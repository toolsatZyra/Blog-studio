import type { SocialProvider, DiscoveredQuestion } from '../types';
import { env } from '../config';

// X (Twitter) discussion angles via twitterapi.io advanced search.
export const twitterApiProvider: SocialProvider = {
  name: 'twitterapi',
  mode: 'live',
  platform: 'x',
  async questions(topic) {
    const q = encodeURIComponent(`${topic} lang:en -is:retweet`);
    const res = await fetch(
      `https://api.twitterapi.io/twitter/tweet/advanced_search?query=${q}&queryType=Top`,
      { headers: { 'x-api-key': env.twitterApiKey } },
    );
    if (!res.ok) throw new Error(`twitterapi.io ${res.status}: ${await res.text()}`);
    const data = await res.json();
    const tweets: { text?: string; url?: string }[] = data?.tweets ?? data?.data ?? [];
    return tweets
      .map((t, i): DiscoveredQuestion | null => {
        const text = (t.text || '').replace(/\s+/g, ' ').trim();
        if (!text) return null;
        return { text: text.slice(0, 200), source: 'x', mode: 'live', url: t.url, rank: i + 1 };
      })
      .filter((q): q is DiscoveredQuestion => q !== null)
      .slice(0, 8);
  },
};
