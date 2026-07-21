'use client';
import { useState } from 'react';
import type { Audit, ScoreCard } from '@/lib/types';
import { ScoreCardView } from './ui';

export function ChecklistTab({ audit }: { audit?: Audit }) {
  const [preflight, setPreflight] = useState<ScoreCard | undefined>(audit?.preflight);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  if (!audit) return <div className="empty">Generate a draft to run the SEO / GEO / AEO audit.</div>;

  async function runPreflight() {
    setLoading(true); setErr('');
    try {
      const res = await fetch('/api/preflight', { method: 'POST' });
      const data = await res.json();
      if (data.error) setErr(data.error); else setPreflight(data.preflight);
    } catch (e) { setErr((e as Error).message); }
    setLoading(false);
  }

  return (
    <div>
      <div className="card" style={{ borderColor: audit.publishable ? 'var(--green)' : 'var(--red)' }}>
        <h3 style={{ margin: 0 }}>
          {audit.publishable
            ? '✅ Publish-ready — no critical issues'
            : '⛔ Not publish-ready'}
        </h3>
        {!audit.publishable && (
          <ul style={{ margin: '8px 0 0', paddingLeft: 18 }} className="small">
            {audit.blockers.map((b, i) => <li key={i}>{b}</li>)}
          </ul>
        )}
      </div>
      <ScoreCardView title="SEO score" card={audit.seo} />
      <ScoreCardView title="GEO / AEO score" card={audit.geo} />
      <ScoreCardView title="Human-voice gate" card={audit.humanVoice} />

      <div className="card">
        <div className="export-head">
          <h3 style={{ margin: 0 }}>Publishing preflight (thezyra.studio)</h3>
          <button className="btn secondary small" onClick={runPreflight} disabled={loading}>
            {loading ? <><span className="spinner" /> Checking…</> : 'Run site check'}
          </button>
        </div>
        {err && <div className="error">{err}</div>}
        {preflight ? <ScoreCardView title="Site readiness" card={preflight} />
          : <p className="muted small">Checks robots.txt, sitemap, AI-crawler access, and schema on the live site.</p>}
      </div>
    </div>
  );
}
