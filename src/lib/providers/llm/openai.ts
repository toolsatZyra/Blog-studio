import { env } from '../../config';

/** Minimal OpenAI Chat Completions call via fetch. Used for the 'cheap' role. */
export async function generateOpenAI(args: {
  system: string; prompt: string; maxTokens?: number; temperature?: number;
}): Promise<string> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${env.openaiKey}`,
    },
    body: JSON.stringify({
      model: env.openaiModelCheap,
      messages: [
        { role: 'system', content: args.system },
        { role: 'user', content: args.prompt },
      ],
      max_tokens: args.maxTokens ?? 1200,
      temperature: args.temperature ?? 0.7,
    }),
  });
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? '';
}
