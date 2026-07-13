import type { Inputs, TopicCluster } from '../types';
import { getLLM } from '../providers';

const MODIFIERS: Record<string, string[]> = {
  'Cost & pricing': ['cost', 'pricing', 'how much does {t} cost', 'is {t} worth it'],
  Comparisons: ['{t} vs traditional production', 'best {t} agency', '{t} alternatives'],
  'How-to & process': ['how to {t}', '{t} process', 'how long does {t} take'],
  'Examples & proof': ['{t} examples', '{t} case study', '{t} results'],
  'For brands': ['{t} for brands', '{t} for D2C', 'ai {t} for marketing'],
};

/** Seed → expanded query set + clusters. Goal/audience-aware. Uses cheap LLM when live. */
export async function topicExpander(inputs: Inputs): Promise<{
  expandedQueries: string[]; clusters: TopicCluster[];
}> {
  const t = inputs.topic.trim();
  const clusters: TopicCluster[] = Object.entries(MODIFIERS).map(([label, tmpls]) => ({
    label,
    queries: tmpls.map((m) => m.replace(/\{t\}/g, t)),
  }));

  const llm = getLLM();
  if (llm.liveFor('cheap')) {
    try {
      const out = await llm.generate({
        role: 'cheap',
        system: 'You expand a seed blog topic into concrete search queries a marketer would type. Return one query per line, no numbering.',
        prompt: `Seed topic: "${t}"\nBlog goal: ${inputs.goal}\nAudience: ${inputs.audience.industries}; ${inputs.audience.roles}; ${inputs.audience.geographies}\nGive 12 realistic search queries (mix of cost, comparison, how-to, and buying intent).`,
        maxTokens: 400, temperature: 0.5,
      });
      const extra = out.split('\n').map((l) => l.replace(/^[-*\d.\s]+/, '').trim()).filter(Boolean);
      if (extra.length) {
        const merged = dedupe([...clusters.flatMap((c) => c.queries), ...extra]);
        return { expandedQueries: merged, clusters };
      }
    } catch { /* fall through to template */ }
  }
  return { expandedQueries: dedupe(clusters.flatMap((c) => c.queries)), clusters };
}

function dedupe(a: string[]): string[] {
  return [...new Set(a.map((s) => s.trim()).filter(Boolean))];
}
