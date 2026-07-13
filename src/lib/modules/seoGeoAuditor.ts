import type { Draft, Brief, Audit } from '../types';
import { seoChecks } from '../scoring/seoChecks';
import { geoChecks } from '../scoring/geoChecks';
import { humanVoice } from '../scoring/humanVoice';

/** Scores the draft on SEO and GEO/AEO (two separate scores) + the human-voice gate. */
export function seoGeoAuditor(draft: Draft, brief: Brief): Audit {
  return {
    seo: seoChecks(draft, brief),
    geo: geoChecks(draft, brief),
    humanVoice: humanVoice(draft),
  };
}
