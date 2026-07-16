import type { SolutionInputs, SolutionPage, SolutionProof, SourceMode } from '../types';
import { getLLM } from '../providers';
import { parseLooseJson } from '../solutions/parseJson';
import { ZYRA_PROOF_POINTS } from '../zyraContext';
import { SERVICE_CATALOG, CASE_STUDY_CATALOG, PROOF_LIMIT, getCaseStudyBySlug, getServiceBySlug } from '../solutionsData';
import { buildSolutionSlug, buildH1, buildEyebrow, servicePhrase, UMBRELLA_SERVICE, normalizeSolutionInputs } from '../solutions/naming';
import { deliveryTimeFor } from '../solutions/delivery';

// Generates a /solutions landing page from a handful of inputs.
//
// DESIGN: the LLM's surface is deliberately small. Anything derivable is derived
// and anything factual comes from the real catalog, so the model only writes the
// prose it cannot get structurally wrong:
//
//   derived (pure)  slug, h1, eyebrow, trustLine, proof
//   real data       deliverables, process, stats (from the site's service pages)
//   LLM             subline, aeoAnswer, problem heading + 3 paras, FAQ, meta
//
// Every hard rule is repeated in the system prompt AND enforced afterwards by
// src/lib/solutions/guards.ts - prompts are persuasion, guards are enforcement.

const SYSTEM = `You write conversion-focused landing pages for Zyra, an AI-native film and content studio in India (Gurgaon). The page targets one industry and/or geography and has exactly one job: get the reader to book a call.

You are writing for a marketing decision-maker who arrived cold from search. They are skeptical, busy, and have seen a lot of agency copy.

HARD RULES - breaking any of these makes the page unpublishable:
1. NEVER mention money. No prices, no budgets, no cost figures, no currency of any kind - not rupees, not dollars, not "lakh" or "crore". This includes the cost of TRADITIONAL production. Contrast on TIME, never on cost. If the reader asks what it costs, the answer routes to a call.
2. NEVER invent results, metrics, percentages, multiples, view counts or ROI for any client or case study. The case-study data has no results in it. If you state a number about a client's outcome, you made it up.
3. NEVER claim the case studies belong to the page's industry or geography. They usually do not. Do not say "our fintech clients" or "our Bengaluru work".
4. Only these Zyra numbers may ever be stated as fact: {{PROOF_POINTS}}. No others.
5. Write in plain ASCII. No em dashes, no en dashes, no curly quotes, no ellipsis characters.
6. Never state a delivery time other than the one supplied to you.
7. Do not put double quotes inside any JSON string value. If you need to name a film or a campaign, write it plain or in single quotes. An unescaped quote breaks the response.

VOICE: specific, candid, concrete. Short sentences. Active voice. No "in today's fast-paced landscape", no "unlock", "seamless", "revolutionize", "elevate", "leverage", "game-changer". Authority comes from specifics, not adjectives. Do not open with a rhetorical question.

Reply with ONLY a JSON object. No preamble, no code fence, no commentary.`;

interface LlmCopy {
  metaTitle: string;
  metaDescription: string;
  subline: string;
  aeoAnswer: string;
  problemHeading: string;
  problemBody: string[];
  faq: { q: string; a: string }[];
}

function segmentLabel(inputs: SolutionInputs): string {
  const parts = [inputs.industry.trim(), inputs.geography.trim()].filter(Boolean);
  return parts.join(' in ');
}

function buildPrompt(inputs: SolutionInputs, proof: SolutionProof[], deliveryTime: string): string {
  const service = servicePhrase(inputs.serviceSlugs);
  const chosen = inputs.serviceSlugs.map(getServiceBySlug).filter(Boolean);
  const h1 = buildH1(inputs);

  const serviceBlock = chosen.length
    ? chosen.map((s) => [
      `- ${s!.title} (${s!.slug})`,
      `  what it is: ${s!.subtitle}`,
      `  deliverables: ${s!.deliverables.map((d) => d.title).join('; ')}`,
    ].join('\n')).join('\n')
    : `- No specific service selected. Frame the page around Zyra's full range: ${SERVICE_CATALOG.map((s) => s.title).join(', ')}.`;

  // No literal double quotes anywhere in this prompt. The model mirrors the
  // style it is shown, and a quoted title came back unescaped INSIDE a JSON
  // string value, terminating it early and breaking the parse. Use a dash.
  const proofBlock = proof.map((p) => [
    `- ${p.client} - ${p.title} (${p.category}, ${p.year})`,
    `  brief: ${p.brief}`,
    `  NOTE: this project is NOT necessarily ${segmentLabel(inputs) || 'in this segment'}.`,
  ].join('\n')).join('\n');

  return `Write the copy for this landing page.

TARGET
  Industry:   ${inputs.industry.trim() || '(none given - do not invent one)'}
  Geography:  ${inputs.geography.trim() || '(none given - do not invent one)'}
  Service:    ${service}${service === UMBRELLA_SERVICE ? ' (umbrella - no single service selected)' : ''}

FIXED - already decided, do not restate or contradict:
  H1:            ${h1}
  Delivery time: ${deliveryTime}   <- the ONLY delivery figure you may use
  Traditional production takes about three months. You may contrast against that
  TIME, but never against its cost.

SERVICES ON THE PAGE (real, from Zyra's own service pages)
${serviceBlock}

CASE STUDIES ON THE PAGE (real; they have NO results data)
${proofBlock}

WRITE THIS JSON:
{
  "metaTitle":       "<=60 chars. Include the H1's core phrase. End with ' | Zyra'.",
  "metaDescription": "140-158 chars. Says what Zyra does for this segment and the delivery time.",
  "subline":         "One line under the H1. Concrete. Mentions speed, not cost.",
  "aeoAnswer":       "40-55 words. A direct, self-contained answer to 'what is this and who is it for', written so an AI answer engine can quote it whole. Third person, names Zyra, names the segment, states the delivery time.",
  "problemHeading":  "<=48 chars. The tension this segment feels. A statement, not a question.",
  "problemBody":     ["3 paragraphs, 2-3 sentences each. Para 1: why the timeline hurts THIS segment specifically. Para 2: what they settle for instead and why it all looks the same. Para 3: a second, non-obvious constraint this segment actually has."],
  "faq":             [{"q": "...", "a": "..."}]
}

FAQ RULES: exactly 5. Include one about whether Zyra works with this segment (answer honestly - Zyra works with them, but do not claim the listed case studies are from this segment). Include one about how long it takes (use ${deliveryTime}). Include one about cost that states NO figure and routes to a call. The other two should answer a real objection this segment has.

Return only the JSON object.`;
}

/** Parse + validate the model's JSON. Repairs are handled by parseLooseJson. */
function parseCopy(raw: string): { copy: LlmCopy; repaired: string[] } {
  const { value: parsed, repaired } = parseLooseJson<LlmCopy>(raw);

  const missing = (['metaTitle', 'metaDescription', 'subline', 'aeoAnswer', 'problemHeading'] as const)
    .filter((k) => typeof parsed[k] !== 'string' || !parsed[k].trim());
  if (missing.length) throw new Error(`Response is missing: ${missing.join(', ')}`);
  if (!Array.isArray(parsed.problemBody) || parsed.problemBody.length < 1) {
    throw new Error('Response is missing problemBody.');
  }
  if (!Array.isArray(parsed.faq) || parsed.faq.length < 3) {
    throw new Error('Response needs at least 3 FAQ entries.');
  }
  return { copy: parsed, repaired };
}

/** Strip characters the site's style rules ban, so we never ship them. */
function ascii(s: string): string {
  return s
    .replace(/[—–]/g, '-')
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/…/g, '...')
    .trim();
}

/** Resolve the operator's picks into real proof, capped and ordered. */
export function resolveProof(caseStudySlugs: string[]): SolutionProof[] {
  return caseStudySlugs
    .slice(0, PROOF_LIMIT) // extras are dropped; the picker warns about this
    .map(getCaseStudyBySlug)
    .filter((c): c is NonNullable<typeof c> => !!c)
    .map((c) => ({
      workSlug: c.slug,
      client: c.client,
      title: c.title,
      category: c.category,
      year: c.year,
      tags: c.tags,
      brief: c.brief,
      cfStream: c.cfStream,
      vertical: c.vertical,
    }));
}

/** Real deliverables from the selected services; the all-services frame when none. */
function resolveDeliverables(serviceSlugs: string[]): { num: string; title: string; desc: string }[] {
  const chosen = serviceSlugs.map(getServiceBySlug).filter(Boolean);
  const source = chosen.length
    ? chosen.flatMap((s) => s!.deliverables)
    // No service selected -> one line per service rather than inventing a
    // generic list. The desc lists that service's real deliverables; it does NOT
    // use s.subtitle. A subtitle is a positioning tagline, not a description of
    // what arrives - and micro-drama's is "India's $10B content opportunity",
    // which is money, which these pages ban. Under a heading that says
    // "Everything included", the deliverable names are the honest answer anyway.
    : SERVICE_CATALOG.map((s) => ({
      title: s.title,
      desc: `${s.deliverables.slice(0, 3).map((d) => d.title).join(', ')}.`,
    }));
  return source.slice(0, 6).map((d, i) => ({
    num: String(i + 1).padStart(2, '0'),
    title: d.title,
    desc: d.desc,
  }));
}

function resolveProcess(serviceSlugs: string[]): { num: string; title: string; desc: string }[] {
  const first = serviceSlugs.map(getServiceBySlug).find(Boolean);
  const source = first?.process ?? getServiceBySlug('ai-brand-films')!.process;
  return source.slice(0, 5).map((p, i) => ({
    num: String(i + 1).padStart(2, '0'),
    title: p.title,
    desc: p.desc,
  }));
}

function trustLineFor(serviceSlugs: string[], deliveryTime: string): string {
  const chosen = serviceSlugs.map(getServiceBySlug).find(Boolean);
  const stat = chosen?.stats?.[0];
  const left = stat ? `${stat.value} ${stat.label.toLowerCase()}` : '50+ brand films & ads created';
  return `${left} · ${deliveryTime} delivery`;
}

function mockCopy(inputs: SolutionInputs, deliveryTime: string): LlmCopy {
  const segment = segmentLabel(inputs) || 'brands';
  const service = servicePhrase(inputs.serviceSlugs);
  return {
    metaTitle: `${buildH1(inputs)} | Zyra`.slice(0, 60),
    metaDescription: `Zyra produces ${service.toLowerCase()} for ${segment}, delivered in ${deliveryTime} instead of the three months a traditional production needs.`,
    subline: 'Cinematic brand stories at the speed of culture - produced in days, not quarters.',
    aeoAnswer: `Zyra is an AI-native film studio producing ${service.toLowerCase()} for ${segment}. We compress concept, production and post into a single AI-accelerated pipeline, delivering OTT-quality work in ${deliveryTime} instead of the three months a traditional production needs.`,
    problemHeading: `${inputs.industry.trim() || segment} moves faster than film.`,
    problemBody: [
      `Teams in ${segment} ship constantly. Traditional production needs about three months for one film, and by the time it airs the thing it was selling has already changed.`,
      'So the category defaults to screen recordings and stock footage, and everyone ends up looking identical.',
      'Approvals make it worse. Every claim needs review, every reshoot restarts the clock, and the safest cut is the one that gets signed off.',
    ],
    faq: [
      { q: `Do you work with ${segment}?`, a: `Yes. We work with teams in ${segment} remotely and on the ground.` },
      { q: 'How long does it take?', a: `${deliveryTime} from approved brief to final master, compared with roughly three months for a traditional production.` },
      { q: 'What does it cost?', a: "It depends on scope - how many films, which deliverables, and the cutdowns you need. Tell us your scope on a call and we'll come back with a number." },
      { q: 'Do the films look AI-generated?', a: 'No. Our pipeline combines AI generation with human creative direction, colour grading, voiceover and music.' },
      { q: 'Can you deliver cutdowns for performance campaigns?', a: 'Yes. Every film ships with 16:9, 9:16 and 1:1 cutdowns for CTV, YouTube, Meta and in-app placements.' },
    ],
  };
}

function assemble(
  inputs: SolutionInputs, copy: LlmCopy, proof: SolutionProof[], deliveryTime: string, mode: SourceMode,
): SolutionPage {
  return {
    slug: buildSolutionSlug(inputs),
    industry: inputs.industry.trim(),
    geography: inputs.geography.trim(),
    serviceSlugs: inputs.serviceSlugs,

    metaTitle: ascii(copy.metaTitle),
    metaDescription: ascii(copy.metaDescription),

    eyebrow: buildEyebrow(inputs),
    h1: buildH1(inputs),
    subline: ascii(copy.subline),
    trustLine: trustLineFor(inputs.serviceSlugs, deliveryTime),
    aeoAnswer: ascii(copy.aeoAnswer),

    problemHeading: ascii(copy.problemHeading),
    problemBody: copy.problemBody.slice(0, 3).map(ascii),

    deliverables: resolveDeliverables(inputs.serviceSlugs),
    proof,
    process: resolveProcess(inputs.serviceSlugs),
    faq: copy.faq.slice(0, 6).map((f) => ({ q: ascii(f.q), a: ascii(f.a) })),

    mode,
  };
}

export interface GeneratedSolution {
  page: SolutionPage;
  warnings: string[];
}

/** Generate the whole page from the inputs. One call, one page. */
export async function solutionGenerator(raw: SolutionInputs): Promise<GeneratedSolution> {
  const inputs = normalizeSolutionInputs(raw);
  const proof = resolveProof(inputs.caseStudySlugs);
  if (!proof.length) throw new Error('Pick at least one case study — the page needs real proof.');
  if (!inputs.industry.trim() && !inputs.geography.trim()) {
    throw new Error('Give an industry or a geography — at least one is required.');
  }

  const deliveryTime = deliveryTimeFor(inputs.serviceSlugs);
  const llm = getLLM();

  if (llm.liveFor('writer')) {
    const system = SYSTEM.replace('{{PROOF_POINTS}}', ZYRA_NUMBERS);
    const prompt = buildPrompt(inputs, proof, deliveryTime);
    const warnings: string[] = [];

    // Two attempts before falling back. A malformed response is usually a
    // one-off, and template copy is a much worse outcome than a retry.
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const raw = await llm.generate({
          role: 'writer',
          system,
          prompt: attempt === 1
            ? prompt
            : `${prompt}\n\nIMPORTANT: your previous reply was not valid JSON. Return ONLY a single valid JSON object. Escape any double quote inside a string, or avoid quotes entirely.`,
          maxTokens: 4000,
          temperature: attempt === 1 ? 0.7 : 0.3, // tighten up on the retry
        });
        const { copy, repaired } = parseCopy(raw);
        if (repaired.length) {
          // Not fatal, but worth knowing the model's JSON needed fixing.
          warnings.push(`Claude's JSON needed repair (${repaired.join(', ')}) — copy is intact.`);
        }
        return { page: assemble(inputs, copy, proof, deliveryTime, 'live'), warnings };
      } catch (e) {
        if (attempt === 2) {
          // Surface the failure rather than quietly shipping template copy as if
          // it were the real thing.
          return {
            page: assemble(inputs, mockCopy(inputs, deliveryTime), proof, deliveryTime, 'mock'),
            warnings: [
              `Live writer (Claude) failed twice — showing template copy instead. ${(e as Error).message}`,
            ],
          };
        }
      }
    }
  }

  return { page: assemble(inputs, mockCopy(inputs, deliveryTime), proof, deliveryTime, 'mock'), warnings: [] };
}

// ZYRA_PROOF_POINTS is the blog pipeline's allow-list and includes
// "$10M ad spend managed". That is a real number, but it is still money, and
// these pages carry none - the guards would refuse to publish a page that used
// it. Filter rather than duplicate the list, so a new proof point added for the
// blog can't silently become un-publishable copy here.
const MONEYISH = /₹|\$|\bRs\b|\bINR\b|\blakh\b|\bcrore\b/i;
const ZYRA_NUMBERS = ZYRA_PROOF_POINTS.filter((p) => !MONEYISH.test(p)).join(', ');
