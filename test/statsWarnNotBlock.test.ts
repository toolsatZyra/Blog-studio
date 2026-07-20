import { test } from 'node:test';
import assert from 'node:assert/strict';

import { seoGeoAuditor } from '../src/lib/modules/seoGeoAuditor.ts';
import type { Draft, Brief } from '../src/lib/types.ts';

const brief = {
  recommendedTitle: 'Cost Analysis of End-to-End AI Production',
  alternativeTitles: [], metaTitle: 'T', metaDescription: 'D', slug: 'cost-analysis',
  primaryKeyword: 'ai production cost', secondaryKeywords: [], intent: 'commercial',
  targetReader: 'CMOs', angle: 'a',
  outline: [{ heading: 'What is the 30% rule?', level: 2 as const, intent: 'i', targetWords: 300, answerBlock: 'a', questionsToAnswer: [] }],
  questionsToAnswer: [], internalLinks: [], externalSourceSuggestions: [],
  faq: [], featuredSnippetAnswer: 'f', geoAnswerBlocks: [],
} as unknown as Brief;

const body = (extra: string) => `There is no single authoritative 30% rule. At least three versions circulate. ${extra} `.repeat(30);

const draft = (text: string): Draft => ({
  title: 'Cost Analysis of End-to-End AI Production',
  blocks: [
    { type: 'h2', text: 'What is the 30% rule for AI?' },
    { type: 'p', text },
    { type: 'p', text: 'The remaining 70% funds data infrastructure, evaluation and monitoring.' },
  ],
  faq: [{ q: 'Q one?', a: 'A one.' }, { q: 'Q two?', a: 'A two.' }, { q: 'Q three?', a: 'A three.' }],
  wordCount: 1300, sourceNeededCount: 0, mode: 'live',
});

// A regex cannot tell a sourced claim from a number explaining a named concept.
// It kept blocking legitimate copy, so it reports rather than refuses.
test('an unsourced figure no longer blocks publishing', () => {
  const audit = seoGeoAuditor(draft(body('Budgets vary by scope and market.')), brief);
  const statBlocker = audit.blockers.find((b) => /unsourced numbers/i.test(b));
  assert.equal(statBlocker, undefined, `stats must not block: ${audit.blockers.join(' | ')}`);
});

// Downgrading it must not make it silent - the operator still needs to see it.
test('the figure is still reported in the GEO checklist', () => {
  const audit = seoGeoAuditor(draft(body('Budgets vary.')), brief);
  const check = audit.geo.checks.find((c) => c.id === 'no-unsupported-stats');
  assert.ok(check, 'the check must still run');
  assert.notEqual(check!.status, 'pass', 'an unsourced figure is still worth flagging');
  assert.match(check!.detail, /70%/, 'the offending number must still be named');
});

// The genuinely dangerous placeholders keep blocking.
test('placeholders still block publishing', () => {
  const d = draft(body('Costs fell by [source needed] last year.'));
  d.sourceNeededCount = 1;
  const audit = seoGeoAuditor(d, brief);
  assert.ok(audit.blockers.some((b) => /placeholder/i.test(b)), 'placeholders must still block');
});
