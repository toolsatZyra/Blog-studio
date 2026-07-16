import type { Inputs, Brief } from '../types';
import { getLLM } from '../providers';
import { SITE_CATEGORIES, categoryByGoal, normalizeCategory, type SiteCategory } from '../categories';

// The category constants + goal fallback live in ../categories, which imports
// nothing. That keeps the export chain (exporter -> cmsCopy -> categories) free
// of the LLM providers, so it can be re-run in the browser after a draft edit
// without pulling config/env into the client bundle. Re-exported here so
// existing importers keep working.
export { SITE_CATEGORIES, categoryByGoal };
export type { SiteCategory };

const SYSTEM = `You file Zyra blog posts into EXACTLY ONE of four categories. Reply with ONLY the category word — no punctuation, no explanation.
- Industry: market shifts, trends, the AI/creative economy, where the industry is heading, analysis or commentary.
- Playbook: how-to guides, frameworks, step-by-step tactics ("how to do X").
- Performance: paid ads, performance marketing, ROAS/CPA/CTR, ad-creative volume, conversion.
- Operations: team, workflow, process, scaling content production, running a content engine.`;

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
      const c = normalizeCategory(out);
      if (c) return c;
    } catch {
      // fall through to the goal map
    }
  }
  return categoryByGoal(inputs.goal);
}
