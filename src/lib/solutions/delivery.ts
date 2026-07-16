// Delivery time is per-service. There is deliberately NO global default:
// quoting one number across formats is the bug this replaces - the live site
// promised "2 weeks" for everything, including work that ships in a day.
// Decided by the user 2026-07-16, verified against the site's service-data.ts.

const RANGE = 'from about a day for vertical formats to 5-7 days for a brand film';

const BY_SERVICE: Record<string, string> = {
  'ai-brand-films': '5-7 days',
  'ai-ad-creatives': 'about a day',
  'social-media-content': 'about a day',
  // 1 episode = 1 day, so a 5-episode series is about five days.
  'micro-drama-production': 'about five days',
  // OTT is NOT covered by the 1-day / 5-7-day rule. Its own published timeline
  // is correct and stands - never "correct" it to look faster.
  'ott-production': '8-10 weeks',
};

/**
 * Phrase for the trust line / delivery stat.
 * - exactly one known service -> that service's phrase
 * - several, or none          -> the range (mixed formats have no single number)
 * Unknown slugs are dropped rather than guessed.
 */
export function deliveryTimeFor(serviceSlugs: string[]): string {
  const known = serviceSlugs.filter((s) => s in BY_SERVICE);
  if (known.length === 1) return BY_SERVICE[known[0]];
  return RANGE;
}
