import { NextResponse } from 'next/server';
import { getLLM } from '@/lib/providers';
import { env, isLive } from '@/lib/config';

export const runtime = 'nodejs';
export const maxDuration = 30;

// Verifies the configured LLM keys actually work (right key + right model id),
// so you can debug before running a full generation.
export async function POST() {
  const llm = getLLM();
  const out: Record<string, unknown> = {};

  for (const role of ['writer', 'cheap'] as const) {
    const configured = llm.liveFor(role);
    const model = role === 'writer' ? env.claudeModelWriter : env.openaiModelCheap;
    if (!configured) { out[role] = { configured: false, model, note: 'No key set — this role uses the mock.' }; continue; }
    try {
      // maxTokens must leave room for a reasoning/thinking block: Sonnet 5 can
      // spend a tiny budget entirely on a `thinking` block and emit no text,
      // which would make this health check flap. 256 comfortably fits both.
      const reply = await llm.generate({ role, system: 'Reply with the single word OK.', prompt: 'OK', maxTokens: 256, temperature: 0 });
      out[role] = { configured: true, ok: !!reply.trim(), model, sample: reply.trim().slice(0, 40) };
    } catch (e) {
      out[role] = { configured: true, ok: false, model, error: (e as Error).message.slice(0, 300) };
    }
  }

  out.providers = {
    claude: isLive.claude(), openai: isLive.openai(),
    dataForSeo: isLive.dataForSeo(), googleAds: isLive.googleAds(),
    apify: isLive.apify(), twitterApi: isLive.twitterApi(),
  };
  return NextResponse.json(out);
}
