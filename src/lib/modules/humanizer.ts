import type { Draft, DraftBlock } from '../types';
import { getLLM } from '../providers';
import { countWords } from '../util';

// The humanizer: a deterministic pass that rewrites common AI-writing tropes so
// drafts read like a person wrote them. Runs BEFORE the SEO/AEO audit. When the
// Claude writer is live it also does a rhythm/voice polish. Never changes facts
// or removes [source needed] tags.

interface Rule { name: string; re: RegExp; rep: string | ((...m: string[]) => string); }

// Rules ported from the `humanizer` skill (Wikipedia "Signs of AI writing").
// Deterministic/lexical patterns live here; judgment-heavy ones (rule-of-three,
// synonym cycling, false ranges, notability, "challenges" sections) are left to
// the Claude polish pass when the writer LLM is live.
const RULES: Rule[] = [
  // 1 — significance / legacy inflation
  { name: 'significance-inflation', re: /\b(?:marking|representing|symboli[sz]ing|reflecting) (?:a )?(?:pivotal|key|significant|crucial|vital|major) (?:moment|milestone|turning point|shift)[^.]*(?=\.)/gi, rep: '' },
  { name: 'testament', re: /\b(?:an? (?:enduring |lasting )?testament to|stands as a testament to)\b/gi, rep: 'shows' },
  { name: 'evolving-landscape', re: /\b(?:ever-)?evolving (?:landscape|world|realm|era) of\b/gi, rep: '' },
  // 3 — superficial -ing analyses (strip trailing participial padding)
  { name: 'ing-padding', re: /,\s+(?:highlighting|underscoring|emphasi[sz]ing|reflecting|symboli[sz]ing|showcasing|fostering|ensuring|cultivating|encompassing|contributing to)\b[^.]*(?=\.)/gi, rep: '' },
  // 4 — promotional / advertisement language
  { name: 'nestled', re: /\bnestled\s+(?:in|within|among)?\s*/gi, rep: '' },
  { name: 'in-the-heart-of', re: /\bin the heart of\b/gi, rep: 'in' },
  { name: 'promo-adjectives', re: /\b(?:breathtaking|stunning|must-visit|vibrant|renowned|groundbreaking|rich)\s+/gi, rep: '' },
  // 7 — overused AI vocabulary
  { name: 'additionally', re: /\b(?:additionally|moreover|furthermore|in essence|in short|that being said)\b,?\s*/gi, rep: '' },
  { name: 'crucial', re: /\bcrucial\b/gi, rep: 'important' },
  { name: 'pivotal', re: /\bpivotal\b/gi, rep: 'major' },
  { name: 'delve', re: /\bdelve into\b/gi, rep: 'dig into' },
  { name: 'leverage', re: /\bleverage\b/gi, rep: 'use' },
  { name: 'utilize', re: /\butili[sz]e\b/gi, rep: 'use' },
  { name: 'enhance', re: /\benhanc(e|es|ed|ing)\b/gi, rep: (m, g) => ({ e: 'improve', es: 'improves', ed: 'improved', ing: 'improving' }[g] ?? 'improve') },
  { name: 'foster', re: /\bfoster(s|ed|ing)?\b/gi, rep: (m, g) => (g === 'ing' ? 'building' : g === 's' ? 'builds' : g === 'ed' ? 'built' : 'build') },
  { name: 'garner', re: /\bgarner(s|ed|ing)?\b/gi, rep: 'get' },
  { name: 'showcase', re: /\bshowcas(e|es|ed|ing)\b/gi, rep: 'show' },
  { name: 'underscore', re: /\bunderscore(s|d)?\b/gi, rep: 'shows' },
  { name: 'tapestry', re: /\b(?:a )?(?:rich )?tapestry of\b/gi, rep: '' },
  { name: 'interplay', re: /\binterplay\b/gi, rep: 'mix' },
  { name: 'intricate', re: /\bintricate\b/gi, rep: 'complex' },
  { name: 'enduring', re: /\benduring\b/gi, rep: 'lasting' },
  { name: 'robust', re: /\brobust\b/gi, rep: 'solid' },
  { name: 'seamless', re: /\bseamless(ly)?\b/gi, rep: (m, g1) => (g1 ? 'smoothly' : 'smooth') },
  { name: 'cutting-edge', re: /\bcutting-edge\b/gi, rep: 'modern' },
  { name: 'align-with', re: /\balign(s|ed)? with\b/gi, rep: 'match' },
  // 8 — copula avoidance
  { name: 'copula-serves-as', re: /\b(?:serves|stands|functions) as (a |an )?/gi, rep: 'is $1' },
  { name: 'copula-boasts', re: /\bboasts\b/gi, rep: 'has' },
  // 9 — negative parallelisms
  { name: 'not-just-x', re: /\bit'?s not just ([^,.;]+?),?\s*it'?s\s+/gi, rep: "it's " },
  { name: 'not-only-but-also', re: /\bnot only ([^,.;]+?) but also\s+/gi, rep: '$1 and ' },
  // 13 — filler / hype phrases
  { name: 'game-changer', re: /\bgame[- ]changer\b/gi, rep: 'turning point' },
  { name: 'revolutionize', re: /\brevolutioni[sz]e\b/gi, rep: 'change' },
  { name: 'hype-verbs', re: /\b(?:unlock|supercharge|elevate|empower|harness|turbocharge)\b\s*/gi, rep: '' },
  { name: 'class-adjs', re: /\b(?:world-class|best-in-class|state-of-the-art|next-level|top-notch|bespoke)\b\s*/gi, rep: '' },
  { name: 'in-todays', re: /\bin today'?s (?:fast-paced|digital|modern|competitive)[^,.]*,\s*/gi, rep: '' },
  { name: 'in-the-world-of', re: /(^|[.!?]\s+)in the (?:world|realm|age|era) of [^,.]+,\s*/gi, rep: '$1' },
  { name: 'whether-youre', re: /(^|[.!?]\s+)whether you'?re [^,]+,\s*/gi, rep: '$1' },
  { name: 'lets-dive', re: /\blet'?s (?:dive in|dive into|delve into|explore|unpack|take a look|break it down)\b[^.?!]*[.?!]\s*/gi, rep: '' },
  { name: 'thats-where-comes-in', re: /\bthat'?s where [^.]+? comes in\.\s*/gi, rep: '' },
  { name: 'heres-the-thing', re: /(^|[.!?]\s+)(?:here'?s the thing|the truth is|let'?s be honest|make no mistake)\b[:,]?\s*/gi, rep: '$1' },
  { name: 'echo-lead-in', re: /(^|[.!?]\s+)(?:straight answer(?: on)?|the honest answer to|honest answer on|thinking about|on the question of)\s+["“]?[^:.?!]{0,80}?["”]?\s*[:,]\s*/gi, rep: '$1' },
  { name: 'end-of-day', re: /\bat the end of the day,?\s*/gi, rep: '' },
  { name: 'when-it-comes-to', re: /\bwhen it comes to\b/gi, rep: 'for' },
  { name: 'important-to-note', re: /\bit(?:'s| is)\s+(?:important|worth) (?:to note|noting)(?: that)?\s*/gi, rep: '' },
  // 22 — verbose filler
  { name: 'in-order-to', re: /\bin order to\b/gi, rep: 'to' },
  { name: 'due-to-the-fact', re: /\bdue to the fact that\b/gi, rep: 'because' },
  { name: 'at-this-point', re: /\bat this point in time\b/gi, rep: 'now' },
  { name: 'in-the-event', re: /\bin the event that\b/gi, rep: 'if' },
  { name: 'ability-to', re: /\b(?:has|have) the ability to\b/gi, rep: 'can' },
  { name: 'plethora', re: /\b(?:a )?(?:plethora|myriad|vast array) of\b/gi, rep: 'many' },
  { name: 'wide-range', re: /\ba (?:wide range|variety|host) of\b/gi, rep: 'many' },
  { name: 'the-fact-that', re: /\bthe fact that\b/gi, rep: 'that' },
  // 23 — excessive hedging
  { name: 'could-be-argued', re: /\bit could (?:potentially )?be argued that\b/gi, rep: '' },
  { name: 'could-potentially', re: /\bcould potentially(?: possibly)?\b/gi, rep: 'could' },
  { name: 'potentially', re: /\bpotentially\b\s*/gi, rep: '' },
  { name: 'arguably', re: /\barguably\b\s*/gi, rep: '' },
  // 19/21 — chatbot artifacts + sycophancy
  { name: 'chatbot-artifacts', re: /\b(?:great question!?|certainly!?|of course!?|you'?re absolutely right!?)\s*/gi, rep: '' },
  { name: 'i-hope-this-helps', re: /\bi hope this helps!?\.?\s*/gi, rep: '' },
  { name: 'let-me-know', re: /\blet me know if[^.]*\.\s*/gi, rep: '' },
  // 20 — knowledge-cutoff disclaimers
  { name: 'as-of-training', re: /\bas of my last (?:training|update)[^.,]*[.,]?\s*/gi, rep: '' },
  { name: 'details-limited', re: /(^|[.!?]\s+)while specific details (?:are|remain) (?:limited|scarce)[^.]*,\s*/gi, rep: '$1' },
  // 24 — generic positive conclusions
  { name: 'conclusion', re: /\b(?:in conclusion|to sum up|all in all|to wrap up|needless to say)\b,?\s*/gi, rep: '' },
  { name: 'future-looks-bright', re: /\bthe future looks bright[^.]*\.\s*/gi, rep: '' },
  { name: 'exciting-times', re: /\bexciting times (?:lie )?ahead[^.]*\.\s*/gi, rep: '' },
  { name: 'so-opener', re: /(^|[.!?]\s+)So,\s+/g, rep: '$1' },
];

// 13/17/18 — em-dash overuse, emojis, curly quotes (character-level, run first).
function normalizeChars(s: string, fired: Set<string>): string {
  let t = s;
  const curly = t.replace(/[“”]/g, '"').replace(/[‘’]/g, "'");
  if (curly !== t) { fired.add('curly-quotes'); t = curly; }
  // Strip emoji/dingbats but keep arrows (→) that users legitimately put in CTAs.
  const noEmoji = t.replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{26FF}\u{2705}\u{274C}\u{2B00}-\u{2BFF}\u{FE0F}]/gu, '').replace(/\s{2,}/g, ' ');
  if (noEmoji !== t) { fired.add('emojis'); t = noEmoji; }
  // Any em/en dash, spaced or not, becomes a comma. Plain ASCII only.
  const noDash = t.replace(/\s*[—–]\s*/g, ', ');
  if (noDash !== t) { fired.add('em-dash'); t = noDash; }
  const noEllipsis = t.replace(/…/g, '...');
  if (noEllipsis !== t) { fired.add('ellipsis'); t = noEllipsis; }
  return t;
}

const CONTRACTIONS: [RegExp, string][] = [
  [/\bit is\b/gi, "it's"], [/\byou will\b/gi, "you'll"], [/\byou are\b/gi, "you're"],
  [/\bdo not\b/gi, "don't"], [/\bcannot\b/gi, "can't"], [/\bwe are\b/gi, "we're"],
  [/\bthat is\b/gi, "that's"], [/\bdoes not\b/gi, "doesn't"], [/\bwe will\b/gi, "we'll"],
  [/\bhere is\b/gi, "here's"], [/\bthey are\b/gi, "they're"], [/\bwho is\b/gi, "who's"],
];

function tidy(s: string): string {
  return s
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+([.,;:!?])/g, '$1')
    .replace(/([.,;:!?]){2,}/g, '$1')
    .replace(/(^|[.!?]\s+)([a-z])/g, (_, p, c) => p + c.toUpperCase())
    .trim();
}
function ucFirst(s: string): string { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }

function humanizeText(input: string, fired: Set<string>): string {
  let t = normalizeChars(input, fired);
  for (const { name, re, rep } of RULES) {
    const before = t;
    t = t.replace(re, rep as string);
    if (t !== before) fired.add(name);
  }
  for (const [re, rep] of CONTRACTIONS) t = t.replace(re, rep);
  // second trope pass (contractions can re-form phrases)
  for (const { name, re, rep } of RULES) {
    const before = t;
    t = t.replace(re, rep as string);
    if (t !== before) fired.add(name);
  }
  return ucFirst(tidy(t));
}

function humanizeBlocks(blocks: DraftBlock[], fired: Set<string>): DraftBlock[] {
  return blocks.map((b) => {
    if (b.text) return { ...b, text: humanizeText(b.text, fired) };
    if (b.items) return { ...b, items: b.items.map((i) => humanizeText(i, fired)) };
    return b;
  });
}

/** Humanize a draft. Deterministic rules always run; Claude adds a rhythm pass when live. */
export async function humanizer(draft: Draft): Promise<Draft> {
  const fired = new Set<string>();
  let blocks = humanizeBlocks(draft.blocks, fired);
  const faq = draft.faq.map((f) => ({ q: f.q, a: humanizeText(f.a, fired) }));

  const llm = getLLM();
  if (llm.liveFor('writer')) {
    try {
      const paras = blocks.map((b, i) => (b.type === 'p' ? `[${i}] ${b.text}` : null)).filter(Boolean).join('\n\n');
      const rewritten = await llm.generate({
        role: 'writer',
        system: 'You are a line editor. Rewrite each numbered paragraph to sound human: vary sentence length hard, keep contractions and active voice, cut any remaining AI-tell phrases and repetition. DO NOT change facts, numbers, tool names, or "[source needed]" tags. PUNCTUATION: plain ASCII only, no em-dashes or en-dashes (use commas or periods), no curly quotes (use straight quotes), no ellipsis character. Return the same [n] markers, one paragraph each.',
        prompt: paras, maxTokens: 3000, temperature: 0.9,
      });
      if (rewritten.trim()) { blocks = applyRewrite(blocks, rewritten); fired.add('claude-rhythm-pass'); }
    } catch { /* keep deterministic version */ }
  }

  // Final ASCII sweep: the Claude rhythm pass can re-introduce em-dashes / curly
  // quotes after the deterministic normalization, so scrub characters once more.
  blocks = blocks.map((b) => (b.text ? { ...b, text: tidy(normalizeChars(b.text, fired)) } : b));

  const text = blocks.map((b) => b.text ?? (b.items ?? []).join(' ')).join(' ');
  return {
    ...draft, blocks, faq,
    wordCount: countWords(text),
    sourceNeededCount: (text.match(/\[source needed\]/gi) ?? []).length,
    appliedRules: [...fired].sort(),
  };
}

function applyRewrite(blocks: DraftBlock[], rewritten: string): DraftBlock[] {
  const map = new Map<number, string>();
  for (const m of rewritten.matchAll(/\[(\d+)\]\s*([\s\S]*?)(?=\n\[\d+\]|$)/g)) map.set(Number(m[1]), m[2].trim());
  return blocks.map((b, i) => (b.type === 'p' && map.has(i) ? { ...b, text: map.get(i)! } : b));
}

// Backward-compatible alias.
export const humanEditor = humanizer;
