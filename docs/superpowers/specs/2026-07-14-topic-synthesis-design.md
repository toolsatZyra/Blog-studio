# Topic Synthesis — real blog topics from research signals

**Date:** 2026-07-14
**Status:** Approved

## Problem

The Recommended Topics tab surfaces raw social text verbatim as blog topics.
`topicScorer.candidateTopics()` maps PAA/Reddit/X question text straight into
topic titles (only stripping a trailing `?`). Result: unpublishable "topics" like
a raw X post *"This AI avatar system is f\*cking ridiculous 🤯 …"*. Research
signals should be **evidence of demand**, not the topics themselves.

## Goal

Synthesize genuine, on-brand, publishable blog topics from the research signals
using the LLM — never copying a post verbatim.

## Approach (approved)

LLM synthesis with a deterministic fallback.

### Data flow (`runResearch`)

```
research signals ─► topicSynthesizer(inputs, research)   [async, cheap LLM]
                      returns [{ title, angle }] × ~8-10
                    ─► topicScorer(inputs, research, topics)  [existing scoring]
                      returns TopicCandidate[]  (now carries `angle`)
```

### `topicSynthesizer(inputs, research): Promise<{title: string; angle: string}[]>`

New module `src/lib/modules/topicSynthesizer.ts`.

Prompt inputs:
- **Brand frame:** Zyra context (services, `ZYRA_PROOF_POINTS`, verified ₹60k
  pricing), audience (industries/roles/geographies), goal, tone.
- **Demand evidence:** PAA questions, Reddit thread titles, X post themes, top
  cluster queries, related keywords, competitor gaps.

Instructions to the LLM:
- Write real, publishable blog **titles** derived from the demand — do NOT copy
  any post verbatim.
- Each topic: `{ title, angle }` where `angle` is one sentence on what the post
  argues / who it's for.
- On-brand + adjacent thought-leadership; **drop off-brand noise** (gaming,
  fiction, unrelated). No profanity or clickbait. Align to audience, goal, tone.
- Return STRICT JSON: `[{"title": "...", "angle": "..."}]`, 8-10 items.

Model: **cheap** role (OpenAI `gpt-4o-mini`) via `getLLM()`.

Fallback (no LLM key, error, or malformed JSON): rule-based cleanup of today's
`candidateTopics` output — filter profanity/off-brand, title-case — so mock mode
and tests stay deterministic and the pipeline never breaks.

Backstop: a small profanity/clickbait post-filter applied to LLM output too.

### `topicScorer` change

- Signature: `topicScorer(inputs, research, topics: {title, angle}[])`.
- Score the `title` exactly as today; carry `angle` onto the candidate.
- If `topics` is empty, fall back to internal `candidateTopics()` (preserves
  current behavior as the ultimate safety net).

### Type change

`TopicCandidate` gains `angle: string`.

### UI change

`RecommendedTopicsTab.tsx`: render `c.angle` under the title (muted line).

## Non-goals

- Raw Reddit/X/PAA stay in `research.questions` (Research tab evidence) — only
  their use as *titles* is removed.
- Scoring weights unchanged.
- No change to Part 2 (brief/draft/audit/export).

## Verification

- Typecheck + build clean.
- Live `/api/research` run: recommended topics are polished titles + angles, no
  raw-post copy-paste, off-brand noise absent.
- Mock mode (no keys) still returns deterministic, clean topics via fallback.
