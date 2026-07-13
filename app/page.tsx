'use client';
import { useEffect, useState } from 'react';
import type {
  Inputs, Research, TopicCandidate, Brief, Draft, Audit, Exports, SourceMode,
} from '@/lib/types';
import { DEFAULT_ZYRA_CONTEXT } from '@/lib/zyraContext';
import { InputsPanel } from './components/InputsPanel';
import { ResearchTab } from './components/ResearchTab';
import { RecommendedTopicsTab } from './components/RecommendedTopicsTab';
import { BriefTab } from './components/BriefTab';
import { DraftTab } from './components/DraftTab';
import { ChecklistTab } from './components/ChecklistTab';
import { ExportTab } from './components/ExportTab';

const DEFAULT_INPUTS: Inputs = {
  topic: '',
  zyraContext: DEFAULT_ZYRA_CONTEXT,
  audience: { industries: 'D2C, FMCG, fintech', geographies: 'India', roles: 'CMOs, brand managers' },
  goal: 'thought leadership',
  tone: 'cinematic but useful',
  wordCount: 1400,
  cta: 'See how Zyra makes cinematic content at the speed of culture →',
  competitorUrls: [],
  manualNotes: '',
};

type TabId = 'inputs' | 'research' | 'topics' | 'brief' | 'draft' | 'checklist' | 'export';
const TABS: { id: TabId; label: string; part: 1 | 2 }[] = [
  { id: 'inputs', label: 'Inputs', part: 1 },
  { id: 'research', label: 'Research', part: 1 },
  { id: 'topics', label: 'Recommended Topics', part: 1 },
  { id: 'brief', label: 'Brief', part: 2 },
  { id: 'draft', label: 'Draft', part: 2 },
  { id: 'checklist', label: 'SEO/GEO Checklist', part: 2 },
  { id: 'export', label: 'Export', part: 2 },
];

const STORAGE_KEY = 'zyra-blog-studio:v1';

export default function Home() {
  const [inputs, setInputs] = useState<Inputs>(DEFAULT_INPUTS);
  const [research, setResearch] = useState<Research>();
  const [candidates, setCandidates] = useState<TopicCandidate[]>();
  const [selected, setSelected] = useState<TopicCandidate>();
  const [brief, setBrief] = useState<Brief>();
  const [draft, setDraft] = useState<Draft>();
  const [audit, setAudit] = useState<Audit>();
  const [exportsData, setExportsData] = useState<Exports>();
  const [providerStatus, setProviderStatus] = useState<Record<string, SourceMode>>();
  const [tab, setTab] = useState<TabId>('inputs');
  const [researching, setResearching] = useState(false);
  const [writing, setWriting] = useState(false);
  const [error, setError] = useState('');
  const [hydrated, setHydrated] = useState(false);

  // Load persisted run.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        setInputs(s.inputs ?? DEFAULT_INPUTS);
        setResearch(s.research); setCandidates(s.candidates); setSelected(s.selected);
        setBrief(s.brief); setDraft(s.draft); setAudit(s.audit); setExportsData(s.exports);
        setProviderStatus(s.providerStatus);
      }
    } catch { /* ignore */ }
    setHydrated(true);
  }, []);

  // Persist run.
  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      inputs, research, candidates, selected, brief, draft, audit, exports: exportsData, providerStatus,
    }));
  }, [hydrated, inputs, research, candidates, selected, brief, draft, audit, exportsData, providerStatus]);

  const part2Ready = !!selected;

  async function runResearch() {
    setResearching(true); setError('');
    setResearch(undefined); setCandidates(undefined); setSelected(undefined);
    setBrief(undefined); setDraft(undefined); setAudit(undefined); setExportsData(undefined);
    try {
      const res = await fetch('/api/research', {
        method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(inputs),
      });
      const data = await res.json();
      if (data.error) { setError(data.error); }
      else { setResearch(data.research); setCandidates(data.candidates); setProviderStatus(data.providerStatus); setTab('topics'); }
    } catch (e) { setError((e as Error).message); }
    setResearching(false);
  }

  async function selectTopic(c: TopicCandidate) {
    if (!research) return;
    setSelected(c); setWriting(true); setError('');
    setBrief(undefined); setDraft(undefined); setAudit(undefined); setExportsData(undefined);
    try {
      const res = await fetch('/api/write', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ inputs, research, selected: c }),
      });
      const data = await res.json();
      if (data.error) { setError(data.error); }
      else { setBrief(data.brief); setDraft(data.draft); setAudit(data.audit); setExportsData(data.exports); setTab('brief'); }
    } catch (e) { setError((e as Error).message); }
    setWriting(false);
  }

  function reset() {
    setResearch(undefined); setCandidates(undefined); setSelected(undefined);
    setBrief(undefined); setDraft(undefined); setAudit(undefined); setExportsData(undefined);
    setTab('inputs');
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand"><h1>Zyra Blog Studio</h1><span className="dot">●</span></div>
        <p className="subtitle">Research → recommend → write → audit → export. Runs on mocks with zero keys.</p>
        {providerStatus && (
          <div className="chips" style={{ marginBottom: 8 }}>
            {Object.entries(providerStatus).map(([k, v]) => (
              <span key={k} className={`badge ${v}`}>{k}: {v}</span>
            ))}
          </div>
        )}
        <InputsPanel inputs={inputs} setInputs={setInputs} onRun={runResearch} loading={researching} />
      </aside>

      <main className="main">
        <div className="tabs">
          {TABS.map((t) => {
            const locked = t.part === 2 && !part2Ready;
            return (
              <button
                key={t.id}
                className={`tab ${tab === t.id ? 'active' : ''}`}
                disabled={locked}
                title={locked ? 'Pick a topic first' : undefined}
                onClick={() => setTab(t.id)}
              >
                <span className="part-tag">P{t.part}</span> {t.label}
              </button>
            );
          })}
        </div>

        {error && <div className="error">{error}</div>}

        {selected && (
          <div className="selected-bar">
            <span className="badge rec">Chosen</span>
            <strong>{selected.topic}</strong>
            <span className="muted">· score {selected.score}</span>
            {writing && <span className="muted"><span className="spinner" /> writing…</span>}
            <button className="btn secondary small" style={{ marginLeft: 'auto' }} onClick={reset}>Pick a different topic</button>
          </div>
        )}

        {tab === 'inputs' && (
          <div className="empty">
            Fill in the panel on the left and hit <strong>Run research</strong> to start Part 1.
          </div>
        )}
        {tab === 'research' && <ResearchTab research={research} />}
        {tab === 'topics' && <RecommendedTopicsTab candidates={candidates} selected={selected} onSelect={selectTopic} loading={writing} />}
        {tab === 'brief' && <BriefTab brief={brief} />}
        {tab === 'draft' && <DraftTab draft={draft} brief={brief} />}
        {tab === 'checklist' && <ChecklistTab audit={audit} />}
        {tab === 'export' && <ExportTab exports={exportsData} />}
      </main>
    </div>
  );
}
