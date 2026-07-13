import type { Inputs, Brief, Draft, DraftBlock } from '../types';
import { getLLM } from '../providers';
import { ZYRA_PROOF_POINTS } from '../zyraContext';
import { countWords } from '../util';

const SYSTEM = `You are a senior content strategist writing for Zyra, India's AI Content Studio ("Where AI meets Cinema"). Write like a sharp human editor, not a template.
RULES:
- Never fabricate numbers, prices, timelines, case studies, or client outcomes. Use only Zyra proof points you are given, or write "[source needed]" for any external stat you cannot source.
- Vary sentence length hard (mix very short and long sentences). Use contractions and active voice. Short paragraphs.
- No banned phrases: "in today's fast-paced digital landscape", "unlock the power of", "revolutionize", "seamless", "game-changer", "delve", "leverage", "moreover", "in conclusion".
- Lead each section with a direct, quotable answer, then expand. Question-style H2s where natural.
- Natural Zyra mentions, helpful (not salesy) CTA.
Return Markdown only: ## for H2, ### for H3, > for a pull-quote, - for bullets, plain paragraphs otherwise. End with a "## FAQ" section of Q/A pairs (question as ### , answer as paragraph).`;

export async function blogGenerator(inputs: Inputs, brief: Brief): Promise<Draft> {
  const llm = getLLM();
  if (llm.liveFor('writer')) {
    try {
      const md = await llm.generate({
        role: 'writer',
        system: SYSTEM,
        prompt: buildPrompt(inputs, brief),
        maxTokens: 4000,
        temperature: 0.85,
      });
      if (md.trim()) return finalize(parseMarkdown(md, brief), 'live');
    } catch { /* fall back to deterministic draft */ }
  }
  return finalize(buildMockBlocks(inputs, brief), 'mock');
}

function buildPrompt(inputs: Inputs, brief: Brief): string {
  return [
    `Write a ~${inputs.wordCount}-word blog post.`,
    `Title: ${brief.recommendedTitle}`,
    `Primary keyword: ${brief.primaryKeyword}`,
    `Audience: ${brief.targetReader}`,
    `Goal: ${inputs.goal}. Tone: ${inputs.tone}. Angle: ${brief.angle}`,
    `CTA to weave in (helpful, not salesy): ${inputs.cta}`,
    `Verified Zyra proof points you MAY cite: ${ZYRA_PROOF_POINTS.join('; ')}`,
    `Zyra context:\n${inputs.zyraContext}`,
    `Outline (question-led H2s — open each with a direct answer):`,
    ...brief.outline.map((s) => `- ${s.heading}`),
    `Include an FAQ with: ${brief.faq.map((f) => f.q).join(' | ')}`,
  ].join('\n');
}

// ── Deterministic (mock) draft ───────────────────────────────────────────────
function buildMockBlocks(inputs: Inputs, brief: Brief): DraftBlock[] {
  const topic = brief.primaryKeyword;
  const blocks: DraftBlock[] = [];
  // Intro: direct answer in the first ~100 words, first-person, no hype.
  blocks.push({
    type: 'p',
    text: `Here's the short version: ${topic} is changing how brands in ${inputs.audience.geographies || 'India'} plan content, and most teams still price it against the old model. We'll walk through what it actually means for ${inputs.audience.roles || 'marketers'}, where it helps, and where it doesn't.`,
  });
  blocks.push({
    type: 'p',
    text: `At Zyra, we build cinematic content with AI-native production and human creative direction. That mix is the lens we'll use here — practical, specific, and honest about trade-offs.`,
  });
  // Key takeaways
  blocks.push({ type: 'h2', text: 'Key takeaways' });
  blocks.push({
    type: 'ul',
    items: [
      `${cap(topic)} is best judged on outcomes, not novelty.`,
      `Budget and timeline expectations usually need re-setting.`,
      `The creative judgment still matters more than the tool.`,
    ],
  });
  // Sections from the brief outline
  for (const s of brief.outline) {
    blocks.push({ type: 'h2', text: s.heading });
    blocks.push({
      type: 'p',
      text: `Short answer: ${stripQ(s.heading).toLowerCase()} comes down to fit and execution. ${cap(topic)} works when the brief is clear and the team knows what "good" looks like.`,
    });
    blocks.push({
      type: 'p',
      text: `In our work across ${ZYRA_PROOF_POINTS[0]} and ${ZYRA_PROOF_POINTS[2]}, the pattern holds: the winners are specific. They know the audience, the format, and the one thing the piece must do. If you need an external benchmark here, cite it — [source needed].`,
    });
  }
  // Pull-quote + comparison for commercial intent
  blocks.push({ type: 'blockquote', text: `The question isn't whether AI can match traditional quality. It's why you'd pay far more for the same result.` });
  if (brief.intent === 'commercial') {
    blocks.push({ type: 'h2', text: 'How the options compare' });
    blocks.push({
      type: 'table',
      table: {
        headers: ['Approach', 'Speed', 'Where it fits'],
        rows: [
          ['Traditional production', 'Slower', 'One-off hero moments'],
          ['AI-native (Zyra)', 'Faster', 'Regular, cinematic output at culture speed'],
        ],
      },
    });
  }
  // CTA
  blocks.push({
    type: 'p',
    text: inputs.cta?.trim()
      ? inputs.cta.trim()
      : `If this maps to something you're planning, take a look at how we work.`,
  });
  // FAQ (real templated answers, no fabricated numbers) so schema + GEO checks pass.
  if (brief.faq.length) {
    blocks.push({ type: 'h2', text: 'FAQ' });
    for (const f of brief.faq) {
      const q = stripQ(f.q);
      blocks.push({ type: 'h3', text: f.q });
      blocks.push({
        type: 'p',
        text: `Short answer: ${q.toLowerCase()} depends on scope, format, and how clear the brief is. We'd rather scope it with you than quote a number that doesn't hold — if you need a market benchmark, cite one: [source needed].`,
      });
    }
  }
  return blocks;
}

// ── Markdown → blocks (live path) ────────────────────────────────────────────
function parseMarkdown(md: string, brief: Brief): DraftBlock[] {
  const lines = md.split('\n');
  const blocks: DraftBlock[] = [];
  let list: string[] | null = null;
  const flush = () => { if (list && list.length) blocks.push({ type: 'ul', items: list }); list = null; };
  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line.trim()) { flush(); continue; }
    if (/^###\s+/.test(line)) { flush(); blocks.push({ type: 'h3', text: line.replace(/^###\s+/, '') }); }
    else if (/^##\s+/.test(line)) { flush(); blocks.push({ type: 'h2', text: line.replace(/^##\s+/, '') }); }
    else if (/^#\s+/.test(line)) { flush(); blocks.push({ type: 'h2', text: line.replace(/^#\s+/, '') }); }
    else if (/^>\s?/.test(line)) { flush(); blocks.push({ type: 'blockquote', text: line.replace(/^>\s?/, '') }); }
    else if (/^[-*]\s+/.test(line)) { (list ??= []).push(line.replace(/^[-*]\s+/, '')); }
    else { flush(); blocks.push({ type: 'p', text: line.trim() }); }
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

function cap(s: string) { return s.charAt(0).toUpperCase() + s.slice(1); }
function stripQ(s: string) { return s.replace(/\?+$/, '').trim(); }
