import { env } from '../../config';

/** Minimal Anthropic Messages API call via fetch. Used for the 'writer' role. */
export async function generateClaude(args: {
  system: string; prompt: string; maxTokens?: number; temperature?: number;
  webSearch?: boolean;
}): Promise<string> {
  const body: Record<string, unknown> = {
    model: env.claudeModelWriter,
    max_tokens: args.maxTokens ?? 4000,
    system: args.system,
    messages: [{ role: 'user', content: args.prompt }],
    // NOTE: `temperature` is omitted — newer Claude models (e.g. Sonnet 5)
    // reject it as deprecated. Default sampling is fine for this use.
  };
  // Live web search: Claude runs searches server-side during generation and
  // grounds the answer in current results. Bounded by max_uses to cap cost/latency.
  if (args.webSearch) {
    body.tools = [{ type: 'web_search_20250305', name: 'web_search', max_uses: env.writerWebSearchMaxUses }];
  }
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': env.anthropicKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Anthropic ${res.status}: ${await res.text()}`);
  const data = await res.json();
  // With web search the content array also holds server_tool_use and
  // web_search_tool_result blocks; we only want the model's text blocks.
  return (data.content ?? [])
    .filter((b: { type?: string }) => b.type === 'text')
    .map((b: { text?: string }) => b.text ?? '')
    .join('');
}
