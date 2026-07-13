import type { Draft, Brief, Audit, Inputs } from '../types';
import { seoChecks } from '../scoring/seoChecks';
import { geoChecks } from '../scoring/geoChecks';
import { humanVoice } from '../scoring/humanVoice';
import { parseMarkets } from '../markets';

// Checks that must pass before a draft can be published (critical quality gates).
const CRITICAL = new Set(['no-duplicate-content', 'no-placeholders', 'unique-content', 'no-unsupported-stats']);
const SCORE_FLOOR = 60;

/** Scores the draft on SEO and GEO/AEO (two separate scores) + the human-voice gate. */
export function seoGeoAuditor(draft: Draft, brief: Brief, inputs?: Inputs): Audit {
  const markets = inputs ? parseMarkets(inputs.audience.geographies) : [];
  const seo = seoChecks(draft, brief);
  const geo = geoChecks(draft, brief, markets);
  const hv = humanVoice(draft);

  const blockers: string[] = [];
  for (const card of [seo, geo]) {
    for (const c of card.checks) {
      if (CRITICAL.has(c.id) && c.status === 'fail') blockers.push(c.detail || c.label);
    }
  }
  if (seo.score < SCORE_FLOOR) blockers.push(`SEO score ${seo.score} is below the ${SCORE_FLOOR} publish floor.`);
  if (geo.score < SCORE_FLOOR) blockers.push(`GEO/AEO score ${geo.score} is below the ${SCORE_FLOOR} publish floor.`);
  if (hv.checks.find((c) => c.id === 'banned-phrases')?.status === 'fail') blockers.push('Contains banned AI-tell phrases.');

  return { seo, geo, humanVoice: hv, publishable: blockers.length === 0, blockers };
}
