import type { Draft, ScoreCard } from '../types';
import { buildCard, draftText, sentences, check } from './score';
import { findBannedPhrases } from './bannedPhrases';
import { countWords } from '../util';

/** Human-voice gate: burstiness, banned phrases, contractions, passive voice, concreteness. */
export function humanVoice(draft: Draft): ScoreCard {
  const text = draftText(draft);
  const sents = sentences(draft);
  const lengths = sents.map((s) => countWords(s));
  const avg = lengths.reduce((a, b) => a + b, 0) / Math.max(1, lengths.length);
  const variance = lengths.reduce((a, l) => a + (l - avg) ** 2, 0) / Math.max(1, lengths.length);
  const stdev = Math.sqrt(variance);
  const hasShort = lengths.some((l) => l <= 6);
  const hasLong = lengths.some((l) => l >= 25);

  const banned = findBannedPhrases(text);
  const contractions = (text.match(/\b\w+'(s|ll|re|t|ve|d)\b/g) ?? []).length;
  const passive = (text.match(/\b(was|were|been|is|are|be)\s+\w+(ed|en)\b/gi) ?? []).length;
  const passiveRatio = sents.length ? passive / sents.length : 0;

  // varied list lengths
  const listLens = draft.blocks.filter((b) => b.items).map((b) => b.items!.length);
  const listVaried = new Set(listLens).size > 1 || listLens.length <= 1;
  const concrete = (text.match(/\d|₹|\$|Zyra|India|Adani|Swiggy|Cars24/g) ?? []).length;

  return buildCard([
    check('burstiness', 'Sentence-length variance (burstiness)',
      stdev >= 7 && hasShort && hasLong ? 'pass' : stdev >= 4 ? 'warn' : 'fail',
      `Std dev ${stdev.toFixed(1)}; short=${hasShort}, long=${hasLong}.`),
    check('avg-sentence', 'Average sentence length ~12–24',
      avg >= 10 && avg <= 24 ? 'pass' : 'warn', `Avg ${avg.toFixed(1)} words.`),
    check('banned-phrases', 'No banned AI-tell phrases',
      banned.length === 0 ? 'pass' : 'fail',
      banned.length ? `Found: ${banned.slice(0, 4).join(', ')}.` : 'Clean.'),
    check('contractions', 'Uses contractions',
      contractions >= 2 ? 'pass' : 'warn', `${contractions} found.`),
    check('passive-voice', 'Low passive voice (<15%)',
      passiveRatio < 0.15 ? 'pass' : 'warn', `${(passiveRatio * 100).toFixed(0)}% of sentences.`),
    check('varied-lists', 'Varied list lengths (not all 3s)',
      listVaried ? 'pass' : 'warn', 'Breaks the AI rule-of-three cadence.'),
    check('concreteness', 'Concrete specifics present',
      concrete >= 3 ? 'pass' : 'warn', `${concrete} concrete markers (numbers/names).`),
  ]);
}
