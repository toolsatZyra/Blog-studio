// Deterministic, realistic mock providers. Derive everything from the topic so
// the whole pipeline demos offline and tests are stable.

import type {
  KeywordProvider, SerpProvider, SocialProvider, KeywordMetric,
  DiscoveredQuestion, SearchIntent,
} from '../types';
import { hash, seededInt, seededPick } from '../util';

function intentFor(kw: string): SearchIntent {
  const t = kw.toLowerCase();
  if (/(cost|price|pricing|hire|agency|vs|best|company|service)/.test(t)) return 'commercial';
  if (/(buy|book|get a quote|contact)/.test(t)) return 'transactional';
  return 'informational';
}

export const mockKeywordProvider: KeywordProvider = {
  name: 'mock',
  mode: 'mock',
  async metrics(keywords) {
    return keywords.map<KeywordMetric>((keyword) => {
      const seed = keyword.toLowerCase();
      const volume = seededInt(seed + 'v', 90, 6400);
      return {
        keyword,
        volume,
        volumeRange: undefined,
        difficulty: seededInt(seed + 'd', 8, 62),
        difficultyBasis: 'mock',
        cpc: seededInt(seed + 'c', 20, 480) / 100,
        intent: intentFor(keyword),
        mode: 'mock',
      };
    });
  },
};

const PAA_TEMPLATES = [
  'What is {t}?',
  'How much does {t} cost in India?',
  'Is {t} worth it for brands?',
  'How long does {t} take?',
  'What is the difference between {t} and traditional production?',
  'Who offers the best {t}?',
];

const RELATED_TEMPLATES = [
  '{t} india', '{t} cost', 'best {t} agency', '{t} vs traditional',
  '{t} examples', '{t} for brands', 'ai {t}', '{t} pricing',
];

export const mockSerpProvider: SerpProvider = {
  name: 'mock',
  mode: 'mock',
  async serp(query) {
    const t = query.replace(/^(what|how|why|is|best)\s+/i, '').trim();
    const n = seededInt(query, 3, 5);
    const organic = Array.from({ length: n }, (_, i) => ({
      title: `${seededPick(query + i, ['The complete guide to', 'Everything about', 'How brands use', 'A practical look at'])} ${t}`,
      url: `https://example-${(hash(query + i) % 900) + 100}.com/${t.replace(/\s+/g, '-')}`,
      snippet: `An overview of ${t} covering the basics, common questions, and what to consider. Coverage of cost and process is thin.`,
    }));
    return {
      organic,
      paa: PAA_TEMPLATES.slice(0, seededInt(query + 'paa', 4, 6)).map((p) => p.replace(/\{t\}/g, t)),
      related: RELATED_TEMPLATES.slice(0, seededInt(query + 'rel', 5, 8)).map((p) => p.replace(/\{t\}/g, t)),
      autocomplete: [`${t} india`, `${t} cost`, `${t} for brands`, `ai ${t}`, `${t} agency`].slice(
        0, seededInt(query + 'ac', 3, 5)),
    };
  },
};

function socialQuestions(topic: string, platform: 'reddit' | 'x'): DiscoveredQuestion[] {
  const t = topic.trim();
  const redditTemplates = [
    `Has anyone actually used ${t} — was it worth it?`,
    `How much should ${t} realistically cost?`,
    `Is ${t} as good as traditional production?`,
    `Looking for recommendations on ${t} for a D2C brand`,
    `What went wrong with your ${t} project?`,
  ];
  const xTemplates = [
    `Hot take: ${t} is changing how brands ship content`,
    `Why isn't every brand using ${t} yet?`,
    `${t} vs the old way — the gap is widening`,
    `The real bottleneck in ${t} isn't the AI`,
  ];
  const templates = platform === 'reddit' ? redditTemplates : xTemplates;
  const count = seededInt(topic + platform, 3, templates.length);
  return templates.slice(0, count).map((text, i) => ({
    text,
    source: platform,
    mode: 'mock' as const,
    url: `https://${platform === 'reddit' ? 'reddit.com/r/marketing' : 'x.com/search'}/${hash(topic + platform + i) % 100000}`,
    rank: i + 1,
  }));
}

export const mockRedditProvider: SocialProvider = {
  name: 'mock', mode: 'mock', platform: 'reddit',
  async questions(topic) { return socialQuestions(topic, 'reddit'); },
};

export const mockXProvider: SocialProvider = {
  name: 'mock', mode: 'mock', platform: 'x',
  async questions(topic) { return socialQuestions(topic, 'x'); },
};
