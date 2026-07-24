// The blog hero as a generated PATTERN, not a photo. A near-black field, a fan of
// thin gold "projector" rays from a top corner, the studio eyebrow, the post
// title, and the gold rule. Deterministic and seeded by the slug, so every post
// gets a hero from the same family that still differs post to post.
//
// Taste reference: Nicolas Solerieu's minimal dark geometric blog covers -
// sparse, refined, one accent colour on near-black. The rays stay quiet.
//
// Pure: no DOM, no Date, no random. The slug is the only source of variation, so
// the same post always renders the same hero. A thin browser wrapper rasterises
// this SVG to the committed PNG (see rasterizeSvg.ts).

export const GOLD = '#c9a876';
const CREAM = '#ece9e2';
const EYEBROW = 'ZYRA · WHERE AI MEETS CINEMA';

export interface PatternInput {
  title: string;
  slug: string;
  width?: number;
  height?: number;
}

/** Small deterministic hash of the slug → a stable integer seed. */
function seedFrom(slug: string): number {
  let h = 2166136261;
  for (let i = 0; i < slug.length; i++) {
    h ^= slug.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** A tiny seeded PRNG (mulberry32) so ray placement is stable per slug. */
function rng(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** Wrap the title to at most `maxLines` lines of roughly `perLine` chars. */
function wrap(title: string, perLine: number, maxLines: number): string[] {
  const words = title.split(/\s+/);
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    if ((cur + ' ' + w).trim().length > perLine && cur) { lines.push(cur.trim()); cur = w; }
    else cur = (cur + ' ' + w).trim();
    if (lines.length === maxLines) break;
  }
  if (cur && lines.length < maxLines) lines.push(cur.trim());
  return lines;
}

/**
 * The hero SVG for a post. Deterministic in every input.
 *
 * The rays fan from the top-right toward the lower-left, their count and spread
 * seeded by the slug. The glow anchors the same corner. The title sits lower-left
 * over the dark, with the eyebrow above it and the gold rule beneath.
 */
export function heroPatternSvg({ title, slug, width = 1536, height = 1024 }: PatternInput): string {
  const rand = rng(seedFrom(slug || title));

  // 7-11 rays, fanning from the top-right corner. Seeded spread so each post
  // differs; kept sparse and quiet per the reference.
  const rayCount = 7 + Math.floor(rand() * 5);
  const originX = width;
  const originY = 0;
  const spread = 0.55 + rand() * 0.25; // how wide the fan opens across the base
  const rays: string[] = [];
  for (let i = 0; i < rayCount; i++) {
    const t = (i + rand() * 0.6) / rayCount;
    const endX = width * (1 - spread) - width * 0.15 * rand();
    const endY = height * (0.35 + t * 0.9);
    const op = (0.10 + rand() * 0.12).toFixed(3);
    rays.push(`<line x1="${originX}" y1="${originY}" x2="${round(endX)}" y2="${round(endY)}" stroke="${GOLD}" stroke-width="1" opacity="${op}"/>`);
  }

  const titleLines = wrap(title, 24, 3);
  const titleSize = round(height * 0.052);
  const baseY = round(height * 0.60);
  const tspans = titleLines
    .map((l, i) => `<tspan x="${round(width * 0.034)}" dy="${i === 0 ? 0 : round(titleSize * 1.18)}">${esc(l)}</tspan>`)
    .join('');

  const eyebrowY = round(baseY - titleSize - height * 0.03);
  const ruleY = round(baseY + titleLines.length * titleSize * 1.18 - titleSize + height * 0.02);
  const ruleW = round(width * 0.05);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="hp-bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#141009"/>
      <stop offset="100%" stop-color="#060504"/>
    </linearGradient>
    <radialGradient id="hp-glow" cx="82%" cy="12%" r="62%">
      <stop offset="0%" stop-color="${GOLD}" stop-opacity="0.42"/>
      <stop offset="65%" stop-color="${GOLD}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="hp-fade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="55%" stop-color="#050403" stop-opacity="0"/>
      <stop offset="100%" stop-color="#050403" stop-opacity="0.85"/>
    </linearGradient>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#hp-bg)"/>
  <g>${rays.join('')}</g>
  <rect width="${width}" height="${height}" fill="url(#hp-glow)"/>
  <rect width="${width}" height="${height}" fill="url(#hp-fade)"/>
  <text x="${round(width * 0.034)}" y="${eyebrowY}" fill="${GOLD}" font-family="Georgia, serif" font-size="${round(height * 0.019)}" letter-spacing="6">${esc(EYEBROW)}</text>
  <text y="${baseY}" fill="${CREAM}" font-family="Georgia, serif" font-size="${titleSize}" font-weight="400">${tspans}</text>
  <rect x="${round(width * 0.034)}" y="${ruleY}" width="${ruleW}" height="${Math.max(2, round(height * 0.004))}" fill="${GOLD}"/>
</svg>`;
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}
