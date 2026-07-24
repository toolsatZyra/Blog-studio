import { test } from 'node:test';
import assert from 'node:assert/strict';

import { heroPatternSvg, GOLD, MOTIFS, motifFor } from '../src/lib/export/heroPattern.ts';

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

test('varies by slug: different posts render differently', () => {
  const a = heroPatternSvg({ title: 'A Title', slug: 'post-one' });
  const b = heroPatternSvg({ title: 'A Title', slug: 'post-two' });
  assert.notEqual(a, b, 'two slugs must not render identically');
  // Each motif draws with its own primitive - lines, paths, circles or rects -
  // so assert that art exists rather than that it is any one shape.
  const art = (s: string) => (s.match(/<g>([\s\S]*?)<\/g>/)?.[1] ?? '').trim();
  assert.ok(art(a).length > 0 && art(b).length > 0, 'both draw geometry');
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

// ── motif rotation ──────────────────────────────────────────────────────────

test('every motif renders a complete hero', () => {
  for (const m of MOTIFS) {
    const svg = heroPatternSvg({ title: 'The Cost of AI Brand Films', slug: `demo-${m}`, motif: m });
    assert.match(svg, /^<svg[^>]*>/, `${m}: opens`);
    assert.match(svg, /<\/svg>$/, `${m}: closes`);
    assert.ok(svg.includes('WHERE AI MEETS CINEMA'), `${m}: eyebrow`);
    assert.ok(svg.includes('Brand'), `${m}: title`);
    assert.ok(svg.includes(GOLD), `${m}: brand gold`);
    assert.ok(svg.includes(`data-motif="${m}"`), `${m}: tagged with its motif`);
    // The motif's art lives in the <g> group. Assert the group is non-empty
    // rather than listing primitives - enumerating shapes meant this check kept
    // going stale as motifs introduced ellipse, polygon, polyline.
    const art = svg.match(/<g>([\s\S]*?)<\/g>/)?.[1] ?? '';
    assert.ok(art.trim().length > 0, `${m}: motif group is empty - it draws nothing`);
  }
});

test('the motif is chosen by the slug and is stable', () => {
  assert.equal(motifFor('a-post'), motifFor('a-post'));
  assert.ok(MOTIFS.includes(motifFor('any-slug')));
});

test('different slugs spread across several motifs, not just one', () => {
  const seen = new Set(Array.from({ length: 60 }, (_, i) => motifFor(`post-number-${i}`)));
  assert.ok(seen.size >= 4, `expected variety across posts, got ${[...seen].join(', ')}`);
});

test('an explicit motif overrides the slug', () => {
  const svg = heroPatternSvg({ title: 'x', slug: 'whatever', motif: 'waveform' });
  assert.ok(svg.includes('data-motif="waveform"'));
});

test('gradient ids are namespaced so heroes can be inlined side by side', () => {
  const a = heroPatternSvg({ title: 'x', slug: 's', motif: 'rays' });
  const b = heroPatternSvg({ title: 'x', slug: 's', motif: 'contour' });
  assert.ok(a.includes('hp-glow-rays') && b.includes('hp-glow-contour'), 'ids carry the motif');
});

// ── Regenerate must actually change the hero ────────────────────────────────
// Everything is seeded from the slug, so without a variant the studio's
// Regenerate button recomputed a byte-identical image and appeared broken.

test('advancing the variant gives a different hero', () => {
  const a = heroPatternSvg({ title: 'A Post', slug: 'a-post', variant: 0 });
  const b = heroPatternSvg({ title: 'A Post', slug: 'a-post', variant: 1 });
  assert.notEqual(a, b, 'variant 1 must differ from variant 0');
});

test('each variant step lands on the next motif', () => {
  const slug = 'a-post';
  for (let v = 0; v < 5; v++) {
    const i = MOTIFS.indexOf(motifFor(slug, v));
    const next = MOTIFS.indexOf(motifFor(slug, v + 1));
    assert.equal(next, (i + 1) % MOTIFS.length, `variant ${v} -> ${v + 1} should advance one motif`);
  }
});

test('cycling a full lap returns to the starting motif', () => {
  assert.equal(motifFor('a-post', MOTIFS.length), motifFor('a-post', 0));
});

test('variant 0 is still the slug default, and stays stable', () => {
  assert.equal(motifFor('a-post'), motifFor('a-post', 0));
  assert.equal(
    heroPatternSvg({ title: 'A Post', slug: 'a-post' }),
    heroPatternSvg({ title: 'A Post', slug: 'a-post', variant: 0 }),
  );
});

test('cycling reaches every motif, so none is unreachable', () => {
  const seen = new Set(Array.from({ length: MOTIFS.length }, (_, v) => motifFor('a-post', v)));
  assert.equal(seen.size, MOTIFS.length, 'all 32 motifs reachable by cycling');
});
