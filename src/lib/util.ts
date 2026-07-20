// Small deterministic helpers. No Date.now()/Math.random() so mocks + tests are stable.

/** Stable 32-bit hash of a string → non-negative int. */
export function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Deterministic integer in [min, max] derived from a seed string. */
export function seededInt(seed: string, min: number, max: number): number {
  if (max <= min) return min;
  return min + (hash(seed) % (max - min + 1));
}

/** Pick one deterministically from a list. */
export function seededPick<T>(seed: string, list: T[]): T {
  return list[hash(seed) % list.length];
}

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/['".,?!:;()]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .split('-')
    .filter((w) => !STOP_WORDS.has(w))
    .slice(0, 7)
    .join('-');
}

const STOP_WORDS = new Set([
  'a', 'an', 'the', 'of', 'to', 'in', 'on', 'for', 'and', 'or', 'is', 'are',
  'with', 'your', 'you', 'how', 'what', 'why', 'do', 'does',
]);

export function splitSentences(text: string): string[] {
  return text
    .replace(/\n+/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function countWords(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

/**
 * A word that already carries a capital past its first letter was cased on
 * purpose: iPhone, eBay, YouTube, McKinsey, LinkedIn. Uppercasing its first
 * character produces "IPhone", which reads as careless to the exact reader these
 * articles are written for.
 */
function isDeliberatelyCased(word: string): boolean {
  return /[A-Z]/.test(word.slice(1));
}

export function titleCase(s: string): string {
  return s.replace(/[\w']+/g, (w) => (isDeliberatelyCased(w) ? w : w.charAt(0).toUpperCase() + w.slice(1)));
}

const ACRONYMS: Record<string, string> = {
  ai: 'AI', ott: 'OTT', gcc: 'GCC', us: 'US', usa: 'USA', uk: 'UK', uae: 'UAE',
  ksa: 'KSA', seo: 'SEO', aeo: 'AEO', geo: 'GEO', faq: 'FAQ', d2c: 'D2C', fmcg: 'FMCG', roi: 'ROI',
};
const SMALL_WORDS = new Set(['a', 'an', 'the', 'and', 'or', 'but', 'for', 'of', 'to', 'in', 'on', 'at', 'by', 'vs', 'with']);

/** Headline-style title case: capitalise words, keep small words lowercase (except first), fix acronyms. */
export function smartTitle(s: string): string {
  const words = s.trim().split(/\s+/);
  return words
    .map((w, i) => {
      const lower = w.toLowerCase();
      if (ACRONYMS[lower]) return ACRONYMS[lower];
      if (isDeliberatelyCased(w)) return w;
      if (i !== 0 && SMALL_WORDS.has(lower)) return lower;
      return w.charAt(0).toUpperCase() + w.slice(1);
    })
    .join(' ');
}

/** Collapse an immediately-repeated 1–4 word phrase: "cost in india cost in india" → "cost in india". */
export function dedupeAdjacentPhrase(s: string): string {
  let prev = '';
  let out = s;
  const re = /\b(\w+(?:\s+\w+){0,3})\s+\1\b/gi;
  while (out !== prev) { prev = out; out = out.replace(re, '$1'); }
  return out;
}

const KW_PREFIXES = [
  'looking for recommendations on', 'recommendations on', 'how much does', 'how much should',
  'what is the difference between', 'what is', 'who offers the best', 'has anyone actually used',
  'how long does', 'is', 'the best', 'best',
];
const KW_SUFFIXES = [
  'for a d2c brand', 'for a brand', 'realistically cost', 'worth it for brands',
  'and traditional production', '— was it worth it', 'was it worth it', 'take', 'cost',
];

/** Derive a concise, non-stuffed primary keyword from a candidate question/topic. */
export function cleanKeyword(raw: string): string {
  let s = raw.toLowerCase().replace(/[?？]+/g, '').replace(/[—–-]+/g, ' ').replace(/\s+/g, ' ').trim();
  s = dedupeAdjacentPhrase(s);
  for (const p of KW_PREFIXES) {
    if (s.startsWith(p + ' ')) { s = s.slice(p.length).trim(); break; }
  }
  for (const suf of KW_SUFFIXES) {
    if (s.endsWith(' ' + suf)) { s = s.slice(0, -suf.length).trim(); break; }
  }
  s = dedupeAdjacentPhrase(s).replace(/\s+/g, ' ').trim();
  // cap to ~6 words so it can't be a stuffed phrase
  const words = s.split(' ').filter(Boolean);
  return words.slice(0, 6).join(' ') || raw.toLowerCase().trim();
}
