import { test } from 'node:test';
import assert from 'node:assert/strict';

import { ZYRA_PROOF_POINTS } from '../src/lib/zyraContext.ts';
import { SERVICE_CATALOG } from '../src/lib/solutionsData.ts';

// The writer may state these as fact, so they must match what the site says.
// solutionsData.ts is generated from the site, making it the local source of truth.
// "2000+" on the site and "2,000+" in prose are the same number.
const norm = (s: string) => s.toLowerCase().replace(/,/g, '');

test('every service stat on the site appears in the proof points', () => {
  for (const svc of SERVICE_CATALOG) {
    for (const stat of svc.stats) {
      const found = ZYRA_PROOF_POINTS.some((p) => norm(p).includes(norm(stat.value)));
      assert.ok(found, `site stat missing from proof points: ${stat.value} ${stat.label} (${svc.slug})`);
    }
  }
});

// The old list carried BOTH "50M+ views" (a stale /work page line) and
// "60M+ social views" (the current service page). The writer could state either,
// so two posts published two different view counts.
test('no superseded 50M view count survives', () => {
  const joined = ZYRA_PROOF_POINTS.join(' ').toLowerCase();
  assert.ok(!/\b50m\b|\b50 million\b/.test(joined), 'the stale 50M figure must be gone');
  assert.ok(/60m/.test(joined), '60M+ is the current figure');
});

// A bare "60M+ views" reads as studio-wide. It is social content alone, and the
// same list also holds micro drama's separate 10M+.
test('every view count says what it covers', () => {
  for (const p of ZYRA_PROOF_POINTS.filter((x) => /views/i.test(x))) {
    assert.ok(p.length > 'NNM+ views'.length + 6, `view stat needs its scope: "${p}"`);
  }
});

test('no two proof points state the same metric at different values', () => {
  const views = ZYRA_PROOF_POINTS.filter((p) => /views/i.test(p));
  const numbers = views.map((p) => p.match(/\d+M/i)?.[0]?.toUpperCase());
  assert.equal(new Set(numbers).size, numbers.length, `duplicate view figures: ${views.join(' | ')}`);
});
