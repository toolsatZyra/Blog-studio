// Re-derive everything downstream of a hand-edited draft.
//
// WHY THIS EXISTS: publish ships `exports.blogPost`, NOT `draft`. So an editor
// that changes `draft` without re-deriving would silently publish the original,
// un-edited text and show a stale audit score. `draft` is the single source of
// truth; this module keeps `audit` and `exports` honest about it.
//
// This is cheap and synchronous: seoGeoAuditor() and exporter() are pure, and
// the only LLM step in the writing pipeline (classifyCategory) depends on
// inputs+brief, NOT on the draft — so an edit never needs a model call. The
// already-resolved category is threaded back in by the caller.

import type { Draft, Brief, Inputs, Audit, Exports } from './types';
import { seoGeoAuditor } from './modules/seoGeoAuditor';
import { exporter } from './modules/exporter';
import { countWords } from './util';

/**
 * Recompute the counters that depend on block content.
 *
 * The formula matches blogGenerator/humanizer exactly (blocks only, FAQ
 * excluded) so an edited draft counts the same way a generated one does.
 * Note the audit's placeholder check is broader — it scans blocks AND the FAQ
 * via draftText() — so a [source needed] left in an FAQ answer still blocks
 * publish even though it isn't in this count. That fails closed, which is the
 * safe direction; the UI surfaces audit blockers so it isn't a silent trap.
 */
export function recountDraft(draft: Draft): Draft {
  const text = draft.blocks.map((b) => b.text ?? (b.items ?? []).join(' ')).join(' ');
  return {
    ...draft,
    wordCount: countWords(text),
    sourceNeededCount: (text.match(/\[source needed\]/gi) ?? []).length,
  };
}

export interface Rederived {
  draft: Draft;
  audit: Audit;
  exports: Exports;
}

/**
 * Recount the draft, then rebuild the audit and exports from it.
 *
 * @param category the already-resolved site category (read from the previous
 *   exports.blogPost.category) so we don't re-run the LLM classifier. When
 *   omitted, cmsCopy falls back to the coarse goal map.
 * @param today injectable for stable tests (exporter stamps the post date).
 */
export function rederive(
  draft: Draft, brief: Brief, inputs: Inputs, category?: string, today?: Date,
): Rederived {
  const counted = recountDraft(draft);
  return {
    draft: counted,
    audit: seoGeoAuditor(counted, brief, inputs),
    exports: exporter(counted, brief, inputs, today, category),
  };
}
