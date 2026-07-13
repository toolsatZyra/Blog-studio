'use client';
import type { Inputs, BlogGoal, Tone } from '@/lib/types';

const GOALS: BlogGoal[] = ['awareness', 'lead generation', 'thought leadership', 'comparison', 'educational'];
const TONES: Tone[] = ['cinematic but useful', 'founder-led', 'expert editorial', 'simple and direct'];
const GEOS = ['India', 'GCC', 'US'];

export function InputsPanel({
  inputs, setInputs, onRun, loading,
}: {
  inputs: Inputs;
  setInputs: (i: Inputs) => void;
  onRun: () => void;
  loading: boolean;
}) {
  const up = (patch: Partial<Inputs>) => setInputs({ ...inputs, ...patch });
  const upAud = (patch: Partial<Inputs['audience']>) => setInputs({ ...inputs, audience: { ...inputs.audience, ...patch } });

  const geoList = inputs.audience.geographies.split(',').map((s) => s.trim()).filter(Boolean);
  const toggleGeo = (g: string) => {
    const next = geoList.includes(g) ? geoList.filter((x) => x !== g) : [...geoList, g];
    upAud({ geographies: next.join(', ') });
  };

  return (
    <div>
      <label>Blog topic / seed idea</label>
      <input value={inputs.topic} onChange={(e) => up({ topic: e.target.value })} placeholder="e.g. AI brand film cost in India" />

      <label>Zyra context (editable)</label>
      <textarea rows={6} value={inputs.zyraContext} onChange={(e) => up({ zyraContext: e.target.value })} />

      <label>Target audience — industries</label>
      <input value={inputs.audience.industries} onChange={(e) => upAud({ industries: e.target.value })} placeholder="D2C, FMCG, fintech" />
      <div className="row">
        <div>
          <label>Geographies</label>
          <div className="chips" style={{ paddingTop: 4 }}>
            {GEOS.map((g) => (
              <button
                key={g}
                type="button"
                className={`chip geo ${geoList.includes(g) ? 'active' : ''}`}
                onClick={() => toggleGeo(g)}
              >
                {g}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label>Roles</label>
          <input value={inputs.audience.roles} onChange={(e) => upAud({ roles: e.target.value })} placeholder="CMOs, brand managers" />
        </div>
      </div>

      <div className="row">
        <div>
          <label>Blog goal</label>
          <select value={inputs.goal} onChange={(e) => up({ goal: e.target.value as BlogGoal })}>
            {GOALS.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
        <div>
          <label>Tone</label>
          <select value={inputs.tone} onChange={(e) => up({ tone: e.target.value as Tone })}>
            {TONES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      <div className="row">
        <div>
          <label>Target word count</label>
          <input type="number" value={inputs.wordCount} onChange={(e) => up({ wordCount: Number(e.target.value) || 0 })} />
        </div>
        <div>
          <label>CTA</label>
          <input value={inputs.cta} onChange={(e) => up({ cta: e.target.value })} placeholder="See how we work →" />
        </div>
      </div>

      <label>Competitor URLs (one per line, optional)</label>
      <textarea rows={2} value={inputs.competitorUrls.join('\n')} onChange={(e) => up({ competitorUrls: e.target.value.split('\n').map((s) => s.trim()).filter(Boolean) })} placeholder="https://competitor.com/post" />

      <label>Manual Reddit/X notes or CSV (optional)</label>
      <textarea rows={2} value={inputs.manualNotes} onChange={(e) => up({ manualNotes: e.target.value })} placeholder="Paste real questions, one per line" />

      <div className="btn-row">
        <button className="btn" onClick={onRun} disabled={loading || !inputs.topic.trim()}>
          {loading ? <><span className="spinner" /> Researching…</> : 'Run research →'}
        </button>
      </div>
    </div>
  );
}
