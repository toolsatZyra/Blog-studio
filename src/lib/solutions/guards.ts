// Publish-blocking guards for /solutions pages.
//
// WHY A MODULE: "no money on the page" is the kind of rule that survives in a
// spec and dies in the code. A price in FAQPage JSON-LD is invisible on the page
// but still reaches Google and AI answer engines - that was a real near-miss
// caught while building the template. So the rule is executable, not advisory.

/** Any currency amount. Broader than Zyra's own price on purpose: the user's
 *  decision (2026-07-16) is NO money at all on these pages - not even the
 *  ₹30–80L industry figure that the template docs still permit. */
const MONEY = /₹|\bRs\.?\b|\bINR\b|\blakh?s?\b|\bcrores?\b|\$\s?\d|\bUSD\b|\bAED\b/i;

/** Metric-shaped claims. work-data.ts has no results, so any of these in
 *  generated copy was invented. */
const FABRICATED_METRIC = /\b\d+(\.\d+)?\s?x\b|\b\d+(\.\d+)?\s?%/i;

const PLACEHOLDER = /\[source needed\]|REPLACE-ME|\bTODO\b|lorem ipsum|\{\{[^}]*\}\}/i;

export interface GuardHit {
  rule: 'money' | 'fabricated-metric' | 'placeholder';
  where: string;
  match: string;
}

/**
 * Scan every string a page will publish - copy AND serialized JSON-LD.
 * Returns [] when clean. The publish route refuses on any hit.
 */
export function findGuardHits(fields: Record<string, string>): GuardHit[] {
  const hits: GuardHit[] = [];
  for (const [where, value] of Object.entries(fields)) {
    if (!value) continue;
    const money = value.match(MONEY);
    if (money) hits.push({ rule: 'money', where, match: money[0] });

    const metric = value.match(FABRICATED_METRIC);
    if (metric) hits.push({ rule: 'fabricated-metric', where, match: metric[0] });

    const ph = value.match(PLACEHOLDER);
    if (ph) hits.push({ rule: 'placeholder', where, match: ph[0] });
  }
  return hits;
}

/** Human-readable reasons for the UI / API error. */
export function explainGuardHits(hits: GuardHit[]): string[] {
  return hits.map((h) => {
    if (h.rule === 'money') {
      return `"${h.where}" mentions money ("${h.match}"). These pages carry no price and no industry cost figure — contrast on time instead.`;
    }
    if (h.rule === 'fabricated-metric') {
      return `"${h.where}" states a metric ("${h.match}"). The case-study data has no results, so this was invented.`;
    }
    return `"${h.where}" still contains a placeholder ("${h.match}").`;
  });
}
