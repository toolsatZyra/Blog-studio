'use client';
import type { ScoreCard, SourceMode } from '@/lib/types';

export function Badge({ mode }: { mode: SourceMode }) {
  return <span className={`badge ${mode}`}>{mode}</span>;
}

export function Bar({ value }: { value: number }) {
  return <div className="bar"><span style={{ width: `${Math.max(0, Math.min(100, value))}%` }} /></div>;
}

export function ScoreCardView({ title, card }: { title: string; card: ScoreCard }) {
  return (
    <div className="card">
      <div className="scorehead">
        <div>
          <div className="big" style={{ color: color(card.score) }}>{card.score}</div>
          <div className="lbl">{title}</div>
        </div>
        <div style={{ flex: 1 }}><Bar value={card.score} /></div>
      </div>
      <ul className="checks">
        {card.checks.map((c) => (
          <li key={c.id}>
            <span className={`status ${c.status}`}>{c.status}</span>
            <span>
              <span className="check-label">{c.label}</span>
              <br />
              <span className="check-detail">{c.detail}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function color(score: number): string {
  if (score >= 75) return 'var(--green)';
  if (score >= 50) return 'var(--amber)';
  return 'var(--red)';
}

export function CopyBlock({ label, content }: { label: string; content: string }) {
  return (
    <div className="card">
      <div className="export-head">
        <h3 style={{ margin: 0 }}>{label}</h3>
        <button className="btn secondary small" onClick={() => navigator.clipboard?.writeText(content)}>Copy</button>
      </div>
      <pre className="export">{content}</pre>
    </div>
  );
}
