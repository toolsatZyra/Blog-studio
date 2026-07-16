import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  serializeSolutionPage, insertIntoLpData, existingSlugs,
} from '../src/lib/modules/solutionPublisher.ts';
import { uniqueSlug } from '../src/lib/solutions/naming.ts';
import type { SolutionPage } from '../src/lib/types.ts';

const page: SolutionPage = {
  slug: 'fintech/bengaluru',
  industry: 'Fintech',
  geography: 'Bengaluru',
  serviceSlugs: ['ai-brand-films'],
  metaTitle: 'AI Brand Films for Fintech Brands in Bengaluru | Zyra',
  metaDescription: 'Cinematic AI brand films for fintech companies in Bengaluru, in five to seven days.',
  eyebrow: 'AI Brand Films · Fintech · Bengaluru',
  h1: 'AI Brand Films for Fintech Brands in Bengaluru',
  subline: "Cinematic brand stories at the speed of culture - produced in days, not quarters.",
  trustLine: '50+ brand films & ads created · 5-7 days delivery',
  aeoAnswer: 'Zyra is an AI-native film studio producing brand films for fintech companies in Bengaluru.',
  problemHeading: 'Fintech moves faster than film.',
  problemBody: ['One.', 'Two.', "Three with an apostrophe's quote."],
  deliverables: [{ num: '01', title: 'Concept & Script', desc: 'Story, script and lookbook.' }],
  proof: [{
    workSlug: 'cars24', client: 'Cars24', title: 'Service Launch', category: 'Brand Film',
    year: '2025', tags: ['Brand Film', '4K'],
    brief: 'An ad campaign for Cars24 spotlighting their 30-day return policy.',
    cfStream: '466b01620c29279a0a63ee1e451fe59c', vertical: false,
  }],
  process: [{ num: '01', title: 'Brief & Greenlight', desc: 'We agree the story up front.' }],
  faq: [{ q: 'How long does it take?', a: 'Five to seven days from approved brief.' }],
  mode: 'live',
};

const FIXTURE = `import type { SolutionPage } from './solutions/types'

export const ALL_SOLUTIONS: SolutionPage[] = [
  {
    slug: 'existing-page',
    industry: 'D2C',
  },
]

export function getSolutionBySlug(slug: string): SolutionPage | undefined {
  return ALL_SOLUTIONS.find((p) => p.slug === slug)
}
`;

test('serialize: produces a parseable TS/JS object literal', () => {
  const literal = serializeSolutionPage(page);
  // If this eval throws, the PR would land a file that does not compile.
  const obj = eval(`(${literal.trim().replace(/,$/, '')})`) as SolutionPage;
  assert.equal(obj.slug, page.slug);
  assert.equal(obj.h1, page.h1);
  assert.equal(obj.proof[0].client, 'Cars24');
  assert.equal(obj.proof[0].vertical, false);
  assert.deepEqual(obj.problemBody, page.problemBody);
});

test('serialize: escapes quotes and apostrophes rather than breaking the file', () => {
  const tricky: SolutionPage = {
    ...page,
    h1: 'He said "hello" to Zyra\'s team',
    problemBody: ['A line with "quotes" and a backslash \\ in it.'],
  };
  const obj = eval(`(${serializeSolutionPage(tricky).trim().replace(/,$/, '')})`) as SolutionPage;
  assert.equal(obj.h1, 'He said "hello" to Zyra\'s team');
  assert.equal(obj.problemBody[0], 'A line with "quotes" and a backslash \\ in it.');
});

test('insert: adds the page as the first element, keeping the rest', () => {
  const out = insertIntoLpData(FIXTURE, serializeSolutionPage(page));
  assert.ok(out.includes(page.slug));
  assert.ok(out.includes('existing-page'), 'must not drop what is already published');
  assert.ok(
    out.indexOf(page.slug) < out.indexOf('existing-page'),
    'newest first',
  );
});

test('insert: refuses a file without the ALL_SOLUTIONS array', () => {
  assert.throws(
    () => insertIntoLpData('export const NOPE = []', serializeSolutionPage(page)),
    /Could not find the ALL_SOLUTIONS array/,
  );
});

test('existingSlugs: reads what is already published', () => {
  assert.deepEqual(existingSlugs(FIXTURE), ['existing-page']);
  const two = insertIntoLpData(FIXTURE, serializeSolutionPage(page));
  assert.deepEqual(existingSlugs(two).sort(), [page.slug, 'existing-page'].sort());
});

test('REGRESSION: republishing the same combo never clobbers the live page', () => {
  // Publishing Fintech x Bengaluru twice must produce a SECOND page, not
  // silently overwrite the first.
  const once = insertIntoLpData(FIXTURE, serializeSolutionPage(page));
  const taken = existingSlugs(once);
  const next = uniqueSlug(page.slug, taken);
  assert.equal(next, 'fintech/bengaluru-2');

  const twice = insertIntoLpData(once, serializeSolutionPage({ ...page, slug: next }));
  const slugs = existingSlugs(twice);
  assert.equal(new Set(slugs).size, slugs.length, 'no duplicate slugs');
  assert.equal(slugs.filter((s) => s.startsWith(page.slug)).length, 2);
});

test('the serialized literal round-trips through an insert without corrupting the file', () => {
  const out = insertIntoLpData(FIXTURE, serializeSolutionPage(page));
  // Balanced braces/brackets is a cheap proxy for "still valid TS".
  const open = (out.match(/[{[]/g) || []).length;
  const close = (out.match(/[}\]]/g) || []).length;
  assert.equal(open, close, 'unbalanced braces would break the site build');
});
