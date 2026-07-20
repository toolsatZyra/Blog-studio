import type { CheckResult, ScoreCard, Draft } from '../types';
import { splitSentences } from '../util';

/** Turn a list of checks into a 0-100 scorecard (pass=1, warn=0.5, fail/unknown=0). */
export function buildCard(checks: CheckResult[]): ScoreCard {
  if (!checks.length) return { score: 0, checks };
  const scored = checks.filter((c) => c.status !== 'unknown');
  const pts = scored.reduce((s, c) => s + (c.status === 'pass' ? 1 : c.status === 'warn' ? 0.5 : 0), 0);
  const score = scored.length ? Math.round((pts / scored.length) * 100) : 0;
  return { score, checks };
}

/** Flatten a draft to plain text (body + faq). */
export function draftText(draft: Draft): string {
  const body = draft.blocks
    .map((b) => b.text ?? (b.items ?? []).join('. ') ?? '')
    .join(' ');
  const faq = draft.faq.map((f) => `${f.q} ${f.a}`).join(' ');
  return `${body} ${faq}`.replace(/\s+/g, ' ').trim();
}

export function sentences(draft: Draft): string[] {
  return splitSentences(draftText(draft));
}

export function check(id: string, label: string, status: CheckResult['status'], detail: string): CheckResult {
  return { id, label, status, detail };
}

/** Paragraph texts (p blocks) from a draft. */
export function paragraphs(draft: Draft): string[] {
  return draft.blocks.filter((b) => b.type === 'p' && b.text).map((b) => b.text!);
}

function shingles(text: string, n = 4): Set<string> {
  const words = text.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(Boolean);
  const out = new Set<string>();
  for (let i = 0; i + n <= words.length; i++) out.add(words.slice(i, i + n).join(' '));
  return out;
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (!a.size || !b.size) return 0;
  let inter = 0;
  for (const s of a) if (b.has(s)) inter++;
  return inter / (a.size + b.size - inter);
}

/** Count paragraphs that are near-duplicates of an earlier paragraph (Jaccard ≥ 0.5). */
export function duplicateParagraphCount(draft: Draft): number {
  const ps = paragraphs(draft).filter((p) => p.split(/\s+/).length >= 8);
  const sh = ps.map((p) => shingles(p));
  let dupes = 0;
  for (let i = 0; i < ps.length; i++) {
    for (let j = 0; j < i; j++) {
      if (jaccard(sh[i], sh[j]) >= 0.5) { dupes++; break; }
    }
  }
  return dupes;
}

/** Unique-word ratio over the body text (low = repetitive/thin). */
export function uniqueRatio(draft: Draft): number {
  const words = draftText(draft).toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(Boolean);
  if (!words.length) return 1;
  return new Set(words).size / words.length;
}

const PLACEHOLDER_PATTERNS = [/\[source needed\]/gi, /REPLACE-ME/gi, /\bTODO\b/g, /\blorem ipsum\b/gi, /\{\{[^}]*\}\}/g];

/** Unresolved internal placeholders that must never ship. */
export function findPlaceholders(text: string): string[] {
  const hits: string[] = [];
  for (const re of PLACEHOLDER_PATTERNS) { const m = text.match(re); if (m) hits.push(...m); }
  return [...new Set(hits.map((h) => h.trim()))];
}

/**
 * The same placeholders, each with the words around it.
 *
 * Knowing a [source needed] exists is not actionable; finding it in a 1,400-word
 * draft is the actual work. On a topic like production cost the writer tags a
 * figure it could not verify on nearly every generation, so this is a recurring
 * hunt, not a one-off.
 */
export function findPlaceholderContexts(text: string, window = 70): { placeholder: string; context: string }[] {
  const out: { placeholder: string; context: string }[] = [];
  for (const re of PLACEHOLDER_PATTERNS) {
    for (const m of text.matchAll(new RegExp(re.source, re.flags.includes('g') ? re.flags : `${re.flags}g`))) {
      const at = m.index ?? 0;
      const start = Math.max(0, at - window);
      const end = Math.min(text.length, at + m[0].length + window);
      const context = `${start > 0 ? '...' : ''}${text.slice(start, end).trim()}${end < text.length ? '...' : ''}`;
      out.push({ placeholder: m[0].trim(), context });
    }
  }
  return out;
}
