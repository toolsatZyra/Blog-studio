'use client';
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
  if (!exports) return <div className="empty">Generate a draft to export CMS-ready assets.</div>;
  const blogPostTs = `// paste into src/lib/blog-data.ts → ALL_POSTS\n${JSON.stringify(exports.blogPost, null, 2)}`;

  return (
    <div>
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
