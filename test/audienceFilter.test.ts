import { test } from 'node:test';
import assert from 'node:assert/strict';

import { briefGenerator } from '../src/lib/modules/briefGenerator.ts';
import type { Inputs, Research, TopicCandidate } from '../src/lib/types.ts';

const inputs: Inputs = {
  topic: 'cinematic video vs normal video',
  zyraContext: 'Zyra is India\'s AI content studio.',
  audience: { industries: 'D2C', geographies: 'India', roles: 'CMOs' },
  goal: 'thought leadership', tone: 'cinematic but useful', wordCount: 1400,
  cta: 'Schedule a call', competitorUrls: [], manualNotes: '',
};

const q = (text: string, source: 'paa' | 'reddit' | 'x' = 'paa') => ({ text, source, mode: 'mock' as const });

const research = (questions: ReturnType<typeof q>[]): Research => ({
  expandedQueries: [], clusters: [], questions,
  autocomplete: [], relatedKeywords: [], competitorGaps: [],
  intent: 'commercial', modes: {},
});

const selected: TopicCandidate = {
  topic: 'The Cost of Cinematic Video Production',
  angle: 'What cinematic actually costs a brand.',
  intent: 'commercial',
  breakdown: { audienceRelevance: 80, searchQuestionDemand: 70, zyraAuthorityFit: 75, commercialIntent: 60, competitionGap: 50 },
  score: 70, justification: 'x', recommended: true,
  signals: { paaCount: 4, redditHits: 0, xHits: 0, serviceMatch: null, volume: 900 },
};

// PAA for a craft term is dominated by consumer phone queries. They became H2
// sections, so an article for CMOs spent half its length on how to switch off
// an iPhone effect. That traffic cannot convert and it dilutes the topic.
test('consumer phone-feature questions never become article sections', () => {
  const brief = briefGenerator(inputs, research([
    q('How do I turn off Cinematic mode on my iPhone?'),
    q('Does the iPhone 17 Pro have LiDAR for Cinematic mode?'),
    q('How do I disable cinematic video in Photos?'),
    q('What separates cinematic video from normal video?'),
    q('What does a cinematic brand film cost?'),
    q('Why do cinematic shoots need a colourist?'),
  ]), selected);

  const headings = brief.outline.map((s) => s.heading.toLowerCase()).join(' | ');
  assert.ok(!/iphone|turn off|disable|photos/.test(headings), `consumer query became a heading: ${headings}`);
  assert.ok(brief.outline.length > 0, 'the legitimate questions must still produce an outline');
});

test('the FAQ is filtered the same way', () => {
  const brief = briefGenerator(inputs, research([
    q('What separates cinematic video from normal video?'),
    q('What does a cinematic brand film cost?'),
    q('Why do cinematic shoots need a colourist?'),
    q('How do I turn off Cinematic mode on my iPhone?'),
    q('Does Samsung Galaxy have a cinematic mode?'),
  ]), selected);
  const faq = brief.faq.map((f) => f.q.toLowerCase()).join(' | ');
  assert.ok(!/iphone|samsung|turn off/.test(faq), `consumer query reached the FAQ: ${faq}`);
});

test('legitimate production questions are not over-filtered', () => {
  const brief = briefGenerator(inputs, research([
    q('How long does a brand film take to produce?'),
    q('What does a cinematic brand film cost?'),
    q('Is vertical video worth shooting natively?'),
    q('How many revisions does a commercial usually need?'),
  ]), selected);
  assert.equal(brief.outline.length, 4, 'real questions must survive the filter');
});
