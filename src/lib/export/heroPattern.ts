// The blog hero as a generated PATTERN, not a photo.
//
// One system, eight motifs. Every hero shares the same chrome - near-black
// field, gold glow, bottom fade, studio eyebrow, cream serif title, gold rule -
// and the slug picks which motif fills the space behind it:
//
//   rays     a fan of thin gold projector beams from the top-right
//   contour  flowing topographic gold curves
//   frames   a filmstrip of empty gold frames with sprocket holes
//   arcs     concentric lens rings from the corner
//   grid     a sparse dot matrix that thins as it falls
//   aperture camera-iris blades
//   waveform an audio waveform - the sound side of production
//   horizon  a receding perspective grid
//
// Consistent enough to read as one brand on the blog index, varied enough that
// posts are distinguishable at a glance. Taste reference: Nicolas Solerieu's
// minimal dark geometric blog covers - sparse, one accent on near-black.
//
// Pure: no DOM, no Date, no random. The slug is the only source of variation, so
// a given post always renders the same hero. A thin browser wrapper rasterises
// this to the committed PNG (see rasterizeSvg.ts).

export const GOLD = '#c9a876';
const CREAM = '#ece9e2';
const EYEBROW = 'ZYRA · WHERE AI MEETS CINEMA';

export const MOTIFS = ['rays', 'contour', 'frames', 'arcs', 'grid', 'aperture', 'waveform', 'horizon'] as const;
export type Motif = (typeof MOTIFS)[number];

export interface PatternInput {
  title: string;
  slug: string;
  width?: number;
  height?: number;
  /** Override the slug-derived motif. Used by the studio's motif picker. */
  motif?: Motif;
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

/** A tiny seeded PRNG (mulberry32) so motif geometry is stable per slug. */
function rng(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Which motif this slug gets. Exported so the picker and tests agree. */
export function motifFor(slug: string): Motif {
  return MOTIFS[seedFrom(slug) % MOTIFS.length];
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
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

// ── motifs ──────────────────────────────────────────────────────────────────
// Each returns inner SVG markup and keeps clear of the lower-left, where the
// title sits.

function raysMotif(w: number, h: number, rand: () => number): string {
  const count = 7 + Math.floor(rand() * 5);
  const spread = 0.55 + rand() * 0.25;
  const out: string[] = [];
  for (let i = 0; i < count; i++) {
    const t = (i + rand() * 0.6) / count;
    const endX = w * (1 - spread) - w * 0.15 * rand();
    const endY = h * (0.35 + t * 0.9);
    const op = (0.10 + rand() * 0.12).toFixed(3);
    out.push(`<line x1="${w}" y1="0" x2="${round(endX)}" y2="${round(endY)}" stroke="${GOLD}" stroke-width="1" opacity="${op}"/>`);
  }
  return out.join('');
}

function contourMotif(w: number, h: number, rand: () => number): string {
  const lines = 6 + Math.floor(rand() * 4);
  const gap = h / (lines + 2);
  const amp = h * (0.05 + rand() * 0.05);
  const phase = rand() * 2;
  const out: string[] = [];
  for (let i = 0; i < lines; i++) {
    const y = gap * (i + 1);
    const a = amp * (0.6 + rand() * 0.8);
    const op = (0.12 + rand() * 0.12).toFixed(3);
    const c1 = round(y - a);
    const c2 = round(y + a * (phase > 1 ? 1 : -1));
    out.push(
      `<path d="M${-w * 0.03} ${round(y)} Q ${round(w * 0.28)} ${c1} ${round(w * 0.55)} ${round(y)} T ${round(w * 1.03)} ${c2}" fill="none" stroke="${GOLD}" stroke-width="1" opacity="${op}"/>`,
    );
  }
  return out.join('');
}

function framesMotif(w: number, h: number, rand: () => number): string {
  const cols = 3 + Math.floor(rand() * 2);
  const fw = w * 0.11;
  const fh = fw * 0.66;
  const gapX = fw * 1.18;
  const startX = w - gapX * cols - w * 0.04;
  const startY = h * (0.10 + rand() * 0.06);
  const rows = 2;
  const out: string[] = [];
  for (let r = 0; r < rows; r++) {
    const y = startY + r * fh * 1.24;
    for (let c = 0; c < cols; c++) {
      const x = startX + c * gapX;
      const op = (0.14 + rand() * 0.12).toFixed(3);
      out.push(`<rect x="${round(x)}" y="${round(y)}" width="${round(fw)}" height="${round(fh)}" fill="none" stroke="${GOLD}" stroke-width="1.5" opacity="${op}"/>`);
    }
    // sprocket holes down the left of each strip row
    for (let s = 0; s < 3; s++) {
      const sy = y + fh * (0.12 + s * 0.33);
      out.push(`<rect x="${round(startX - fw * 0.16)}" y="${round(sy)}" width="${round(fw * 0.05)}" height="${round(fh * 0.14)}" fill="${GOLD}" opacity="0.22"/>`);
    }
  }
  return out.join('');
}

/** Concentric arcs radiating from the top-right — a lens/ripple read. */
function arcsMotif(w: number, h: number, rand: () => number): string {
  const count = 6 + Math.floor(rand() * 4);
  const step = Math.max(w, h) * (0.085 + rand() * 0.03);
  const start = Math.max(w, h) * (0.14 + rand() * 0.06);
  const out: string[] = [];
  for (let i = 0; i < count; i++) {
    const r = start + i * step;
    const op = (0.16 - i * 0.012).toFixed(3);
    out.push(`<circle cx="${w}" cy="0" r="${round(r)}" fill="none" stroke="${GOLD}" stroke-width="1" opacity="${op}"/>`);
  }
  return out.join('');
}

/** A sparse dot matrix that thins as it falls — digital, generative. */
function gridMotif(w: number, h: number, rand: () => number): string {
  const cols = 10 + Math.floor(rand() * 4);
  const rows = 6 + Math.floor(rand() * 3);
  const x0 = w * 0.42;
  const y0 = h * 0.10;
  const dx = (w * 0.55) / cols;
  const dy = (h * 0.5) / rows;
  const r = Math.max(1.2, w * 0.0016);
  const out: string[] = [];
  for (let ry = 0; ry < rows; ry++) {
    for (let cx = 0; cx < cols; cx++) {
      // thin out toward the lower-left so the title stays clean
      if (rand() < 0.18 + (ry / rows) * 0.35) continue;
      const op = (0.30 - (ry / rows) * 0.18).toFixed(3);
      out.push(`<circle cx="${round(x0 + cx * dx)}" cy="${round(y0 + ry * dy)}" r="${round(r)}" fill="${GOLD}" opacity="${op}"/>`);
    }
  }
  return out.join('');
}

/** Camera-iris blades — the most literal lens reference. */
function apertureMotif(w: number, h: number, rand: () => number): string {
  const cx = w * (0.74 + rand() * 0.06);
  const cy = h * (0.34 + rand() * 0.06);
  const R = Math.min(w, h) * (0.26 + rand() * 0.06);
  const blades = 6;
  const rot = rand() * Math.PI;
  const out: string[] = [];
  for (let i = 0; i < blades; i++) {
    const a1 = rot + (i / blades) * Math.PI * 2;
    const a2 = rot + ((i + 1) / blades) * Math.PI * 2;
    const x1 = cx + R * Math.cos(a1), y1 = cy + R * Math.sin(a1);
    const x2 = cx + R * Math.cos(a2), y2 = cy + R * Math.sin(a2);
    // chord + spoke: reads as an aperture opening
    out.push(`<line x1="${round(x1)}" y1="${round(y1)}" x2="${round(x2)}" y2="${round(y2)}" stroke="${GOLD}" stroke-width="1.5" opacity="0.24"/>`);
    out.push(`<line x1="${round(cx)}" y1="${round(cy)}" x2="${round(x1)}" y2="${round(y1)}" stroke="${GOLD}" stroke-width="1" opacity="0.10"/>`);
  }
  out.push(`<circle cx="${round(cx)}" cy="${round(cy)}" r="${round(R * 0.30)}" fill="none" stroke="${GOLD}" stroke-width="1" opacity="0.20"/>`);
  return out.join('');
}

/** An audio waveform — the sound half of production. */
function waveformMotif(w: number, h: number, rand: () => number): string {
  const bars = 34 + Math.floor(rand() * 14);
  const x0 = w * 0.42;
  const span = w * 0.54;
  const mid = h * 0.30;
  const bw = Math.max(1.5, span / bars * 0.34);
  const out: string[] = [];
  for (let i = 0; i < bars; i++) {
    const t = i / bars;
    // a couple of envelopes so it looks like real audio, not noise
    const env = Math.sin(t * Math.PI) * (0.55 + 0.45 * Math.sin(t * 9 + rand()));
    const amp = Math.abs(env) * h * 0.16 * (0.35 + rand() * 0.9);
    const x = x0 + t * span;
    out.push(`<rect x="${round(x)}" y="${round(mid - amp)}" width="${round(bw)}" height="${round(amp * 2)}" fill="${GOLD}" opacity="${(0.16 + rand() * 0.14).toFixed(3)}"/>`);
  }
  return out.join('');
}

/** A receding perspective grid — cinematic depth. */
function horizonMotif(w: number, h: number, rand: () => number): string {
  const vpX = w * (0.80 + rand() * 0.10);
  const vpY = h * (0.24 + rand() * 0.08);
  const spokes = 9 + Math.floor(rand() * 4);
  const out: string[] = [];
  for (let i = 0; i < spokes; i++) {
    const t = i / (spokes - 1);
    const edgeY = h * (0.30 + t * 0.95);
    out.push(`<line x1="${round(vpX)}" y1="${round(vpY)}" x2="${round(-w * 0.02)}" y2="${round(edgeY)}" stroke="${GOLD}" stroke-width="1" opacity="${(0.08 + rand() * 0.09).toFixed(3)}"/>`);
  }
  // a few horizontals, spaced so they compress toward the vanishing point
  for (let i = 1; i <= 4; i++) {
    const y = vpY + (h - vpY) * Math.pow(i / 5, 1.7);
    out.push(`<line x1="0" y1="${round(y)}" x2="${w}" y2="${round(y)}" stroke="${GOLD}" stroke-width="1" opacity="0.07"/>`);
  }
  return out.join('');
}

const RENDERERS: Record<Motif, (w: number, h: number, rand: () => number) => string> = {
  rays: raysMotif,
  contour: contourMotif,
  frames: framesMotif,
  arcs: arcsMotif,
  grid: gridMotif,
  aperture: apertureMotif,
  waveform: waveformMotif,
  horizon: horizonMotif,
};

/**
 * The hero SVG for a post. Deterministic in every input: the same slug always
 * yields the same motif and the same geometry.
 */
export function heroPatternSvg({ title, slug, width = 1536, height = 1024, motif }: PatternInput): string {
  const key = slug || title;
  const rand = rng(seedFrom(key));
  const chosen: Motif = motif ?? motifFor(key);
  const art = RENDERERS[chosen](width, height, rand);

  const titleLines = wrap(title, 24, 3);
  const titleSize = round(height * 0.052);
  const baseY = round(height * 0.60);
  const leftX = round(width * 0.034);
  const tspans = titleLines
    .map((l, i) => `<tspan x="${leftX}" dy="${i === 0 ? 0 : round(titleSize * 1.18)}">${esc(l)}</tspan>`)
    .join('');
  const eyebrowY = round(baseY - titleSize - height * 0.03);
  const ruleY = round(baseY + titleLines.length * titleSize * 1.18 - titleSize + height * 0.02);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" data-motif="${chosen}">
  <defs>
    <linearGradient id="hp-bg-${chosen}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#141009"/>
      <stop offset="100%" stop-color="#060504"/>
    </linearGradient>
    <radialGradient id="hp-glow-${chosen}" cx="82%" cy="12%" r="62%">
      <stop offset="0%" stop-color="${GOLD}" stop-opacity="0.42"/>
      <stop offset="65%" stop-color="${GOLD}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="hp-fade-${chosen}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="55%" stop-color="#050403" stop-opacity="0"/>
      <stop offset="100%" stop-color="#050403" stop-opacity="0.85"/>
    </linearGradient>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#hp-bg-${chosen})"/>
  <g>${art}</g>
  <rect width="${width}" height="${height}" fill="url(#hp-glow-${chosen})"/>
  <rect width="${width}" height="${height}" fill="url(#hp-fade-${chosen})"/>
  <text x="${leftX}" y="${eyebrowY}" fill="${GOLD}" font-family="Georgia, serif" font-size="${round(height * 0.019)}" letter-spacing="6">${esc(EYEBROW)}</text>
  <text y="${baseY}" fill="${CREAM}" font-family="Georgia, serif" font-size="${titleSize}" font-weight="400">${tspans}</text>
  <rect x="${leftX}" y="${ruleY}" width="${round(width * 0.05)}" height="${Math.max(2, round(height * 0.004))}" fill="${GOLD}"/>
</svg>`;
}
