'use client';
import { useState } from 'react';
import type { SolutionPage } from '@/lib/types';

// Opens the REAL page in a new tab, before any PR exists.
//
// A new tab rather than an iframe: the site sets X-Frame-Options: SAMEORIGIN
// (correct clickjacking protection) which blocks cross-origin framing but has no
// bearing on a normal tab. So this needs no security change to the live site.
//
// The page travels in the URL FRAGMENT rather than postMessage, because a
// fragment is never sent to the server (the draft stays out of access logs),
// needs no window.opener (popup blockers and noopener can't break it), and the
// link survives a reload. A SolutionPage is ~10KB, so ~13KB base64 - far below
// any browser's URL limit.

// Default to the LIVE site, not localhost. The deployed studio is the common
// case and it has no .env, so a localhost default sent everyone to a dead
// address on their own machine. Local dev overrides this in .env.
const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.thezyra.studio';
const PREVIEW_URL = `${SITE}/solutions/preview`;

/** base64 that survives non-ASCII copy (curly quotes, ₹, etc.). */
export function encodePage(page: SolutionPage): string {
  const bytes = new TextEncoder().encode(JSON.stringify(page));
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

export function ViewPageButton({ page }: { page: SolutionPage }) {
  const [note, setNote] = useState('');

  function open() {
    const url = `${PREVIEW_URL}#p=${encodeURIComponent(encodePage(page))}`;
    const w = window.open(url, '_blank', 'noopener');
    setNote(w ? '' : 'Your browser blocked the popup — allow popups for this site, or use the link below.');
  }

  const url = `${PREVIEW_URL}#p=${encodeURIComponent(encodePage(page))}`;

  return (
    <>
      <button className="btn" onClick={open}>View page ↗</button>
      {note && (
        <p className="hint warn" style={{ marginTop: 6 }}>
          {note} <a href={url} target="_blank" rel="noopener noreferrer">Open preview</a>
        </p>
      )}
    </>
  );
}
