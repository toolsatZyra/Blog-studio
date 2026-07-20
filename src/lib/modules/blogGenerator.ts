import type { Inputs, Brief, Draft, DraftBlock } from '../types';
import { getLLM } from '../providers';
import { env } from '../config';
import { ZYRA_PROOF_POINTS, matchService } from '../zyraContext';
import { marketGuidance } from '../markets';
import { countWords } from '../util';
import { WRITER_SYSTEM_PROMPT } from '../writerSystemPrompt';

export async function blogGenerator(inputs: Inputs, brief: Brief): Promise<Draft> {
  const llm = getLLM();
  if (llm.liveFor('writer')) {
    try {
      const webSearch = env.writerWebSearch;
      const md = await llm.generate({
        role: 'writer',
        system: WRITER_SYSTEM_PROMPT,
        prompt: buildPrompt(inputs, brief),
        // This prompt does heavy live research (search + thinking) on top of a full
        // article, so give it generous headroom or it truncates before finishing.
        maxTokens: webSearch ? 12000 : 6000,
        temperature: 0.85,
        webSearch,
      });
      const out = md.trim();
      // The prompt's freshness gate bails with a single RESEARCH_REQUIRED line when
      // it can't verify current evidence; never treat that (or a stub) as an article.
      if (/^RESEARCH_REQUIRED/i.test(out) || out.length < 300) {
        throw new Error(out ? out.slice(0, 200) : 'Claude returned an empty response.');
      }
      return finalize(parseMarkdown(md), 'live', brief.recommendedTitle);
    } catch (e) {
      // Surface the failure instead of silently pretending it worked.
      const draft = finalize(buildMockBlocks(inputs, brief), 'mock', brief.recommendedTitle);
      draft.warnings = [`Live writer (Claude) failed — showing mock draft instead. ${(e as Error).message}`];
      return draft;
    }
  }
  return finalize(buildMockBlocks(inputs, brief), 'mock', brief.recommendedTitle);
}

export function buildPrompt(inputs: Inputs, brief: Brief): string {
  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const outline = brief.outline.map((sec) => `  - ${sec.heading}  (~${sec.targetWords} words)`).join('\n');
  const faq = brief.faq.map((f) => f.q).join(' | ');
  return [
    `CURRENT DATE: ${today}. TARGET MARKET: ${inputs.audience.geographies || 'India'}.`,
    ``,
    `ARTICLE BRIEF:`,
    `- Title: ${brief.recommendedTitle}`,
    `- Primary intent / angle: ${brief.angle} (goal: ${inputs.goal})`,
    `- Primary keyword: ${brief.primaryKeyword}`,
    `- Audience: ${brief.targetReader}`,
    `- Tone: ${inputs.tone}`,
    `- Word range: about ${inputs.wordCount} words, met through useful depth (do not pad, do not stop short).`,
    `- Conversion goal: weave in this CTA naturally, not salesy: "${inputs.cta}"`,
    `- Outline (H2 sections in order; open each with a direct answer, then expand to roughly the word budget; rewrite any awkward raw question into a clean, descriptive heading):`,
    outline,
    // Ask for the exact shape the parser reads. The parser tolerates other
    // phrasings (see isFaqHeading), but a heading it cannot read costs the
    // FAQPage JSON-LD silently, so the prompt should not leave it to chance.
    // Always ask for one. When research turned up no spare questions the brief
    // has no candidates, and the old "none required" line meant the article
    // simply shipped without an FAQ - and without the FAQPage JSON-LD. The
    // writer has live web search, so it can source real questions itself.
    `- FAQ: REQUIRED. End the article with an H2 heading exactly "## FAQ", then each question as an H3 (###) followed by its answer paragraph. Write 3 to 5, none of them restating a section above.`,
    brief.faq.length
      ? `  Start from these researched candidates, dropping any the article already answers: ${faq}`
      : `  Research turned up no spare questions, so source your own from the reading you did: what would this reader still ask after finishing the article?`,
    ``,
    // The brief computed these, the Brief tab showed them and the SEO auditor
    // scored the article on having 3-5 of them - but nothing ever handed them to
    // the writer, so it was marked down for omitting links it was never given.
    `INTERNAL LINKS: work 3 to 5 of these into the body as natural in-sentence links, where the topic genuinely calls for it. Never a bare list, never a "related reading" block, never all of them.`,
    ...brief.internalLinks.map((l) => `  - [${l.anchor}](${l.href})`),
    ``,
    `VERIFIED ZYRA FACTS (the ONLY Zyra numbers/claims you may state as fact): ${ZYRA_PROOF_POINTS.join('; ')}`,
    `ZYRA CONTEXT (positioning and services, not dated first-hand production notes):\n${inputs.zyraContext.trim()}`,
    `ZYRA PRODUCTION NOTES: none supplied for this article. So do NOT present any specific first-hand shot, project, client, reroll count, cost, timeline, or result as something Zyra did. You may still state the VERIFIED ZYRA FACTS above and describe Zyra's services in general terms.`,
    ``,
    `MARKET ADAPTATION:\n${marketGuidance(inputs.audience.geographies).promptBlock}`,
    ``,
    `RESEARCH: Live web search IS available to you. Follow the FRESHNESS GATE and MANDATORY RESEARCH PROTOCOL in your instructions: research current evidence silently before writing, and do not rely on memory for any volatile tool, ranking, pricing, access, language-quality, or legal claim.`,
    ``,
    // Stated in the guard's own terms. The auditor accepts a percentage or
    // multiplier only when its SENTENCE carries "according to", "Source:", or a
    // link - so a vaguer instruction to "cite volatile facts" leaves the writer
    // producing bare figures that are then blocked at publish, and the operator
    // resolving them by hand on every stat-heavy article.
    `STATISTICS - THIS IS A PUBLISH GATE, NOT A STYLE NOTE:`,
    `Every percentage ("70%") and every multiplier ("3.2x") is refused at publish unless the SAME SENTENCE names its source. Two acceptable forms:`,
    `  - "According to <publication>, 70% of ..." (name the actual publication)`,
    `  - "... 70% of projects stall ([Publication Name](https://real-url))" - a real URL you actually found in research, never invented`,
    `If you cannot source a figure, do not write the figure. Write the plain-language claim instead: "most projects stall", "several times faster". A sourced sentence and an unnumbered sentence both publish; a bare number does not.`,
    `This does not apply to a named concept such as "the 30% rule", to Zyra's verified facts above, or to prices, counts and durations.`,
  ].join('\n');
}

// ── Deterministic (mock) draft ───────────────────────────────────────────────
// Coherent, question-MATCHED body content. Each section answers what its heading
// actually asks; no keyword-echo, proper casing, no placeholders. NOTE: this is a
// DEMO draft — publish-grade prose with real figures needs the Claude writer and
// real pricing in the Zyra context.

type QType = 'define' | 'cost' | 'worth' | 'time' | 'compare' | 'choose' | 'general';

function classify(heading: string): QType {
  const h = heading.toLowerCase();
  if (/\b(difference|vs\b|versus|traditional)\b/.test(h)) return 'compare';
  if (/\b(cost|price|pricing|pay|how much|budget|expensive)\b/.test(h)) return 'cost';
  if (/\b(worth|should i|roi|value)\b/.test(h)) return 'worth';
  if (/\b(how long|take|timeline|time|fast|turnaround)\b/.test(h)) return 'time';
  if (/\b(best|who|which|choose|recommend|agency|studio)\b/.test(h)) return 'choose';
  if (/\bwhat (is|are)\b|\bdefine\b/.test(h)) return 'define';
  return 'general';
}

// Two variants per type so a repeated type still reads distinctly.
function sectionContent(type: QType, headingNoun: string, variant: number, svc: string): string[] {
  const v = variant % 2;
  const byType: Record<QType, string[][]> = {
    define: [[
      `An AI brand film is a short, cinematic piece — usually 30 to 120 seconds — that carries a brand's story on screen. The "AI" part is the pipeline: environments, sets, and much of the imagery are generated, then a human team directs, edits, and grades it. On screen it reads like a shoot. Behind it, there's no location, crew call, or shoot day.`,
      `That shift is the whole reason the money conversation changes. You're not paying for a soundstage or a two-day crew. You're paying for the idea, the direction, and the finish — the parts that still need people.`,
    ], [
      `Put simply, it's a brand film made with AI-generated visuals and human creative direction. Same intent as a traditional brand film — tell the story, move the viewer — with a different production method underneath.`,
      `The look can be indistinguishable from a shoot. What differs is how it's made, which is exactly what changes the cost and the timeline.`,
    ]],
    cost: [[
      `There's no single price, and anyone who quotes one before seeing your brief is guessing. What you pay tracks four things: how long the film is, how finished it needs to look, how many cuts and formats you need, and how many revision rounds you'll run. Change one and the number moves.`,
      `Here's the honest part — we won't print a figure we can't stand behind for your project. What we can say is where the money goes: AI-native production strips out crew, location, and shoot-day costs and shifts the budget toward creative direction and the final grade. Share the finished use-case, not just "a brand film," and the estimate gets real.`,
    ], [
      `Budget by drivers, not by rate card. Length, finish level, number of deliverables, and revision rounds do most of the work; the vendor's day rate does less than people expect.`,
      `The single biggest lever is scope. Two films that both get called "a brand film" can differ several times over in effort — so the tighter your brief, the more accurate (and usually lower) the number.`,
    ]],
    worth: [[
      `It's worth it when you need speed or volume. Three ad cuts for a launch, a monthly drumbeat of films, or a format you'd normally skip because a full shoot is too slow — that's where AI-native production earns its place.`,
      `It's a weaker fit when the whole point is one hero film built around real talent in a real location. Match the method to the job. A useful test: if you'd run three variants but only budgeted for one, this is the thing that lets you run all three.`,
    ], [
      `The ROI case is usually volume. When you can produce several strong cuts for the cost and time of one traditional film, you get more shots at a winner — which is most of what performance content is about.`,
      `Where it disappoints is when it's chosen to look cheap rather than to move faster. The tool doesn't replace the idea; it just gets the idea on screen sooner.`,
    ]],
    time: [[
      `Timeline is the other half of cost, and it's usually shorter than a traditional shoot because there's nothing to schedule on location. The slow steps aren't filming — they're approvals and revisions.`,
      `Lock the script and the reference look early and the rest compresses fast. Leave them vague and no tool will save the calendar. Most overruns we see trace back to decisions that could have been made in week one.`,
    ], [
      `Plan in days and short weeks, not months. Removing the shoot removes the part of the schedule that's hardest to move.`,
      `The variable is you: fast, clear feedback keeps it fast. Rounds of "can we try something totally different" are what stretch it out.`,
    ]],
    compare: [[
      `The difference isn't the look — a well-made AI brand film and a well-shot one can be hard to tell apart. The difference is the process and where the cost sits. Traditional production spends on crew, cast, and location days; AI-native production spends on direction, iteration, and grading.`,
      `That also changes what's easy. Traditional makes one polished thing slowly; AI-native makes several things quickly. So it suits testing and always-on content more than a once-a-year showpiece.`,
    ], [
      `Think of it as the same destination by a different road. Traditional production is crew-and-camera; AI-native is prompt-direct-and-grade. Quality can match; economics and speed don't.`,
      `The practical takeaway: pick traditional for a singular hero moment with real talent, and AI-native when you need range, speed, or many variants.`,
    ]],
    choose: [[
      `Judge a studio on its reel and its process, not its rate card. Ask how they handle creative direction, how many revision rounds are included, and who does the final grade — that's where AI-native work is either elevated or exposed.`,
      `At Zyra we pair generated production with human creative direction across ${svc}. Across 1,000+ creatives and 50M+ views, the through-line is simple: the specific briefs win. Bring a clear use-case and you'll get sharper work and a cleaner quote.`,
    ], [
      `Shortlist on craft, then on process. A strong reel proves they can direct AI; a clear process proves they can do it on your deadline without runaway revisions.`,
      `Ask to see raw-to-final examples. Anyone can show a hero cut; the tell is how they handle the unglamorous parts — grading, sound, and consistency across deliverables.`,
    ]],
    general: [[
      `On ${headingNoun}, the short answer is that it depends on the brief. The four cost drivers — length, finish, deliverables, and revisions — are the levers, and scope sets the price more than the vendor does.`,
      `Bring the finished use-case to the first conversation and you'll get a real answer instead of a range.`,
    ], [
      `For ${headingNoun}, start from the outcome you need, then work back to the format. The clearer the outcome, the cleaner the plan and the quote.`,
      `A guess dressed up as a quote helps no one; a scoped estimate does.`,
    ]],
  };
  return byType[type][v];
}

function faqAnswer(type: QType): string {
  const map: Record<QType, string> = {
    define: `It's a short cinematic film that tells a brand's story, made with AI-generated visuals and human creative direction. On screen it looks like a shoot; behind it, there's no crew or location day.`,
    cost: `There's no flat rate. Price tracks length, finish level, number of deliverables, and revision rounds. Share the finished use-case and you'll get a real quote instead of a range — we won't invent a figure.`,
    worth: `Yes when you need speed or several cuts; less so for a single on-location hero film. Match the method to the job.`,
    time: `Days to a couple of weeks, not months, because there's no shoot to schedule. Approvals and revisions set the pace, so a tight brief turns around fast.`,
    compare: `Look and quality can be similar; the difference is process and cost. Traditional spends on crew and locations, AI-native on direction and grading — and it's faster for multiple cuts.`,
    choose: `Judge the reel and the process, not the rate. Ask about creative direction, included revision rounds, and who grades the final.`,
    general: `It comes down to the brief — length, finish, and deliverables. Give a studio the finished use-case and the answer gets specific fast.`,
  };
  return map[type];
}

function buildMockBlocks(inputs: Inputs, brief: Brief): DraftBlock[] {
  const svc = (matchService(brief.primaryKeyword)?.name ?? 'AI Brand Films & Commercials').toLowerCase();
  const mkt = marketGuidance(inputs.audience.geographies);
  const named = mkt.markets.find((m) => brief.primaryKeyword.toLowerCase().includes(m.label.toLowerCase().split(' ')[0]));
  const market = (named ?? mkt.primary)?.label ?? 'your market';
  const roles = inputs.audience.roles || 'marketers';
  const blocks: DraftBlock[] = [];

  // Intro — direct answer first, market-specific, no hype, no fabricated figure.
  blocks.push({ type: 'p', text: `An AI brand film costs less than a traditional shoot of the same ambition — but there's no single price. What you'll pay depends on length, how finished it needs to look, how many cuts you need, and how many rounds of changes you run. This guide breaks down those drivers for ${roles} in ${market} so you can budget without guessing.` });
  blocks.push({ type: 'p', text: `We're Zyra, an AI content studio. We'll be specific about what moves the number and what doesn't — and we won't quote a figure we can't stand behind for your brief.` });

  blocks.push({ type: 'h2', text: 'Key takeaways' });
  blocks.push({ type: 'ul', items: [
    `Cost tracks four drivers: length, finish level, number of deliverables, and revision rounds.`,
    `AI-native production removes crew, cast, and location costs and shifts spend to direction and grading.`,
    `It shines for volume and speed — several cuts fast — and less for a single on-location hero film.`,
    `Ask for a scoped quote, not a rate card. Your brief moves the price more than the vendor does.`,
  ] });

  const typeCounts: Partial<Record<QType, number>> = {};
  brief.outline.forEach((s) => {
    const type = classify(s.heading);
    const variant = (typeCounts[type] = (typeCounts[type] ?? 0) + 1) - 1;
    blocks.push({ type: 'h2', text: s.heading });
    for (const p of sectionContent(type, stripQ(s.heading).toLowerCase(), variant, svc)) {
      blocks.push({ type: 'p', text: p });
    }
  });

  blocks.push({ type: 'blockquote', text: `The question isn't whether AI can match a traditional shoot. It's why you'd pay for crew days you no longer need.` });

  if (brief.intent === 'commercial') {
    blocks.push({ type: 'h2', text: 'How the options compare' });
    blocks.push({ type: 'table', table: {
      headers: ['Approach', 'Typical speed', 'Best for', 'What drives the cost'],
      rows: [
        ['Traditional shoot', 'Weeks', 'One hero film, real talent and locations', 'Crew, cast, location, shoot days'],
        ['AI-native (Zyra)', 'Days', 'Multiple cuts, fast turnarounds, always-on content', 'Direction, revisions, final grade'],
      ],
    } });
  }

  blocks.push({ type: 'p', text: inputs.cta?.trim() || `Planning something specific? Bring the brief and we'll scope it — no rate-card guesswork.` });

  if (brief.faq.length) {
    blocks.push({ type: 'h2', text: 'FAQ' });
    brief.faq.forEach((f) => {
      blocks.push({ type: 'h3', text: f.q });
      blocks.push({ type: 'p', text: faqAnswer(classify(f.q)) });
    });
  }
  return blocks;
}

// ── Markdown → blocks (live path) ────────────────────────────────────────────
function parseTableRow(line: string): string[] {
  return line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());
}
const isTableSep = (line: string) => /^\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)+\|?\s*$/.test(line.trim());
const isTableRow = (line: string) => /^\s*\|.*\|\s*$/.test(line);

export function parseMarkdown(md: string): DraftBlock[] {
  // Strip code fences and any accidental preamble/sign-off wrapper.
  const cleaned = md.replace(/```[a-z]*\n?/gi, '').trim();
  const lines = cleaned.split('\n');
  const blocks: DraftBlock[] = [];
  let list: string[] | null = null;
  const flush = () => { if (list && list.length) blocks.push({ type: 'ul', items: list }); list = null; };
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trimEnd();
    if (!line.trim()) { flush(); continue; }
    // Markdown table: header row, separator row, then data rows.
    if (isTableRow(line) && i + 1 < lines.length && isTableSep(lines[i + 1])) {
      flush();
      const headers = parseTableRow(line);
      const rows: string[][] = [];
      i += 2;
      while (i < lines.length && isTableRow(lines[i])) { rows.push(parseTableRow(lines[i])); i++; }
      i--;
      blocks.push({ type: 'table', table: { headers, rows } });
      continue;
    }
    if (/^###\s+/.test(line)) { flush(); blocks.push({ type: 'h3', text: line.replace(/^###\s+/, '') }); }
    else if (/^##\s+/.test(line)) { flush(); blocks.push({ type: 'h2', text: line.replace(/^##\s+/, '') }); }
    else if (/^#\s+/.test(line)) { flush(); blocks.push({ type: 'h2', text: line.replace(/^#\s+/, '') }); }
    else if (/^>\s?/.test(line)) { flush(); blocks.push({ type: 'blockquote', text: line.replace(/^>\s?/, '') }); }
    else if (/^[-*]\s+/.test(line)) { (list ??= []).push(line.replace(/^[-*]\s+/, '')); }
    else { flush(); blocks.push({ type: 'p', text: stripInlineMd(line.trim()) }); }
  }
  flush();
  return blocks;
}

/**
 * Does this H2 open the FAQ section?
 *
 * The writer prompt asks for "## FAQ" but a model phrases headings its own way,
 * and an unrecognised heading silently costs the FAQPage JSON-LD - the Q&A text
 * stays in the body, so nothing looks broken until you notice the rich result
 * never appears. Matching the bare substring "faq" missed the single most
 * natural phrasing, "Frequently Asked Questions", which does not contain it.
 *
 * Deliberately NOT a loose /questions/ test: "The Questions Nobody Asks About
 * Rerolls" is an article section, not an FAQ. A heading qualifies when it says
 * FAQ, uses a known FAQ phrase, or *opens* with "Questions".
 */
export function isFaqHeading(text: string): boolean {
  const s = text.trim();
  return /\bfaqs?\b/i.test(s)
    || /\bfrequently\s+asked\s+questions\b/i.test(s)
    || /\bcommon\s+questions\b/i.test(s)
    || /\bpeople\s+also\s+ask\b/i.test(s)
    || /^questions\b/i.test(s);
}

/**
 * Split a draft's blocks into body + structured FAQ.
 *
 * Exported so the heading-matching rules are testable on their own: this used to
 * be inline in finalize(), where the only way to exercise it was a full generate.
 */
export function splitFaqSection(blocks: DraftBlock[]): { body: DraftBlock[]; faq: { q: string; a: string }[] } {
  const faq: { q: string; a: string }[] = [];
  let inFaq = false; let pendingQ = '';
  const body: DraftBlock[] = [];
  for (const b of blocks) {
    if (b.type === 'h2' && isFaqHeading(b.text ?? '')) { inFaq = true; pendingQ = ''; continue; }
    if (inFaq) {
      if (b.type === 'h3') { pendingQ = b.text ?? ''; }
      else if (b.type === 'p' && pendingQ) { faq.push({ q: pendingQ, a: b.text ?? '' }); pendingQ = ''; }
      // A second paragraph under the same question appends rather than being
      // dropped on the floor, which is what the old `continue` did silently.
      else if (b.type === 'p' && faq.length) { faq[faq.length - 1].a += ` ${b.text ?? ''}`.trimEnd(); }
      continue;
    }
    body.push(b);
  }
  return { body, faq };
}

/**
 * Every exporter emits brief.recommendedTitle as the H1 and then renders each
 * block, so a leading H2 that repeats the title ships as an H1 followed by an
 * identical H2. The system prompt says not to repeat the title; the writer does
 * it anyway often enough to matter, and a prompt is not a guarantee.
 *
 * Only the FIRST block is considered, and only on an exact match after
 * normalising: a section legitimately named close to the title stays, and a
 * later H2 that happens to echo it is untouched.
 */
export function finalize(blocks: DraftBlock[], mode: 'mock' | 'live', title?: string): Draft {
  const key = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
  const deduped = title && blocks[0]?.type === 'h2' && key(blocks[0].text ?? '') === key(title)
    ? blocks.slice(1)
    : blocks;
  const { body, faq } = splitFaqSection(deduped);
  const text = body.map((b) => b.text ?? (b.items ?? []).join(' ')).join(' ');
  const draftTitle = title || body.find((b) => b.type === 'h2')?.text || '';
  return {
    title: draftTitle,
    blocks: body,
    faq,
    wordCount: countWords(text),
    sourceNeededCount: (text.match(/\[source needed\]/gi) ?? []).length,
    mode,
  };
}

function stripQ(s: string) { return s.replace(/\?+$/, '').trim(); }
// Strip inline markdown emphasis + links the CMS renders as plain text.
function stripInlineMd(s: string): string {
  return s
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/(^|[^*])\*([^*]+)\*/g, '$1$2')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/`([^`]+)`/g, '$1');
}
