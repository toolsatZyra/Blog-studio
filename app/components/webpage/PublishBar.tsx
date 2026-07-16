'use client';
import { useState } from 'react';
import type { SolutionPage } from '@/lib/types';

interface Result {
  prUrl: string;
  prNumber: number;
  slug: string;
  renamed: boolean;
}

/**
 * Publish = open a PR appending this page to lp-data.ts on thezyra.in.
 *
 * Nothing reaches the live site here: the publisher always branches and opens a
 * PR for review, exactly like the blog flow. Merging is what publishes.
 */
export function PublishBar({ page, blocked }: { page: SolutionPage; blocked: boolean }) {
  const [publishing, setPublishing] = useState(false);
  const [result, setResult] = useState<Result>();
  const [error, setError] = useState('');
  const [blockers, setBlockers] = useState<string[]>([]);

  async function publish() {
    setPublishing(true);
    setError('');
    setBlockers([]);
    try {
      const res = await fetch('/api/solutions/publish', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ page, nonce: Date.now().toString(36) }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
        setBlockers(data.blockers || []);
      } else {
        setResult(data.result);
      }
    } catch (e) {
      setError((e as Error).message);
    }
    setPublishing(false);
  }

  if (result) {
    return (
      <div className="card">
        <h3>Pull request opened — nothing is live yet</h3>
        <ol className="next-steps">
          <li>
            <strong>Open PR #{result.prNumber}</strong> and wait for Vercel to build its preview
            (about a minute).
          </li>
          <li>
            <strong>Click the Vercel preview link</strong> on the PR and go to{' '}
            <code className="slug-chip">/solutions/{result.slug}</code> — that is the real page,
            on a real URL, exactly as it will look.
          </li>
          <li>
            Happy? <strong>Merge.</strong> That is the moment it goes live. Not happy? Close the PR
            and regenerate — nothing was published.
          </li>
        </ol>
        {result.renamed && (
          <p className="hint warn">
            Slug renamed to <strong>{result.slug}</strong> — the original was already published,
            so this went out as a new page rather than overwriting it.
          </p>
        )}
        <div className="btn-row">
          <a className="btn" href={result.prUrl} target="_blank" rel="noopener noreferrer">
            Review PR #{result.prNumber} →
          </a>
          <button className="btn secondary" onClick={() => setResult(undefined)}>Publish another</button>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="export-head">
        <h3 style={{ margin: 0 }}>Publish to thezyra.in</h3>
        <button className="btn small" onClick={publish} disabled={publishing || blocked}>
          {publishing ? <><span className="spinner" /> Opening PR…</> : 'Open pull request →'}
        </button>
      </div>
      <p className="muted small" style={{ margin: '6px 0 0' }}>
        Appends this page to <code>lp-data.ts</code> on a new branch and opens a PR — this is how
        you see the real page: Vercel builds a preview for the PR, at a real URL.
        <strong> Nothing goes live until you merge.</strong>
      </p>

      {blocked && (
        <p className="hint warn" style={{ marginTop: 8 }}>
          Blocked by the checks above — regenerate before publishing.
        </p>
      )}

      {error && (
        <div className="error" style={{ marginTop: 10 }}>
          {error}
          {blockers.length > 0 && (
            <ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>
              {blockers.map((b, i) => <li key={i}>{b}</li>)}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
