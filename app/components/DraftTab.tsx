'use client';
import { useState } from 'react';
import type { Draft, Brief, Inputs, Audit, DraftBlock, BlockType } from '@/lib/types';
import { parseMarkets } from '@/lib/markets';
import {
  ADDABLE_BLOCK_TYPES,
  updateBlockText, updateBlockItems, updateTableCell, deleteBlock,
  addBlockAfter, moveBlock, updateFaq, addFaq, deleteFaq,
} from '@/lib/draftOps';
import { Badge } from './ui';

const TYPE_LABELS: Record<BlockType, string> = {
  p: 'Paragraph', h2: 'Heading 2', h3: 'Heading 3',
  blockquote: 'Quote', ul: 'Bullet list', ol: 'Numbered list', table: 'Table',
};

interface Props {
  draft?: Draft;
  brief?: Brief;
  inputs?: Inputs;
  audit?: Audit;
  /** Applies an edited draft and re-derives audit + exports. Read-only when omitted. */
  onDraftChange?: (next: Draft) => void;
  /** Restores the originally generated draft. */
  onRevert?: () => void;
}

export function DraftTab({ draft, brief, inputs, audit, onDraftChange, onRevert }: Props) {
  if (!draft) return <div className="empty">Choose a topic to generate the blog draft.</div>;
  const markets = inputs ? parseMarkets(inputs.audience.geographies) : [];
  const editable = !!onDraftChange;
  const apply = (next: Draft) => onDraftChange?.(next);

  return (
    <div>
      {draft.warnings?.map((w, i) => <div key={i} className="error">{w}</div>)}

      <div className="selected-bar">
        <Badge mode={draft.mode} />
        {draft.edited && <span className="badge rec">Edited</span>}
        <span>{draft.wordCount} words</span>
        {markets.length > 0 && (
          <span className="muted">· writing for: {markets.map((m) => m.label).join(', ')}</span>
        )}
        {draft.sourceNeededCount > 0 && (
          <span className="muted">· {draft.sourceNeededCount} [source needed] tag(s) to resolve</span>
        )}
        {draft.edited && onRevert && (
          <button
            className="btn secondary small"
            style={{ marginLeft: 'auto' }}
            onClick={() => { if (confirm('Discard your edits and restore the generated draft?')) onRevert(); }}
          >
            Revert to generated
          </button>
        )}
      </div>

      {/* The auditor scans the FAQ as well as the blocks, so it can block publish
          for a placeholder the block-only counter above doesn't show. Surface the
          real blockers here rather than leaving them a tab away. */}
      {audit && !audit.publishable && (
        <div className="error">
          <strong>Publishing is blocked until these are fixed:</strong>
          <ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>
            {audit.blockers.map((b, i) => <li key={i}>{b}</li>)}
          </ul>
        </div>
      )}

      {editable && (
        <p className="muted small" style={{ marginTop: 0 }}>
          Click any block to edit it. Changes update the word count, the SEO/GEO score, and
          everything you publish.
        </p>
      )}

      <div className="card article">
        {brief && <h1 style={{ fontSize: 22, marginTop: 0 }}>{brief.recommendedTitle}</h1>}

        {editable && <AddBlock onAdd={(t) => apply(addBlockAfter(draft, -1, t))} />}

        {draft.blocks.map((b, i) => (
          <div key={i}>
            {editable ? (
              <EditableBlock
                block={b}
                isFirst={i === 0}
                isLast={i === draft.blocks.length - 1}
                onText={(text) => apply(updateBlockText(draft, i, text))}
                onItems={(items) => apply(updateBlockItems(draft, i, items))}
                onCell={(row, col, v) => apply(updateTableCell(draft, i, row, col, v))}
                onDelete={() => apply(deleteBlock(draft, i))}
                onMove={(dir) => apply(moveBlock(draft, i, dir))}
              />
            ) : (
              <Block b={b} />
            )}
            {editable && <AddBlock onAdd={(t) => apply(addBlockAfter(draft, i, t))} />}
          </div>
        ))}

        {(draft.faq.length > 0 || editable) && <h2>FAQ</h2>}
        {editable && (
          <p className="muted small" style={{ marginTop: -4 }}>
            The FAQ publishes into the post body <em>and</em> becomes the FAQPage schema Google reads.
          </p>
        )}
        {draft.faq.map((f, i) => (
          editable ? (
            <div key={i} className="block-edit">
              <div className="block-tools">
                <span className="muted small">FAQ {i + 1}</span>
                <button className="iconbtn" title="Delete this Q&A" onClick={() => apply(deleteFaq(draft, i))}>✕</button>
              </div>
              <AutoTextarea
                className="edit-field edit-h3"
                value={f.q}
                placeholder="Question"
                onCommit={(v) => apply(updateFaq(draft, i, { q: v }))}
              />
              <AutoTextarea
                className="edit-field"
                value={f.a}
                placeholder="Answer"
                onCommit={(v) => apply(updateFaq(draft, i, { a: v }))}
              />
            </div>
          ) : (
            <div key={i}><h3>{f.q}</h3><p>{f.a}</p></div>
          )
        ))}
        {editable && (
          <button className="btn secondary small" onClick={() => apply(addFaq(draft))}>+ Add Q&amp;A</button>
        )}
      </div>
    </div>
  );
}

function EditableBlock({
  block, isFirst, isLast, onText, onItems, onCell, onDelete, onMove,
}: {
  block: DraftBlock; isFirst: boolean; isLast: boolean;
  onText: (t: string) => void; onItems: (i: string[]) => void;
  onCell: (row: number, col: number, v: string) => void;
  onDelete: () => void; onMove: (dir: -1 | 1) => void;
}) {
  return (
    <div className="block-edit">
      <div className="block-tools">
        <span className="muted small">{TYPE_LABELS[block.type]}</span>
        <button className="iconbtn" title="Move up" disabled={isFirst} onClick={() => onMove(-1)}>↑</button>
        <button className="iconbtn" title="Move down" disabled={isLast} onClick={() => onMove(1)}>↓</button>
        <button className="iconbtn" title="Delete this block" onClick={onDelete}>✕</button>
      </div>
      <BlockField block={block} onText={onText} onItems={onItems} onCell={onCell} />
    </div>
  );
}

function BlockField({
  block, onText, onItems, onCell,
}: {
  block: DraftBlock;
  onText: (t: string) => void; onItems: (i: string[]) => void;
  onCell: (row: number, col: number, v: string) => void;
}) {
  if (block.type === 'ul' || block.type === 'ol') {
    return (
      <AutoTextarea
        className="edit-field edit-list"
        value={(block.items ?? []).join('\n')}
        placeholder="One item per line"
        onCommit={(v) => onItems(v.split('\n'))}
      />
    );
  }
  if (block.type === 'table') {
    if (!block.table) return null;
    const t = block.table;
    return (
      <table>
        <thead>
          <tr>
            {t.headers.map((h, c) => (
              <th key={c}>
                <input className="edit-cell" defaultValue={h} onBlur={(e) => onCell(-1, c, e.target.value)} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {t.rows.map((r, ri) => (
            <tr key={ri}>
              {r.map((cell, ci) => (
                <td key={ci}>
                  <input className="edit-cell" defaultValue={cell} onBlur={(e) => onCell(ri, ci, e.target.value)} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    );
  }
  const cls =
    block.type === 'h2' ? 'edit-field edit-h2'
      : block.type === 'h3' ? 'edit-field edit-h3'
        : block.type === 'blockquote' ? 'edit-field edit-quote'
          : 'edit-field';
  return (
    <AutoTextarea
      className={cls}
      value={block.text ?? ''}
      placeholder={`Empty ${TYPE_LABELS[block.type].toLowerCase()} — write here, or ✕ to remove`}
      onCommit={onText}
    />
  );
}

/**
 * Auto-growing textarea that commits on blur.
 *
 * Typing stays in local state and is pushed up on blur, so the SEO/GEO score
 * doesn't recompute (and jitter) on every keystroke. The `seen` check resyncs
 * the field when the draft changes underneath it — revert, move, or delete.
 */
function AutoTextarea({
  value, onCommit, className, placeholder,
}: { value: string; onCommit: (v: string) => void; className?: string; placeholder?: string }) {
  const [local, setLocal] = useState(value);
  const [seen, setSeen] = useState(value);
  if (seen !== value) { setSeen(value); setLocal(value); }

  const grow = (el: HTMLTextAreaElement) => {
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  };

  return (
    <textarea
      className={className}
      value={local}
      placeholder={placeholder}
      rows={1}
      ref={(el) => { if (el) grow(el); }}
      onChange={(e) => { setLocal(e.target.value); grow(e.target); }}
      onBlur={() => { if (local !== value) onCommit(local); }}
    />
  );
}

function AddBlock({ onAdd }: { onAdd: (t: BlockType) => void }) {
  const [open, setOpen] = useState(false);
  if (!open) {
    return (
      <div className="addblock">
        <button className="addblock-line" title="Add a block here" onClick={() => setOpen(true)}>+</button>
      </div>
    );
  }
  return (
    <div className="addblock open">
      {ADDABLE_BLOCK_TYPES.map((t) => (
        <button key={t} className="btn secondary small" onClick={() => { onAdd(t); setOpen(false); }}>
          {TYPE_LABELS[t]}
        </button>
      ))}
      <button className="btn secondary small" onClick={() => setOpen(false)}>Cancel</button>
    </div>
  );
}

function Block({ b }: { b: DraftBlock }) {
  switch (b.type) {
    case 'h2': return <h2>{b.text}</h2>;
    case 'h3': return <h3>{b.text}</h3>;
    case 'blockquote': return <blockquote>{b.text}</blockquote>;
    case 'ul': return <ul>{(b.items ?? []).map((i, n) => <li key={n}>{i}</li>)}</ul>;
    case 'ol': return <ol>{(b.items ?? []).map((i, n) => <li key={n}>{i}</li>)}</ol>;
    case 'table':
      return b.table ? (
        <table>
          <thead><tr>{b.table.headers.map((h, n) => <th key={n}>{h}</th>)}</tr></thead>
          <tbody>{b.table.rows.map((r, n) => <tr key={n}>{r.map((c, m) => <td key={m}>{c}</td>)}</tr>)}</tbody>
        </table>
      ) : null;
    default: return <p>{b.text}</p>;
  }
}
