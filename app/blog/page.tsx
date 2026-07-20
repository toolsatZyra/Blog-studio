'use client';
import { useEffect, useState } from 'react';
import type {
  Inputs, Research, TopicCandidate, Brief, Draft, Audit, Exports, SourceMode,
} from '@/lib/types';
import { DEFAULT_ZYRA_CONTEXT } from '@/lib/zyraContext';
import { rederive } from '@/lib/rederive';
import { InputsPanel } from '../components/InputsPanel';
import { ResearchTab } from '../components/ResearchTab';
import { RecommendedTopicsTab } from '../components/RecommendedTopicsTab';
import { BriefTab } from '../components/BriefTab';
import { DraftTab } from '../components/DraftTab';
import { ChecklistTab } from '../components/ChecklistTab';
import { ExportTab } from '../components/ExportTab';

const DEFAULT_INPUTS: Inputs = {
  topic: '',
  zyraContext: DEFAULT_ZYRA_CONTEXT,
  audience: { industries: '', geographies: 'India, GCC, US', roles: 'CMOs, brand managers' },
  goal: 'thought leadership',
  tone: 'cinematic but useful',
  wordCount: 1400,
  cta: 'Schedule a call',
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
  // The pristine generated draft, kept so "Revert to generated" can undo edits.
  const [originalDraft, setOriginalDraft] = useState<Draft>();
  const [audit, setAudit] = useState<Audit>();
  const [exportsData, setExportsData] = useState<Exports>();
  const [providerStatus, setProviderStatus] = useState<Record<string, SourceMode>>();
  const [tab, setTab] = useState<TabId>('inputs');
  const [researching, setResearching] = useState(false);
  const [writing, setWriting] = useState(false);
  const [error, setError] = useState('');
  const [hydrated, setHydrated] = useState(false);
  const [llmCheck, setLlmCheck] = useState<string>();
  const [checking, setChecking] = useState(false);

  // Load persisted run.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        // Merge over defaults so new fields get their default, and force the CTA
        // to fall back to the default whenever a saved draft left it blank.
        const mergedInputs = { ...DEFAULT_INPUTS, ...(s.inputs || {}) };
        if (!mergedInputs.cta?.trim()) mergedInputs.cta = DEFAULT_INPUTS.cta;
        setInputs(mergedInputs);
        setResearch(s.research); setCandidates(s.candidates); setSelected(s.selected);
        setBrief(s.brief); setDraft(s.draft); setAudit(s.audit); setExportsData(s.exports);
        setOriginalDraft(s.originalDraft ?? s.draft);
        setProviderStatus(s.providerStatus);
      }
    } catch { /* ignore */ }
    setHydrated(true);
  }, []);

  // Persist run.
  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      inputs, research, candidates, selected, brief, draft, audit, exports: exportsData,
      originalDraft, providerStatus,
    }));
  }, [hydrated, inputs, research, candidates, selected, brief, draft, audit, exportsData, originalDraft, providerStatus]);

  const part2Ready = !!selected;

  /**
   * Apply a hand-edited draft.
   *
   * Publishing ships exports.blogPost, not draft — so every edit MUST re-derive
   * the audit and exports or we'd publish the original text and score the wrong
   * draft. rederive() is pure and synchronous; the resolved category is threaded
   * back through so this never costs an LLM call.
   */
  function onDraftChange(next: Draft) {
    if (!brief) return;
    const category = exportsData?.blogPost.category;
    const r = rederive(next, brief, inputs, category);
    setDraft(r.draft); setAudit(r.audit); setExportsData(r.exports);
  }

  function revertDraft() {
    if (!originalDraft || !brief) return;
    const r = rederive(originalDraft, brief, inputs, exportsData?.blogPost.category);
    setDraft(r.draft); setAudit(r.audit); setExportsData(r.exports);
  }

  async function runResearch() {
    if (draft?.edited && !confirm('You have edited this draft. Running research again will discard those edits. Continue?')) return;
    setResearching(true); setError('');
    setResearch(undefined); setCandidates(undefined); setSelected(undefined);
    setBrief(undefined); setDraft(undefined); setAudit(undefined); setExportsData(undefined);
    setOriginalDraft(undefined);
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
    // Regenerating overwrites the draft — never throw away hand edits silently.
    if (draft?.edited && !confirm('You have edited this draft. Writing a new one will discard those edits. Continue?')) return;
    setSelected(c); setWriting(true); setError('');
    setBrief(undefined); setDraft(undefined); setAudit(undefined); setExportsData(undefined);
    setOriginalDraft(undefined);
    try {
      const res = await fetch('/api/write', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ inputs, research, selected: c }),
      });
      const data = await res.json();
      if (data.error) { setError(data.error); }
      else {
        setBrief(data.brief); setDraft(data.draft); setAudit(data.audit); setExportsData(data.exports);
        setOriginalDraft(data.draft);
        setTab('brief');
      }
    } catch (e) { setError((e as Error).message); }
    setWriting(false);
  }

  async function checkLlm() {
    setChecking(true); setLlmCheck(undefined);
    try {
      const res = await fetch('/api/llm-check', { method: 'POST' });
      const d = await res.json();
      const fmt = (r: { configured: boolean; ok?: boolean; model: string; error?: string; note?: string }) =>
        !r.configured ? `mock (no key)` : r.ok ? `live ✓ (${r.model})` : `ERROR (${r.model}): ${r.error}`;
      setLlmCheck(`Writer/Claude: ${fmt(d.writer)}\nCheap/OpenAI: ${fmt(d.cheap)}`);
    } catch (e) { setLlmCheck((e as Error).message); }
    setChecking(false);
  }

  function reset() {
    if (draft?.edited && !confirm('You have edited this draft. Picking a different topic will discard those edits. Continue?')) return;
    setResearch(undefined); setCandidates(undefined); setSelected(undefined);
    setBrief(undefined); setDraft(undefined); setAudit(undefined); setExportsData(undefined);
    setOriginalDraft(undefined);
    setTab('inputs');
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand"><h1>Blog</h1><span className="dot">●</span></div>
        <p className="subtitle">Research → recommend → write → audit → export. Runs on mocks with zero keys.</p>
        {providerStatus && (
          <div className="chips" style={{ marginBottom: 8 }}>
            {Object.entries(providerStatus).map(([k, v]) => (
              <span key={k} className={`badge ${v}`}>{k}: {v}</span>
            ))}
          </div>
        )}
        <button className="btn secondary small" style={{ marginBottom: 8 }} onClick={checkLlm} disabled={checking}>
          {checking ? <><span className="spinner" /> Checking…</> : 'Check writer connection'}
        </button>
        {llmCheck && <pre className="export" style={{ maxHeight: 120, marginBottom: 10, whiteSpace: 'pre-wrap' }}>{llmCheck}</pre>}
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
        {tab === 'draft' && (
          <DraftTab
            draft={draft}
            brief={brief}
            inputs={inputs}
            audit={audit}
            onDraftChange={onDraftChange}
            onRevert={originalDraft && originalDraft !== draft ? revertDraft : undefined}
          />
        )}
        {tab === 'checklist' && <ChecklistTab audit={audit} />}
        {tab === 'export' && <ExportTab exports={exportsData} brief={brief} inputs={inputs} audit={audit} draft={draft} />}
      </main>
    </div>
  );
}
