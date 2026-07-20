import type { Draft, Brief, Audit, Inputs } from '../types';
import { seoChecks } from '../scoring/seoChecks';
import { geoChecks } from '../scoring/geoChecks';
import { humanVoice } from '../scoring/humanVoice';
import { parseMarkets } from '../markets';

// Checks that must pass before a draft can be published (critical quality gates).
//
// 'no-unsupported-stats' is deliberately NOT here. It reports, it does not
// refuse. A regex cannot separate a statistic asserted as fact from a number
// explaining an idea, and it produced three distinct false positives in a day:
// a percentage in a heading (which can never carry a citation), a figure cited
// correctly in the body but named first in a heading, and the complement of a
// named ratio ("no more than 30% ... the remaining 70%"). Each one blocked an
// article whose numbers were fine, and the only fix it offered was deleting a
// true statement.
//
// The real defence moved upstream: the writer is now told in the guard's own
// terms to cite every figure inline or drop it (see buildPrompt). This check is
// the second pair of eyes, and it still names the offending sentence in the
// checklist - it just leaves the judgment to the operator.
//
// Placeholders stay blocking. "[source needed]" is unambiguous: the writer is
// saying outright that it could not source the claim.
const CRITICAL = new Set(['no-duplicate-content', 'no-placeholders', 'unique-content']);
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
