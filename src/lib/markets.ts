// Market-aware writing: currency, spelling, and examples per target geography.
// Used to guide the writer and to flag currency mismatches in the audit.

export interface Market {
  key: 'India' | 'GCC' | 'US';
  label: string;
  currency: string; // human description, e.g. "₹ (INR)"
  spelling: string; // e.g. "Indian/British English"
  examples: string; // reference brands/platforms/moments
  // lowercase markers that indicate this market's currency in text:
  currencyMarkers: string[];
}

export const MARKETS: Record<Market['key'], Market> = {
  India: {
    key: 'India', label: 'India', currency: '₹ (INR; lakh/crore)',
    spelling: 'Indian/British English (colour, organise)',
    examples: 'D2C/FMCG brands, Swiggy, Cars24, JioCinema/MX, festive/IPL moments',
    currencyMarkers: ['₹', 'inr', 'rupee', 'lakh', 'crore'],
  },
  GCC: {
    key: 'GCC', label: 'GCC (Gulf)', currency: 'AED / SAR (dirham / riyal)',
    spelling: 'British English',
    examples: 'Gulf brands and platforms (Careem, Noon, Talabat), Ramadan/Eid moments, UAE/KSA context',
    currencyMarkers: ['aed', 'sar', 'dirham', 'riyal'],
  },
  US: {
    key: 'US', label: 'US', currency: '$ (USD)',
    spelling: 'American English (color, organize)',
    examples: 'US D2C brands, streaming (Netflix/YouTube), Super Bowl / seasonal retail moments',
    currencyMarkers: ['usd'], // '$' is global/also a Zyra proof point — not flagged
  },
};

const MATCHERS: [RegExp, Market['key']][] = [
  [/\b(india|indian|bharat)\b/i, 'India'],
  [/\b(gcc|gulf|uae|dubai|abu dhabi|saudi|ksa|riyadh|qatar|middle east|mena)\b/i, 'GCC'],
  [/\b(us|usa|u\.s\.|united states|america|american)\b/i, 'US'],
];

export interface ParsedGeographies {
  /** Markets we carry currency/spelling rules for (first = primary). */
  markets: Market[];
  /** Anything typed that we have no rules for, e.g. "Japan", "Bengaluru". */
  unknown: string[];
}

/**
 * Split the free geographies string into markets we know and the ones we don't.
 * Geography is free text, so most values land in `unknown` - that is expected,
 * not an error. Callers use it to soften currency guidance rather than guess.
 */
export function parseGeographies(geographies: string): ParsedGeographies {
  const markets: Market[] = [];
  const unknown: string[] = [];
  const seen = new Set<string>();
  for (const token of geographies.split(',').map((s) => s.trim()).filter(Boolean)) {
    // A single token can name more than one market ("India and the US"), so
    // check every matcher rather than stopping at the first hit.
    let matched = false;
    for (const [re, key] of MATCHERS) {
      if (!re.test(token)) continue;
      matched = true;
      if (!seen.has(key)) { seen.add(key); markets.push(MARKETS[key]); }
    }
    if (!matched && !unknown.includes(token)) unknown.push(token);
  }
  return { markets, unknown };
}

/** Parse the free geographies string into recognised markets (first = primary). */
export function parseMarkets(geographies: string): Market[] {
  return parseGeographies(geographies).markets;
}

export interface MarketGuidance {
  markets: Market[];
  primary: Market | null;
  /** Typed markets we carry no rules for; named to the writer verbatim. */
  unknown: string[];
  promptBlock: string;
}

/** Instruction for a market we have no currency/spelling table for. */
function unknownLine(unknown: string[]): string {
  return `- ${unknown.join(', ')}: use that market's own local currency and spelling conventions; do not default to another market's currency.`;
}

const NEVER_INVENT = 'Never invent prices or figures; if a number needs a source, write "[source needed]".';

/** Build writer guidance for the selected markets. */
export function marketGuidance(geographies: string): MarketGuidance {
  const { markets, unknown } = parseGeographies(geographies);
  const primary = markets[0] ?? null;

  if (!markets.length) {
    // Nothing recognised. If the user typed something, name it for the writer
    // instead of throwing it away; only a blank field is "unspecified".
    const promptBlock = unknown.length
      ? [
          `Target market(s): ${unknown.join(', ')}.`,
          unknownLine(unknown),
          NEVER_INVENT,
        ].join('\n')
      : 'Target market: unspecified — keep currency and spelling neutral; never invent figures.';
    return { markets, primary, unknown, promptBlock };
  }

  const lines = markets.map(
    (m) => `- ${m.label}: currency ${m.currency}; ${m.spelling}; examples — ${m.examples}.`,
  );
  if (unknown.length) lines.push(unknownLine(unknown));
  const allLabels = [...markets.map((m) => m.label), ...unknown];
  const multi = allLabels.length > 1;
  return {
    markets, primary, unknown,
    promptBlock: [
      `Target market(s): ${allLabels.join(', ')}. Primary: ${primary!.label}.`,
      ...lines,
      `Lead with the primary market's currency and spelling (${primary!.currency}, ${primary!.spelling}).`,
      multi
        ? 'When you reference another selected market, use ITS own currency — never present one currency\'s number as another, and never convert without saying so.'
        : 'Do not use another market\'s currency.',
      NEVER_INVENT,
    ].join('\n'),
  };
}

/**
 * Currency markers in the text that belong to a market NOT in the selected set.
 *
 * Returns nothing when the target includes a market we have no rules for: we
 * cannot know which currency is correct for "Japan", so every marker would look
 * wrong and the check would be noise instead of a signal.
 */
export function currencyMismatch(text: string, markets: Market[], hasUnknownMarket = false): string[] {
  if (hasUnknownMarket) return [];
  const selected = new Set(markets.map((m) => m.key));
  const lower = text.toLowerCase();
  const bad: string[] = [];
  for (const key of Object.keys(MARKETS) as Market['key'][]) {
    if (selected.has(key)) continue;
    for (const marker of MARKETS[key].currencyMarkers) {
      if (marker === '₹' ? text.includes('₹') : lower.includes(marker)) {
        bad.push(`${marker} (${key})`);
      }
    }
  }
  return [...new Set(bad)];
}
