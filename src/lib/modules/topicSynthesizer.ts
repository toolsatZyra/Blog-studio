import type { Inputs, Research } from '../types';
import { getLLM } from '../providers';
import { ZYRA_SERVICES, ZYRA_PROOF_POINTS } from '../zyraContext';
import { titleCase } from '../util';

export interface SynthTopic { title: string; angle: string }

const SYSTEM = `You are a content strategist for Zyra, India's AI Content Studio ("Where AI meets Cinema"). You turn raw audience-demand signals into REAL, publishable blog post topics for Zyra's own website.

RULES:
- NEVER copy a Reddit/X post or search query verbatim. Those are evidence of what people care about — synthesize a proper editorial blog TITLE from the underlying demand.
- Every topic must serve Zyra's space: AI brand films, AI video/content production, micro-drama, performance ad creative, social content, and adjacent thought-leadership a brand/marketing audience cares about (AI in advertising, production cost/'speed, creative workflows).
- DROP anything off-brand or off-topic (gaming lore, fiction, personal drama, unrelated tech). If a signal isn't relevant to Zyra, ignore it.
- Titles must be clean and professional: no profanity, no emoji, no clickbait, no ALL CAPS, no first-person rant phrasing. Publishable on a company blog.
- BIAS HARD TOWARD BUYER INTENT. Zyra's readers are brand marketers, founders, and CMOs deciding whether to COMMISSION AI content, not DIY hobbyists. Lead with topics they'd actually search and convert on: cost and budgeting, ROI and results, AI vs traditional production, use-cases for their industry, "is this right for my brand", how brands use AI video/films, timelines and process, what to look for in a studio. At MOST 1-2 of the topics may be pure educational explainers; do NOT fill the list with practitioner how-tos (prompt tips, ComfyUI/LoRA tutorials, tool settings, "how to keep a character consistent") — those attract creators who won't hire a studio.
- Tailor to the given audience, goal, and tone.
- Each topic gets a one-sentence "angle": what the post argues and who it's for.

OUTPUT: Return ONLY a strict JSON array of 8-10 objects, no prose, no code fences:
[{"title": "...", "angle": "..."}]`;

function evidenceBlock(research: Research): string {
  const bySource = (s: string) =>
    research.questions.filter((q) => q.source === s).map((q) => q.text.trim()).filter(Boolean);
  const lines: string[] = [];
  const paa = bySource('paa');
  const reddit = bySource('reddit');
  const x = bySource('x');
  const clusters = research.clusters.flatMap((c) => c.queries);
  const keywords = research.relatedKeywords.map((k) => k.keyword).slice(0, 15);
  const gaps = research.competitorGaps.filter((g) => !g.coversTopic).map((g) => g.gapNote || g.title).slice(0, 6);
  if (paa.length) lines.push(`People-Also-Ask: ${paa.slice(0, 10).join(' | ')}`);
  if (reddit.length) lines.push(`Reddit threads: ${reddit.slice(0, 8).join(' | ')}`);
  if (x.length) lines.push(`X posts: ${x.slice(0, 8).join(' | ')}`);
  if (clusters.length) lines.push(`Search clusters: ${clusters.slice(0, 12).join(' | ')}`);
  if (keywords.length) lines.push(`Related keywords: ${keywords.join(', ')}`);
  if (gaps.length) lines.push(`Competitor content gaps: ${gaps.join(' | ')}`);
  return lines.join('\n');
}

function buildPrompt(inputs: Inputs, research: Research): string {
  const services = ZYRA_SERVICES.map((s) => s.name).join(', ');
  const aud = inputs.audience;
  return [
    `ZYRA CONTEXT:\n${inputs.zyraContext.trim()}`,
    `Zyra services: ${services}.`,
    `Verified proof points (may inform angles): ${ZYRA_PROOF_POINTS.join('; ')}.`,
    `TARGET AUDIENCE — industries: ${aud.industries || 'any'}; roles: ${aud.roles || 'any'}; geographies: ${aud.geographies || 'India'}.`,
    `BLOG GOAL: ${inputs.goal}. TONE: ${inputs.tone}.`,
    `SEED TOPIC / theme the user is exploring: ${inputs.topic.trim()}`,
    `\nDEMAND SIGNALS (evidence only — do NOT copy verbatim):\n${evidenceBlock(research)}`,
    `\nSynthesize 8-10 real, on-brand blog topics (title + angle) grounded in this demand.`,
  ].join('\n');
}

// Backstop: reject anything that reads like a raw post, not a blog title.
const PROFANITY = /\b(f+u+c+k+|f\*+ck|sh\*?it|a+ss+hole|bitch|damn|wtf)\b/i;
const EMOJI = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2190}-\u{21FF}\u{2B00}-\u{2BFF}]/u;
function isPublishableTitle(t: string): boolean {
  if (!t) return false;
  const len = t.length;
  if (len < 15 || len > 95) return false; // raw posts run long; real titles are tight
  if (PROFANITY.test(t) || EMOJI.test(t)) return false;
  if (/^(i|my|so|this)\b/i.test(t.trim()) && /[!?]{2,}|f\*|lol|omg/i.test(t)) return false;
  const caps = t.replace(/[^A-Za-z]/g, '');
  if (caps.length > 8 && caps === caps.toUpperCase()) return false; // ALL CAPS shouting
  return true;
}

function parseTopics(raw: string): SynthTopic[] {
  const match = raw.match(/\[[\s\S]*\]/);
  if (!match) return [];
  let arr: unknown;
  try { arr = JSON.parse(match[0]); } catch { return []; }
  if (!Array.isArray(arr)) return [];
  const out: SynthTopic[] = [];
  const seen = new Set<string>();
  for (const it of arr) {
    if (!it || typeof it !== 'object') continue;
    const title = String((it as Record<string, unknown>).title ?? '').replace(/\s+/g, ' ').trim();
    const angle = String((it as Record<string, unknown>).angle ?? '').replace(/\s+/g, ' ').trim();
    if (!isPublishableTitle(title)) continue;
    const key = title.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ title, angle: angle || `A ${title.length > 0 ? 'focused' : ''} take for Zyra's audience.` });
    if (out.length >= 10) break;
  }
  return out;
}

/**
 * Deterministic fallback used when no LLM key is set, the call fails, or output
 * is unusable. Cleans the raw signals into passable titles so mock mode and
 * tests never surface profane/raw-post topics and the pipeline never breaks.
 */
export function ruleBasedTopics(inputs: Inputs, research: Research): SynthTopic[] {
  const fromQuestions = research.questions
    .filter((q) => ['paa', 'reddit', 'x'].includes(q.source))
    .map((q) => titleCase(q.text.replace(/\?+$/, '').trim()));
  const fromClusters = research.clusters.flatMap((c) => c.queries).map(titleCase);
  const seen = new Set<string>();
  const out: SynthTopic[] = [];
  for (const t of [...fromClusters, ...fromQuestions]) {
    if (!isPublishableTitle(t)) continue;
    const key = t.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 40);
    if (key.length < 8 || seen.has(key)) continue;
    seen.add(key);
    out.push({ title: t, angle: `Answers real ${inputs.audience.geographies || 'India'} demand around "${t.toLowerCase()}".` });
    if (out.length >= 10) break;
  }
  return out;
}

/** Synthesize real, on-brand blog topics from the research signals. */
export async function topicSynthesizer(inputs: Inputs, research: Research): Promise<SynthTopic[]> {
  const llm = getLLM();
  if (llm.liveFor('cheap')) {
    try {
      const raw = await llm.generate({
        role: 'cheap', system: SYSTEM, prompt: buildPrompt(inputs, research), maxTokens: 900, temperature: 0.7,
      });
      const topics = parseTopics(raw);
      if (topics.length >= 3) return topics;
    } catch {
      // fall through to rule-based
    }
  }
  return ruleBasedTopics(inputs, research);
}
