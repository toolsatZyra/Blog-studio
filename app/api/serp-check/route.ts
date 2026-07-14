import { NextResponse } from 'next/server';
import { dataForSeoSerpProvider } from '@/lib/providers/dataforseo';
import { isLive } from '@/lib/config';

export const runtime = 'nodejs';
export const maxDuration = 45;

// Debug endpoint: calls DataForSEO SERP directly and returns the real organic
// results + People-Also-Ask, or the exact error (bad creds / unverified / funds).
export async function POST() {
  if (!isLive.dataForSeo()) {
    return NextResponse.json({ configured: false, note: 'Set DATAFORSEO_LOGIN + DATAFORSEO_PASSWORD in .env.' });
  }
  try {
    const data = await dataForSeoSerpProvider.serp('AI brand film cost in India');
    return NextResponse.json({
      configured: true, ok: true,
      organicCount: data.organic.length,
      topDomains: data.organic.slice(0, 5).map((o) => o.url),
      paaCount: data.paa.length,
      peopleAlsoAsk: data.paa.slice(0, 6),
      autocomplete: data.autocomplete.slice(0, 5),
    });
  } catch (e) {
    return NextResponse.json({ configured: true, ok: false, error: (e as Error).message.slice(0, 600) });
  }
}
