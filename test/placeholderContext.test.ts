import { test } from 'node:test';
import assert from 'node:assert/strict';

import { findPlaceholderContexts } from '../src/lib/scoring/score.ts';

test('a placeholder is reported with the words around it', () => {
  const text = 'Generation is only one layer. Independent tests put the reject rate near 40 percent [source needed] on complex prompts. The edit is where time goes.';
  const [hit] = findPlaceholderContexts(text);
  assert.equal(hit.placeholder, '[source needed]');
  assert.match(hit.context, /reject rate near 40 percent/);
  assert.ok(hit.context.includes('[source needed]'), 'the tag itself must be visible in the snippet');
});

test('several placeholders are reported separately', () => {
  const text = 'One claim [source needed] here. Another TODO there.';
  const hits = findPlaceholderContexts(text);
  assert.equal(hits.length, 2);
});

test('clean copy reports nothing', () => {
  assert.deepEqual(findPlaceholderContexts('A perfectly clean sentence with no tags.'), []);
});

test('a placeholder at the very start does not break the snippet', () => {
  const hits = findPlaceholderContexts('[source needed] leads the sentence.');
  assert.equal(hits.length, 1);
  assert.match(hits[0].context, /leads the sentence/);
});
