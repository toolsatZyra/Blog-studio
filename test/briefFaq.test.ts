import { test } from 'node:test';
import assert from 'node:assert/strict';

import { briefGenerator } from '../src/lib/modules/briefGenerator.ts';
import { buildPrompt } from '../src/lib/modules/blogGenerator.ts';
import type { Inputs, Research, TopicCandidate } from '../src/lib/types.ts';

const inputs: Inputs = {
  topic: 'AI production cost',
  zyraContext: 'Zyra is India\'s AI content studio.',
  audience: { industries: 'D2C', geographies: 'India', roles: 'CMOs' },
  goal: 'thought leadership', tone: 'cinematic but useful', wordCount: 1400,
  cta: 'Schedule a call', competitorUrls: [], manualNotes: '',
};

const q = (text: string, source: 'paa' | 'reddit' | 'x') => ({ text, source, mode: 'mock' as const });

const research = (questions: ReturnType<typeof q>[]): Research => ({
  expandedQueries: [], clusters: [], questions,
  autocomplete: [], relatedKeywords: [], competitorGaps: [],
  intent: 'commercial', modes: {},
});

const selected: TopicCandidate = {
  topic: 'Case Studies in AI Production Cost',
  angle: 'What the public cost case studies actually prove.',
  intent: 'commercial',
  breakdown: {
    audienceRelevance: 80, searchQuestionDemand: 70, zyraAuthorityFit: 75,
    commercialIntent: 60, competitionGap: 50,
  },
  score: 70,
  justification: 'Strong demand, Zyra has direct production experience.',
  recommended: true,
  signals: { paaCount: 4, redditHits: 2, xHits: 1, serviceMatch: null, volume: 900 },
};

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

// The outline and the FAQ were both taken from the top of the same question
// pool, so every FAQ candidate was already an H2. The writer is told to skip
// questions the article already answers, so it correctly wrote no FAQ at all.
test('FAQ candidates are not the same questions as the outline headings', () => {
  const r = research([
    q('What does an AI brand film cost?', 'paa'),
    q('How long does AI production take?', 'paa'),
    q('Is AI video cheaper than traditional?', 'paa'),
    q('What is cost per approved shot?', 'paa'),
    q('Do reject rates change the budget?', 'paa'),
    q('Can AI match a rental house look?', 'reddit'),
    q('Which model suits Hindi dialogue?', 'reddit'),
    q('How do approvals affect timelines?', 'x'),
  ]);
  const brief = briefGenerator(inputs, r, selected);
  const headings = new Set(brief.outline.map((s) => norm(s.heading)));
  assert.ok(brief.faq.length > 0, 'a brief with plenty of questions must still offer FAQ candidates');
  for (const f of brief.faq) {
    assert.ok(!headings.has(norm(f.q)), `FAQ repeats an outline heading: "${f.q}"`);
  }
});

// When research yields no spare questions the brief legitimately has no
// candidates - inventing filler here would be worse. The writer has live web
// search, so the PROMPT must still demand an FAQ and tell it to source its own.
test('the writer is asked for an FAQ even when the brief has no candidates', () => {
  const thin = briefGenerator(inputs, research([
    q('What does an AI brand film cost?', 'paa'),
    q('How long does AI production take?', 'paa'),
  ]), selected);
  assert.equal(thin.faq.length, 0, 'precondition: this brief has no spare questions');

  const prompt = buildPrompt(inputs, thin);
  assert.match(prompt, /FAQ: REQUIRED/, 'an empty candidate list must not become "no FAQ"');
  assert.match(prompt, /## FAQ/, 'the heading the parser reads must still be requested');
  assert.match(prompt, /source your own/, 'the writer should research its own questions');
  assert.doesNotMatch(prompt, /none required/);
});

test('a brief WITH candidates passes them to the writer', () => {
  const rich = briefGenerator(inputs, research([
    q('What does an AI brand film cost?', 'paa'),
    q('How long does AI production take?', 'paa'),
    q('Is AI video cheaper than traditional?', 'paa'),
    q('What is cost per approved shot?', 'paa'),
    q('Do reject rates change the budget?', 'paa'),
    q('Can AI match a rental house look?', 'reddit'),
  ]), selected);
  const prompt = buildPrompt(inputs, rich);
  assert.match(prompt, /FAQ: REQUIRED/);
  assert.match(prompt, /researched candidates/);
});

// The brief computes internal links, the Brief tab shows them, and the SEO
// auditor scores whether the article has 3-5 of them. The prompt never passed
// them, so the writer could not have used them if it wanted to.
test('the writer is given the internal links it is scored on', () => {
  const brief = briefGenerator(inputs, research([
    q('What does an AI brand film cost?', 'paa'),
    q('How long does AI production take?', 'paa'),
  ]), selected);
  assert.ok(brief.internalLinks.length >= 3, 'precondition: the brief has links');

  const prompt = buildPrompt(inputs, brief);
  for (const link of brief.internalLinks) {
    assert.ok(prompt.includes(link.href), `href missing from the prompt: ${link.href}`);
    assert.ok(prompt.includes(link.anchor), `anchor missing from the prompt: ${link.anchor}`);
  }
  assert.match(prompt, /INTERNAL LINKS/, 'they need a labelled section, not a buried mention');
});
