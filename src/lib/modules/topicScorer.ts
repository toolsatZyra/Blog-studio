import type {
  Inputs, Research, TopicCandidate, ScoreBreakdown, SearchIntent, KeywordMetric,
} from '../types';
import { matchService } from '../zyraContext';
import { ruleBasedTopics, type SynthTopic } from './topicSynthesizer';

/** Weights are your exact model; kept in one object so they're tunable. */
export const SCORE_WEIGHTS = {
  audienceRelevance: 0.30,
  searchQuestionDemand: 0.25,
  zyraAuthorityFit: 0.20,
  commercialIntent: 0.15,
  competitionGap: 0.10,
} as const;

function clamp(n: number): number { return Math.max(0, Math.min(100, Math.round(n))); }

function audienceScore(topic: string, inputs: Inputs): number {
  const words = `${inputs.audience.industries} ${inputs.audience.roles} ${inputs.audience.geographies}`
    .toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 2);
  const t = topic.toLowerCase();
  const hits = words.filter((w) => t.includes(w)).length;
  // Base relevance + audience keyword overlap.
  return clamp(52 + hits * 14 + (t.includes('brand') || t.includes('marketing') ? 8 : 0));
}

function demandScore(topic: string, research: Research): { score: number; paaCount: number; volume: number | null } {
  const t = topic.toLowerCase();
  const paaCount = research.questions.filter((q) => q.source === 'paa').length;
  const recurrence = research.questions.filter((q) => overlap(q.text, t)).length;
  const kw: KeywordMetric | undefined = research.relatedKeywords
    .find((k) => overlap(k.keyword, t)) ?? research.relatedKeywords[0];
  const volume = kw?.volume ?? null;
  const volScore = volume ? Math.min(45, volume / 100) : 18;
  return { score: clamp(30 + volScore + paaCount * 3 + recurrence * 4), paaCount, volume };
}

function authorityScore(topic: string): { score: number; service: string | null } {
  const svc = matchService(topic);
  return { score: svc ? 88 : 46, service: svc?.name ?? null };
}

function commercialScore(topic: string, intent: SearchIntent): number {
  const t = topic.toLowerCase();
  let s = intent === 'commercial' ? 72 : intent === 'transactional' ? 85 : 40;
  if (/(cost|price|pricing|hire|agency|budget)/.test(t)) s += 12;
  return clamp(s);
}

function gapScore(topic: string, research: Research): number {
  const gaps = research.competitorGaps;
  if (!gaps.length) return 55;
  const weak = gaps.filter((g) => !g.coversTopic).length;
  return clamp(45 + (weak / gaps.length) * 45);
}

function overlap(a: string, b: string): boolean {
  const aw = new Set(a.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 3));
  return b.split(/[^a-z0-9]+/).filter((w) => w.length > 3).some((w) => aw.has(w));
}

function justify(topic: string, b: ScoreBreakdown, sig: TopicCandidate['signals']): string {
  const parts: string[] = [];
  if (sig.serviceMatch) parts.push(`maps directly to Zyra's ${sig.serviceMatch} service (authority ${b.zyraAuthorityFit})`);
  else parts.push(`broader topic — moderate fit to Zyra's services (authority ${b.zyraAuthorityFit})`);
  const demandBits: string[] = [];
  if (sig.paaCount) demandBits.push(`${sig.paaCount} related People-Also-Ask questions`);
  if (sig.redditHits) demandBits.push(`${sig.redditHits} Reddit threads`);
  if (sig.xHits) demandBits.push(`${sig.xHits} X discussions`);
  if (sig.volume) demandBits.push(`~${sig.volume.toLocaleString()} est. monthly searches`);
  if (demandBits.length) parts.push(`demand evidence: ${demandBits.join(', ')} (demand ${b.searchQuestionDemand})`);
  parts.push(`audience fit ${b.audienceRelevance}, commercial intent ${b.commercialIntent}`);
  parts.push(`competitors cover it ${b.competitionGap >= 70 ? 'thinly — clear gap to win' : 'reasonably well'} (gap ${b.competitionGap})`);
  return capitalise(parts.join('; ')) + '.';
}

function capitalise(s: string): string { return s.charAt(0).toUpperCase() + s.slice(1); }

/**
 * Scores + justifies every candidate topic and flags the top pick(s) as
 * Recommended. Topics are pre-synthesized (real blog titles + angles); if none
 * were produced, falls back to the deterministic rule-based cleanup.
 */
export function topicScorer(inputs: Inputs, research: Research, synthTopics: SynthTopic[]): TopicCandidate[] {
  const topics: SynthTopic[] = synthTopics.length ? synthTopics : ruleBasedTopics(inputs, research);
  const candidates: TopicCandidate[] = topics.map(({ title: topic, angle }) => {
    const a = audienceScore(topic, inputs);
    const d = demandScore(topic, research);
    const auth = authorityScore(topic);
    const commercial = commercialScore(topic, research.intent);
    const gap = gapScore(topic, research);
    const breakdown: ScoreBreakdown = {
      audienceRelevance: a,
      searchQuestionDemand: d.score,
      zyraAuthorityFit: auth.score,
      commercialIntent: commercial,
      competitionGap: gap,
    };
    const score = clamp(
      breakdown.audienceRelevance * SCORE_WEIGHTS.audienceRelevance +
      breakdown.searchQuestionDemand * SCORE_WEIGHTS.searchQuestionDemand +
      breakdown.zyraAuthorityFit * SCORE_WEIGHTS.zyraAuthorityFit +
      breakdown.commercialIntent * SCORE_WEIGHTS.commercialIntent +
      breakdown.competitionGap * SCORE_WEIGHTS.competitionGap,
    );
    const signals = {
      paaCount: d.paaCount,
      redditHits: research.questions.filter((q) => q.source === 'reddit').length,
      xHits: research.questions.filter((q) => q.source === 'x').length,
      serviceMatch: auth.service,
      volume: d.volume,
    };
    return {
      topic, angle, intent: research.intent, breakdown, score,
      justification: justify(topic, breakdown, signals), recommended: false, signals,
    };
  });

  candidates.sort((x, y) => y.score - x.score);
  // Flag the top pick (and any within 3 points of it) as Recommended.
  if (candidates.length) {
    const top = candidates[0].score;
    candidates.forEach((c) => { c.recommended = top - c.score <= 3; });
  }
  return candidates;
}
