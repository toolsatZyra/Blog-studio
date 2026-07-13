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

export function titleCase(s: string): string {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}
