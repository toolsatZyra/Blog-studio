import { NextResponse } from 'next/server';
import { getSerp } from '@/lib/providers';
import { isLive } from '@/lib/config';

export const runtime = 'nodejs';
export const maxDuration = 45;

// Debug endpoint: Reddit questions now come from the DataForSEO SERP call (the
// reddit.com threads Google ranks for the topic) — no Reddit API/credit. Shows
// the real mined threads, or mock if DataForSEO isn't configured.
// Mirrors /api/serp-check, /api/x-check, /api/ads-check.
export async function POST() {
  const topic = 'AI brand film cost in India';
  try {
    const serp = await getSerp(topic);
    return NextResponse.json({
      configured: isLive.dataForSeo(),
      ok: true,
      source: 'dataforseo-serp',
      mode: serp.mode, // 'live' when DataForSEO answered, else 'mock'
      topic,
      count: serp.data.reddit.length,
      questions: serp.data.reddit.map((q) => ({ text: q.text, url: q.url, rank: q.rank })),
    });
  } catch (e) {
    return NextResponse.json({ configured: isLive.dataForSeo(), ok: false, source: 'dataforseo-serp', topic, error: (e as Error).message.slice(0, 800) });
  }
}
