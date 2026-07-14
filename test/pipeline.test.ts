import { test } from 'node:test';
import assert from 'node:assert/strict';

import { buildCard } from '../src/lib/scoring/score.ts';
import { findBannedPhrases } from '../src/lib/scoring/bannedPhrases.ts';
import { topicScorer, SCORE_WEIGHTS } from '../src/lib/modules/topicScorer.ts';
import { exporter } from '../src/lib/modules/exporter.ts';
import { humanizer } from '../src/lib/modules/humanizer.ts';
import { slugify, cleanKeyword, dedupeAdjacentPhrase } from '../src/lib/util.ts';
import { duplicateParagraphCount, findPlaceholders } from '../src/lib/scoring/score.ts';
import { seoGeoAuditor } from '../src/lib/modules/seoGeoAuditor.ts';
import { runResearch, runWriting } from '../src/lib/pipeline.ts';
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
  const synthTopics = [
    { title: 'What an AI Brand Film Really Costs in India', angle: 'Pricing guide for D2C founders.' },
    { title: 'How to Brief an AI Video Studio for Better Ads', angle: 'A practical workflow for marketers.' },
  ];
  const candidates = topicScorer(inputs, research, synthTopics);
  assert.ok(candidates.length > 0);
  assert.ok(candidates.every((c) => c.score >= 0 && c.score <= 100));
  assert.ok(candidates.every((c) => typeof c.angle === 'string' && c.angle.length > 0));
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

test('humanizer strips banned phrases and adds contractions', async () => {
  const edited = await humanizer(draft);
  const text = edited.blocks.map((b) => b.text ?? '').join(' ').toLowerCase();
  assert.ok(!text.includes('it is worth noting'));
  assert.ok(!text.includes(' we are ')); // contracted to we're
});

test('humanizer removes AI tropes and reports applied rules', async () => {
  const tropey: Draft = {
    title: 't',
    blocks: [
      { type: 'p', text: `In today's fast-paced world, we leverage cutting-edge tools to unlock growth. It is not just fast, it is seamless. Let's dive into it. At the end of the day, it's a game-changer.` },
      { type: 'p', text: `A launch needs three cuts for a campaign, and that works well.` }, // must NOT be damaged
    ],
    faq: [], wordCount: 40, sourceNeededCount: 0, mode: 'mock',
  };
  const out = await humanizer(tropey);
  const t = out.blocks.map((b) => b.text).join(' ').toLowerCase();
  for (const bad of ["in today's fast-paced", 'leverage', 'cutting-edge', 'unlock', 'seamless', "let's dive", 'at the end of the day', 'game-changer', 'it is not just']) {
    assert.ok(!t.includes(bad), `still contains: ${bad}`);
  }
  assert.ok((out.appliedRules?.length ?? 0) >= 5);
  // legitimate "for a campaign," prose survives intact
  assert.ok(out.blocks[1].text!.includes('three cuts for a campaign'), 'damaged good prose');
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

test('parseMarkets recognises India, GCC, US and keeps primary first', async () => {
  const { parseMarkets } = await import('../src/lib/markets.ts');
  const m = parseMarkets('US, India, GCC');
  assert.deepEqual(m.map((x) => x.key), ['US', 'India', 'GCC']);
  assert.equal(parseMarkets('Dubai, Saudi')[0].key, 'GCC');
  assert.deepEqual(parseMarkets('Europe').map((x) => x.key), []);
});

test('marketGuidance builds primary-led guidance', async () => {
  const { marketGuidance } = await import('../src/lib/markets.ts');
  const g = marketGuidance('India, US');
  assert.equal(g.primary?.key, 'India');
  assert.ok(g.promptBlock.includes('Primary: India'));
  assert.ok(/₹|INR/.test(g.promptBlock));
});

test('currencyMismatch flags non-target currency but not $ or in-market currency', async () => {
  const { currencyMismatch, parseMarkets } = await import('../src/lib/markets.ts');
  const us = parseMarkets('US');
  assert.deepEqual(currencyMismatch('It costs ₹50 lakh for the film.', us).length > 0, true); // ₹ wrong for US
  assert.deepEqual(currencyMismatch('It costs $50,000 for the film.', us), []); // $ fine for US
  const india = parseMarkets('India');
  assert.deepEqual(currencyMismatch('₹8L and our $10M ad spend managed.', india), []); // ₹ ok; $ never flagged
  assert.ok(currencyMismatch('Priced in AED 20,000.', india).length > 0); // AED wrong for India-only
});

test('dedupeAdjacentPhrase collapses repeated phrases', () => {
  assert.equal(dedupeAdjacentPhrase('cost in india cost in india'), 'cost in india');
  assert.equal(dedupeAdjacentPhrase('ai brand film cost'), 'ai brand film cost');
});

test('cleanKeyword strips filler + doubling and stays short', () => {
  const k = cleanKeyword('Looking for recommendations on AI brand film cost in India cost in India for a D2C brand');
  assert.ok(!/cost in india cost in india/i.test(k));
  assert.ok(k.split(' ').length <= 6, `too long: "${k}"`);
  assert.ok(k.includes('brand film'));
});

test('duplicateParagraphCount + findPlaceholders catch spun/placeholder content', () => {
  const spun = 'Short answer: it comes down to fit and execution and the winners are specific and know the format.';
  const bad: Draft = {
    title: 't',
    blocks: [
      { type: 'p', text: spun },
      { type: 'p', text: spun.replace('fit', 'fit') }, // identical
      { type: 'p', text: 'Cite a benchmark here [source needed].' },
    ],
    faq: [], wordCount: 40, sourceNeededCount: 1, mode: 'mock',
  };
  assert.ok(duplicateParagraphCount(bad) >= 1);
  assert.deepEqual(findPlaceholders('a [source needed] b REPLACE-ME').sort(), ['[source needed]', 'REPLACE-ME'].sort());
});

test('seoGeoAuditor blocks publishing of duplicate/placeholder drafts', () => {
  const p = 'Short answer: ai brand film cost comes down to fit and execution and the winners are specific about the brief.';
  const bad: Draft = {
    title: 't',
    blocks: [{ type: 'h2', text: 'What is it?' }, { type: 'p', text: p }, { type: 'h2', text: 'Cost?' }, { type: 'p', text: p }, { type: 'p', text: 'Benchmark [source needed].' }],
    faq: [], wordCount: 45, sourceNeededCount: 1, mode: 'mock',
  };
  const a = seoGeoAuditor(bad, brief, inputs);
  assert.equal(a.publishable, false);
  assert.ok(a.blockers.length > 0);
});

test('cleaned mock pipeline produces no duplicates or placeholders', async () => {
  const ins: Inputs = { ...inputs, topic: 'AI brand film cost in India' };
  const { research, candidates } = await runResearch(ins);
  const { draft } = await runWriting(ins, research, candidates[0]);
  assert.equal(draft.sourceNeededCount, 0, 'no [source needed] in body');
  assert.equal(duplicateParagraphCount(draft), 0, 'no duplicate paragraphs');
  assert.equal(findPlaceholders(draft.blocks.map((b) => b.text ?? '').join(' ')).length, 0);
});

test('parseMarkdown handles fences, tables, and inline bold (live-path parsing)', async () => {
  const { parseMarkdown } = await import('../src/lib/modules/blogGenerator.ts');
  const md = [
    '```markdown', '## What is it?', 'A **bold** claim and a [link](https://x.com).',
    '', '## How the options compare', '| Approach | Speed |', '| --- | --- |',
    '| Traditional | Weeks |', '| AI-native | Days |', '```',
  ].join('\n');
  const blocks = parseMarkdown(md);
  const table = blocks.find((b) => b.type === 'table');
  assert.ok(table, 'table parsed');
  assert.deepEqual(table!.table!.headers, ['Approach', 'Speed']);
  assert.equal(table!.table!.rows.length, 2);
  const p = blocks.find((b) => b.type === 'p');
  assert.equal(p!.text, 'A bold claim and a link.'); // bold + link stripped, no fence
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
