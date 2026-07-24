import type { HeroImage } from '../types';
import { env, isLive } from '../config';

// Generates a hero/poster image for a post. Live: OpenAI images (gpt-image-1),
// returned as a committable PNG. Mock: a deterministic branded SVG preview
// (not committed — the poster stays a placeholder until a real image exists).

export interface ImageInput {
  title: string;
  slug: string;
  angle?: string;
  zyraContext?: string;
}

function buildPrompt({ title, angle }: ImageInput): string {
  return [
    `Cinematic, premium editorial hero image for a blog post titled "${title}".`,
    'Style: filmic, moody, dark background with warm gold accent lighting, subtle film-grain, shallow depth of field, abstract and atmospheric — evoking an AI film studio.',
    angle ? `Mood/angle: ${angle}.` : '',
    'No text, no words, no logos, no watermark. 3:2 landscape composition suitable as a blog cover.',
  ].filter(Boolean).join(' ');
}

export async function imageGenerator(input: ImageInput): Promise<HeroImage> {
  const prompt = buildPrompt(input);

  if (isLive.openai()) {
    try {
      const res = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${env.openaiKey}` },
        body: JSON.stringify({ model: env.openaiImageModel, prompt, size: '1536x1024', n: 1 }),
      });
      if (!res.ok) throw new Error(`OpenAI images ${res.status}: ${(await res.text()).slice(0, 200)}`);
      const data = await res.json();
      const b64: string = data.data?.[0]?.b64_json;
      if (!b64) throw new Error('No image returned.');
      const filename = `${input.slug}.png`;
      return {
        dataUrl: `data:image/png;base64,${b64}`,
        base64: b64,
        mimeType: 'image/png',
        ext: 'png',
        filename,
        posterPath: `/posters/${filename}`,
        prompt,
        mode: 'live',
        publishable: true,
      };
    } catch (e) {
      console.warn('[imageGenerator] fell back to mock SVG:', (e as Error).message);
    }
  }

  // Mock: deterministic branded SVG preview (not committed to the repo).
  const svg = brandedSvg(input.title);
  const base64 = Buffer.from(svg, 'utf8').toString('base64');
  return {
    dataUrl: `data:image/svg+xml;base64,${base64}`,
    base64,
    mimeType: 'image/svg+xml',
    ext: 'svg',
    filename: '',
    posterPath: '/posters/REPLACE-ME.webp',
    prompt,
    mode: 'mock',
    publishable: false,
  };
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function wrap(title: string, perLine = 22, maxLines = 3): string[] {
  const words = title.split(/\s+/);
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    if ((cur + ' ' + w).trim().length > perLine) { lines.push(cur.trim()); cur = w; }
    else cur = (cur + ' ' + w).trim();
    if (lines.length === maxLines) break;
  }
  if (cur && lines.length < maxLines) lines.push(cur.trim());
  if (lines.length === maxLines) lines[maxLines - 1] = lines[maxLines - 1].replace(/[,.;:]?$/, '…');
  return lines;
}

function brandedSvg(title: string): string {
  const lines = wrap(title);
  const tspans = lines
    .map((l, i) => `<tspan x="110" dy="${i === 0 ? 0 : 74}">${esc(l)}</tspan>`)
    .join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1536" height="1024" viewBox="0 0 1536 1024">
  <defs>
    <radialGradient id="glow" cx="72%" cy="30%" r="60%">
      <stop offset="0%" stop-color="#c9a876" stop-opacity="0.22"/>
      <stop offset="60%" stop-color="#c9a876" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#141210"/>
      <stop offset="100%" stop-color="#050504"/>
    </linearGradient>
  </defs>
  <rect width="1536" height="1024" fill="url(#bg)"/>
  <rect width="1536" height="1024" fill="url(#glow)"/>
  <text x="110" y="360" fill="#c9a876" font-family="Georgia, serif" font-size="26" letter-spacing="8">ZYRA — WHERE AI MEETS CINEMA</text>
  <text x="110" y="440" fill="#ece9e2" font-family="Georgia, serif" font-size="66" font-weight="400">${tspans}</text>
  <rect x="110" y="${440 + lines.length * 74 + 20}" width="120" height="3" fill="#c9a876"/>
</svg>`;
}
