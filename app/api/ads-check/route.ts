import { NextResponse } from 'next/server';
import { googleAdsKeywordProvider } from '@/lib/providers/googleads';
import { env, isLive } from '@/lib/config';

export const runtime = 'nodejs';
export const maxDuration = 30;

// Debug endpoint: calls Google Ads Keyword Planner directly and returns the raw
// result or the exact error (version / token-approval / customer-id issues).
export async function POST() {
  if (!isLive.googleAds()) {
    return NextResponse.json({
      configured: false,
      note: 'Set GOOGLE_ADS_DEVELOPER_TOKEN + refresh token + customer id in .env.',
    });
  }
  const meta = {
    apiVersion: env.googleAds.apiVersion,
    customerId: env.googleAds.customerId,
    loginCustomerId: env.googleAds.loginCustomerId,
  };
  try {
    const data = await googleAdsKeywordProvider.metrics(['ai brand film cost']);
    return NextResponse.json({
      configured: true, ok: true, ...meta,
      sampleCount: data.length,
      sample: data.slice(0, 3).map((k) => ({ keyword: k.keyword, volume: k.volume, difficulty: k.difficulty })),
    });
  } catch (e) {
    return NextResponse.json({ configured: true, ok: false, ...meta, error: (e as Error).message.slice(0, 600) });
  }
}
