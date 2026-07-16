'use client';
import type { SolutionPage } from '@/lib/types';
import { proofDisclaimer } from '@/lib/solutions/disclaimer';
import { Badge } from '../ui';

const thumb = (cfStream: string) =>
  `https://customer-rphzzo1xs9tbitpo.cloudflarestream.com/${cfStream}/thumbnails/thumbnail.jpg?time=1s&height=720`;

/**
 * What the published page will say, in the studio's own chrome.
 *
 * This is a content proof, not a pixel preview of Option E - the real layout
 * lives on the site. Its job is to let the operator read every generated string
 * before it becomes a PR.
 */
export function SolutionPreview({ page }: { page: SolutionPage }) {
  return (
    <div className="card article">
      <div className="selected-bar" style={{ marginBottom: 18 }}>
        <Badge mode={page.mode} />
        <code className="slug-chip">/solutions/{page.slug}</code>
      </div>

      <p className="muted small" style={{ letterSpacing: '.12em', textTransform: 'uppercase', margin: 0 }}>
        {page.eyebrow}
      </p>
      <h1 style={{ fontSize: 24, margin: '6px 0 8px' }}>{page.h1}</h1>
      <p style={{ marginTop: 0 }}>{page.subline}</p>
      <p className="muted small">{page.trustLine}</p>

      <div className="answer-card">
        <p className="muted small" style={{ margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '.12em' }}>
          The short answer <span className="muted">· {page.aeoAnswer.split(/\s+/).length} words</span>
        </p>
        <p style={{ margin: 0 }}>{page.aeoAnswer}</p>
      </div>

      <h2>{page.problemHeading}</h2>
      <p className="muted small" style={{ marginTop: -4 }}>
        Ghost numeral <strong>Weeks</strong> · stat <strong>3 Months to Weeks</strong> — fixed chrome
      </p>
      {page.problemBody.map((p, i) => <p key={i}>{p}</p>)}

      <h2>Everything included</h2>
      <ul>
        {page.deliverables.map((d) => (
          <li key={d.num}><strong>{d.title}</strong> — {d.desc}</li>
        ))}
      </ul>

      <h2>Selected work</h2>
      <div className="proof-grid">
        {page.proof.map((p, i) => (
          <figure key={p.workSlug} className={i === 0 ? 'featured' : ''}>
            <img src={thumb(p.cfStream)} alt={`${p.client} — ${p.title}`} loading="lazy" />
            <figcaption>
              {i === 0 && <span className="badge rec">Featured</span>}{' '}
              <strong>{p.client}</strong> — {p.title}
              <br />
              <span className="muted small">{p.category} · {p.year} · /work/{p.workSlug}</span>
            </figcaption>
          </figure>
        ))}
      </div>
      {/* Fixed chrome — the generator cannot remove this. */}
      <p className="muted small disclaimer">{proofDisclaimer(page.industry, page.geography)}</p>

      <h2>How the work runs</h2>
      <ol>
        {page.process.map((s) => (
          <li key={s.num}><strong>{s.title}</strong> — {s.desc}</li>
        ))}
      </ol>

      <h2>FAQ</h2>
      {page.faq.map((f, i) => (
        <div key={i}>
          <h3>{f.q}</h3>
          <p>{f.a}</p>
        </div>
      ))}

      <h2>Let&apos;s make something impossible.</h2>
      <p className="muted small">
        3 CTAs on the published page — hero, sticky bar, final band — all to Calendly.
      </p>
    </div>
  );
}
