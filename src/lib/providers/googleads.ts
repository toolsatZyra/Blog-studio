import type { KeywordProvider, KeywordMetric, SearchIntent } from '../types';
import { env } from '../config';

// Google Ads Keyword Planner (generateKeywordIdeas). FREE with an Ads account,
// but returns bucketed volume + AD competition (NOT SEO difficulty), and needs
// an approved developer token + OAuth2 refresh token. See docs/API_RECOMMENDATIONS.md.

async function accessToken(): Promise<string> {
  const body = new URLSearchParams({
    client_id: env.googleAds.clientId,
    client_secret: env.googleAds.clientSecret,
    refresh_token: env.googleAds.refreshToken,
    grant_type: 'refresh_token',
  });
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!res.ok) throw new Error(`Google OAuth ${res.status}: ${await res.text()}`);
  return (await res.json()).access_token;
}

function intentFor(kw: string): SearchIntent {
  const t = kw.toLowerCase();
  if (/(cost|price|hire|agency|vs|best|company|service)/.test(t)) return 'commercial';
  if (/(buy|book|quote|contact)/.test(t)) return 'transactional';
  return 'informational';
}

// Map Google Ads competition (LOW/MEDIUM/HIGH or index 0-100) to an approx difficulty.
function competitionToDifficulty(c: unknown): number {
  if (typeof c === 'number') return Math.round(c);
  const m: Record<string, number> = { LOW: 25, MEDIUM: 50, HIGH: 80, UNSPECIFIED: 40, UNKNOWN: 40 };
  return m[String(c)] ?? 40;
}

export const googleAdsKeywordProvider: KeywordProvider = {
  name: 'googleads',
  mode: 'live',
  async metrics(keywords) {
    const token = await accessToken();
    const cid = env.googleAds.customerId.replace(/-/g, '');
    const res = await fetch(
      `https://googleads.googleapis.com/${env.googleAds.apiVersion}/customers/${cid}:generateKeywordIdeas`,
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${token}`,
          'developer-token': env.googleAds.developerToken,
          ...(env.googleAds.loginCustomerId
            ? { 'login-customer-id': env.googleAds.loginCustomerId.replace(/-/g, '') }
            : {}),
        },
        body: JSON.stringify({
          keywordSeed: { keywords },
          geoTargetConstants: ['geoTargetConstants/2356'], // India
          language: 'languageConstants/1000', // English
        }),
      },
    );
    if (!res.ok) throw new Error(`Google Ads ${res.status}: ${await res.text()}`);
    const data = await res.json();
    const results: {
      text: string;
      keywordIdeaMetrics?: { avgMonthlySearches?: string; competition?: string; competitionIndex?: string };
    }[] = data.results ?? [];

    return results.slice(0, 40).map<KeywordMetric>((r) => {
      const m = r.keywordIdeaMetrics ?? {};
      const vol = m.avgMonthlySearches ? Number(m.avgMonthlySearches) : null;
      return {
        keyword: r.text,
        volume: vol,
        volumeRange: undefined,
        difficulty: competitionToDifficulty(m.competitionIndex ?? m.competition),
        difficultyBasis: 'ad-competition-approx',
        intent: intentFor(r.text),
        mode: 'live',
      };
    });
  },
};
