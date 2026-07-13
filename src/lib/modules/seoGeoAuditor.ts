import type { Draft, Brief, Audit, Inputs } from '../types';
import { seoChecks } from '../scoring/seoChecks';
import { geoChecks } from '../scoring/geoChecks';
import { humanVoice } from '../scoring/humanVoice';
import { parseMarkets } from '../markets';

/** Scores the draft on SEO and GEO/AEO (two separate scores) + the human-voice gate. */
export function seoGeoAuditor(draft: Draft, brief: Brief, inputs?: Inputs): Audit {
  const markets = inputs ? parseMarkets(inputs.audience.geographies) : [];
  return {
    seo: seoChecks(draft, brief),
    geo: geoChecks(draft, brief, markets),
    humanVoice: humanVoice(draft),
  };
}
