import type { Inputs, Research, TopicCandidate, Brief, BriefSection } from '../types';
import { ZYRA_INTERNAL_LINKS, matchService } from '../zyraContext';
import { slugify, titleCase } from '../util';

/** Builds the full SEO/GEO/AEO brief for the chosen topic. Deterministic + reliable. */
export function briefGenerator(
  inputs: Inputs, research: Research, selected: TopicCandidate,
): Brief {
  const topic = selected.topic.replace(/\?+$/, '').trim();
  const core = topic.toLowerCase();
  const svc = matchService(topic);

  const recommendedTitle = craftTitle(topic, inputs);
  const metaTitle = recommendedTitle.length <= 60 ? recommendedTitle : recommendedTitle.slice(0, 57).trim() + '…';

  // Question-led H2s from the strongest discovered questions.
  const questionPool = research.questions
    .filter((q) => ['paa', 'reddit', 'x'].includes(q.source))
    .map((q) => q.text.trim())
    .filter((q) => q.length > 8);
  const headings = uniqueTop(questionPool, 5);
  const perSection = Math.max(120, Math.round((inputs.wordCount - 200) / (headings.length + 1)));

  const outline: BriefSection[] = headings.map((h) => ({
    heading: ensureQuestion(h),
    level: 2 as const,
    intent: 'Answer directly, then expand with a Zyra-relevant example.',
    targetWords: perSection,
    answerBlock: `Direct 2–3 sentence answer to "${stripQ(h)}" that a reader (or AI engine) could quote. Lead with the answer, not context.`,
    questionsToAnswer: [h],
  }));

  const secondaryKeywords = research.relatedKeywords.slice(0, 8).map((k) => k.keyword);

  const internalLinks = [
    ...(svc ? [{ anchor: svc.name.toLowerCase(), href: svc.slug }] : []),
    ...ZYRA_INTERNAL_LINKS,
  ].slice(0, 5);

  return {
    recommendedTitle,
    alternativeTitles: altTitles(topic, inputs),
    metaTitle,
    metaDescription: metaDesc(topic, inputs),
    slug: slugify(topic),
    primaryKeyword: core,
    secondaryKeywords,
    intent: research.intent,
    targetReader: `${inputs.audience.roles || 'marketers'} at ${inputs.audience.industries || 'brands'} in ${inputs.audience.geographies || 'India'}`,
    angle: angleFor(inputs, svc?.name),
    outline,
    questionsToAnswer: uniqueTop(questionPool, 8),
    internalLinks,
    externalSourceSuggestions: [
      'An industry report or platform data point (cite the source; tag [source needed] if not fetched)',
      'A named third-party study on AI video / content marketing',
      'A primary statistic from a credible publication (never invent — mark [source needed])',
    ],
    faq: uniqueTop(questionPool, 4).map((q) => ({
      q: ensureQuestion(q),
      a: `Concise 40–60 word answer to "${stripQ(q)}". Factual, specific, no fabricated numbers.`,
    })),
    featuredSnippetAnswer: `A 40–55 word paragraph that directly answers "${topic}" — the passage most likely to win the featured snippet and AI citation.`,
    geoAnswerBlocks: headings.map((h) => `Standalone quotable answer for "${stripQ(h)}" (40–60 words, self-contained, no pronouns referring back).`),
  };
}

function craftTitle(topic: string, inputs: Inputs): string {
  const t = titleCase(topic);
  if (inputs.goal === 'comparison') return `${t}: An Honest Comparison for ${inputs.audience.geographies || 'India'}`;
  if (/cost|price/i.test(topic)) return `${t}: What Brands Actually Pay`;
  if (inputs.goal === 'educational') return `${t}: A Practical Guide`;
  return t;
}

function altTitles(topic: string, inputs: Inputs): string[] {
  const t = titleCase(topic);
  return [
    `${t} — What Marketers Need to Know`,
    `The Real Story Behind ${t}`,
    `${t}: A Straight Answer`,
  ];
}

function metaDesc(topic: string, inputs: Inputs): string {
  const base = `A clear, practical look at ${topic.toLowerCase()} for ${inputs.audience.roles || 'marketers'} — what it means, what to expect, and how Zyra approaches it.`;
  if (base.length <= 158) return base.padEnd(120, ' ').slice(0, Math.max(120, base.length));
  return base.slice(0, 155).trim() + '…';
}

function angleFor(inputs: Inputs, service?: string | null): string {
  const lens = {
    awareness: 'introduce the shift and why it matters now',
    'lead generation': 'help the reader make a decision, then invite a conversation',
    'thought leadership': 'take a clear, contrarian-but-defensible point of view',
    comparison: 'compare options honestly and show where Zyra fits',
    educational: 'teach the how and the why with concrete detail',
  }[inputs.goal];
  return `${inputs.tone}; ${lens}${service ? `; anchor to Zyra's ${service}` : ''}.`;
}

function ensureQuestion(s: string): string { return /\?$/.test(s) ? s : titleCase(s) + '?'; }
function stripQ(s: string): string { return s.replace(/\?+$/, '').trim(); }

function uniqueTop(list: string[], n: number): string[] {
  const seen = new Set<string>(); const out: string[] = [];
  for (const s of list) {
    const k = s.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (seen.has(k)) continue; seen.add(k); out.push(s);
    if (out.length >= n) break;
  }
  return out;
}
