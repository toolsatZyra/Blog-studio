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
      body: JSON.stringify({
        searches: [topic],
        type: 'posts',
        sort: 'relevance',
        maxItems: 25,
      }),
    });
    if (!res.ok) throw new Error(`Apify ${res.status}: ${await res.text()}`);
    const items: { title?: string; url?: string; body?: string }[] = await res.json();
    return items
      .map((it, i): DiscoveredQuestion | null => {
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
