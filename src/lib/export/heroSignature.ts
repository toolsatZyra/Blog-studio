// The "light signature" every generated blog hero carries: a top-right gold
// glow, a dark bottom fade, and a short gold rule lower-left. It is the look of
// the studio's SVG fallback (imageGenerator.ts brandedSvg), applied to the real
// generated photo so the two finally match and every hero reads as one set.
//
// This module is PURE - it returns the overlay as an SVG string and nothing
// more. The actual compositing onto the PNG happens in a thin browser wrapper
// (applyHeroSignature.ts) that draws this over the image on a canvas. Keeping the
// geometry here means the deterministic part is unit-tested without a DOM.
//
// Every dimension is a fraction of width/height, so the signature reads the same
// on a 320px card thumbnail and a 1536px hero.

export const GOLD = '#c9a876';

/** The overlay SVG for an image of the given pixel size. */
export function heroSignatureSvg(width: number, height: number): string {
  // Gold rule: a short bar in the lower-left. 8% of the width, ~0.6% of height
  // tall (min 2px), inset from the edge by 3% of the width.
  const ruleWidth = round(width * 0.08);
  const ruleHeight = Math.max(2, round(height * 0.006));
  const ruleX = round(width * 0.03);
  const ruleY = round(height - height * 0.06);

  // data-* attributes expose the derived geometry so tests can assert the
  // scaling without parsing gradient internals. Browsers ignore them.
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <radialGradient id="hs-glow" cx="76%" cy="22%" r="52%">
      <stop offset="0%" stop-color="${GOLD}" stop-opacity="0.38"/>
      <stop offset="70%" stop-color="${GOLD}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="hs-fade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="52%" stop-color="#050403" stop-opacity="0"/>
      <stop offset="100%" stop-color="#050403" stop-opacity="0.9"/>
    </linearGradient>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#hs-glow)"/>
  <rect width="${width}" height="${height}" fill="url(#hs-fade)"/>
  <rect data-rule-x="${ruleX}" data-rule-y="${ruleY}" data-rule-width="${ruleWidth}" x="${ruleX}" y="${ruleY}" width="${ruleWidth}" height="${ruleHeight}" fill="${GOLD}"/>
</svg>`;
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}
