// Tolerant JSON extraction for LLM output.
//
// Models are good at JSON and still get it wrong a few percent of the time, in a
// small number of predictable ways. A strict JSON.parse turns each of those into
// a failed generation, so parse defensively and repair what is unambiguous.
//
// Repairs are conservative on purpose: each one fixes a syntax error that has
// exactly one sensible reading. Anything ambiguous is left to fail loudly rather
// than silently changing what the model said.

/** Pull the outermost JSON object out of a response that may be fenced or chatty. */
export function extractJsonObject(raw: string): string {
  let s = raw.trim();
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) s = fence[1].trim();
  const start = s.indexOf('{');
  const end = s.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) {
    throw new Error('No JSON object found in the response.');
  }
  return s.slice(start, end + 1);
}

/** Escape raw newlines/tabs that appear INSIDE string literals (illegal in JSON). */
function escapeControlCharsInStrings(s: string): string {
  let out = '';
  let inString = false;
  let escaped = false;
  for (const ch of s) {
    if (escaped) { out += ch; escaped = false; continue; }
    if (ch === '\\') { out += ch; escaped = true; continue; }
    if (ch === '"') { inString = !inString; out += ch; continue; }
    if (inString && (ch === '\n' || ch === '\r' || ch === '\t')) {
      out += ch === '\t' ? '\\t' : '\\n';
      continue;
    }
    out += ch;
  }
  return out;
}

/**
 * Escape stray double quotes inside string values.
 *
 * The common failure: the model writes  "a": "we made "Service Launch" for X"
 * A quote is a terminator only when the next non-space character is one of
 * , } ] :  — otherwise it is content the model forgot to escape.
 */
function escapeStrayQuotes(s: string): string {
  let out = '';
  let inString = false;
  let escaped = false;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (escaped) { out += ch; escaped = false; continue; }
    if (ch === '\\') { out += ch; escaped = true; continue; }
    if (ch !== '"') { out += ch; continue; }

    if (!inString) { inString = true; out += ch; continue; }

    // We're in a string and hit a quote: terminator, or content?
    const rest = s.slice(i + 1);
    const next = rest.match(/^\s*(.)/);
    if (!next || /[,}\]:]/.test(next[1])) {
      inString = false;
      out += ch;
    } else {
      out += '\\"'; // content the model failed to escape
    }
  }
  return out;
}

/** Drop trailing commas before a closing brace/bracket. */
function dropTrailingCommas(s: string): string {
  return s.replace(/,(\s*[}\]])/g, '$1');
}

/** Insert a missing comma between two adjacent string array elements. */
function insertMissingCommas(s: string): string {
  return s.replace(/"(\s*\n\s*)"/g, '",$1"');
}

export interface ParseResult<T> {
  value: T;
  repaired: string[]; // which repairs were needed; empty when the model got it right
}

/**
 * Parse LLM JSON, repairing only unambiguous syntax errors.
 * Throws with the offending snippet when it cannot be salvaged.
 */
export function parseLooseJson<T>(raw: string): ParseResult<T> {
  const extracted = extractJsonObject(raw);

  try {
    return { value: JSON.parse(extracted) as T, repaired: [] };
  } catch { /* fall through to repairs */ }

  // ORDER MATTERS. missing-commas must run before stray-quotes: given
  //     "para one."
  //     "para two."
  // stray-quotes would see a quote followed by another quote, read it as
  // content, and escape the very thing missing-commas is about to fix.
  // Insert the comma first, and stray-quotes then sees a clean terminator.
  const repairs: { name: string; fn: (s: string) => string }[] = [
    { name: 'control-chars-in-strings', fn: escapeControlCharsInStrings },
    { name: 'missing-commas', fn: insertMissingCommas },
    { name: 'trailing-commas', fn: dropTrailingCommas },
    { name: 'stray-quotes', fn: escapeStrayQuotes },
  ];

  let s = extracted;
  const applied: string[] = [];
  for (const { name, fn } of repairs) {
    const next = fn(s);
    if (next !== s) {
      s = next;
      applied.push(name);
      try {
        return { value: JSON.parse(s) as T, repaired: applied };
      } catch { /* keep repairing */ }
    }
  }

  // Give the caller something actionable rather than "Unexpected token".
  try {
    JSON.parse(s);
  } catch (e) {
    const m = (e as Error).message.match(/position (\d+)/);
    const pos = m ? Number(m[1]) : 0;
    const snippet = s.slice(Math.max(0, pos - 90), pos + 90).replace(/\n/g, '\\n');
    throw new Error(`${(e as Error).message} — near: ...${snippet}...`);
  }
  throw new Error('Unreachable');
}
