'use client';
import { useState } from 'react';
import type { Exports, Brief, Inputs, HeroImage, Audit, Draft } from '@/lib/types';
import { CopyBlock } from './ui';
import { buildReviewDocx, DOCX_MIME } from '@/lib/export/docx';
import { applyHeroSignature } from '@/lib/export/applyHeroSignature';

function download(name: string, content: string, type = 'text/plain') {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = name; a.click();
  URL.revokeObjectURL(url);
}

export function ExportTab({ exports, brief, inputs, audit, draft }: { exports?: Exports; brief?: Brief; inputs?: Inputs; audit?: Audit; draft?: Draft }) {
  const [hero, setHero] = useState<HeroImage>();
  const [imgLoading, setImgLoading] = useState(false);
  const [imgErr, setImgErr] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [prUrl, setPrUrl] = useState('');
  const [pubErr, setPubErr] = useState('');
  const [copied, setCopied] = useState(false);
  const [docxBusy, setDocxBusy] = useState(false);

  // Markdown, not HTML: it pastes into Slack, email, Docs and Notion as readable
  // prose, where raw tags would arrive as noise.
  async function copyForReview() {
    if (!exports) return;
    await navigator.clipboard.writeText(exports.markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  // The docx library is the only non-framework dependency here, so it is
  // imported inside buildReviewDocx and fetched on click rather than shipped in
  // the main bundle.
  async function downloadDocx() {
    if (!draft || !exports) return;
    setDocxBusy(true);
    try {
      const bytes = await buildReviewDocx(draft, brief?.recommendedTitle ?? draft.title);
      const url = URL.createObjectURL(new Blob([bytes], { type: DOCX_MIME }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `${exports.blogPost.slug}.docx`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setDocxBusy(false);
    }
  }

  if (!exports) return <div className="empty">Generate a draft to export CMS-ready assets.</div>;

  const poster = hero?.publishable ? hero.posterPath : exports.blogPost.poster;
  const blogPost = { ...exports.blogPost, poster };
  const blogPostTs = `// paste into src/lib/blog-data.ts → ALL_POSTS\n${JSON.stringify(blogPost, null, 2)}`;

  async function generateImage() {
    setImgLoading(true); setImgErr(''); setHero(undefined);
    try {
      const res = await fetch('/api/image', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          title: exports!.blogPost.title, slug: exports!.blogPost.slug,
          angle: brief?.angle, zyraContext: inputs?.zyraContext,
        }),
      });
      const data = await res.json();
      if (data.error) { setImgErr(data.error); setImgLoading(false); return; }

      let heroImage = data.heroImage as HeroImage;
      // Bake the house signature into the real PNG so every published hero shares
      // it. The mock SVG fallback already carries this look, so signing it would
      // double-stamp - only composite a live raster image. A compositing failure
      // must not lose the image: fall back to the unsigned hero.
      if (heroImage?.mode === 'live' && heroImage.ext === 'png') {
        try {
          const signed = await applyHeroSignature(heroImage.base64);
          heroImage = { ...heroImage, base64: signed, dataUrl: `data:image/png;base64,${signed}` };
        } catch (e) {
          console.warn('[hero signature] skipped:', (e as Error).message);
        }
      }
      setHero(heroImage);
    } catch (e) { setImgErr((e as Error).message); }
    setImgLoading(false);
  }

  async function publish() {
    setPublishing(true); setPubErr(''); setPrUrl('');
    try {
      const image = hero?.publishable
        ? { path: `public/posters/${hero.filename}`, base64: hero.base64 }
        : undefined;
      const res = await fetch('/api/publish', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ blogPost, nonce: Date.now().toString(36), image }),
      });
      const data = await res.json();
      if (data.error) setPubErr(data.error);
      else setPrUrl(data.result.prUrl);
    } catch (e) { setPubErr((e as Error).message); }
    setPublishing(false);
  }

  return (
    <div>
      <div className="card">
        <div className="export-head">
          <h3 style={{ margin: 0 }}>Hero image</h3>
          <button className="btn secondary small" onClick={generateImage} disabled={imgLoading}>
            {imgLoading ? <><span className="spinner" /> Generating…</> : hero ? 'Regenerate' : 'Generate hero image'}
          </button>
        </div>
        {imgErr && <div className="error">{imgErr}</div>}
        {hero ? (
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={hero.dataUrl} alt="Generated hero" style={{ width: '100%', borderRadius: 8, border: '1px solid var(--border)' }} />
            <p className="muted small" style={{ marginBottom: 0 }}>
              <span className={`badge ${hero.mode}`}>{hero.mode}</span>{' '}
              {hero.publishable
                ? <>Will be committed to <code>public/posters/{hero.filename}</code> and set as the poster.</>
                : <>Sample preview only (no OpenAI key). Poster stays a placeholder until a real image is generated.</>}
            </p>
          </div>
        ) : <p className="muted small">Generate a cinematic poster (OpenAI when configured; a branded sample otherwise).</p>}
      </div>

      <div className="card">
        <div className="export-head">
          <h3 style={{ margin: 0 }}>Publish to thezyra.studio</h3>
          <button className="btn small" onClick={publish} disabled={publishing || (audit && !audit.publishable)}>
            {publishing ? <><span className="spinner" /> Opening PR…</> : 'Open pull request →'}
          </button>
        </div>
        <p className="muted small">
          Appends this post to <code>blog-data.ts</code> on a new branch{hero?.publishable ? ' (with the hero image)' : ''} and
          opens a PR for review — nothing goes live until you merge.
        </p>
        {audit && !audit.publishable && (
          <div className="error">
            <strong>Publishing blocked — fix these first:</strong>
            <ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>
              {audit.blockers.map((b, i) => <li key={i}>{b}</li>)}
            </ul>
          </div>
        )}
        {pubErr && <div className="error">{pubErr}</div>}
        {prUrl && (
          <div className="selected-bar" style={{ marginBottom: 0 }}>
            <span className="badge live">PR opened</span>
            <a href={prUrl} target="_blank" rel="noreferrer">{prUrl}</a>
          </div>
        )}
      </div>

      {/* Sending the draft to a human to read and approve is a different job from
          shipping it to the CMS, so it gets its own row above the developer formats. */}
      <div className="btn-row" style={{ marginTop: 0, marginBottom: 12 }}>
        <button
          className="btn small"
          title="A real Word document - opens in Word, Google Docs or Pages"
          disabled={!draft || docxBusy}
          onClick={downloadDocx}
        >
          {docxBusy ? 'Building...' : 'Download for review (.docx)'}
        </button>
        <button className="btn secondary small" onClick={copyForReview}>
          {copied ? 'Copied ✓' : 'Copy draft text'}
        </button>
      </div>

      <div className="btn-row" style={{ marginTop: 0, marginBottom: 12 }}>
        <button className="btn small" onClick={() => download(`${blogPost.slug}.md`, exports.markdown, 'text/markdown')}>Download .md</button>
        <button className="btn small" onClick={() => download(`${blogPost.slug}.html`, exports.html, 'text/html')}>Download .html</button>
        <button className="btn small" onClick={() => download(`${blogPost.slug}.blogpost.json`, JSON.stringify(blogPost, null, 2), 'application/json')}>Download BlogPost JSON</button>
      </div>
      <CopyBlock label="CMS-ready copy (thezyra.studio BlogPost)" content={blogPostTs} />
      <CopyBlock label="Markdown" content={exports.markdown} />
      <CopyBlock label="HTML" content={exports.html} />
      <CopyBlock label="Meta tags" content={exports.metaTags} />
      <CopyBlock label="FAQ schema (JSON-LD)" content={exports.faqSchema || '(no FAQ in this draft)'} />
      <CopyBlock label="Blog brief JSON" content={exports.briefJson} />
    </div>
  );
}
