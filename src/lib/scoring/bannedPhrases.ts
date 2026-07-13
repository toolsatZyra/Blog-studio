// AI-tell phrases the humanEditor strips and the human-voice gate fails on.

export const BANNED_PHRASES: string[] = [
  // openers
  "in today's fast-paced digital landscape",
  "in today's fast-paced world",
  'in the ever-evolving world of',
  'in the ever-evolving landscape',
  'in the digital age',
  // hype
  'unlock the power of',
  'revolutionize your brand',
  'revolutionize the way',
  'take it to the next level',
  'supercharge',
  'game-changer',
  'game changer',
  'elevate your',
  // filler connectives
  'moreover',
  'furthermore',
  'it is important to note',
  "it's important to note",
  'it is worth noting',
  "it's worth noting",
  'that being said',
  'when it comes to',
  // overused verbs/nouns
  'delve',
  'leverage',
  'harness the power',
  'navigate the landscape',
  'tapestry',
  'testament to',
  'a beacon of',
  // overused adjectives ('seamless' also substring-matches 'seamlessly')
  'seamless',
  'cutting-edge',
  'world-class',
  'unparalleled',
  // closers
  'in conclusion',
  'at the end of the day',
];

/** Replacements the humanEditor uses for a few of the worst offenders. */
export const PHRASE_REPLACEMENTS: [RegExp, string][] = [
  [/\bmoreover\b,?\s*/gi, ''],
  [/\bfurthermore\b,?\s*/gi, ''],
  [/\bit(?:'s|s| is)\s+important to note that\s*/gi, ''],
  [/\bit(?:'s|s| is)\s+worth noting that\s*/gi, ''],
  [/\bwhen it comes to\b/gi, 'for'],
  [/\bseamlessly\b/gi, 'smoothly'],
  [/\bseamless\b/gi, 'smooth'],
  [/\bleverage\b/gi, 'use'],
  [/\bdelve into\b/gi, 'dig into'],
  [/\bin conclusion\b,?\s*/gi, ''],
  [/\bcutting-edge\b/gi, 'modern'],
  [/\bgame[- ]changer\b/gi, 'turning point'],
];

/** Returns the banned phrases found in a text (lowercased match). */
export function findBannedPhrases(text: string): string[] {
  const t = text.toLowerCase();
  return BANNED_PHRASES.filter((p) => t.includes(p));
}
