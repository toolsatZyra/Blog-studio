'use client';
import type { TopicCandidate } from '@/lib/types';

export function RecommendedTopicsTab({
  candidates, selected, onSelect, loading,
}: {
  candidates?: TopicCandidate[];
  selected?: TopicCandidate;
  onSelect: (c: TopicCandidate) => void;
  loading: boolean;
}) {
  if (!candidates?.length) return <div className="empty">Run research to get recommended blog topics with justifications.</div>;

  return (
    <div>
      <p className="muted small">Ranked by fit for thezyra.studio. Pick one to write the blog (Part 2).</p>
      {candidates.map((c, i) => (
        <div key={i} className={`topic-card ${c.recommended ? 'rec' : ''}`}>
          <div className="topic-head">
            <div className="title">
              {c.topic} {c.recommended && <span className="badge rec">Recommended</span>}
            </div>
            <div className="score-num">{c.score}</div>
          </div>
          {c.angle && <div className="topic-angle muted small">{c.angle}</div>}
          <div className="subscores">
            <span className="subscore">Audience <b>{c.breakdown.audienceRelevance}</b></span>
            <span className="subscore">Demand <b>{c.breakdown.searchQuestionDemand}</b></span>
            <span className="subscore">Authority <b>{c.breakdown.zyraAuthorityFit}</b></span>
            <span className="subscore">Commercial <b>{c.breakdown.commercialIntent}</b></span>
            <span className="subscore">Gap <b>{c.breakdown.competitionGap}</b></span>
          </div>
          <div className="justification">{c.justification}</div>
          <button
            className={`btn small ${selected?.topic === c.topic ? '' : 'secondary'}`}
            disabled={loading}
            onClick={() => onSelect(c)}
          >
            {selected?.topic === c.topic ? 'Selected — writing…' : 'Choose this topic → write the blog'}
          </button>
        </div>
      ))}
    </div>
  );
}
