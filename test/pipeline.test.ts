import { test } from 'node:test';
import assert from 'node:assert/strict';

import { buildCard } from '../src/lib/scoring/score.ts';
import { findBannedPhrases } from '../src/lib/scoring/bannedPhrases.ts';
import { topicScorer, SCORE_WEIGHTS } from '../src/lib/modules/topicScorer.ts';
import { exporter } from '../src/lib/modules/exporter.ts';
import { humanEditor } from '../src/lib/modules/humanEditor.ts';
import { slugify } from '../src/lib/util.ts';
import { serializeBlogPost, insertIntoBlogData } from '../src/lib/modules/publisher.ts';
import type { Inputs, Research, Draft, Brief, BlogPostObject } from '../src/lib/types.ts';

const inputs: Inputs = {
  topic: 'AI brand film cost in India',
  zyraContext: 'Zyra is India\'s AI content studio.',
  audience: { industries: 'D2C', geographies: 'India', roles: 'CMOs' },
  goal: 'lead generation', tone: 'cinematic but useful', wordCount: 1200,
  cta: 'See how we work', competitorUrls: [], manualNotes: '',
};

const research: Research = {
  expandedQueries: ['ai brand film cost', 'ai brand film vs traditional'],
  clusters: [{ label: 'Cost', queries: ['ai brand film cost'] }],
  questions: [
    { text: 'How much does an AI brand film cost?', source: 'paa', mode: 'mock' },
    { text: 'Is an AI brand film worth it?', source: 'reddit', mode: 'mock' },
    { text: 'AI brand film vs traditional?', source: 'x', mode: 'mock' },
  ],
  autocomplete: ['ai brand film india'],
  relatedKeywords: [{ keyword: 'ai brand film cost', volume: 1200, difficulty: 30, difficultyBasis: 'mock', intent: 'commercial', mode: 'mock' }],
  competitorGaps: [{ url: 'x.com', title: 'x', coversTopic: false, gapNote: 'thin' }],
  intent: 'commercial',
  modes: {},
};

test('score weights sum to 1', () => {
  const sum = Object.values(SCORE_WEIGHTS).reduce((a, b) => a + b, 0);
  assert.ok(Math.abs(sum - 1) < 1e-9);
});

test('buildCard scores pass/warn/fail correctly', () => {
  const card = buildCard([
    { id: 'a', label: 'a', status: 'pass', detail: '' },
    { id: 'b', label: 'b', status: 'warn', detail: '' },
    { id: 'c', label: 'c', status: 'fail', detail: '' },
  ]);
  assert.equal(card.score, 50); // (1 + 0.5 + 0) / 3 = 0.5
});

test('buildCard ignores unknown checks', () => {
  const card = buildCard([
    { id: 'a', label: 'a', status: 'pass', detail: '' },
    { id: 'b', label: 'b', status: 'unknown', detail: '' },
  ]);
  assert.equal(card.score, 100);
});

test('findBannedPhrases catches AI tells', () => {
  assert.deepEqual(findBannedPhrases('We seamlessly unlock the power of AI.').sort(),
    ['seamless', 'unlock the power of'].sort());
  assert.deepEqual(findBannedPhrases('A clean human sentence.'), []);
});

test('topicScorer returns scored candidates with a recommended pick', () => {
  const candidates = topicScorer(inputs, research);
  assert.ok(candidates.length > 0);
  assert.ok(candidates.every((c) => c.score >= 0 && c.score <= 100));
  assert.ok(candidates.some((c) => c.recommended));
  assert.ok(candidates[0].justification.length > 20);
  // sorted descending
  for (let i = 1; i < candidates.length; i++) assert.ok(candidates[i - 1].score >= candidates[i].score);
});

test('slugify is clean and stop-word free', () => {
  assert.equal(slugify('How much does an AI Brand Film cost?'), 'much-ai-brand-film-cost');
});

const brief: Brief = {
  recommendedTitle: 'AI Brand Film Cost in India', alternativeTitles: [], metaTitle: 'AI Brand Film Cost in India',
  metaDescription: 'x'.repeat(140), slug: 'ai-brand-film-cost-india', primaryKeyword: 'ai brand film cost',
  secondaryKeywords: [], intent: 'commercial', targetReader: 'CMOs', angle: 'a',
  outline: [], questionsToAnswer: [], internalLinks: [], externalSourceSuggestions: [],
  faq: [{ q: 'How much?', a: 'It depends.' }], featuredSnippetAnswer: 'x', geoAnswerBlocks: [],
};

const draft: Draft = {
  title: 'AI Brand Film Cost in India',
  blocks: [
    { type: 'p', text: 'It is worth noting that we are fast.' },
    { type: 'h2', text: 'What does it cost?' },
    { type: 'p', text: 'Short answer: it depends.' },
  ],
  faq: [{ q: 'How much?', a: 'It depends.' }], wordCount: 12, sourceNeededCount: 0, mode: 'mock',
};

test('exporter builds all artifacts with a placeholder poster and derived readTime', () => {
  const fixedDate = new Date('2026-07-13T00:00:00Z');
  const out = exporter(draft, brief, inputs, fixedDate);
  assert.ok(out.markdown.includes('# AI Brand Film Cost in India'));
  assert.ok(out.html.includes('<article>'));
  assert.ok(out.faqSchema.includes('FAQPage'));
  assert.equal(out.blogPost.poster, '/posters/REPLACE-ME.webp');
  assert.equal(out.blogPost.readTime, '1 min read');
  assert.equal(out.blogPost.category, 'Performance');
});

test('humanEditor strips banned phrases and adds contractions', async () => {
  const edited = await humanEditor(draft);
  const text = edited.blocks.map((b) => b.text ?? '').join(' ').toLowerCase();
  assert.ok(!text.includes('it is worth noting'));
  assert.ok(!text.includes(' we are ')); // contracted to we're
});

const blogPost: BlogPostObject = {
  slug: 'ai-brand-film-cost', title: 'AI Brand Film Cost',
  excerpt: 'What it costs.', body: [{ type: 'p', text: 'It "depends".' }, { type: 'h2', text: 'Cost' }],
  date: 'July 2026', readTime: '4 min read', category: 'Industry', poster: '/posters/REPLACE-ME.webp',
};

test('serializeBlogPost emits a valid TS literal with escaped strings', () => {
  const lit = serializeBlogPost(blogPost);
  assert.ok(lit.includes('slug: "ai-brand-film-cost"'));
  assert.ok(lit.includes('type: "p"'));
  // quotes inside text must be escaped by JSON.stringify
  assert.ok(lit.includes('\\"depends\\"'));
});

test('insertIntoBlogData inserts as the first array element', () => {
  const file = 'export const ALL_POSTS: BlogPost[] = [\n  { slug: "old" },\n]\n';
  const out = insertIntoBlogData(file, serializeBlogPost(blogPost));
  const idxNew = out.indexOf('ai-brand-film-cost');
  const idxOld = out.indexOf('slug: "old"');
  assert.ok(idxNew > 0 && idxNew < idxOld); // new post appears before the old one
  assert.ok(out.includes('export const ALL_POSTS: BlogPost[] = [')); // declaration intact
});

test('insertIntoBlogData throws if the array is missing', () => {
  assert.throws(() => insertIntoBlogData('const x = 1', 'lit'));
});

test('imageGenerator returns a deterministic mock SVG when no key is set', async () => {
  const { imageGenerator } = await import('../src/lib/modules/imageGenerator.ts');
  const a = await imageGenerator({ title: 'AI Brand Film Cost in India', slug: 'ai-brand-film-cost' });
  const b = await imageGenerator({ title: 'AI Brand Film Cost in India', slug: 'ai-brand-film-cost' });
  assert.equal(a.mode, 'mock');
  assert.equal(a.publishable, false);
  assert.equal(a.posterPath, '/posters/REPLACE-ME.webp'); // mock never claims a real poster
  assert.ok(a.dataUrl.startsWith('data:image/svg+xml;base64,'));
  assert.equal(a.dataUrl, b.dataUrl); // deterministic
});
