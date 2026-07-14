import type { Inputs, Brief } from '../types';
import { getLLM } from '../providers';

// The four real categories on thezyra.in/blog. A post's category MUST be one of
// these exact strings or the site's category filter won't match it.
export const SITE_CATEGORIES = ['Industry', 'Playbook', 'Performance', 'Operations'] as const;
export type SiteCategory = typeof SITE_CATEGORIES[number];

// Deterministic fallback: coarse map from the blog goal. Used only when the LLM
// is unavailable or returns something unusable. Note it can't reach Operations —
// that's exactly why the LLM classifier below is preferred.
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

const SYSTEM = `You file Zyra blog posts into EXACTLY ONE of four categories. Reply with ONLY the category word — no punctuation, no explanation.
- Industry: market shifts, trends, the AI/creative economy, where the industry is heading, analysis or commentary.
- Playbook: how-to guides, frameworks, step-by-step tactics ("how to do X").
- Performance: paid ads, performance marketing, ROAS/CPA/CTR, ad-creative volume, conversion.
- Operations: team, workflow, process, scaling content production, running a content engine.`;

function normalize(raw: string): SiteCategory | null {
  const t = raw.toLowerCase();
  for (const c of SITE_CATEGORIES) if (t.includes(c.toLowerCase())) return c;
  return null;
}

/** Classify a post into one of the site's four real categories (LLM, goal fallback). */
export async function classifyCategory(inputs: Inputs, brief: Brief): Promise<SiteCategory> {
  const llm = getLLM();
  if (llm.liveFor('cheap')) {
    try {
      const out = await llm.generate({
        role: 'cheap',
        system: SYSTEM,
        prompt: `Title: ${brief.recommendedTitle}\nAngle: ${brief.angle}\nPrimary keyword: ${brief.primaryKeyword}\nStated goal: ${inputs.goal}\n\nCategory:`,
        maxTokens: 32,
        temperature: 0,
      });
      const c = normalize(out);
      if (c) return c;
    } catch {
      // fall through to the goal map
    }
  }
  return categoryByGoal(inputs.goal);
}
