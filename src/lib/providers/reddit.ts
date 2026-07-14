import type { SocialProvider, DiscoveredQuestion } from '../types';

// Reddit questions via Reddit's own public search JSON — one request, no key, no
// Apify credit. Returns post titles directly (no per-post crawl), so it's fast
// enough to run inside a request. Reddit rate-limits by IP and *requires* a
// descriptive User-Agent (a generic/browser UA gets 429/403), so we send one.
const UA = 'zyra-blog-studio/1.0 (blog question discovery; +https://thezyra.in)';

interface RedditChild {
  kind: string;
  data: { title?: string; permalink?: string; over_18?: boolean; num_comments?: number };
}

export const redditJsonProvider: SocialProvider = {
  name: 'reddit-json',
  mode: 'live',
  platform: 'reddit',
  async questions(topic) {
    const q = encodeURIComponent(topic);
    // sort=relevance, restrict to link posts, past year, request extra so we can
    // rank question-shaped titles to the top before slicing.
    const url = `https://www.reddit.com/search.json?q=${q}&sort=relevance&type=link&t=year&limit=25&raw_json=1`;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 12_000);
    let res: Response;
    try {
      res = await fetch(url, { headers: { 'user-agent': UA, accept: 'application/json' }, signal: ctrl.signal });
    } finally {
      clearTimeout(timer);
    }
    if (!res.ok) throw new Error(`Reddit ${res.status}: ${(await res.text()).slice(0, 200)}`);
    const json: { data?: { children?: RedditChild[] } } = await res.json();
    const children = json.data?.children ?? [];
    return children
      .filter((c) => c.kind === 't3' && !c.data.over_18)
      .map((c, i): DiscoveredQuestion | null => {
        const text = (c.data.title || '').trim();
        if (!text) return null;
        const url = c.data.permalink ? `https://www.reddit.com${c.data.permalink}` : undefined;
        return { text, source: 'reddit', mode: 'live', url, rank: i + 1 };
      })
      .filter((q): q is DiscoveredQuestion => q !== null)
      // prefer question-shaped titles, then more-discussed threads
      .sort((a, b) => Number(b.text.includes('?')) - Number(a.text.includes('?')))
      .slice(0, 8);
  },
};
