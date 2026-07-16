'use client';
import type { SolutionInputs } from '@/lib/types';
import {
  SERVICE_CATALOG, CASE_STUDY_CATALOG, PROOF_LIMIT,
  INDUSTRY_SUGGESTIONS, GEO_SUGGESTIONS,
} from '@/lib/solutionsData';

interface Props {
  inputs: SolutionInputs;
  setInputs: (i: SolutionInputs) => void;
  onGenerate: () => void;
  loading: boolean;
}

/** At least one of industry/geography, and at least one case study. */
export function canGenerate(i: SolutionInputs): boolean {
  const hasSegment = !!(i.industry.trim() || i.geography.trim());
  return hasSegment && i.caseStudySlugs.length > 0;
}

// Case studies whose category matches a selected service are surfaced first —
// the operator usually wants proof of the thing they're selling.
const CATEGORY_BY_SERVICE: Record<string, string> = {
  'ott-production': 'OTT Production',
  'ai-brand-films': 'Brand Film',
  'micro-drama-production': 'Micro Drama',
  'ai-ad-creatives': 'Ad Creative',
  'social-media-content': 'Social',
};

export function WebpageInputsPanel({ inputs, setInputs, onGenerate, loading }: Props) {
  const set = <K extends keyof SolutionInputs>(k: K, v: SolutionInputs[K]) =>
    setInputs({ ...inputs, [k]: v });

  const toggleService = (slug: string) => {
    const next = inputs.serviceSlugs.includes(slug)
      ? inputs.serviceSlugs.filter((s) => s !== slug)
      : [...inputs.serviceSlugs, slug];
    set('serviceSlugs', next);
  };

  // Selection ORDER is meaningful: the first pick becomes the featured tile, so
  // append on select rather than re-sorting into catalog order.
  const toggleCase = (slug: string) => {
    const next = inputs.caseStudySlugs.includes(slug)
      ? inputs.caseStudySlugs.filter((s) => s !== slug)
      : [...inputs.caseStudySlugs, slug];
    set('caseStudySlugs', next);
  };

  const relevant = new Set(
    inputs.serviceSlugs.map((s) => CATEGORY_BY_SERVICE[s]).filter(Boolean),
  );
  const cases = [...CASE_STUDY_CATALOG].sort((a, b) => {
    const ar = relevant.has(a.category) ? 0 : 1;
    const br = relevant.has(b.category) ? 0 : 1;
    return ar - br || a.category.localeCompare(b.category);
  });

  const segmentMissing = !inputs.industry.trim() && !inputs.geography.trim();
  const overCap = inputs.caseStudySlugs.length > PROOF_LIMIT;
  const ready = canGenerate(inputs);

  return (
    <div className="wp-inputs">
      <label className="fld">
        <span>Industry segment</span>
        <input
          list="industry-suggestions"
          value={inputs.industry}
          placeholder="e.g. Fintech (type anything)"
          onChange={(e) => set('industry', e.target.value)}
        />
        <datalist id="industry-suggestions">
          {INDUSTRY_SUGGESTIONS.map((s) => <option key={s} value={s} />)}
        </datalist>
      </label>

      <label className="fld">
        <span>Geography</span>
        <input
          list="geo-suggestions"
          value={inputs.geography}
          placeholder="e.g. Bengaluru (type anything)"
          onChange={(e) => set('geography', e.target.value)}
        />
        <datalist id="geo-suggestions">
          {GEO_SUGGESTIONS.map((s) => <option key={s} value={s} />)}
        </datalist>
      </label>

      {segmentMissing && (
        <p className="hint warn">Fill in an industry or a geography — at least one is required.</p>
      )}

      <div className="fld">
        <span>Services <em className="muted">— optional</em></span>
        <div className="checks-list">
          {SERVICE_CATALOG.map((s) => (
            <label key={s.slug} className="chk">
              <input
                type="checkbox"
                checked={inputs.serviceSlugs.includes(s.slug)}
                onChange={() => toggleService(s.slug)}
              />
              <span>{s.title}</span>
            </label>
          ))}
        </div>
        {inputs.serviceSlugs.length === 0 && (
          <p className="hint">
            None selected — the page uses the all-services frame and an
            &ldquo;AI Content Production&rdquo; headline.
          </p>
        )}
      </div>

      <div className="fld">
        <span>
          Case studies <em className="muted">— required, pick one or more</em>
        </span>

        {/* The generator honors only the first PROOF_LIMIT picks. Say so here
            rather than silently discarding the operator's choices. */}
        {overCap && (
          <p className="hint warn">
            Only the first {PROOF_LIMIT} are shown on the page (plus a &ldquo;View all&rdquo; link).
            {' '}Extra picks are dropped.
          </p>
        )}

        <div className="checks-list scroll">
          {cases.map((c) => {
            const idx = inputs.caseStudySlugs.indexOf(c.slug);
            const picked = idx !== -1;
            const shown = picked && idx < PROOF_LIMIT;
            return (
              <label key={c.slug} className={`chk ${picked && !shown ? 'dropped' : ''}`}>
                <input type="checkbox" checked={picked} onChange={() => toggleCase(c.slug)} />
                <span>
                  {picked && (
                    <span className={`pick-no ${idx === 0 ? 'featured' : ''}`}>
                      {idx === 0 ? 'Featured' : shown ? `#${idx + 1}` : 'not shown'}
                    </span>
                  )}
                  {c.client} — {c.title}
                  <br />
                  <span className="muted small">{c.category} · {c.year}</span>
                </span>
              </label>
            );
          })}
        </div>
        {inputs.caseStudySlugs.length === 0 && (
          <p className="hint warn">Pick at least one case study — the page needs real proof.</p>
        )}
      </div>

      <label className="fld">
        <span>CTA label</span>
        <input value={inputs.cta} onChange={(e) => set('cta', e.target.value)} />
      </label>

      <button className="btn" disabled={!ready || loading} onClick={onGenerate}>
        {loading ? <><span className="spinner" /> Generating…</> : 'Generate page'}
      </button>
    </div>
  );
}
