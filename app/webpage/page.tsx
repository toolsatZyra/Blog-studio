'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { SolutionInputs } from '@/lib/types';
import { WebpageInputsPanel, canGenerate } from '../components/webpage/WebpageInputsPanel';
import { getCaseStudyBySlug, PROOF_LIMIT } from '@/lib/solutionsData';

const DEFAULT_INPUTS: SolutionInputs = {
  industry: '',
  geography: '',
  serviceSlugs: [],
  caseStudySlugs: [],
  cta: 'Schedule a Call',
};

// Own storage key — the blog flow keeps zyra-blog-studio:v1 untouched.
const STORAGE_KEY = 'zyra-webpage-studio:v1';

export default function WebpagePage() {
  const [inputs, setInputs] = useState<SolutionInputs>(DEFAULT_INPUTS);
  const [hydrated, setHydrated] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setInputs({ ...DEFAULT_INPUTS, ...JSON.parse(raw).inputs });
    } catch { /* ignore */ }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ inputs }));
  }, [hydrated, inputs]);

  async function generate() {
    setGenerating(true);
    setError('');
    try {
      // The generate route lands next; this keeps the button honest until then.
      setError('Generation is not wired up yet — the inputs are captured and validated.');
    } catch (e) {
      setError((e as Error).message);
    }
    setGenerating(false);
  }

  // Preview of what will actually reach the page: first 3, first is featured.
  const shown = inputs.caseStudySlugs.slice(0, PROOF_LIMIT).map(getCaseStudyBySlug).filter(Boolean);
  const dropped = inputs.caseStudySlugs.length - shown.length;

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <h1>Webpage</h1>
          <span className="dot">●</span>
        </div>
        <p className="subtitle">
          Industry × geography × service → a landing page at thezyra.in/solutions.
        </p>
        <Link href="/" className="btn secondary small" style={{ marginBottom: 12, display: 'inline-block' }}>
          ← All tools
        </Link>
        <WebpageInputsPanel
          inputs={inputs}
          setInputs={setInputs}
          onGenerate={generate}
          loading={generating}
        />
      </aside>

      <main className="main">
        {error && <div className="error">{error}</div>}

        {!canGenerate(inputs) ? (
          <div className="empty">
            Pick an <strong>industry and/or geography</strong> and at least{' '}
            <strong>one case study</strong> on the left, then hit{' '}
            <strong>Generate page</strong>.
          </div>
        ) : (
          <div className="card">
            <h3>Ready to generate</h3>
            <p className="muted small">
              Targeting{' '}
              <strong>{[inputs.industry, inputs.geography].filter(Boolean).join(' · ')}</strong>
              {inputs.serviceSlugs.length > 0
                ? <> · {inputs.serviceSlugs.length} service(s)</>
                : <> · all services</>}
            </p>
            <p className="muted small" style={{ marginTop: 10 }}>
              Proof on the page ({shown.length} of {inputs.caseStudySlugs.length} selected
              {dropped > 0 ? `, ${dropped} dropped` : ''}):
            </p>
            <ul className="proof-list">
              {shown.map((c, i) => (
                <li key={c!.slug}>
                  {i === 0 ? <span className="badge rec">Featured</span> : <span className="badge mock">#{i + 1}</span>}
                  <span>{c!.client} — {c!.title}</span>
                  <span className="muted small">{c!.category} · {c!.year}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </main>
    </div>
  );
}
