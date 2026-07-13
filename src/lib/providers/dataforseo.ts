import type { SerpProvider } from '../types';
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
    return { organic, paa, related, autocomplete: related.slice(0, 6) };
  },
};
