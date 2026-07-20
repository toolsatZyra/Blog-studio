// Machine-readable Zyra knowledge. Only site-VERIFIED facts live here — the
// writer may assert these and nothing else numeric. See docs/zyra-context.md.

export interface ZyraService {
  slug: string; // internal-link target on thezyra.in
  name: string;
  summary: string;
  keywords: string[]; // used for authority-fit matching
}

export const ZYRA_SERVICES: ZyraService[] = [
  {
    slug: '/ott-production',
    name: 'AI Native Film Production',
    summary: 'Full-length AI-native series, films, and specials for streaming/OTT platforms.',
    keywords: ['ott', 'streaming', 'series', 'film production', 'web series', 'feature', 'jiocinema', 'netflix'],
  },
  {
    slug: '/ai-brand-films',
    name: 'AI Brand Films & Commercials',
    summary: 'Cinematic, AI-accelerated brand films and commercials.',
    keywords: ['brand film', 'commercial', 'ad film', 'brand video', 'tvc', 'cinematic', 'brand story'],
  },
  {
    slug: '/micro-drama-production',
    name: 'AI Micro Drama Production',
    summary: 'Episodic, mobile-first (9:16) serialised micro-drama.',
    keywords: ['micro drama', 'short drama', 'episodic', 'vertical video', 'reels series', 'mobile-first'],
  },
  {
    slug: '/ai-ad-creatives',
    name: 'Performance Marketing Ads',
    summary: 'High-volume performance ad creatives, multiple variants per campaign.',
    keywords: ['performance', 'ad creative', 'meta ads', 'google ads', 'cpa', 'ugc', 'variants', 'paid media', 'roas'],
  },
  {
    slug: '/social-media-content',
    name: 'Social Media Content',
    summary: 'Always-on social content production at scale.',
    keywords: ['social media', 'reels', 'shorts', 'instagram', 'linkedin', 'content engine', 'organic'],
  },
];

/** Site-verified proof points — the ONLY numbers the writer may state. */
// Each carries WHAT IT COVERS, because a bare number gets restated as a
// studio-wide claim. "60M+ views" is social content alone; micro drama's 10M+ is
// a separate figure, and a post that merged them would be overstating.
//
// Verified against the site's own per-service stats (mirrored in
// solutionsData.ts, which is generated from service-data.ts). A test pins the
// agreement so the two cannot drift apart again.
//
// REMOVED 2026-07-20, both from the stale /work line
// "1,000+ creatives. 5 formats. 50 million views.":
//   - "50M+ views": superseded. Social content alone is 60M+, so a studio-wide
//     50M could not be right. Holding both let one post claim 50M and the next
//     60M, and both looked sourced.
//   - "1,000+ creatives": unverifiable and self-contradicting. No count of
//     "creatives" exists anywhere on the site, and it understates the 2,000+ ads
//     the site does claim. Dropped rather than guessed at; the scoped numbers
//     below say more and can be defended.
// "5 formats" was checked and kept: the site has exactly 5 services.
export const ZYRA_PROOF_POINTS: string[] = [
  '5 production formats',
  '50+ brand films & ads created',
  '2,000+ ads created for performance campaigns',
  '$10M ad spend managed',
  '60M+ views generated on social content',
  '10M+ views generated on micro drama',
  '10+ episodes and 200hr+ of content produced for OTT',
];

/** Entities the GEO auditor checks the draft covers. */
export const ZYRA_ENTITIES: string[] = [
  'Zyra',
  'AI content studio',
  'AI brand films',
  'micro drama',
  'OTT',
  'performance ads',
  'social content',
  'India',
  'brands',
  'marketers',
];

export const ZYRA_CLIENTS: string[] = [
  'Adani', 'NDTV', 'Cars24', 'Swiggy', 'Wildstone',
  'Meesho', 'Country Delight', 'VAMA', 'Mederma',
];

export const ZYRA_INTERNAL_LINKS: { anchor: string; href: string }[] = [
  { anchor: 'AI brand films', href: '/ai-brand-films' },
  { anchor: 'AI micro drama production', href: '/micro-drama-production' },
  { anchor: 'AI native / OTT production', href: '/ott-production' },
  { anchor: 'performance marketing ads', href: '/ai-ad-creatives' },
  { anchor: 'social media content', href: '/social-media-content' },
  { anchor: 'our work', href: '/work' },
  { anchor: 'about Zyra', href: '/about' },
];

/** The prefilled, editable context textarea default (Part 1 input). */
export const DEFAULT_ZYRA_CONTEXT = `Zyra is India's AI Content Studio (also positioned as a Global AI Content Studio), based in Gurgaon, Haryana. Core line: "Where AI meets Cinema."

Zyra produces brand films, short films, micro drama, OTT-ready content, performance ads, and social media content — combining cinematic quality and AI-accelerated production with human-directed creative judgment, for faster timelines, lower cost, and culture-speed delivery.

Zyra works with brands across India, the GCC (Gulf markets like the UAE and Saudi Arabia), and the US — cinematic content built for each market's audience, at the speed of culture.

Five services:
1. AI Native Film Production — full-length series, films, specials for streaming/OTT.
2. AI Brand Films & Commercials — cinematic, AI-accelerated brand films.
3. AI Micro Drama Production — episodic, mobile-first serialised drama.
4. Performance Marketing Ads — high-volume performance ad creatives.
5. Social Media Content — always-on social content at scale.

Verified proof points (the only numbers to state as fact): 1,000+ creatives, 5 formats, 50M+ views; 50+ brand films & ads; 2,000+ ads created and $10M ad spend managed; 60M+ social views.

Clients (mention only when useful, never with invented outcomes): Adani, NDTV, Cars24, Swiggy, Wildstone, Meesho, Country Delight, VAMA, Mederma.

Voice: confident, cinematic, first-person plural, specific and concrete — cinematic but genuinely useful. Never fabricate numbers, prices, timelines, or client outcomes.`;

/** Which Zyra service a topic most closely maps to (authority-fit). Returns null if none. */
export function matchService(text: string): ZyraService | null {
  const t = text.toLowerCase();
  let best: { service: ZyraService; hits: number } | null = null;
  for (const service of ZYRA_SERVICES) {
    const hits = service.keywords.filter((k) => t.includes(k)).length;
    if (hits > 0 && (!best || hits > best.hits)) best = { service, hits };
  }
  return best?.service ?? null;
}
