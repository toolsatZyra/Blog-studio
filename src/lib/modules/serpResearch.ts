import type { Inputs, CompetitorGap, SearchIntent, SourceMode } from '../types';
import { getSerp } from '../providers';

/** SERP + competitor gap analysis for the seed topic. */
export async function serpResearch(inputs: Inputs): Promise<{
  competitorGaps: CompetitorGap[];
  intent: SearchIntent;
  related: string[];
  mode: SourceMode;
}> {
  const topic = inputs.topic.trim();
  const { data, mode } = await getSerp(topic);

  // Rank organic + any user-supplied competitor URLs as gap candidates.
  const organicGaps: CompetitorGap[] = data.organic.slice(0, 5).map((r) => ({
    url: r.url,
    title: r.title,
    coversTopic: /cost|price|guide|how/i.test(r.snippet),
    gapNote: /cost|price/i.test(r.snippet)
      ? 'Mentions the topic but covers cost/process only thinly.'
      : 'Ranks for the topic but does not directly answer cost/process — gap to win.',
  }));

  const userGaps: CompetitorGap[] = inputs.competitorUrls.filter(Boolean).map((url) => ({
    url,
    title: url,
    coversTopic: true,
    gapNote: 'User-supplied competitor — compare depth, structure, and freshness against this.',
  }));

  return {
    competitorGaps: [...userGaps, ...organicGaps],
    intent: inferIntent(topic),
    related: data.related,
    mode,
  };
}

function inferIntent(topic: string): SearchIntent {
  const t = topic.toLowerCase();
  if (/(cost|price|hire|agency|best|vs|company|service|near me)/.test(t)) return 'commercial';
  if (/(buy|book|quote|contact|sign up)/.test(t)) return 'transactional';
  return 'informational';
}
