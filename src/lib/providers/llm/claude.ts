import { env } from '../../config';

/** Minimal Anthropic Messages API call via fetch. Used for the 'writer' role. */
export async function generateClaude(args: {
  system: string; prompt: string; maxTokens?: number; temperature?: number;
}): Promise<string> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': env.anthropicKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: env.claudeModelWriter,
      max_tokens: args.maxTokens ?? 4000,
      temperature: args.temperature ?? 0.8,
      system: args.system,
      messages: [{ role: 'user', content: args.prompt }],
    }),
  });
  if (!res.ok) throw new Error(`Anthropic ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return (data.content ?? []).map((b: { text?: string }) => b.text ?? '').join('');
}
