'use client';
import type { Draft, Brief, Inputs } from '@/lib/types';
import { parseMarkets } from '@/lib/markets';
import { Badge } from './ui';

export function DraftTab({ draft, brief, inputs }: { draft?: Draft; brief?: Brief; inputs?: Inputs }) {
  if (!draft) return <div className="empty">Choose a topic to generate the blog draft.</div>;
  const markets = inputs ? parseMarkets(inputs.audience.geographies) : [];
  return (
    <div>
      <div className="selected-bar">
        <Badge mode={draft.mode} />
        <span>{draft.wordCount} words</span>
        {markets.length > 0 && (
          <span className="muted">· writing for: {markets.map((m) => m.label).join(', ')}</span>
        )}
        {draft.sourceNeededCount > 0 && <span className="muted">· {draft.sourceNeededCount} [source needed] tag(s) to resolve</span>}
      </div>
      <div className="card article">
        {brief && <h1 style={{ fontSize: 22, marginTop: 0 }}>{brief.recommendedTitle}</h1>}
        {draft.blocks.map((b, i) => <Block key={i} b={b} />)}
        {draft.faq.length > 0 && (
          <>
            <h2>FAQ</h2>
            {draft.faq.map((f, i) => (<div key={i}><h3>{f.q}</h3><p>{f.a}</p></div>))}
          </>
        )}
      </div>
    </div>
  );
}

function Block({ b }: { b: Draft['blocks'][number] }) {
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
