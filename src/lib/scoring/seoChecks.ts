import type { Draft, Brief, ScoreCard } from '../types';
import { buildCard, draftText, sentences, check } from './score';
import { countWords } from '../util';

/** On-page SEO scorecard for the draft + brief. */
export function seoChecks(draft: Draft, brief: Brief): ScoreCard {
  const text = draftText(draft);
  const lower = text.toLowerCase();
  const kw = brief.primaryKeyword.toLowerCase();
  const kwWords = kw.split(/\s+/).filter((w) => w.length > 3);
  const first100 = text.split(/\s+/).slice(0, 100).join(' ').toLowerCase();
  const h2s = draft.blocks.filter((b) => b.type === 'h2').map((b) => (b.text ?? '').toLowerCase());
  const total = countWords(text);
  const kwCount = countOccurrences(lower, kwWords);
  const density = total ? (kwCount / total) * 100 : 0;
  const avgSentence = sentences(draft).reduce((s, x) => s + countWords(x), 0) / Math.max(1, sentences(draft).length);

  // heading hierarchy: no H3 before the first H2
  let sawH2 = false; let hierarchyOk = true;
  for (const b of draft.blocks) {
    if (b.type === 'h2') sawH2 = true;
    if (b.type === 'h3' && !sawH2) hierarchyOk = false;
  }

  return buildCard([
    check('meta-title-len', 'Meta title ≤ 60 chars',
      brief.metaTitle.length <= 60 ? 'pass' : 'fail',
      `${brief.metaTitle.length} chars.`),
    check('meta-desc-len', 'Meta description 120–158 chars',
      brief.metaDescription.length >= 120 && brief.metaDescription.length <= 158 ? 'pass' : 'warn',
      `${brief.metaDescription.length} chars.`),
    check('h1', 'Exactly one H1 (title)',
      brief.recommendedTitle ? 'pass' : 'fail', 'Title acts as the single H1; body starts at H2.'),
    check('hierarchy', 'Logical H2/H3 hierarchy',
      hierarchyOk ? 'pass' : 'fail', hierarchyOk ? 'No skipped levels.' : 'An H3 appears before any H2.'),
    check('kw-first-100', 'Keyword in first 100 words',
      kwWords.some((w) => first100.includes(w)) ? 'pass' : 'warn', `Primary keyword: "${kw}".`),
    check('kw-h2', 'Keyword in at least one H2',
      h2s.some((h) => kwWords.some((w) => h.includes(w))) ? 'pass' : 'warn', 'Helps topical relevance.'),
    check('kw-slug', 'Keyword in URL slug',
      kwWords.some((w) => brief.slug.includes(w)) ? 'pass' : 'warn', `Slug: ${brief.slug}`),
    check('internal-links', 'Internal links present (3–5)',
      brief.internalLinks.length >= 3 ? 'pass' : 'warn', `${brief.internalLinks.length} suggested to Zyra pages.`),
    check('external-citations', 'External citation or [source needed] present',
      /\[source needed\]|https?:\/\//i.test(text) || brief.externalSourceSuggestions.length > 0 ? 'pass' : 'warn',
      'Every external stat should be sourced.'),
    check('readability', 'Readable average sentence length',
      avgSentence <= 26 ? 'pass' : 'warn', `Avg ${avgSentence.toFixed(1)} words/sentence.`),
    check('no-stuffing', 'No keyword stuffing (<2.5%)',
      density < 2.5 ? 'pass' : 'fail', `Density ${density.toFixed(2)}%.`),
  ]);
}

function countOccurrences(text: string, words: string[]): number {
  if (!words.length) return 0;
  // count occurrences of the full keyword-ish: sum of each word hit / words.length
  const counts = words.map((w) => (text.match(new RegExp(`\\b${escapeRe(w)}\\b`, 'g')) ?? []).length);
  return Math.round(counts.reduce((a, b) => a + b, 0) / words.length);
}
function escapeRe(s: string) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
