import { test } from 'node:test';
import assert from 'node:assert/strict';

import { heroSignatureSvg, GOLD } from '../src/lib/export/heroSignature.ts';

test('produces a well-formed SVG at the image dimensions', () => {
  const svg = heroSignatureSvg(1536, 1024);
  assert.match(svg, /^<svg[^>]*width="1536"[^>]*height="1024"/);
  assert.match(svg, /<\/svg>$/);
});

test('carries all three signature elements', () => {
  const svg = heroSignatureSvg(1536, 1024);
  assert.ok(/radialGradient/.test(svg), 'the top-right glow');
  assert.ok(/linearGradient/.test(svg), 'the bottom fade');
  assert.ok(/<rect[^>]*height="[0-9.]+"[^>]*\/>/.test(svg), 'the gold rule');
});

test('uses the brand gold, not an arbitrary colour', () => {
  assert.equal(GOLD, '#c9a876');
  assert.ok(heroSignatureSvg(1536, 1024).includes('#c9a876'));
});

test('the rule and glow scale with the image, not fixed pixels', () => {
  const small = heroSignatureSvg(320, 213);
  const large = heroSignatureSvg(1536, 1024);
  const ruleW = (s: string) => Number(s.match(/data-rule-width="([0-9.]+)"/)![1]);
  assert.ok(ruleW(large) > ruleW(small), 'the rule is wider on a larger image');
  // rule width is a fixed fraction of image width
  assert.ok(Math.abs(ruleW(small) / 320 - ruleW(large) / 1536) < 0.001, 'same proportion at both sizes');
});

test('the rule sits near the bottom-left, inside the frame', () => {
  const svg = heroSignatureSvg(1000, 500);
  const x = Number(svg.match(/data-rule-x="([0-9.]+)"/)![1]);
  const y = Number(svg.match(/data-rule-y="([0-9.]+)"/)![1]);
  assert.ok(x > 0 && x < 200, `rule x should be left-margin, got ${x}`);
  assert.ok(y > 400 && y < 500, `rule y should be near the base, got ${y}`);
});

test('is inert markup: no script, no external refs', () => {
  const svg = heroSignatureSvg(1536, 1024);
  assert.ok(!/script|href|xlink/i.test(svg));
});
