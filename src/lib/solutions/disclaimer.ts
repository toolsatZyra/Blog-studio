// The proof disclaimer is fixed chrome: the generator fills industry/geo but may
// never remove or reword this sentence.
//
// Any combination can surface case studies that match neither its industry nor
// its geography - Fintech x Bengaluru can select Cars24 and Swiggy, which are
// neither fintech nor Bengaluru projects. Without this line the page implies
// client relationships and geographies that do not exist. This is structural
// honesty, not a disclaimer for its own sake.

/**
 * Build the non-removable proof disclaimer.
 * At least one of industry/geography is always present (the UI enforces it),
 * but both degenerate cases must still read grammatically.
 */
export function proofDisclaimer(industry: string, geography: string): string {
  const i = industry.trim();
  const g = geography.trim();

  const parts: string[] = [];
  if (i) parts.push(i);
  if (g) parts.push(`${g}-based`);

  const tail = parts.join(' or ');
  const clause = tail
    ? `Not all projects shown are ${tail} - each links to its full case study.`
    : 'Each links to its full case study.';

  return `Selected from Zyra's full body of work. ${clause}`;
}
