import type { KeywordMetric, SourceMode } from '../types';
import { getKeywords } from '../providers';

/** Keyword volume + difficulty (Google Ads or mock) for the expanded queries. */
export async function keywordResearch(queries: string[]): Promise<{
  keywords: KeywordMetric[]; mode: SourceMode;
}> {
  const unique = [...new Set(queries.map((q) => q.toLowerCase().trim()))].slice(0, 25);
  const { data, mode } = await getKeywords(unique);
  // Highest volume first for a useful default ordering.
  data.sort((a, b) => (b.volume ?? 0) - (a.volume ?? 0));
  return { keywords: data, mode };
}
