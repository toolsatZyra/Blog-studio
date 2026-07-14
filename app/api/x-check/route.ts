import { NextResponse } from 'next/server';
import { twitterApiProvider } from '@/lib/providers/twitterapi';
import { isLive } from '@/lib/config';

export const runtime = 'nodejs';
export const maxDuration = 45;

// Debug endpoint: calls twitterapi.io advanced search directly and returns the
// real X posts, or the exact error (bad key / no credit / rate limit).
// Mirrors /api/serp-check and /api/ads-check.
export async function POST() {
  if (!isLive.twitterApi()) {
    return NextResponse.json({ configured: false, note: 'Set TWITTERAPI_KEY in .env, then restart the server.' });
  }
  const topic = 'AI brand film';
  try {
    const questions = await twitterApiProvider.questions(topic);
    return NextResponse.json({
      configured: true, ok: true,
      source: 'twitterapi.io',
      topic,
      count: questions.length,
      posts: questions.map((q) => ({ text: q.text, url: q.url })),
    });
  } catch (e) {
    return NextResponse.json({ configured: true, ok: false, source: 'twitterapi.io', topic, error: (e as Error).message.slice(0, 800) });
  }
}
