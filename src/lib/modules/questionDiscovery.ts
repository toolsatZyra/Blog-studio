import type { Inputs, DiscoveredQuestion, SourceMode } from '../types';
import { getSerp, getRedditQuestions, getXQuestions } from '../providers';

/**
 * Gathers questions from PAA + autocomplete (SERP), Reddit (Apify), X (twitterapi),
 * competitor URLs, and the user's manual notes/CSV. Returns questions + per-source modes.
 */
export async function questionDiscovery(inputs: Inputs): Promise<{
  questions: DiscoveredQuestion[];
  autocomplete: string[];
  modes: Record<string, SourceMode>;
}> {
  const topic = inputs.topic.trim();
  const [serp, reddit, x] = await Promise.all([
    getSerp(topic),
    getRedditQuestions(topic),
    getXQuestions(topic),
  ]);

  const paaQuestions: DiscoveredQuestion[] = serp.data.paa.map((text, i) => ({
    text, source: 'paa', mode: serp.mode, rank: i + 1,
  }));

  const competitorQuestions: DiscoveredQuestion[] = inputs.competitorUrls
    .filter(Boolean)
    .map((url) => ({
      text: `What does ${hostOf(url)} say about ${topic}?`,
      source: 'competitor', mode: 'mock', url,
    }));

  const manualQuestions: DiscoveredQuestion[] = parseManual(inputs.manualNotes);

  const questions = dedupeByText([
    ...paaQuestions,
    ...reddit.data,
    ...x.data,
    ...competitorQuestions,
    ...manualQuestions,
  ]);

  return {
    questions,
    autocomplete: serp.data.autocomplete,
    modes: { serp: serp.mode, reddit: reddit.mode, x: x.mode },
  };
}

function parseManual(notes: string): DiscoveredQuestion[] {
  if (!notes?.trim()) return [];
  return notes
    .split(/[\n,]/)
    .map((s) => s.replace(/^["']|["']$/g, '').trim())
    .filter((s) => s.length > 6)
    .map((text) => ({ text, source: 'manual' as const, mode: 'live' as const }));
}

function hostOf(url: string): string {
  try { return new URL(url.startsWith('http') ? url : `https://${url}`).hostname.replace('www.', ''); }
  catch { return url; }
}

function dedupeByText(qs: DiscoveredQuestion[]): DiscoveredQuestion[] {
  const seen = new Set<string>();
  const out: DiscoveredQuestion[] = [];
  for (const q of qs) {
    const key = q.text.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(q);
  }
  return out;
}
