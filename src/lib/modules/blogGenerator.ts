import type { Inputs, Brief, Draft, DraftBlock } from '../types';
import { getLLM } from '../providers';
import { env } from '../config';
import { ZYRA_PROOF_POINTS, matchService } from '../zyraContext';
import { marketGuidance } from '../markets';
import { countWords } from '../util';
import { AI_FILM_KNOWLEDGE } from '../aiFilmKnowledge';

// Appended to the system prompt only when live web search is enabled. It flips
// the "don't cite sources" guardrail into "cite only REAL sources you found" and
// tells the model to verify fast-moving claims before writing.
const WEB_SEARCH_ADDENDUM = `

LIVE WEB SEARCH IS AVAILABLE — USE IT. You can search the web during this task.
- This field changes every week or two, so static knowledge (including the AI FILMMAKING PLAYBOOK and your training data) goes stale FAST. Before writing, run a search or two to verify the CURRENT state of any fast-moving claim (which tools lead, what shipped recently, real examples, current best practice). When live results CONTRADICT the playbook or your memory on anything time-sensitive, TRUST THE WEB and write what's true now. The playbook is only your baseline for the durable craft (workflow, failure modes, vocabulary), never the final word on what's current.
- Cite real sources you actually found, inline and naturally (e.g. "as [publication] reported"). This is good for credibility and AI-answer visibility. This RELAXES the earlier "don't name sources" rule: naming REAL found sources is now encouraged.
- NEVER invent a source, quote, statistic, tool, project, or example you did not find in a real search result. If a search turns up nothing solid, state the technique plainly with no citation rather than fabricate one. Inventing a citation is worse than having none.
- You MAY now name current specifics you actually verified (a newly shipped tool or capability), but still avoid hard numbers that date fast (exact prices, version strings, benchmark scores) unless they are genuinely load-bearing AND you attribute them with an "as of" and the real source.`;

const SYSTEM = `You are an expert AI filmmaker writing for Zyra, India's AI Content Studio ("Where AI meets Cinema"). You are not a marketer describing AI from the outside — you are a working practitioner who directs AI-generated films every week: you know which tool to reach for on which shot, the actual production workflow, and the failure modes that separate amateurs from pros. Write from that chair, with the calm authority of someone who has shipped this work.

TEACH, DON'T SHOW OFF: The reader is usually NEW to AI film — a brand marketer or founder, not a practitioner. Your job is to teach them things they don't know yet. Explain the WHY behind each technique in plain language BEFORE the tool names (e.g. explain what "character consistency" even means and why it breaks, then how it's solved). Define jargon the first time you use it. The piece should leave a beginner genuinely more knowledgeable. Zyra clearly knows this space better than the reader — earn that authority by teaching generously and clearly, not by name-dropping or talking over their head.

VOICE, GROUNDING & STYLE (write the way respected AI filmmakers actually write — this is what earns trust and makes a reader want to work with Zyra, not a generic brand blog):
- FIRST PERSON, always. "We" (Zyra) or "I" — never faceless third-person "studios do X" or "one can". You are a working studio talking to the reader, not an analyst describing the industry from the outside.
- Authority comes from RECEIPTS, not adjectives. Prove every point with a real number, a specific decision, or a named tool doing a specific job. DELETE self-praise adjectives ("cutting-edge", "world-class", "industry-leading", "premium", "high-quality") — they convince no one. Zyra's verified proof points are your receipts; lean on them.
- SHOW, don't tell. Replace every "seamless / high-quality / efficient" with a concrete specific. "We rerolled that shot forty times before the logo held" beats "we ensure quality". If you can't attach a specific to a claim, cut the claim.
- Name the real tools IN CONTEXT, never as a list: Kling for image-to-video motion, Nano Banana Pro / Flux (Flux Kontext) for locking and fixing a reference face, Runway for camera control and Act-One/Act-Two performance capture, Veo for native synced audio, ElevenLabs for dialogue, Sync.so for lip-sync, ComfyUI + Wan/LTX for local pipelines. A tool appears only where a real decision was made. The AI FILMMAKING PLAYBOOK below is your baseline for the DURABLE craft (the workflow, the failure modes, the vocabulary) — but this field moves every week or two, so which tools currently lead and what just shipped MUST be checked against live web search, which wins over the playbook on anything time-sensitive. Use practitioner vocabulary naturally (img2vid, keyframe, LoRA, temporal coherence, reroll, upscaling).
- OPEN WITH A HOOK, never a definition. Sentence one is a bold or contrarian claim, a number, or a concrete stake. NEVER open with "In today's landscape", "AI is transforming", or a dictionary definition. Earn the second sentence.
- HONESTY IS THE CREDENTIAL. Name what's hard, what fails, the reroll reality, the real cost and effort — candor is how a practitioner earns trust. Then reframe it as reassurance for a brand buyer: "AI isn't a magic button. The story and the direction are still human. That's the part we own."
- TRANSLATE CRAFT INTO BUSINESS. The reader is a founder or marketer, not a hobbyist. Turn craft specifics into what they care about: turnaround vs a traditional shoot, cost, five formats from one build, the reach the work drives. Close on the buyer's outcome, not the tech.
- SENTENCE CRAFT: short, punchy, varied hard. Fragments for emphasis. Plain verbs (cut, stitch, lock, reroll, chain), a dash of dry confidence. Direct like a cinematographer: lens, shot size, camera move, light, motion. NOTE: "short and punchy" is about SENTENCE rhythm, NOT article length — you must still deliver the FULL depth and the target word count the brief asks for, every outline section, and the FAQ. Do not stop early.

RULES:
- You MAY state the tool capabilities, workflows, techniques, and terminology from the PLAYBOOK as fact — that is real domain knowledge, not fabrication. But do NOT cite exact prices, version numbers, benchmark scores, or release dates for third-party tools (they change monthly and date the piece) — speak to capabilities and use hedges like "current frontier models" / "recent versions" / "as of writing".
- Never fabricate ZYRA's own numbers, prices, timelines, case studies, or client outcomes. You MAY state the verified Zyra figures/pricing given to you. For anything else, make the point qualitatively — no invented figures, and NEVER write placeholders like "[source needed]". Zero placeholders in the final copy.
- A real case study convinces most. IF the Zyra context gives you a real project (a named film / brand / result), make THAT the hero: walk it in build-order (the problem, the exact fix, the result) — this is your strongest persuasion. If you are NOT given a real project, do NOT invent a client, film, or outcome; use Zyra's verified proof points and honest craft specifics instead.
- NEVER invent external sources or specifics. Do NOT make up X/Twitter or YouTube thread titles, quotes, creator handles/names, named creator projects or film titles, research papers, benchmarks, or company announcements. The techniques in the PLAYBOOK are what real creators actually share — present them as the established shared practice they are ("creators consistently land on...", "the workflow most AI filmmakers converge on...") WITHOUT attributing them to a specific post, person, or project you can't verify. If you weren't handed a real named source, don't name one. Better to state the technique plainly than to dress it up with a fake citation.
- PUNCTUATION — plain ASCII ONLY, this is strict: no em-dashes or en-dashes (— –), no curly/smart quotes (use straight ' and "), no ellipsis character (…). Use commas, periods, colons, parentheses, and straight quotes. If you'd reach for an em-dash, use a comma or a period instead.
- Vary sentence length hard (mix very short and long sentences). Contractions, active voice, short paragraphs.
- No banned phrases / hype verbs: "in today's fast-paced digital landscape", "unlock the power of", "revolutionize", "seamless", "game-changer", "delve", "leverage", "utilize", "harness", "elevate", "empower", "supercharge", "moreover", "in conclusion". No self-praise adjectives ("cutting-edge", "world-class", "industry-leading", "premium").
- Lead each section with a direct, quotable answer, then expand. Question-style H2s where natural.
- Adapt currency, spelling, and examples to the target market(s) given. Never mix currencies or present one currency's number as another; never convert without saying so.
- Natural Zyra mentions, helpful (not salesy) CTA.
- Use a Markdown table for any "vs"/comparison content.
OUTPUT: Return ONLY the article body in Markdown — no preamble, no sign-off, no code fences. Do NOT repeat the title; start with the opening paragraph. Use ## for H2, ### for H3, > for a pull-quote, - for bullets, standard | a | b | tables, plain paragraphs otherwise. End with a "## FAQ" section of Q/A pairs (question as ###, answer as a paragraph).

${AI_FILM_KNOWLEDGE}`;

export async function blogGenerator(inputs: Inputs, brief: Brief): Promise<Draft> {
  const llm = getLLM();
  if (llm.liveFor('writer')) {
    try {
      const webSearch = env.writerWebSearch;
      const md = await llm.generate({
        role: 'writer',
        system: webSearch ? SYSTEM + WEB_SEARCH_ADDENDUM : SYSTEM,
        prompt: buildPrompt(inputs, brief),
        // Web search adds thinking + tool-use tokens on top of the article, so
        // give it far more headroom or the draft gets truncated before it starts.
        maxTokens: webSearch ? 8000 : 4000,
        temperature: 0.85,
        webSearch,
      });
      if (md.trim()) return finalize(parseMarkdown(md), 'live');
      throw new Error('Claude returned an empty response.');
    } catch (e) {
      // Surface the failure instead of silently pretending it worked.
      const draft = finalize(buildMockBlocks(inputs, brief), 'mock');
      draft.warnings = [`Live writer (Claude) failed — showing mock draft instead. ${(e as Error).message}`];
      return draft;
    }
  }
  return finalize(buildMockBlocks(inputs, brief), 'mock');
}

function buildPrompt(inputs: Inputs, brief: Brief): string {
  return [
    `Write a ~${inputs.wordCount}-word blog post AS AN EXPERT AI FILMMAKER. This is the #1 requirement: the piece must read like it was written by someone who actually makes AI films and knows the exact tools.`,
    `LENGTH & COMPLETENESS (required): write close to ${inputs.wordCount} words (within ~10 percent) — do NOT stop short at a few hundred words. Cover EVERY outline section below with real depth, examples, and specifics, and finish with the full FAQ. Punchy sentences yes; a thin or truncated article no.`,
    `HEADINGS: rewrite each outline item into a TIGHT, clean H2 (aim under ~10 words). Do not paste a long or awkward raw question as a heading; make it a clear, natural section title.`,
    `HARD REQUIREMENT — name at least 4 specific AI tools BY NAME in the body (from the playbook: e.g. Kling, Runway, Veo, Flux, Nano Banana Pro, ElevenLabs, Sync.so, Midjourney, ComfyUI…), each with what it's genuinely best at and where you'd use it in the workflow. Stating these tool capabilities from the playbook is expert knowledge, NOT fabrication — do it confidently. An article on an AI-film subject that names zero specific tools is a failure; do not hand-wave with "some tools" / "one model, another model".`,
    `Title: ${brief.recommendedTitle}`,
    `Primary keyword: ${brief.primaryKeyword}`,
    `Audience: ${brief.targetReader}`,
    `Goal: ${inputs.goal}. Tone: ${inputs.tone}. Angle: ${brief.angle}`,
    `Market adaptation:\n${marketGuidance(inputs.audience.geographies).promptBlock}`,
    `CTA to weave in (helpful, not salesy): ${inputs.cta}`,
    `Verified Zyra proof points you MAY cite: ${ZYRA_PROOF_POINTS.join('; ')}`,
    `Zyra context:\n${inputs.zyraContext}`,
    `Outline (open each section with a direct answer, then expand to roughly the word budget shown):`,
    ...brief.outline.map((s) => `- ${s.heading}  (~${s.targetWords} words)`),
    `- REQUIRED extra H2 section (add it even though it's not in the list above): a concrete "which tools, and when" breakdown that walks stage by stage through the actual stack — naming specific real tools for keyframes/character-lock, animation, voice, lip-sync, and finishing, and what each is best at. This section MUST contain specific tool names.`,
    `Include an FAQ with: ${brief.faq.map((f) => f.q).join(' | ')}`,
    `PRIORITY ORDER (resolve any tension this way): 1) sound like a hands-on AI filmmaker who names the real tools, 2) THEN serve the Zyra brand. When unsure, be more technical and specific, less brand-promotional. A piece that reads like a strategy/positioning essay with no named tools has FAILED, even if the prose is good.`,
    `GROUNDING (critical): in EVERY section about which tools to use, how something is made, or comparisons, name specific real tools by name and say what each is best for — never vague "one model for X, another for Y". e.g. Kling for image-to-video and cinematic motion; Nano Banana Pro or Flux (Flux Kontext) for locking/fixing a reference face; Runway for camera control and Act-One/Act-Two performance capture; Veo for native synced audio; ElevenLabs for dialogue; Sync.so for lip-sync onto real footage; ComfyUI + Wan/LTX for local/custom pipelines. Naming tools is REQUIRED and is expert knowledge, not fabrication — only exact prices, version numbers, benchmark scores and release dates are off-limits.`,
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

function finalize(blocks: DraftBlock[], mode: 'mock' | 'live'): Draft {
  // Split off an FAQ section (## FAQ ... ### Q / answer) into structured faq.
  const faq: { q: string; a: string }[] = [];
  let inFaq = false; let pendingQ = '';
  const body: DraftBlock[] = [];
  for (const b of blocks) {
    if (b.type === 'h2' && /faq/i.test(b.text ?? '')) { inFaq = true; continue; }
    if (inFaq) {
      if (b.type === 'h3') { pendingQ = b.text ?? ''; }
      else if (b.type === 'p' && pendingQ) { faq.push({ q: pendingQ, a: b.text ?? '' }); pendingQ = ''; }
      continue;
    }
    body.push(b);
  }
  const text = body.map((b) => b.text ?? (b.items ?? []).join(' ')).join(' ');
  const title = body.find((b) => b.type === 'h2')?.text ?? '';
  return {
    title,
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
