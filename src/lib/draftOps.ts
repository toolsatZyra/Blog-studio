// Pure block-level edit operations on a Draft.
//
// Every op returns a NEW Draft and never mutates its input, so React state
// updates stay predictable. Each op marks the draft `edited` — the UI uses that
// to badge the draft and to warn before a regenerate throws the edits away.
//
// These ops deliberately do NOT recompute wordCount/sourceNeededCount or the
// audit/exports. That is rederive()'s job — see ./rederive.ts. Keeping the two
// apart means the ops stay trivially testable and the recount formula lives in
// exactly one place.

import type { Draft, DraftBlock, BlockType } from './types';

/** Block types a human can add from the UI. `table` is intentionally absent: */
/** existing tables stay editable, but authoring one from scratch belongs in a  */
/** real table editor, not a type picker.                                       */
export const ADDABLE_BLOCK_TYPES: BlockType[] = ['p', 'h2', 'h3', 'blockquote', 'ul', 'ol'];

function mark(draft: Draft, blocks?: DraftBlock[], faq?: Draft['faq']): Draft {
  return { ...draft, ...(blocks ? { blocks } : {}), ...(faq ? { faq } : {}), edited: true };
}

function emptyBlock(type: BlockType): DraftBlock {
  if (type === 'ul' || type === 'ol') return { type, items: [''] };
  if (type === 'table') return { type, table: { headers: ['', ''], rows: [['', '']] } };
  return { type, text: '' };
}

/** Replace a block's text (p/h2/h3/blockquote). */
export function updateBlockText(draft: Draft, index: number, text: string): Draft {
  if (!draft.blocks[index]) return draft;
  return mark(draft, draft.blocks.map((b, i) => (i === index ? { ...b, text } : b)));
}

/** Replace a list block's items (ul/ol). Blank lines are dropped on save. */
export function updateBlockItems(draft: Draft, index: number, items: string[]): Draft {
  if (!draft.blocks[index]) return draft;
  const cleaned = items.map((s) => s.trim()).filter(Boolean);
  return mark(draft, draft.blocks.map((b, i) => (i === index ? { ...b, items: cleaned } : b)));
}

/** Replace a single table cell. `row === -1` targets the header row. */
export function updateTableCell(draft: Draft, index: number, row: number, col: number, value: string): Draft {
  const block = draft.blocks[index];
  if (!block?.table) return draft;
  const table = block.table;
  if (row === -1) {
    if (col < 0 || col >= table.headers.length) return draft;
    const headers = table.headers.map((h, c) => (c === col ? value : h));
    return mark(draft, draft.blocks.map((b, i) => (i === index ? { ...b, table: { ...table, headers } } : b)));
  }
  if (!table.rows[row] || col < 0 || col >= table.rows[row].length) return draft;
  const rows = table.rows.map((r, ri) => (ri === row ? r.map((c, ci) => (ci === col ? value : c)) : r));
  return mark(draft, draft.blocks.map((b, i) => (i === index ? { ...b, table: { ...table, rows } } : b)));
}

export function deleteBlock(draft: Draft, index: number): Draft {
  if (!draft.blocks[index]) return draft;
  return mark(draft, draft.blocks.filter((_, i) => i !== index));
}

/** Insert a new empty block after `index`. Pass -1 to prepend. */
export function addBlockAfter(draft: Draft, index: number, type: BlockType): Draft {
  const blocks = [...draft.blocks];
  blocks.splice(index + 1, 0, emptyBlock(type));
  return mark(draft, blocks);
}

/** Move a block one slot up (-1) or down (+1). No-op at the ends. */
export function moveBlock(draft: Draft, index: number, dir: -1 | 1): Draft {
  const target = index + dir;
  if (!draft.blocks[index] || target < 0 || target >= draft.blocks.length) return draft;
  const blocks = [...draft.blocks];
  [blocks[index], blocks[target]] = [blocks[target], blocks[index]];
  return mark(draft, blocks);
}

// ── FAQ ─────────────────────────────────────────────────────────────────────
// The FAQ is not cosmetic: cmsCopy folds it into the published body AND it
// drives the FAQPage JSON-LD that ships to Google.

export function updateFaq(draft: Draft, index: number, patch: Partial<{ q: string; a: string }>): Draft {
  if (!draft.faq[index]) return draft;
  return mark(draft, undefined, draft.faq.map((f, i) => (i === index ? { ...f, ...patch } : f)));
}

export function addFaq(draft: Draft): Draft {
  return mark(draft, undefined, [...draft.faq, { q: '', a: '' }]);
}

export function deleteFaq(draft: Draft, index: number): Draft {
  if (!draft.faq[index]) return draft;
  return mark(draft, undefined, draft.faq.filter((_, i) => i !== index));
}
