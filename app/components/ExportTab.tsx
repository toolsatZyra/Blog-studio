'use client';
import { useState } from 'react';
import type { Exports } from '@/lib/types';
import { CopyBlock } from './ui';

function download(name: string, content: string, type = 'text/plain') {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = name; a.click();
  URL.revokeObjectURL(url);
}

export function ExportTab({ exports }: { exports?: Exports }) {
  const [publishing, setPublishing] = useState(false);
  const [prUrl, setPrUrl] = useState('');
  const [pubErr, setPubErr] = useState('');

  if (!exports) return <div className="empty">Generate a draft to export CMS-ready assets.</div>;
  const blogPostTs = `// paste into src/lib/blog-data.ts → ALL_POSTS\n${JSON.stringify(exports.blogPost, null, 2)}`;

  async function publish() {
    setPublishing(true); setPubErr(''); setPrUrl('');
    try {
      const res = await fetch('/api/publish', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ blogPost: exports!.blogPost, nonce: Date.now().toString(36) }),
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
          <h3 style={{ margin: 0 }}>Publish to thezyra.in</h3>
          <button className="btn small" onClick={publish} disabled={publishing}>
            {publishing ? <><span className="spinner" /> Opening PR…</> : 'Open pull request →'}
          </button>
        </div>
        <p className="muted small">
          Appends this post to <code>blog-data.ts</code> on a new branch and opens a PR for review —
          nothing goes live until you merge. The poster stays a placeholder for you to swap in the PR.
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
        <button className="btn small" onClick={() => download(`${exports.blogPost.slug}.md`, exports.markdown, 'text/markdown')}>Download .md</button>
        <button className="btn small" onClick={() => download(`${exports.blogPost.slug}.html`, exports.html, 'text/html')}>Download .html</button>
        <button className="btn small" onClick={() => download(`${exports.blogPost.slug}.blogpost.json`, JSON.stringify(exports.blogPost, null, 2), 'application/json')}>Download BlogPost JSON</button>
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
