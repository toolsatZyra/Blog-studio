import type { SerpProvider, DiscoveredQuestion } from '../types';
import { env } from '../config';

// DataForSEO SERP (Google Organic, live) — returns organic + PAA + related.
// Docs: https://docs.dataforseo.com/v3/serp/google/organic/live/advanced/
function authHeader() {
  const token = Buffer.from(`${env.dataForSeo.login}:${env.dataForSeo.password}`).toString('base64');
  return `Basic ${token}`;
}

export const dataForSeoSerpProvider: SerpProvider = {
  name: 'dataforseo',
  mode: 'live',
  async serp(query) {
    const res = await fetch('https://api.dataforseo.com/v3/serp/google/organic/live/advanced', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: authHeader() },
      body: JSON.stringify([{ keyword: query, location_code: 2356 /* India */, language_code: 'en', depth: 20 }]),
    });
    if (!res.ok) throw new Error(`DataForSEO ${res.status}: ${await res.text()}`);
    const data = await res.json();
    const items = data?.tasks?.[0]?.result?.[0]?.items ?? [];
    const organic = items
      .filter((i: { type: string }) => i.type === 'organic')
      .slice(0, 6)
      .map((i: { title: string; url: string; description?: string }) => ({
        title: i.title, url: i.url, snippet: i.description ?? '',
      }));
    const paa = items
      .filter((i: { type: string }) => i.type === 'people_also_ask')
      .flatMap((i: { items?: { title: string }[] }) => (i.items ?? []).map((q) => q.title));
    const related = items
      .filter((i: { type: string }) => i.type === 'related_searches')
      .flatMap((i: { items?: string[] }) => i.items ?? []);
    // Mine Reddit threads from the full organic list (not just the top 6) — these
    // are the Reddit discussions Google ranks for the query, so they're already
    // relevance-filtered. Prefer question-shaped titles.
    const reddit: DiscoveredQuestion[] = items
      .filter((i: { type: string; url?: string; domain?: string }) =>
        i.type === 'organic' &&
        (/(^|\.)reddit\.com/.test(i.domain ?? '') || (i.url ?? '').includes('reddit.com')))
      .map((i: { title?: string; url?: string; rank_absolute?: number }, idx: number): DiscoveredQuestion | null => {
        const text = (i.title ?? '').replace(/\s+/g, ' ').trim();
        if (!text) return null;
        return { text, source: 'reddit', mode: 'live', url: i.url, rank: i.rank_absolute ?? idx + 1 };
      })
      .filter((q: DiscoveredQuestion | null): q is DiscoveredQuestion => q !== null)
      .sort((a: DiscoveredQuestion, b: DiscoveredQuestion) =>
        Number(b.text.includes('?')) - Number(a.text.includes('?')))
      .slice(0, 6);
    return { organic, paa, related, autocomplete: related.slice(0, 6), reddit };
  },
};
