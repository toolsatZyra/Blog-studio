// Provider registry. Returns the live adapter when its key(s) exist, else the
// mock. Live calls are wrapped so a failure degrades to mock and reports the
// mode actually used — the pipeline never hard-crashes on a provider error.

import type {
  KeywordProvider, SerpProvider, SocialProvider, KeywordMetric,
  DiscoveredQuestion, SourceMode,
} from '../types';
import { isLive } from '../config';
import {
  mockKeywordProvider, mockSerpProvider, mockRedditProvider, mockXProvider,
} from './mock';
import { dataForSeoSerpProvider } from './dataforseo';
import { apifyRedditProvider } from './apify';
import { twitterApiProvider } from './twitterapi';
import { googleAdsKeywordProvider } from './googleads';

export { getLLM } from './llm';

export interface Called<T> { data: T; mode: SourceMode }

/** Keyword metrics with fallback. */
export async function getKeywords(keywords: string[]): Promise<Called<KeywordMetric[]>> {
  if (isLive.googleAds()) {
    try {
      return { data: await googleAdsKeywordProvider.metrics(keywords), mode: 'live' };
    } catch (e) {
      console.warn('[googleads] fell back to mock:', (e as Error).message);
    }
  }
  return { data: await mockKeywordProvider.metrics(keywords), mode: 'mock' };
}

function serpProvider(): { p: SerpProvider; live: boolean } {
  if (isLive.dataForSeo()) return { p: dataForSeoSerpProvider, live: true };
  return { p: mockSerpProvider, live: false };
}

export async function getSerp(query: string): Promise<Called<Awaited<ReturnType<SerpProvider['serp']>>>> {
  const { p, live } = serpProvider();
  if (live) {
    try { return { data: await p.serp(query), mode: 'live' }; }
    catch (e) { console.warn('[serp] fell back to mock:', (e as Error).message); }
  }
  return { data: await mockSerpProvider.serp(query), mode: 'mock' };
}

export async function getRedditQuestions(topic: string): Promise<Called<DiscoveredQuestion[]>> {
  if (isLive.apify()) {
    try { return { data: await apifyRedditProvider.questions(topic), mode: 'live' }; }
    catch (e) { console.warn('[apify] fell back to mock:', (e as Error).message); }
  }
  return { data: await mockRedditProvider.questions(topic), mode: 'mock' };
}

export async function getXQuestions(topic: string): Promise<Called<DiscoveredQuestion[]>> {
  if (isLive.twitterApi()) {
    try { return { data: await twitterApiProvider.questions(topic), mode: 'live' }; }
    catch (e) { console.warn('[twitterapi] fell back to mock:', (e as Error).message); }
  }
  return { data: await mockXProvider.questions(topic), mode: 'mock' };
}

/** Snapshot of which sources are configured live (for UI badges before a run). */
export function providerStatus(): Record<string, SourceMode> {
  return {
    keywords: isLive.googleAds() ? 'live' : 'mock',
    serp: isLive.dataForSeo() ? 'live' : 'mock',
    reddit: isLive.apify() ? 'live' : 'mock',
    x: isLive.twitterApi() ? 'live' : 'mock',
    writer: isLive.claude() ? 'live' : 'mock',
    cheap: isLive.openai() ? 'live' : 'mock',
  };
}
