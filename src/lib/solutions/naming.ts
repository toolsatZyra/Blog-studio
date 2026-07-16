// Slug, H1 and eyebrow for a /solutions page.
//
// Deliberately NOT using util.ts's slugify(): that one strips stop words and
// caps at 7 words, which would turn
// "ai-brand-films-for-fintech-brands-in-bengaluru" into
// "ai-brand-films-fintech-brands-bengaluru". The connective words are what make
// these read like real URLs, so they stay.

import type { SolutionInputs } from '../types';
import { getServiceBySlug } from '../solutionsData';
import { smartTitle } from '../util';

/** When no service is selected, one neutral umbrella covering all 5. */
export const UMBRELLA_SERVICE = 'AI Content Production';
const UMBRELLA_SLUG = 'ai-content-production';

/**
 * Canonical short name for a service, derived from its SLUG rather than its
 * catalog title. The title is a marketing string ("AI Brand Films &
 * Commercials") that makes for a clumsy H1 and a worse URL; the slug is already
 * the site's own URL for that service (/ai-brand-films), so it keeps the
 * landing page consistent with the page it links to.
 */
function slugToPhrase(slug: string): string {
  return smartTitle(slug.replace(/-/g, ' '));
}

/** URL part for the service: the single selected slug, else the umbrella. */
export function serviceSlugPart(serviceSlugs: string[]): string {
  const known = serviceSlugs.filter((s) => getServiceBySlug(s));
  return known.length === 1 ? known[0] : UMBRELLA_SLUG;
}

/** Display phrase for the H1/eyebrow: the single selected service, else the umbrella.
 *  Several services read as one umbrella rather than a list - an H1 naming three
 *  services is neither readable nor rankable. */
export function servicePhrase(serviceSlugs: string[]): string {
  const known = serviceSlugs.filter((s) => getServiceBySlug(s));
  return known.length === 1 ? slugToPhrase(known[0]) : UMBRELLA_SERVICE;
}

function toSlugPart(s: string): string {
  return s
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '') // strip accents
    .replace(/&/g, ' and ')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Deterministic, keyword-rich, readable slug.
 *   Fintech x Bengaluru x AI Brand Films
 *     -> ai-brand-films-for-fintech-brands-in-bengaluru
 *   industry only -> ai-brand-films-for-fintech-brands
 *   geography only -> ai-brand-films-in-bengaluru
 * Caller enforces that at least one of industry/geography is present.
 */
export function buildSolutionSlug(inputs: SolutionInputs): string {
  const parts = [serviceSlugPart(inputs.serviceSlugs)];
  const industry = inputs.industry.trim();
  const geography = inputs.geography.trim();

  if (industry) parts.push('for', toSlugPart(industry), 'brands');
  if (geography) parts.push('in', toSlugPart(geography));

  return parts.filter(Boolean).join('-').replace(/-+/g, '-');
}

/** De-duplicate against slugs already published. `-2`, `-3`, ... */
export function uniqueSlug(base: string, taken: string[]): string {
  if (!taken.includes(base)) return base;
  for (let n = 2; n < 500; n++) {
    const candidate = `${base}-${n}`;
    if (!taken.includes(candidate)) return candidate;
  }
  throw new Error(`Could not find a free slug for "${base}".`);
}

/**
 * H1. With one service: "AI Brand Films for Fintech Brands in Bengaluru".
 * With none/several: "AI Content Production for Fintech in Bengaluru" - note the
 * umbrella form drops "Brands", per the decided edge case.
 */
export function buildH1(inputs: SolutionInputs): string {
  const service = servicePhrase(inputs.serviceSlugs);
  const umbrella = service === UMBRELLA_SERVICE;
  const industry = inputs.industry.trim();
  const geography = inputs.geography.trim();

  let out = service;
  if (industry) out += umbrella ? ` for ${industry}` : ` for ${industry} Brands`;
  if (geography) out += ` in ${geography}`;
  return out;
}

/** Eyebrow: "AI Brand Films · Fintech · Bengaluru". Drops the service segment
 *  when none is selected -> "Fintech · Bengaluru". */
export function buildEyebrow(inputs: SolutionInputs): string {
  const service = servicePhrase(inputs.serviceSlugs);
  const segments: string[] = [];
  if (service !== UMBRELLA_SERVICE) segments.push(service);
  if (inputs.industry.trim()) segments.push(inputs.industry.trim());
  if (inputs.geography.trim()) segments.push(inputs.geography.trim());
  return segments.join(' · ');
}
