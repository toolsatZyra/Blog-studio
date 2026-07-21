// The site's real blog categories + the deterministic goal fallback.
//
// Kept free of any provider/config import so the export + audit chain
// (exporter -> cmsCopy -> here) stays safe to run in the browser. The LLM
// classifier lives in modules/categoryClassifier.ts and imports from here.

// The four real categories on thezyra.studio/blog. A post's category MUST be one of
// these exact strings or the site's category filter won't match it.
export const SITE_CATEGORIES = ['Industry', 'Playbook', 'Performance', 'Operations'] as const;
export type SiteCategory = typeof SITE_CATEGORIES[number];

// Deterministic fallback: coarse map from the blog goal. Used only when the LLM
// is unavailable or returns something unusable. Note it can't reach Operations —
// that's exactly why the LLM classifier is preferred.
const BY_GOAL: Record<string, SiteCategory> = {
  awareness: 'Industry',
  'lead generation': 'Performance',
  'thought leadership': 'Industry',
  comparison: 'Playbook',
  educational: 'Playbook',
};

export function categoryByGoal(goal: string): SiteCategory {
  return BY_GOAL[goal] ?? 'Industry';
}

export function normalizeCategory(raw: string): SiteCategory | null {
  const t = raw.toLowerCase();
  for (const c of SITE_CATEGORIES) if (t.includes(c.toLowerCase())) return c;
  return null;
}
