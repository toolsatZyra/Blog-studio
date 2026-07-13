'use client';
import type { Research } from '@/lib/types';
import { Badge } from './ui';

export function ResearchTab({ research }: { research?: Research }) {
  if (!research) return <div className="empty">Run research to see topic clusters, questions, and keywords.</div>;
  const q = (src: string) => research.questions.filter((x) => x.source === src);

  return (
    <div>
      <div className="card">
        <h3>Topic clusters</h3>
        {research.clusters.map((c) => (
          <div key={c.label} style={{ marginBottom: 10 }}>
            <div className="small muted" style={{ marginBottom: 4 }}>{c.label}</div>
            <div className="chips">{c.queries.map((qq) => <span key={qq} className="chip">{qq}</span>)}</div>
          </div>
        ))}
      </div>

      <div className="row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <QCard title="Reddit-style questions" mode={research.modes.reddit} items={q('reddit').map((x) => x.text)} />
        <QCard title="X-style discussion angles" mode={research.modes.x} items={q('x').map((x) => x.text)} />
        <QCard title="Google People Also Ask" mode={research.modes.serp} items={q('paa').map((x) => x.text)} />
        <QCard title="Autocomplete" mode={research.modes.serp} items={research.autocomplete} />
      </div>

      <div className="card">
        <h3>Related keywords <Badge mode={research.modes.keywords} /></h3>
        <ul className="qlist">
          {research.relatedKeywords.slice(0, 12).map((k) => (
            <li key={k.keyword}>
              <span>{k.keyword}</span>
              <span className="src">
                {k.volume != null ? `${k.volume.toLocaleString()} vol` : 'vol n/a'} · KD {k.difficulty ?? '–'}
                {k.difficultyBasis === 'ad-competition-approx' ? ' (ad-approx)' : ''}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="card">
        <h3>Competitor article gaps</h3>
        <ul className="qlist">
          {research.competitorGaps.map((g, i) => (
            <li key={i}><span>{g.title}<br /><span className="check-detail">{g.gapNote}</span></span></li>
          ))}
        </ul>
      </div>

      <div className="card">
        <h3>Search intent</h3>
        <span className="chip">{research.intent}</span>
      </div>
    </div>
  );
}

function QCard({ title, items, mode }: { title: string; items: string[]; mode: 'mock' | 'live' }) {
  return (
    <div className="card">
      <h3>{title} <Badge mode={mode} /></h3>
      {items.length ? (
        <ul className="qlist">{items.map((t, i) => <li key={i}><span>{t}</span></li>)}</ul>
      ) : <div className="muted small">None found.</div>}
    </div>
  );
}
