import type { Inputs, Research, TopicCandidate, Brief, Draft, Audit, Exports } from './types';
import { topicExpander } from './modules/topicExpander';
import { questionDiscovery } from './modules/questionDiscovery';
import { keywordResearch } from './modules/keywordResearch';
import { serpResearch } from './modules/serpResearch';
import { topicScorer } from './modules/topicScorer';
import { topicSynthesizer } from './modules/topicSynthesizer';
import { briefGenerator } from './modules/briefGenerator';
import { blogGenerator } from './modules/blogGenerator';
import { humanizer } from './modules/humanizer';
import { seoGeoAuditor } from './modules/seoGeoAuditor';
import { exporter } from './modules/exporter';
import { providerStatus } from './providers';

/** PART 1 — research the space and recommend scored topics. */
export async function runResearch(inputs: Inputs): Promise<{
  research: Research; candidates: TopicCandidate[]; providerStatus: Record<string, string>;
}> {
  const [{ expandedQueries, clusters }, discovery, serp] = await Promise.all([
    topicExpander(inputs),
    questionDiscovery(inputs),
    serpResearch(inputs),
  ]);
  const { keywords, mode: kwMode } = await keywordResearch(expandedQueries);

  const research: Research = {
    expandedQueries,
    clusters,
    questions: discovery.questions,
    autocomplete: discovery.autocomplete,
    relatedKeywords: keywords,
    competitorGaps: serp.competitorGaps,
    intent: serp.intent,
    modes: { ...discovery.modes, keywords: kwMode, serp: serp.mode },
  };

  const synthTopics = await topicSynthesizer(inputs, research);
  const candidates = topicScorer(inputs, research, synthTopics);
  return { research, candidates, providerStatus: providerStatus() };
}

/** PART 2 — turn the chosen topic into a brief, human draft, audit, and exports. */
export async function runWriting(inputs: Inputs, research: Research, selected: TopicCandidate): Promise<{
  brief: Brief; draft: Draft; audit: Audit; exports: Exports;
}> {
  const brief = briefGenerator(inputs, research, selected);
  const rawDraft = await blogGenerator(inputs, brief);
  const draft = await humanizer(rawDraft);
  const audit = seoGeoAuditor(draft, brief, inputs);
  const exports = exporter(draft, brief, inputs);
  return { brief, draft, audit, exports };
}
