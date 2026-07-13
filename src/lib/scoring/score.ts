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
