import type { Draft, Brief, ScoreCard } from '../types';
import { buildCard, draftText, check } from './score';
import { ZYRA_ENTITIES } from '../zyraContext';
import { currencyMismatch, type Market } from '../markets';

/** GEO/AEO scorecard. Rewards sourced claims + structure; flags unsupported stats. */
export function geoChecks(draft: Draft, brief: Brief, markets: Market[] = [], hasUnknownMarket = false): ScoreCard {
  const text = draftText(draft);
  const first100 = text.split(/\s+/).slice(0, 100).join(' ');
  const h2s = draft.blocks.filter((b) => b.type === 'h2');
  const questionH2s = h2s.filter((b) => /\?$/.test(b.text ?? ''));

  // each major section opens with a paragraph (answer-first)
  let answerFirst = 0;
  for (let i = 0; i < draft.blocks.length; i++) {
    if (draft.blocks[i].type === 'h2') {
      const next = draft.blocks[i + 1];
      if (next && next.type === 'p') answerFirst++;
    }
  }
  const answerRatio = h2s.length ? answerFirst / h2s.length : 0;

  const entitiesHit = ZYRA_ENTITIES.filter((e) => text.toLowerCase().includes(e.toLowerCase()));
  const hasTable = draft.blocks.some((b) => b.type === 'table');
  const hasQuote = draft.blocks.some((b) => b.type === 'blockquote');

  // Unsupported-stats check: numbers that aren't Zyra proof points and have no nearby source.
  const unsupported = findUnsupportedStats(draft);
  const wrongCurrency = currencyMismatch(text, markets, hasUnknownMarket);

  return buildCard([
    check('direct-answer', 'Direct answer in first ~100 words',
      first100.length > 40 ? 'pass' : 'warn', 'Lead with the answer, not context.'),
    check('answer-first-sections', 'Each section opens with an answer',
      answerRatio >= 0.7 ? 'pass' : answerRatio >= 0.4 ? 'warn' : 'fail',
      `${answerFirst}/${h2s.length} sections answer-first.`),
    check('question-headings', '≥3 question-style H2s',
      questionH2s.length >= 3 ? 'pass' : questionH2s.length >= 1 ? 'warn' : 'fail',
      `${questionH2s.length} question headings.`),
    check('entity-coverage', 'Covers key entities',
      entitiesHit.length >= 6 ? 'pass' : entitiesHit.length >= 3 ? 'warn' : 'fail',
      `${entitiesHit.length}/${ZYRA_ENTITIES.length}: ${entitiesHit.slice(0, 6).join(', ')}.`),
    check('faq-schema', 'FAQ present (≥3 Q&A) for schema',
      draft.faq.length >= 3 ? 'pass' : 'warn', `${draft.faq.length} Q&A pairs.`),
    check('quotable', 'Quotable definition / pull-quote',
      hasQuote || /\bis (a|the|an)\b/i.test(text) ? 'pass' : 'warn', 'Gives AI engines a clean quote.'),
    check('comparison-table', 'Comparison table where useful',
      brief.intent === 'commercial' ? (hasTable ? 'pass' : 'warn') : 'pass',
      brief.intent === 'commercial' ? (hasTable ? 'Table present.' : 'Commercial intent — add a comparison table.') : 'Not required for this intent.'),
    check('no-unsupported-stats', 'No unsupported statistics',
      unsupported.length === 0 ? 'pass' : 'fail',
      unsupported.length ? `Unsourced numbers: ${unsupported.slice(0, 3).join(', ')} — add a source or remove.` : 'All numbers are sourced or Zyra proof points.'),
    check('currency-market-match', 'Currency matches target market(s)',
      markets.length === 0 ? 'unknown' : wrongCurrency.length === 0 ? 'pass' : 'fail',
      markets.length === 0
        ? 'No recognised target market — currency not checked.'
        : wrongCurrency.length
          ? `Uses currency for a non-target market: ${wrongCurrency.join(', ')}. Match ${markets.map((m) => m.currency).join(' / ')}.`
          : `Currency fits ${markets.map((m) => m.label).join(', ')}.`),
  ]);
}

const PROOF_NUMBERS = ['1,000', '1000', '50m', '50 m', '2,000', '2000', '$10m', '$10 m', '60m', '60 m'];

const CITED = /\[source needed\]|source:|according to|https?:\/\//i;
/** "the 30% rule", "the 80/20 rule" — a named concept being discussed, not a
 *  statistic being claimed. Asking for a citation on it is a category error. */
const NAMED_RULE = /\d[\d,./]*\s?%?\s*rule\b/i;

/**
 * Flags only genuinely fabrication-prone figures: percentages ("73% of CMOs")
 * and multipliers ("3.2x"). Prices, currency amounts, counts, and durations are
 * legitimate (a brand quoting its own price is not a fabricated statistic) and
 * are never flagged here — the [source-needed] placeholder check covers the rest.
 *
 * Scans PROSE ONLY, deliberately. A heading cannot carry a citation, so flagging
 * a figure because it appears in one is unfixable except by rewriting the
 * headline — and the old version did worse than that: it inspected only the
 * FIRST sentence containing the figure, so when a heading mentioned it first,
 * citing it properly in the body still would not clear the gate. Sourcing your
 * work correctly and staying blocked is how a guard loses the operator's trust.
 */
export function findUnsupportedStats(draft: Draft): string[] {
  const prose = draft.blocks
    .filter((b) => b.type !== 'h2' && b.type !== 'h3')
    .map((b) => b.text ?? (b.items ?? []).join('. ') ?? '')
    .concat(draft.faq.map((f) => `${f.q} ${f.a}`))
    .join(' ')
    .replace(/\s+/g, ' ');

  const out: string[] = [];
  const re = /(\d[\d,]*\.?\d*\s?%)|(\d+(?:\.\d+)?\s?[x×]\b)/gi;
  const sentencesArr = prose.split(/(?<=[.!?])\s+/);
  for (const m of prose.match(re) ?? []) {
    const token = m.trim().toLowerCase().replace(/\s+/g, ' ');
    if (PROOF_NUMBERS.some((p) => token.includes(p))) continue;
    // EVERY sentence carrying the figure, not just the first: one good citation
    // anywhere is enough to establish it.
    const carrying = sentencesArr.filter((s) => s.toLowerCase().includes(token));
    if (carrying.some((s) => CITED.test(s))) continue;
    if (carrying.some((s) => NAMED_RULE.test(s))) continue;
    out.push(m.trim());
  }
  return [...new Set(out)];
}
