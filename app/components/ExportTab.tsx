'use client';
import { useState } from 'react';
import type { Exports, Brief, Inputs, HeroImage } from '@/lib/types';
import { CopyBlock } from './ui';

function download(name: string, content: string, type = 'text/plain') {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = name; a.click();
  URL.revokeObjectURL(url);
}

export function ExportTab({ exports, brief, inputs }: { exports?: Exports; brief?: Brief; inputs?: Inputs }) {
  const [hero, setHero] = useState<HeroImage>();
  const [imgLoading, setImgLoading] = useState(false);
  const [imgErr, setImgErr] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [prUrl, setPrUrl] = useState('');
  const [pubErr, setPubErr] = useState('');

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
      if (data.error) setImgErr(data.error); else setHero(data.heroImage);
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
          <h3 style={{ margin: 0 }}>Publish to thezyra.in</h3>
          <button className="btn small" onClick={publish} disabled={publishing}>
            {publishing ? <><span className="spinner" /> Opening PR…</> : 'Open pull request →'}
          </button>
        </div>
        <p className="muted small">
          Appends this post to <code>blog-data.ts</code> on a new branch{hero?.publishable ? ' (with the hero image)' : ''} and
          opens a PR for review — nothing goes live until you merge.
        </p>
        {pubErr && <div className="error">{pubErr}</div>}
        {prUrl && (
          <div className="selected-bar" style={{ marginBottom: 0 }}>
            <span className="badge live">PR opened</span>
            <a href={prUrl} target="_blank" rel="noreferrer">{prUrl}</a>
          </div>
        )}
      </div>

      <div className="btn-row" style={{ marginTop: 0, marginBottom: 12 }}>
        <button className="btn small" onClick={() => download(`${blogPost.slug}.md`, exports.markdown, 'text/markdown')}>Download .md</button>
        <button className="btn small" onClick={() => download(`${blogPost.slug}.html`, exports.html, 'text/html')}>Download .html</button>
        <button className="btn small" onClick={() => download(`${blogPost.slug}.blogpost.json`, JSON.stringify(blogPost, null, 2), 'application/json')}>Download BlogPost JSON</button>
      </div>
      <CopyBlock label="CMS-ready copy (thezyra.in BlogPost)" content={blogPostTs} />
      <CopyBlock label="Markdown" content={exports.markdown} />
      <CopyBlock label="HTML" content={exports.html} />
      <CopyBlock label="Meta tags" content={exports.metaTags} />
      <CopyBlock label="FAQ schema (JSON-LD)" content={exports.faqSchema || '(no FAQ in this draft)'} />
      <CopyBlock label="Blog brief JSON" content={exports.briefJson} />
    </div>
  );
}
