'use client';
import type { Brief } from '@/lib/types';

export function BriefTab({ brief }: { brief?: Brief }) {
  if (!brief) return <div className="empty">Choose a topic in Recommended Topics to generate the brief.</div>;
  return (
    <div>
      <div className="card">
        <h3>Titles & meta</h3>
        <Field k="Recommended title" v={brief.recommendedTitle} />
        <Field k="Alternatives" v={brief.alternativeTitles.join('  ·  ')} />
        <Field k={`Meta title (${brief.metaTitle.length})`} v={brief.metaTitle} />
        <Field k={`Meta description (${brief.metaDescription.length})`} v={brief.metaDescription} />
        <Field k="URL slug" v={brief.slug} />
      </div>

      <div className="card">
        <h3>Targeting</h3>
        <Field k="Primary keyword" v={brief.primaryKeyword} />
        <Field k="Secondary keywords" v={brief.secondaryKeywords.join(', ')} />
        <Field k="Search intent" v={brief.intent} />
        <Field k="Target reader" v={brief.targetReader} />
        <Field k="Angle" v={brief.angle} />
      </div>

      <div className="card">
        <h3>Outline (question-led H2s)</h3>
        {brief.outline.map((s, i) => (
          <div key={i} style={{ marginBottom: 10 }}>
            <div style={{ fontWeight: 600 }}>{s.heading} <span className="muted small">· ~{s.targetWords}w</span></div>
            <div className="check-detail">{s.answerBlock}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <h3>Featured-snippet answer</h3>
        <p className="small">{brief.featuredSnippetAnswer}</p>
        <h3 style={{ marginTop: 12 }}>GEO/AEO answer blocks</h3>
        <ul className="qlist">{brief.geoAnswerBlocks.map((b, i) => <li key={i}><span className="small">{b}</span></li>)}</ul>
      </div>

      <div className="row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div className="card">
          <h3>Internal links</h3>
          <ul className="qlist">{brief.internalLinks.map((l, i) => <li key={i}><span>{l.anchor}</span><span className="src">{l.href}</span></li>)}</ul>
        </div>
        <div className="card">
          <h3>External source suggestions</h3>
          <ul className="qlist">{brief.externalSourceSuggestions.map((s, i) => <li key={i}><span className="small">{s}</span></li>)}</ul>
        </div>
      </div>

      <div className="card">
        <h3>FAQ</h3>
        {brief.faq.map((f, i) => (
          <div key={i} style={{ marginBottom: 8 }}>
            <div style={{ fontWeight: 600 }}>{f.q}</div>
            <div className="check-detail">{f.a}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Field({ k, v }: { k: string; v: string }) {
  return <div style={{ marginBottom: 6 }}><span className="muted small">{k}: </span><span className="small">{v}</span></div>;
}
