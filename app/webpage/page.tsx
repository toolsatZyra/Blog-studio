'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { SolutionInputs, SolutionPage } from '@/lib/types';
import { WebpageInputsPanel, canGenerate } from '../components/webpage/WebpageInputsPanel';
import { SolutionPreview } from '../components/webpage/SolutionPreview';
import { PublishBar } from '../components/webpage/PublishBar';
import { CopyBlock } from '../components/ui';

const DEFAULT_INPUTS: SolutionInputs = {
  industry: '',
  geography: '',
  serviceSlugs: [],
  caseStudySlugs: [],
  cta: 'Schedule a Call',
};

// Own storage key — the blog flow keeps zyra-blog-studio:v1 untouched.
const STORAGE_KEY = 'zyra-webpage-studio:v1';

type TabId = 'preview' | 'schema' | 'json';
const TABS: { id: TabId; label: string }[] = [
  { id: 'preview', label: 'Preview' },
  { id: 'schema', label: 'JSON-LD' },
  { id: 'json', label: 'Page object' },
];

export default function WebpagePage() {
  const [inputs, setInputs] = useState<SolutionInputs>(DEFAULT_INPUTS);
  const [page, setPage] = useState<SolutionPage>();
  const [schema, setSchema] = useState('');
  const [blockers, setBlockers] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [tab, setTab] = useState<TabId>('preview');
  const [hydrated, setHydrated] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        setInputs({ ...DEFAULT_INPUTS, ...s.inputs });
        setPage(s.page); setSchema(s.schema || '');
        setBlockers(s.blockers || []); setWarnings(s.warnings || []);
      }
    } catch { /* ignore */ }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ inputs, page, schema, blockers, warnings }));
  }, [hydrated, inputs, page, schema, blockers, warnings]);

  async function generate() {
    setGenerating(true);
    setError('');
    try {
      const res = await fetch('/api/solutions/generate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(inputs),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setPage(data.page);
        setSchema(data.schema);
        setBlockers(data.blockers || []);
        setWarnings(data.warnings || []);
        setTab('preview');
      }
    } catch (e) {
      setError((e as Error).message);
    }
    setGenerating(false);
  }

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
        {warnings.map((w, i) => <div key={i} className="error">{w}</div>)}

        {blockers.length > 0 && (
          <div className="error">
            <strong>Publishing is blocked until these are fixed:</strong>
            <ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>
              {blockers.map((b, i) => <li key={i}>{b}</li>)}
            </ul>
            <p className="small" style={{ margin: '8px 0 0' }}>
              Regenerate to try again — these rules are enforced, not suggested.
            </p>
          </div>
        )}

        {!page ? (
          <div className="empty">
            {canGenerate(inputs)
              ? <>Ready. Hit <strong>Generate page</strong> on the left.</>
              : <>Pick an <strong>industry and/or geography</strong> and at least{' '}
                <strong>one case study</strong> on the left.</>}
          </div>
        ) : (
          <>
            <div className="tabs">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  className={`tab ${tab === t.id ? 'active' : ''}`}
                  onClick={() => setTab(t.id)}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {tab === 'preview' && (
              <>
                <PublishBar page={page} blocked={blockers.length > 0} />
                <SolutionPreview page={page} />
              </>
            )}
            {tab === 'schema' && (
              <CopyBlock label="JSON-LD (Service + FAQPage + BreadcrumbList)" content={schema} />
            )}
            {tab === 'json' && (
              <CopyBlock
                label="SolutionPage — what gets appended to lp-data.ts"
                content={JSON.stringify(page, null, 2)}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}
