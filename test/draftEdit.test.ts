import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  updateBlockText, updateBlockItems, updateTableCell, deleteBlock,
  addBlockAfter, moveBlock, updateFaq, addFaq, deleteFaq,
} from '../src/lib/draftOps.ts';
import { recountDraft, rederive } from '../src/lib/rederive.ts';
import type { Draft, Brief, Inputs } from '../src/lib/types.ts';

const inputs: Inputs = {
  topic: 'AI brand film cost in India',
  zyraContext: 'Zyra is India\'s AI content studio.',
  audience: { industries: 'D2C', geographies: 'India', roles: 'CMOs' },
  goal: 'lead generation', tone: 'cinematic but useful', wordCount: 1200,
  cta: 'Schedule a call', competitorUrls: [], manualNotes: '',
};

const brief: Brief = {
  recommendedTitle: 'What an AI Brand Film Costs in India',
  alternativeTitles: [],
  metaTitle: 'AI brand film cost in India',
  metaDescription: 'What an AI brand film costs in India and why quotes vary.',
  slug: 'ai-brand-film-cost-india',
  primaryKeyword: 'ai brand film cost',
  secondaryKeywords: ['ai film production'],
  intent: 'commercial',
  targetReader: 'CMOs',
  angle: 'Cost is a stack of decisions, not a price sheet.',
  outline: [],
  questionsToAnswer: [],
  internalLinks: [],
  externalSourceSuggestions: [],
  faq: [],
  featuredSnippetAnswer: 'An AI brand film in India varies with the stack.',
  geoAnswerBlocks: [],
};

function makeDraft(): Draft {
  return {
    title: 'What an AI Brand Film Costs in India',
    blocks: [
      { type: 'h2', text: 'What does it cost' },
      { type: 'p', text: 'The honest answer is that cost lives in the workflow.' },
      { type: 'ul', items: ['Tools', 'Rerolls'] },
    ],
    faq: [{ q: 'How long does it take?', a: 'Two to four weeks.' }],
    wordCount: 0,
    sourceNeededCount: 0,
    mode: 'mock',
  };
}

const D = new Date('2026-07-16T00:00:00Z');

// ── draftOps: purity + behavior ─────────────────────────────────────────────

test('draftOps never mutate the input draft', () => {
  const d = makeDraft();
  const snapshot = JSON.stringify(d);
  updateBlockText(d, 1, 'changed');
  deleteBlock(d, 0);
  addBlockAfter(d, 0, 'p');
  moveBlock(d, 0, 1);
  addFaq(d);
  assert.equal(JSON.stringify(d), snapshot, 'input draft was mutated');
});

test('every op marks the draft as edited', () => {
  const d = makeDraft();
  assert.equal(d.edited, undefined);
  assert.equal(updateBlockText(d, 1, 'x').edited, true);
  assert.equal(deleteBlock(d, 0).edited, true);
  assert.equal(addBlockAfter(d, 0, 'p').edited, true);
  assert.equal(moveBlock(d, 0, 1).edited, true);
  assert.equal(updateFaq(d, 0, { a: 'x' }).edited, true);
  assert.equal(addFaq(d).edited, true);
  assert.equal(deleteFaq(d, 0).edited, true);
});

test('updateBlockText replaces only the targeted block', () => {
  const out = updateBlockText(makeDraft(), 1, 'New paragraph text.');
  assert.equal(out.blocks[1].text, 'New paragraph text.');
  assert.equal(out.blocks[0].text, 'What does it cost');
});

test('updateBlockItems drops blank lines', () => {
  const out = updateBlockItems(makeDraft(), 2, ['Tools', '  ', 'Rerolls', '']);
  assert.deepEqual(out.blocks[2].items, ['Tools', 'Rerolls']);
});

test('deleteBlock removes the block; addBlockAfter inserts in place', () => {
  assert.equal(deleteBlock(makeDraft(), 0).blocks.length, 2);
  const added = addBlockAfter(makeDraft(), 0, 'h3');
  assert.equal(added.blocks.length, 4);
  assert.equal(added.blocks[1].type, 'h3');
  assert.equal(added.blocks[1].text, '');
  // -1 prepends
  assert.equal(addBlockAfter(makeDraft(), -1, 'p').blocks[0].type, 'p');
});

test('addBlockAfter seeds a list with one empty item', () => {
  assert.deepEqual(addBlockAfter(makeDraft(), 0, 'ul').blocks[1].items, ['']);
});

test('moveBlock swaps neighbours and is a no-op at the ends', () => {
  const moved = moveBlock(makeDraft(), 0, 1);
  assert.equal(moved.blocks[0].type, 'p');
  assert.equal(moved.blocks[1].type, 'h2');
  const d = makeDraft();
  assert.deepEqual(moveBlock(d, 0, -1).blocks, d.blocks, 'moving the first block up should no-op');
  assert.deepEqual(moveBlock(d, 2, 1).blocks, d.blocks, 'moving the last block down should no-op');
});

test('out-of-range indices are no-ops rather than crashes', () => {
  const d = makeDraft();
  assert.deepEqual(updateBlockText(d, 99, 'x'), d);
  assert.deepEqual(deleteBlock(d, 99), d);
  assert.deepEqual(updateFaq(d, 99, { q: 'x' }), d);
});

test('updateTableCell edits headers (row -1) and body cells', () => {
  const d: Draft = {
    ...makeDraft(),
    blocks: [{ type: 'table', table: { headers: ['A', 'B'], rows: [['1', '2']] } }],
  };
  assert.deepEqual(updateTableCell(d, 0, -1, 0, 'Model').blocks[0].table!.headers, ['Model', 'B']);
  assert.deepEqual(updateTableCell(d, 0, 0, 1, '99').blocks[0].table!.rows, [['1', '99']]);
  // a table op on a non-table block is a no-op
  assert.deepEqual(updateTableCell(makeDraft(), 1, 0, 0, 'x'), makeDraft());
});

test('FAQ ops add, edit, and remove entries', () => {
  assert.equal(addFaq(makeDraft()).faq.length, 2);
  assert.equal(updateFaq(makeDraft(), 0, { a: 'Three weeks.' }).faq[0].a, 'Three weeks.');
  assert.equal(updateFaq(makeDraft(), 0, { a: 'Three weeks.' }).faq[0].q, 'How long does it take?');
  assert.equal(deleteFaq(makeDraft(), 0).faq.length, 0);
});

// ── recountDraft ────────────────────────────────────────────────────────────

test('recountDraft recomputes wordCount from the edited blocks', () => {
  const edited = updateBlockText(makeDraft(), 1, 'one two three four five');
  const out = recountDraft(edited);
  // h2 (4) + p (5) + ul items (2) = 11
  assert.equal(out.wordCount, 11);
});

test('recountDraft tracks [source needed] tags appearing and disappearing', () => {
  const withTag = updateBlockText(makeDraft(), 1, 'Costs vary [source needed] a lot.');
  assert.equal(recountDraft(withTag).sourceNeededCount, 1);
  const resolved = updateBlockText(withTag, 1, 'Costs vary a lot.');
  assert.equal(recountDraft(resolved).sourceNeededCount, 0);
});

// ── rederive: the whole point ───────────────────────────────────────────────

test('REGRESSION: editing a block updates exports.blogPost — publish cannot ship stale text', () => {
  const original = makeDraft();
  const edited = updateBlockText(original, 1, 'Zyra ships films in two weeks flat.');
  const out = rederive(edited, brief, inputs, 'Performance', D);

  const bodyText = out.exports.blogPost.body.map((b) => b.text).join(' ');
  assert.ok(
    bodyText.includes('Zyra ships films in two weeks flat.'),
    'the edited text must reach the published blogPost body',
  );
  assert.ok(
    !bodyText.includes('The honest answer is that cost lives in the workflow.'),
    'the original, replaced text must NOT survive into the published body',
  );
});

test('REGRESSION: deleting a block removes it from exports.blogPost', () => {
  const out = rederive(deleteBlock(makeDraft(), 1), brief, inputs, 'Performance', D);
  const bodyText = out.exports.blogPost.body.map((b) => b.text).join(' ');
  assert.ok(!bodyText.includes('cost lives in the workflow'));
});

test('rederive re-counts the draft it returns (readTime depends on it)', () => {
  const edited = updateBlockText(makeDraft(), 1, 'one two three four five');
  const out = rederive(edited, brief, inputs, 'Performance', D);
  assert.equal(out.draft.wordCount, 11);
  assert.equal(out.exports.blogPost.readTime, '1 min read');
});

test('rederive preserves the resolved category (no LLM re-classification)', () => {
  const out = rederive(makeDraft(), brief, inputs, 'Operations', D);
  assert.equal(out.exports.blogPost.category, 'Operations');
});

test('edited FAQ reaches both the published body and the FAQ schema', () => {
  const edited = updateFaq(makeDraft(), 0, { a: 'Usually about ten working days.' });
  const out = rederive(edited, brief, inputs, 'Performance', D);
  const bodyText = out.exports.blogPost.body.map((b) => b.text).join(' ');
  assert.ok(bodyText.includes('Usually about ten working days.'), 'FAQ is folded into the CMS body');
  assert.ok(out.exports.faqSchema.includes('Usually about ten working days.'), 'FAQ drives FAQPage JSON-LD');
});

test('PUBLISH-UNBLOCK: resolving the last [source needed] flips audit.publishable', () => {
  const dirty = updateBlockText(makeDraft(), 1, 'Costs vary [source needed] a lot.');
  const before = rederive(dirty, brief, inputs, 'Performance', D);
  assert.equal(before.audit.publishable, false, 'a draft with a placeholder must not be publishable');
  assert.ok(before.audit.blockers.length > 0);

  const clean = updateBlockText(dirty, 1, 'Costs vary with the stack you choose.');
  const after = rederive(clean, brief, inputs, 'Performance', D);
  assert.ok(
    !after.audit.blockers.some((b) => /source needed|placeholder/i.test(b)),
    'resolving the placeholder must clear the placeholder blocker',
  );
});

test('the audit catches a [source needed] left in an FAQ answer (fails closed)', () => {
  // recountDraft counts blocks only, so this tag is NOT in sourceNeededCount —
  // but the auditor scans the FAQ too, so publish is still blocked. This test
  // pins that safe-direction inconsistency so it can't silently flip.
  const edited = updateFaq(makeDraft(), 0, { a: 'About [source needed] weeks.' });
  const out = rederive(edited, brief, inputs, 'Performance', D);
  assert.equal(out.draft.sourceNeededCount, 0, 'FAQ tags are outside the block-only counter');
  assert.equal(out.audit.publishable, false, 'but the audit must still block publish');
});
