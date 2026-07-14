import type { SocialProvider, DiscoveredQuestion } from '../types';
import { env } from '../config';

// Reddit questions via an Apify actor (run-sync-get-dataset-items).
// Uses Zyra's Apify token. Actor id is configurable (APIFY_REDDIT_ACTOR).
export const apifyRedditProvider: SocialProvider = {
  name: 'apify',
  mode: 'live',
  platform: 'reddit',
  async questions(topic) {
    const actor = env.apifyRedditActor.replace('/', '~');
    const url = `https://api.apify.com/v2/acts/${actor}/run-sync-get-dataset-items?token=${env.apifyToken}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      // Input matches the trudax/reddit-scraper-lite schema: post search only
      // (no `type` field — that was ignored). maxPostCount must be raised too or
      // it caps at its default of 10 regardless of maxItems. Apify proxy is
      // required — Reddit blocks the actor's own datacenter IPs.
      body: JSON.stringify({
        searches: [topic],
        searchPosts: true,
        searchComments: false,
        searchCommunities: false,
        searchUsers: false,
        skipComments: true,
        sort: 'relevance',
        maxItems: 25,
        maxPostCount: 25,
        proxy: { useApifyProxy: true },
      }),
    });
    if (!res.ok) throw new Error(`Apify ${res.status}: ${await res.text()}`);
    const items: { title?: string; url?: string; body?: string; dataType?: string }[] = await res.json();
    return items
      .map((it, i): DiscoveredQuestion | null => {
        if (it.dataType && it.dataType !== 'post') return null;
        const text = (it.title || '').trim();
        if (!text) return null;
        return { text, source: 'reddit', mode: 'live', url: it.url, rank: i + 1 };
      })
      .filter((q): q is DiscoveredQuestion => q !== null)
      // prefer question-shaped titles
      .sort((a, b) => Number(b.text.includes('?')) - Number(a.text.includes('?')))
      .slice(0, 8);
  },
};
