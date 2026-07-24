// The blog hero as a generated PATTERN, not a photo.
//
// One system, thirty-two motifs. Every hero shares the same chrome - near-black
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

export const MOTIFS = [
  'rays', 'contour', 'frames', 'arcs', 'grid', 'aperture', 'waveform', 'horizon',
  'timeline', 'nodes', 'spectrum', 'flare', 'crosshatch', 'orbit', 'thirds', 'stairs',
  'bokeh', 'reel', 'equalizer', 'matrix', 'wave', 'spiral', 'triangles', 'hexgrid',
  'radar', 'barcode', 'slats', 'plus', 'chevron', 'lattice', 'burst', 'nest',
] as const;
export type Motif = (typeof MOTIFS)[number];

export interface PatternInput {
  title: string;
  slug: string;
  width?: number;
  height?: number;
  /** Override the slug-derived motif. Used by the studio's motif picker. */
  motif?: Motif;
  /**
   * Which alternative to show for this post. 0 is the slug's default; each
   * increment moves to the next motif and reseeds the geometry, so the studio's
   * Regenerate button can cycle instead of recomputing the same image.
   */
  variant?: number;
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

/** Which motif this slug gets at a given variant. Exported so picker and tests agree. */
export function motifFor(slug: string, variant = 0): Motif {
  return MOTIFS[(seedFrom(slug) + variant) % MOTIFS.length];
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


/** An NLE editing timeline - stacked clip bars. The edit bay, literally. */
function timelineMotif(w: number, h: number, rand: () => number): string {
  const tracks = 4 + Math.floor(rand() * 2);
  const x0 = w * 0.40, span = w * 0.56;
  const y0 = h * 0.12, gap = h * 0.055;
  const bh = gap * 0.52;
  const out: string[] = [];
  for (let t = 0; t < tracks; t++) {
    const y = y0 + t * gap;
    let x = x0 + rand() * span * 0.08;
    while (x < x0 + span) {
      const clip = span * (0.08 + rand() * 0.22);
      const end = Math.min(x + clip, x0 + span);
      out.push(`<rect x="${round(x)}" y="${round(y)}" width="${round(end - x)}" height="${round(bh)}" fill="none" stroke="${GOLD}" stroke-width="1" opacity="${(0.14 + rand() * 0.12).toFixed(3)}"/>`);
      x = end + span * (0.015 + rand() * 0.03);
    }
  }
  return out.join('');
}

/** A connected node graph - the AI half of the studio. */
function nodesMotif(w: number, h: number, rand: () => number): string {
  const n = 7 + Math.floor(rand() * 4);
  const pts: { x: number; y: number }[] = [];
  for (let i = 0; i < n; i++) {
    pts.push({ x: w * (0.42 + rand() * 0.54), y: h * (0.08 + rand() * 0.42) });
  }
  const out: string[] = [];
  for (let i = 0; i < pts.length; i++) {
    // link each node to its nearest neighbour ahead - a graph, not a scribble
    let best = -1, bd = Infinity;
    for (let j = i + 1; j < pts.length; j++) {
      const d = (pts[i].x - pts[j].x) ** 2 + (pts[i].y - pts[j].y) ** 2;
      if (d < bd) { bd = d; best = j; }
    }
    if (best >= 0) {
      out.push(`<line x1="${round(pts[i].x)}" y1="${round(pts[i].y)}" x2="${round(pts[best].x)}" y2="${round(pts[best].y)}" stroke="${GOLD}" stroke-width="1" opacity="0.14"/>`);
    }
  }
  for (const p of pts) {
    out.push(`<circle cx="${round(p.x)}" cy="${round(p.y)}" r="${round(Math.max(2, w * 0.0026))}" fill="${GOLD}" opacity="0.30"/>`);
  }
  return out.join('');
}

/** Broadcast colour bars, drawn as outlines - the test-card reference. */
function spectrumMotif(w: number, h: number, rand: () => number): string {
  const bars = 7 + Math.floor(rand() * 3);
  const x0 = w * 0.44, span = w * 0.52;
  const bw = span / bars;
  const top = h * 0.09, bh = h * 0.30;
  const out: string[] = [];
  for (let i = 0; i < bars; i++) {
    const x = x0 + i * bw;
    const inset = bw * 0.12;
    out.push(`<rect x="${round(x + inset)}" y="${round(top)}" width="${round(bw - inset * 2)}" height="${round(bh * (0.55 + rand() * 0.45))}" fill="${GOLD}" opacity="${(0.06 + rand() * 0.10).toFixed(3)}"/>`);
  }
  return out.join('');
}

/** An anamorphic lens flare - one horizontal streak through the glow. */
function flareMotif(w: number, h: number, rand: () => number): string {
  const y = h * (0.20 + rand() * 0.16);
  const out: string[] = [];
  out.push(`<line x1="${round(w * 0.06)}" y1="${round(y)}" x2="${round(w * 0.99)}" y2="${round(y)}" stroke="${GOLD}" stroke-width="1.5" opacity="0.26"/>`);
  out.push(`<line x1="${round(w * 0.22)}" y1="${round(y)}" x2="${round(w * 0.92)}" y2="${round(y)}" stroke="${GOLD}" stroke-width="3" opacity="0.10"/>`);
  // a couple of faint iris ghosts along the streak
  for (let i = 0; i < 3; i++) {
    const cx = w * (0.42 + i * 0.18 + rand() * 0.03);
    out.push(`<circle cx="${round(cx)}" cy="${round(y)}" r="${round(w * (0.012 + rand() * 0.014))}" fill="none" stroke="${GOLD}" stroke-width="1" opacity="0.13"/>`);
  }
  return out.join('');
}

/** Fine diagonal cross-hatching - a drafting texture. */
function crosshatchMotif(w: number, h: number, rand: () => number): string {
  const step = w * (0.035 + rand() * 0.015);
  const x0 = w * 0.40;
  const out: string[] = [];
  for (let x = x0; x < w * 1.1; x += step) {
    out.push(`<line x1="${round(x)}" y1="${round(h * 0.06)}" x2="${round(x - h * 0.42)}" y2="${round(h * 0.48)}" stroke="${GOLD}" stroke-width="1" opacity="0.10"/>`);
  }
  for (let x = x0; x < w * 1.1; x += step * 2) {
    out.push(`<line x1="${round(x - h * 0.42)}" y1="${round(h * 0.06)}" x2="${round(x)}" y2="${round(h * 0.48)}" stroke="${GOLD}" stroke-width="1" opacity="0.07"/>`);
  }
  return out.join('');
}

/** Tilted concentric ellipses - orbital rings. */
function orbitMotif(w: number, h: number, rand: () => number): string {
  const cx = w * (0.72 + rand() * 0.08), cy = h * (0.30 + rand() * 0.08);
  const rings = 3 + Math.floor(rand() * 3);
  const tilt = -22 - rand() * 26;
  const out: string[] = [];
  for (let i = 0; i < rings; i++) {
    const rx = Math.min(w, h) * (0.16 + i * 0.075);
    const ry = rx * (0.34 + rand() * 0.12);
    out.push(`<ellipse cx="${round(cx)}" cy="${round(cy)}" rx="${round(rx)}" ry="${round(ry)}" fill="none" stroke="${GOLD}" stroke-width="1" opacity="${(0.20 - i * 0.025).toFixed(3)}" transform="rotate(${round(tilt)} ${round(cx)} ${round(cy)})"/>`);
  }
  return out.join('');
}

/** Viewfinder framing marks - corner brackets and thirds guides. */
function thirdsMotif(w: number, h: number, rand: () => number): string {
  const x = w * 0.46, y = h * 0.08;
  const bw = w * 0.48, bh = h * 0.40;
  const arm = Math.min(bw, bh) * 0.16;
  const out: string[] = [];
  const corner = (px: number, py: number, sx: number, sy: number) =>
    `<path d="M${round(px + sx * arm)} ${round(py)} H${round(px)} V${round(py + sy * arm)}" fill="none" stroke="${GOLD}" stroke-width="1.5" opacity="0.26"/>`;
  out.push(corner(x, y, 1, 1), corner(x + bw, y, -1, 1), corner(x, y + bh, 1, -1), corner(x + bw, y + bh, -1, -1));
  for (let i = 1; i <= 2; i++) {
    out.push(`<line x1="${round(x + (bw * i) / 3)}" y1="${round(y)}" x2="${round(x + (bw * i) / 3)}" y2="${round(y + bh)}" stroke="${GOLD}" stroke-width="1" opacity="0.08"/>`);
    out.push(`<line x1="${round(x)}" y1="${round(y + (bh * i) / 3)}" x2="${round(x + bw)}" y2="${round(y + (bh * i) / 3)}" stroke="${GOLD}" stroke-width="1" opacity="0.08"/>`);
  }
  // a small focus reticle, placed on a thirds intersection
  const fx = x + (bw * (rand() < 0.5 ? 1 : 2)) / 3, fy = y + (bh * (rand() < 0.5 ? 1 : 2)) / 3;
  out.push(`<circle cx="${round(fx)}" cy="${round(fy)}" r="${round(arm * 0.34)}" fill="none" stroke="${GOLD}" stroke-width="1" opacity="0.22"/>`);
  return out.join('');
}

/** Stepped blocks descending - a stagger/ramp. */
function stairsMotif(w: number, h: number, rand: () => number): string {
  const steps = 5 + Math.floor(rand() * 3);
  const bw = w * 0.075, bh = h * 0.052;
  let x = w * 0.44, y = h * 0.11;
  const out: string[] = [];
  for (let i = 0; i < steps; i++) {
    out.push(`<rect x="${round(x)}" y="${round(y)}" width="${round(bw * (1 + rand() * 0.5))}" height="${round(bh)}" fill="none" stroke="${GOLD}" stroke-width="1" opacity="${(0.22 - i * 0.02).toFixed(3)}"/>`);
    x += bw * (0.8 + rand() * 0.5);
    y += bh * (1.1 + rand() * 0.5);
  }
  return out.join('');
}


/** Out-of-focus highlights - bokeh. */
function bokehMotif(w: number, h: number, rand: () => number): string {
  const n = 9 + Math.floor(rand() * 6);
  const out: string[] = [];
  for (let i = 0; i < n; i++) {
    const r = Math.min(w, h) * (0.02 + rand() * 0.075);
    out.push(`<circle cx="${round(w * (0.40 + rand() * 0.58))}" cy="${round(h * (0.05 + rand() * 0.42))}" r="${round(r)}" fill="none" stroke="${GOLD}" stroke-width="1" opacity="${(0.08 + rand() * 0.14).toFixed(3)}"/>`);
  }
  return out.join('');
}

/** A film strip running down the right edge. */
function reelMotif(w: number, h: number, rand: () => number): string {
  const sw = w * 0.13, x = w - sw - w * 0.05;
  const cells = 4 + Math.floor(rand() * 2);
  const ch = h * 0.85 / cells;
  const out: string[] = [`<rect x="${round(x)}" y="0" width="${round(sw)}" height="${round(h)}" fill="none" stroke="${GOLD}" stroke-width="1" opacity="0.16"/>`];
  for (let i = 0; i < cells; i++) {
    const y = h * 0.04 + i * ch;
    out.push(`<rect x="${round(x + sw * 0.18)}" y="${round(y)}" width="${round(sw * 0.64)}" height="${round(ch * 0.72)}" fill="none" stroke="${GOLD}" stroke-width="1" opacity="${(0.12 + rand() * 0.10).toFixed(3)}"/>`);
    for (const sx of [x + sw * 0.05, x + sw * 0.88]) {
      out.push(`<rect x="${round(sx)}" y="${round(y + ch * 0.24)}" width="${round(sw * 0.06)}" height="${round(ch * 0.16)}" fill="${GOLD}" opacity="0.20"/>`);
    }
  }
  return out.join('');
}

/** Equalizer columns rising from a baseline. */
function equalizerMotif(w: number, h: number, rand: () => number): string {
  const bars = 14 + Math.floor(rand() * 8);
  const x0 = w * 0.44, span = w * 0.52, base = h * 0.44;
  const bw = (span / bars) * 0.5;
  const out: string[] = [];
  for (let i = 0; i < bars; i++) {
    const hgt = h * (0.04 + rand() * 0.28);
    out.push(`<rect x="${round(x0 + (i * span) / bars)}" y="${round(base - hgt)}" width="${round(bw)}" height="${round(hgt)}" fill="none" stroke="${GOLD}" stroke-width="1" opacity="${(0.14 + rand() * 0.14).toFixed(3)}"/>`);
  }
  return out.join('');
}

/** Falling digital columns - short vertical dashes. */
function matrixMotif(w: number, h: number, rand: () => number): string {
  const cols = 12 + Math.floor(rand() * 6);
  const out: string[] = [];
  for (let c = 0; c < cols; c++) {
    const x = w * 0.42 + (c * w * 0.56) / cols;
    const runs = 2 + Math.floor(rand() * 3);
    for (let r = 0; r < runs; r++) {
      const y = h * (0.04 + rand() * 0.40);
      const len = h * (0.03 + rand() * 0.10);
      out.push(`<line x1="${round(x)}" y1="${round(y)}" x2="${round(x)}" y2="${round(y + len)}" stroke="${GOLD}" stroke-width="1.5" opacity="${(0.10 + rand() * 0.16).toFixed(3)}"/>`);
    }
  }
  return out.join('');
}

/** One long sine wave. */
function waveMotif(w: number, h: number, rand: () => number): string {
  const y = h * (0.22 + rand() * 0.14);
  const amp = h * (0.06 + rand() * 0.07);
  const k = 1.4 + rand() * 1.4;
  const pts: string[] = [];
  for (let i = 0; i <= 60; i++) {
    const t = i / 60;
    pts.push(`${round(w * t)} ${round(y + Math.sin(t * Math.PI * 2 * k) * amp)}`);
  }
  return `<polyline points="${pts.join(' ')}" fill="none" stroke="${GOLD}" stroke-width="1.5" opacity="0.24"/>`;
}

/** An archimedean spiral. */
function spiralMotif(w: number, h: number, rand: () => number): string {
  const cx = w * (0.72 + rand() * 0.08), cy = h * (0.30 + rand() * 0.06);
  const turns = 3 + rand() * 2;
  const rMax = Math.min(w, h) * (0.22 + rand() * 0.08);
  const pts: string[] = [];
  const steps = 220;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const a = t * turns * Math.PI * 2;
    const r = t * rMax;
    pts.push(`${round(cx + r * Math.cos(a))} ${round(cy + r * Math.sin(a))}`);
  }
  return `<polyline points="${pts.join(' ')}" fill="none" stroke="${GOLD}" stroke-width="1" opacity="0.22"/>`;
}

/** Scattered outlined triangles. */
function trianglesMotif(w: number, h: number, rand: () => number): string {
  const n = 5 + Math.floor(rand() * 4);
  const out: string[] = [];
  for (let i = 0; i < n; i++) {
    const cx = w * (0.44 + rand() * 0.52), cy = h * (0.07 + rand() * 0.36);
    const r = Math.min(w, h) * (0.035 + rand() * 0.06);
    const rot = rand() * Math.PI * 2;
    const p = [0, 1, 2].map((k) => {
      const a = rot + (k / 3) * Math.PI * 2;
      return `${round(cx + r * Math.cos(a))},${round(cy + r * Math.sin(a))}`;
    }).join(' ');
    out.push(`<polygon points="${p}" fill="none" stroke="${GOLD}" stroke-width="1" opacity="${(0.12 + rand() * 0.12).toFixed(3)}"/>`);
  }
  return out.join('');
}

/** A hexagonal tiling patch. */
function hexgridMotif(w: number, h: number, rand: () => number): string {
  const R = Math.min(w, h) * (0.05 + rand() * 0.02);
  const dx = R * 1.73, dy = R * 1.5;
  const cols = 5 + Math.floor(rand() * 2), rows = 3 + Math.floor(rand() * 2);
  const x0 = w * 0.46, y0 = h * 0.08;
  const out: string[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cx = x0 + c * dx + (r % 2 ? dx / 2 : 0);
      const cy = y0 + r * dy;
      const p = [0, 1, 2, 3, 4, 5].map((k) => {
        const a = (Math.PI / 180) * (60 * k - 30);
        return `${round(cx + R * Math.cos(a))},${round(cy + R * Math.sin(a))}`;
      }).join(' ');
      out.push(`<polygon points="${p}" fill="none" stroke="${GOLD}" stroke-width="1" opacity="${(0.09 + rand() * 0.10).toFixed(3)}"/>`);
    }
  }
  return out.join('');
}

/** A radar scope - rings, ticks and a sweep. */
function radarMotif(w: number, h: number, rand: () => number): string {
  const cx = w * (0.74 + rand() * 0.06), cy = h * (0.30 + rand() * 0.06);
  const R = Math.min(w, h) * (0.24 + rand() * 0.05);
  const out: string[] = [];
  for (let i = 1; i <= 3; i++) {
    out.push(`<circle cx="${round(cx)}" cy="${round(cy)}" r="${round((R * i) / 3)}" fill="none" stroke="${GOLD}" stroke-width="1" opacity="0.16"/>`);
  }
  const a = rand() * Math.PI * 2;
  out.push(`<line x1="${round(cx)}" y1="${round(cy)}" x2="${round(cx + R * Math.cos(a))}" y2="${round(cy + R * Math.sin(a))}" stroke="${GOLD}" stroke-width="1.5" opacity="0.26"/>`);
  for (let i = 0; i < 12; i++) {
    const t = (i / 12) * Math.PI * 2;
    out.push(`<line x1="${round(cx + R * 0.94 * Math.cos(t))}" y1="${round(cy + R * 0.94 * Math.sin(t))}" x2="${round(cx + R * Math.cos(t))}" y2="${round(cy + R * Math.sin(t))}" stroke="${GOLD}" stroke-width="1" opacity="0.18"/>`);
  }
  return out.join('');
}

/** Vertical lines of varying width - a barcode. */
function barcodeMotif(w: number, h: number, rand: () => number): string {
  const x0 = w * 0.44, span = w * 0.52;
  const top = h * 0.10, bh = h * 0.28;
  const out: string[] = [];
  let x = x0;
  while (x < x0 + span) {
    const bw = span * (0.004 + rand() * 0.016);
    out.push(`<rect x="${round(x)}" y="${round(top)}" width="${round(bw)}" height="${round(bh)}" fill="${GOLD}" opacity="${(0.12 + rand() * 0.16).toFixed(3)}"/>`);
    x += bw + span * (0.006 + rand() * 0.018);
  }
  return out.join('');
}

/** Evenly spaced vertical slats, opacity drifting. */
function slatsMotif(w: number, h: number, rand: () => number): string {
  const n = 16 + Math.floor(rand() * 10);
  const x0 = w * 0.40, span = w * 0.58;
  const out: string[] = [];
  for (let i = 0; i < n; i++) {
    const x = x0 + (i * span) / n;
    out.push(`<line x1="${round(x)}" y1="0" x2="${round(x)}" y2="${round(h * (0.30 + rand() * 0.28))}" stroke="${GOLD}" stroke-width="1" opacity="${(0.06 + rand() * 0.14).toFixed(3)}"/>`);
  }
  return out.join('');
}

/** A field of small plus marks. */
function plusMotif(w: number, h: number, rand: () => number): string {
  const cols = 8 + Math.floor(rand() * 4), rows = 4 + Math.floor(rand() * 2);
  const x0 = w * 0.44, y0 = h * 0.09;
  const dx = (w * 0.52) / cols, dy = (h * 0.34) / rows;
  const a = Math.min(dx, dy) * 0.18;
  const out: string[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (rand() < 0.15) continue;
      const x = x0 + c * dx, y = y0 + r * dy;
      const op = (0.20 - (r / rows) * 0.10).toFixed(3);
      out.push(`<path d="M${round(x - a)} ${round(y)} H${round(x + a)} M${round(x)} ${round(y - a)} V${round(y + a)}" stroke="${GOLD}" stroke-width="1" opacity="${op}"/>`);
    }
  }
  return out.join('');
}

/** Chevrons marching right. */
function chevronMotif(w: number, h: number, rand: () => number): string {
  const n = 5 + Math.floor(rand() * 3);
  const x0 = w * 0.48, y = h * 0.24;
  const s = Math.min(w, h) * (0.06 + rand() * 0.03);
  const gap = s * (1.3 + rand() * 0.5);
  const out: string[] = [];
  for (let i = 0; i < n; i++) {
    const x = x0 + i * gap;
    out.push(`<path d="M${round(x)} ${round(y - s)} L${round(x + s * 0.7)} ${round(y)} L${round(x)} ${round(y + s)}" fill="none" stroke="${GOLD}" stroke-width="1.5" opacity="${(0.22 - i * 0.025).toFixed(3)}"/>`);
  }
  return out.join('');
}

/** A diamond lattice. */
function latticeMotif(w: number, h: number, rand: () => number): string {
  const step = Math.min(w, h) * (0.075 + rand() * 0.03);
  const x0 = w * 0.42, y0 = h * 0.05, cols = 7, rows = 4;
  const out: string[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cx = x0 + c * step + (r % 2 ? step / 2 : 0);
      const cy = y0 + r * step * 0.8;
      const p = `${round(cx)},${round(cy - step * 0.4)} ${round(cx + step * 0.45)},${round(cy)} ${round(cx)},${round(cy + step * 0.4)} ${round(cx - step * 0.45)},${round(cy)}`;
      out.push(`<polygon points="${p}" fill="none" stroke="${GOLD}" stroke-width="1" opacity="${(0.08 + rand() * 0.09).toFixed(3)}"/>`);
    }
  }
  return out.join('');
}

/** A starburst radiating from one point. */
function burstMotif(w: number, h: number, rand: () => number): string {
  const cx = w * (0.70 + rand() * 0.10), cy = h * (0.26 + rand() * 0.08);
  const n = 14 + Math.floor(rand() * 10);
  const R = Math.min(w, h) * (0.26 + rand() * 0.10);
  const out: string[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + rand() * 0.05;
    const r0 = R * (0.18 + rand() * 0.2);
    out.push(`<line x1="${round(cx + r0 * Math.cos(a))}" y1="${round(cy + r0 * Math.sin(a))}" x2="${round(cx + R * Math.cos(a))}" y2="${round(cy + R * Math.sin(a))}" stroke="${GOLD}" stroke-width="1" opacity="${(0.10 + rand() * 0.12).toFixed(3)}"/>`);
  }
  return out.join('');
}

/** Nested rounded rectangles - a depth stack. */
function nestMotif(w: number, h: number, rand: () => number): string {
  const cx = w * (0.70 + rand() * 0.08), cy = h * (0.28 + rand() * 0.06);
  const n = 4 + Math.floor(rand() * 3);
  const out: string[] = [];
  for (let i = 0; i < n; i++) {
    const bw = Math.min(w, h) * (0.10 + i * 0.055);
    const bh = bw * 0.66;
    out.push(`<rect x="${round(cx - bw / 2)}" y="${round(cy - bh / 2)}" width="${round(bw)}" height="${round(bh)}" rx="${round(bw * 0.04)}" fill="none" stroke="${GOLD}" stroke-width="1" opacity="${(0.22 - i * 0.03).toFixed(3)}"/>`);
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
  timeline: timelineMotif,
  nodes: nodesMotif,
  spectrum: spectrumMotif,
  flare: flareMotif,
  crosshatch: crosshatchMotif,
  orbit: orbitMotif,
  thirds: thirdsMotif,
  stairs: stairsMotif,
  bokeh: bokehMotif,
  reel: reelMotif,
  equalizer: equalizerMotif,
  matrix: matrixMotif,
  wave: waveMotif,
  spiral: spiralMotif,
  triangles: trianglesMotif,
  hexgrid: hexgridMotif,
  radar: radarMotif,
  barcode: barcodeMotif,
  slats: slatsMotif,
  plus: plusMotif,
  chevron: chevronMotif,
  lattice: latticeMotif,
  burst: burstMotif,
  nest: nestMotif,
};

/**
 * The hero SVG for a post. Deterministic in every input: the same slug always
 * yields the same motif and the same geometry.
 */
export function heroPatternSvg({ title, slug, width = 1536, height = 1024, motif, variant = 0 }: PatternInput): string {
  const key = slug || title;
  // The variant shifts both the motif and the geometry seed, so cycling gives a
  // genuinely different hero rather than the same drawing in a new shape.
  const rand = rng(seedFrom(key) + variant * 0x9e3779b1);
  const chosen: Motif = motif ?? motifFor(key, variant);
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
