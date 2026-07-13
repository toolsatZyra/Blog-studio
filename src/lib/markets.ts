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

/** Parse the free geographies string into recognised markets (first = primary). */
export function parseMarkets(geographies: string): Market[] {
  const out: Market[] = [];
  const seen = new Set<string>();
  for (const token of geographies.split(',').map((s) => s.trim()).filter(Boolean)) {
    for (const [re, key] of MATCHERS) {
      if (re.test(token) && !seen.has(key)) { seen.add(key); out.push(MARKETS[key]); }
    }
  }
  return out;
}

export interface MarketGuidance {
  markets: Market[];
  primary: Market | null;
  promptBlock: string;
}

/** Build writer guidance for the selected markets. */
export function marketGuidance(geographies: string): MarketGuidance {
  const markets = parseMarkets(geographies);
  const primary = markets[0] ?? null;
  if (!markets.length) {
    return { markets, primary, promptBlock: 'Target market: unspecified — keep currency and spelling neutral; never invent figures.' };
  }
  const lines = markets.map(
    (m) => `- ${m.label}: currency ${m.currency}; ${m.spelling}; examples — ${m.examples}.`,
  );
  const multi = markets.length > 1;
  return {
    markets, primary,
    promptBlock: [
      `Target market(s): ${markets.map((m) => m.label).join(', ')}. Primary: ${primary!.label}.`,
      ...lines,
      `Lead with the primary market's currency and spelling (${primary!.currency}, ${primary!.spelling}).`,
      multi
        ? 'When you reference another selected market, use ITS own currency — never present one currency\'s number as another, and never convert without saying so.'
        : 'Do not use another market\'s currency.',
      'Never invent prices or figures; if a number needs a source, write "[source needed]".',
    ].join('\n'),
  };
}

/** Currency markers in the text that belong to a market NOT in the selected set. */
export function currencyMismatch(text: string, markets: Market[]): string[] {
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
