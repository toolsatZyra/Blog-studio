import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  parseGeographies, parseMarkets, marketGuidance, currencyMismatch, MARKETS,
} from '../src/lib/markets.ts';

// Geography is free text. Known markets keep their currency/spelling rules;
// anything else is carried through to the writer instead of being dropped.

test('known markets still parse exactly as before', () => {
  const { markets, unknown } = parseGeographies('India, GCC, US');
  assert.deepEqual(markets.map((m) => m.key), ['India', 'GCC', 'US']);
  assert.deepEqual(unknown, []);
});

test('a token naming two markets still yields both', () => {
  // Guards the multi-match loop: one comma-free token, two markets.
  assert.deepEqual(parseMarkets('India and the US').map((m) => m.key), ['India', 'US']);
});

test('an unrecognised geography is reported, not discarded', () => {
  const { markets, unknown } = parseGeographies('Japan');
  assert.deepEqual(markets, []);
  assert.deepEqual(unknown, ['Japan']);
});

test('known and unknown markets can be mixed', () => {
  const { markets, unknown } = parseGeographies('India, Japan');
  assert.deepEqual(markets.map((m) => m.key), ['India']);
  assert.deepEqual(unknown, ['Japan']);
});

test('duplicate unknown tokens collapse', () => {
  assert.deepEqual(parseGeographies('Japan, Japan').unknown, ['Japan']);
});

test('a blank field yields no markets and no unknowns', () => {
  assert.deepEqual(parseGeographies('  ,  ').unknown, []);
  assert.deepEqual(parseGeographies('').markets, []);
});

test('the writer is told the unknown market by name', () => {
  const { promptBlock, unknown } = marketGuidance('Japan');
  assert.deepEqual(unknown, ['Japan']);
  assert.match(promptBlock, /Target market\(s\): Japan/);
  assert.match(promptBlock, /own local currency and spelling/);
  assert.doesNotMatch(promptBlock, /unspecified/);
});

test('a blank field is still "unspecified"', () => {
  assert.match(marketGuidance('').promptBlock, /unspecified/);
});

test('mixed targets keep the known market as primary and name the unknown', () => {
  const g = marketGuidance('India, Japan');
  assert.equal(g.primary?.key, 'India');
  assert.match(g.promptBlock, /Target market\(s\): India, Japan/);
  assert.match(g.promptBlock, /lakh\/crore/); // India's rules survive
  assert.match(g.promptBlock, /Japan: use that market's own local currency/);
});

test('known-market guidance is unchanged by the new code path', () => {
  const g = marketGuidance('India');
  assert.equal(g.primary?.key, 'India');
  assert.deepEqual(g.unknown, []);
  assert.match(g.promptBlock, /Target market\(s\): India\. Primary: India\./);
  assert.match(g.promptBlock, /Do not use another market's currency\./);
});

test('currency mismatch still fires for a known market', () => {
  const wrong = currencyMismatch('the budget was 5000 AED', [MARKETS.India]);
  assert.ok(wrong.some((w) => w.includes('aed')));
});

test('currency mismatch stands down when a market is unknown', () => {
  // We cannot know Japan's correct currency, so flagging every marker would be
  // noise. This is the check that made free-text geography unusable before.
  const text = 'costs ₹5 lakh, 5000 AED, and 200 USD';
  assert.deepEqual(currencyMismatch(text, [], true), []);
  assert.deepEqual(currencyMismatch(text, [MARKETS.India], true), []);
  // ...but with no unknown market it behaves exactly as before.
  assert.ok(currencyMismatch(text, [], false).length > 0);
});
