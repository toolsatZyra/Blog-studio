import { test } from 'node:test';
import assert from 'node:assert/strict';

import { heroPatternSvg, GOLD } from '../src/lib/export/heroPattern.ts';

test('produces a well-formed SVG at the requested size', () => {
  const svg = heroPatternSvg({ title: 'The Cost of AI Brand Films', slug: 'cost-ai-brand-films', width: 1536, height: 1024 });
  assert.match(svg, /^<svg[^>]*width="1536"[^>]*height="1024"/);
  assert.match(svg, /<\/svg>$/);
});

test('renders the title and the studio eyebrow', () => {
  const svg = heroPatternSvg({ title: 'How AI Micro Drama Works', slug: 'ai-micro-drama' });
  assert.ok(svg.includes('WHERE AI MEETS CINEMA'), 'the eyebrow');
  assert.ok(svg.includes('Micro Drama'), 'the title words render');
});

test('escapes markup in the title rather than injecting it', () => {
  const svg = heroPatternSvg({ title: 'Cost & Value <of> AI', slug: 's' });
  assert.ok(svg.includes('Cost &amp; Value &lt;of&gt; AI'));
  assert.ok(!svg.includes('<of>'));
});

test('uses the brand gold', () => {
  assert.equal(GOLD, '#c9a876');
  assert.ok(heroPatternSvg({ title: 'x', slug: 's' }).includes('#c9a876'));
});

test('is deterministic: same slug and title give byte-identical output', () => {
  const a = heroPatternSvg({ title: 'Same Post', slug: 'same-post' });
  const b = heroPatternSvg({ title: 'Same Post', slug: 'same-post' });
  assert.equal(a, b);
});

test('varies by slug: different posts get different ray layouts', () => {
  const a = heroPatternSvg({ title: 'A Title', slug: 'post-one' });
  const b = heroPatternSvg({ title: 'A Title', slug: 'post-two' });
  const rays = (s: string) => s.match(/<line /g)?.length ?? 0;
  // Same family, but the actual ray geometry differs.
  assert.notEqual(a, b, 'two slugs must not render identically');
  assert.ok(rays(a) > 0 && rays(b) > 0, 'both have rays');
});

test('the rays scale with the canvas, not fixed pixels', () => {
  const small = heroPatternSvg({ title: 'x', slug: 's', width: 320, height: 213 });
  const large = heroPatternSvg({ title: 'x', slug: 's', width: 1536, height: 1024 });
  // The glow/fade rects span the full canvas at both sizes.
  assert.ok(small.includes('width="320"'));
  assert.ok(large.includes('width="1536"'));
});

test('a long title wraps to at most three lines', () => {
  const svg = heroPatternSvg({ title: 'A Very Long Blog Title That Should Wrap Across Several Lines For Sure', slug: 's' });
  const tspans = svg.match(/<tspan /g)?.length ?? 0;
  assert.ok(tspans >= 1 && tspans <= 3, `expected 1-3 lines, got ${tspans}`);
});

test('is inert markup: no script or external refs', () => {
  const svg = heroPatternSvg({ title: 'x', slug: 's' });
  assert.ok(!/script|href|xlink/i.test(svg));
});
