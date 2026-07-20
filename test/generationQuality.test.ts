import { test } from 'node:test';
import assert from 'node:assert/strict';

import { titleCase, smartTitle } from '../src/lib/util.ts';
import { parseMarkdown, finalize } from '../src/lib/modules/blogGenerator.ts';

// ── intercapped brand names ─────────────────────────────────────────────────
// "iPhone" is not a typo to be corrected. Capitalising it reads as careless to
// exactly the reader this blog is for.
test('a deliberately intercapped name keeps its own casing', () => {
  for (const fn of [titleCase, smartTitle]) {
    assert.equal(fn('iPhone cinematic mode'), fn('iPhone cinematic mode').replace('IPhone', 'iPhone'));
    assert.ok(!fn('iPhone cinematic mode').includes('IPhone'), `${fn.name} mangled iPhone`);
    assert.ok(fn('iPhone cinematic mode').includes('iPhone'), `${fn.name} lost iPhone`);
  }
});

test('other real intercapped names survive too', () => {
  assert.ok(smartTitle('eBay and YouTube ads').includes('eBay'));
  assert.ok(smartTitle('eBay and YouTube ads').includes('YouTube'));
  assert.ok(titleCase('a McKinsey report').includes('McKinsey'));
});

test('ordinary lowercase words are still capitalised', () => {
  assert.equal(titleCase('how much does it cost'), 'How Much Does It Cost');
  assert.equal(smartTitle('ai brand film cost'), 'AI Brand Film Cost');
  assert.equal(smartTitle('the cost of production'), 'The Cost of Production');
});

// ── duplicated title ────────────────────────────────────────────────────────
// The exporters emit brief.recommendedTitle as the H1 and then every block. The
// writer is told not to repeat the title and sometimes does anyway, producing an
// H1 and an identical H2 back to back.
test('a first H2 that repeats the title is dropped', () => {
  const md = '## The Cost of Cinematic Video Production\n\nOpening paragraph.\n\n## A Real Section\n\nMore.\n';
  const draft = finalize(parseMarkdown(md), 'live', 'The Cost of Cinematic Video Production');
  assert.equal(draft.blocks[0].type, 'p', 'the duplicate H2 should be gone');
  assert.ok(!draft.blocks.some((b) => b.type === 'h2' && b.text === 'The Cost of Cinematic Video Production'));
  assert.ok(draft.blocks.some((b) => b.type === 'h2' && b.text === 'A Real Section'), 'real sections survive');
});

test('a first H2 that merely resembles the title is kept', () => {
  const md = '## What Cinematic Video Actually Costs\n\nBody.\n';
  const draft = finalize(parseMarkdown(md), 'live', 'The Cost of Cinematic Video Production');
  assert.equal(draft.blocks[0].type, 'h2');
});

test('only a LEADING duplicate is dropped, never one mid-article', () => {
  const md = '## Opening\n\nBody.\n\n## The Title\n\nMore.\n';
  const draft = finalize(parseMarkdown(md), 'live', 'The Title');
  assert.ok(draft.blocks.some((b) => b.type === 'h2' && b.text === 'The Title'));
});
