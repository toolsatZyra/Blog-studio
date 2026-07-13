import type { Draft, DraftBlock } from '../types';
import { getLLM } from '../providers';
import { PHRASE_REPLACEMENTS } from '../scoring/bannedPhrases';
import { countWords } from '../util';

const CONTRACTIONS: [RegExp, string][] = [
  [/\bit is\b/g, "it's"], [/\byou will\b/g, "you'll"], [/\byou are\b/g, "you're"],
  [/\bdo not\b/g, "don't"], [/\bcannot\b/g, "can't"], [/\bwe are\b/g, "we're"],
  [/\bthat is\b/g, "that's"], [/\bdoes not\b/g, "doesn't"], [/\bwe will\b/g, "we'll"],
  [/\bhere is\b/g, "here's"],
];

function humanizeText(input: string): string {
  let t = input;
  for (const [re, rep] of PHRASE_REPLACEMENTS) t = t.replace(re, rep);
  for (const [re, rep] of CONTRACTIONS) t = t.replace(re, rep);
  // Second pass: contractions can re-create a banned phrase ("it is worth
  // noting" → "it's worth noting"), so strip again after contracting.
  for (const [re, rep] of PHRASE_REPLACEMENTS) t = t.replace(re, rep);
  t = t.replace(/\s{2,}/g, ' ').replace(/\s+([.,;:!?])/g, '$1').trim();
  // Capitalise the first letter after cleanup (in case a leading connective was stripped).
  return t.charAt(0).toUpperCase() + t.slice(1);
}

function humanizeBlocks(blocks: DraftBlock[]): DraftBlock[] {
  return blocks.map((b) => {
    if (b.text) return { ...b, text: humanizeText(b.text) };
    if (b.items) return { ...b, items: b.items.map(humanizeText) };
    return b;
  });
}

/**
 * Separate humanising pass. Deterministic cleanup always runs (banned-phrase
 * removal, contractions); when the writer LLM is live it also does a rhythm pass.
 * Never changes facts or removes [source needed] tags.
 */
export async function humanEditor(draft: Draft): Promise<Draft> {
  let blocks = humanizeBlocks(draft.blocks);
  let faq = draft.faq.map((f) => ({ q: f.q, a: humanizeText(f.a) }));

  const llm = getLLM();
  if (llm.liveFor('writer')) {
    try {
      const paragraphs = blocks
        .map((b, i) => (b.type === 'p' ? `[${i}] ${b.text}` : null))
        .filter(Boolean)
        .join('\n\n');
      const rewritten = await llm.generate({
        role: 'writer',
        system: 'You are a line editor. Rewrite each numbered paragraph to sound more human: vary sentence length hard, keep contractions and active voice, cut any remaining AI-tell phrases. DO NOT change facts, numbers, or "[source needed]" tags. Return the same [n] markers, one paragraph each.',
        prompt: paragraphs,
        maxTokens: 3000, temperature: 0.9,
      });
      if (rewritten.trim()) blocks = applyRewrite(blocks, rewritten);
    } catch { /* keep deterministic version */ }
  }

  const text = blocks.map((b) => b.text ?? (b.items ?? []).join(' ')).join(' ');
  return {
    ...draft,
    blocks,
    faq,
    wordCount: countWords(text),
    sourceNeededCount: (text.match(/\[source needed\]/gi) ?? []).length,
  };
}

function applyRewrite(blocks: DraftBlock[], rewritten: string): DraftBlock[] {
  const map = new Map<number, string>();
  for (const m of rewritten.matchAll(/\[(\d+)\]\s*([\s\S]*?)(?=\n\[\d+\]|$)/g)) {
    map.set(Number(m[1]), m[2].trim());
  }
  return blocks.map((b, i) => (b.type === 'p' && map.has(i) ? { ...b, text: map.get(i)! } : b));
}
