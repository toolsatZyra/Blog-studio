import { test } from 'node:test';
import assert from 'node:assert/strict';

import { findUnsupportedStats } from '../src/lib/scoring/geoChecks.ts';
import type { Draft } from '../src/lib/types.ts';

const draft = (blocks: Draft['blocks']): Draft => ({
  title: 'T', blocks, faq: [], wordCount: 0, sourceNeededCount: 0, mode: 'live',
});

test('a genuinely unsourced statistic is still flagged', () => {
  const d = draft([{ type: 'p', text: 'AI production is 85% cheaper than traditional.' }]);
  assert.deepEqual(findUnsupportedStats(d), ['85%']);
});

test('a multiplier with no source is still flagged', () => {
  const d = draft([{ type: 'p', text: 'It is 3.2x faster.' }]);
  assert.deepEqual(findUnsupportedStats(d), ['3.2x']);
});

test('a properly sourced statistic is accepted', () => {
  const d = draft([{ type: 'p', text: 'According to McKinsey, 30% of projects stall.' }]);
  assert.deepEqual(findUnsupportedStats(d), []);
});

// A heading cannot carry a citation, so flagging one is unfixable by design.
test('a percentage in a heading is not flagged on its own', () => {
  const d = draft([
    { type: 'h2', text: 'What Is The 30% Rule In AI, And Does It Apply To Brand Films?' },
    { type: 'p', text: 'There is no single official version of it.' },
  ]);
  assert.deepEqual(findUnsupportedStats(d), []);
});

// The old check inspected only the FIRST sentence containing the figure. When a
// heading mentioned it first, citing it correctly in the body did not clear the
// block - the operator had no way to satisfy the gate.
test('a figure named in a heading and sourced in the body is accepted', () => {
  const d = draft([
    { type: 'h2', text: 'The 30% Rule Explained' },
    { type: 'p', text: 'According to McKinsey, 30% of AI projects stall before launch.' },
  ]);
  assert.deepEqual(findUnsupportedStats(d), []);
});

test('a named rule is a concept, not a statistic', () => {
  const d = draft([{ type: 'p', text: 'There is no single official 30% rule in AI.' }]);
  assert.deepEqual(findUnsupportedStats(d), []);
});

test('an unsourced figure elsewhere is still caught when another is sourced', () => {
  const d = draft([
    { type: 'p', text: 'According to McKinsey, 30% of projects stall.' },
    { type: 'p', text: 'Our films are 70% faster to approve.' },
  ]);
  assert.deepEqual(findUnsupportedStats(d), ['70%']);
});
