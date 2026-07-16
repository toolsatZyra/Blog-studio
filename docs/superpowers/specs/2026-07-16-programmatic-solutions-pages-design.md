# Programmatic Solutions Pages — SEO/AEO landing pages from Industry × Geo × Service

**Date:** 2026-07-16
**Status:** Draft (awaiting user review)

## Problem

Zyra needs conversion-focused landing pages targeted at specific
**industry segment** and/or **geography** combinations, optionally scoped to one
or more of its **services**, each backed by real **case studies** from the site.
Building these by hand does not scale, and hand-authored pages drift in structure
and SEO quality. We want an operator to specify a combination, pick supporting
case studies, click once, and get a complete, SEO/AEO-optimized, publishable
landing page with a unique URL slug.

## Requirement (verbatim, decomposed)

> Given the following inputs: Industry segment and/or Geography (one among these
> is mandatory), and Service Type (optional multi-select of the services we
> provide), create a SEO/AEO optimized landing page (web page) suited for the
> input combination (intent of the web page is to convert the customers landing
> on that page, conversion means clicking a CTA button to schedule a call). The
> feature should ask us to choose from the list of case studies we have on the
> website. We/user should be able to choose one or more. On click, the whole page
> should be generated with a unique url slug.

| Clause | Interpretation | Rule |
|---|---|---|
| Industry segment **and/or** Geography | Two inputs; **at least one** required | UI blocks Generate until ≥1 is filled |
| Service Type — **optional** multi-select of the services we provide | 0..N of the 5 real services | Optional; drives the "What we deliver" section |
| **suited for the input combination** | Copy is tailored to industry/geo/service | LLM writes each section grounded in the combo |
| **SEO/AEO optimized** | Meta, schema, internal links, snippet-ready answer | See §6 |
| **convert … click a CTA … schedule a call** | Primary goal = book a call | Multiple "Schedule a call" CTAs; conversion structure |
| **ask us to choose from the list of case studies … one or more** | Case-study selection is a **required step**, min 1 | UI blocks Generate until ≥1 case study is selected |
| **On click, the whole page should be generated** | Single action produces the full page | One "Generate" click assembles all sections |
| **unique url slug** | Deterministic, keyword-rich, collision-free | See §7 |

**Key correction from brainstorming:** case-study selection is **required
(minimum one)**, not optional. Service selection **is** optional.

## Goal

A new **Solutions** mode inside Zyra Blog Studio that turns
(Industry and/or Geography) + (optional Services) + (≥1 Case Study) into a
complete `/solutions/[slug]` landing page on thezyra.in, generated on a single
click, SEO/AEO-optimized, grounded only in real Zyra data, and published via a
GitHub PR (never direct to main).

## Non-goals (YAGNI)

- No bulk/CSV batch generation — one page per Generate click.
- No fabricated metrics or results (site case-study data has none — see §5).
- No A/B testing, analytics wiring, or live-editing of published pages here
  (GA4 lead events already exist site-wide; this feature only emits the CTAs).
- No new LLM providers, config, or auth — reuse Blog Studio's existing infra.

## Approach (approved)

Hybrid generation: a **fixed conversion/AEO skeleton** with **LLM-written prose**
per section, grounded in real structured data. Reuses Blog Studio's Claude
writer, config, SEO/GEO auditor, and GitHub-PR publisher. Delivered as a new
sidebar **mode** so the existing blog pipeline is untouched.

## Placement & architecture

- New top-level mode toggle in the studio sidebar: **Blog** (existing) ↔
  **Solutions** (new). Selecting a mode swaps the left panel and the tabbed
  workspace; existing blog state and code paths are unchanged.
- New Solutions-only components, new API routes, new modules. Reuses:
  `src/lib/providers/llm/*`, `src/lib/config.ts`, the SEO/GEO auditor
  (`src/lib/scoring/*`, `src/lib/modules/seoGeoAuditor.ts`), and the GitHub
  publisher (`src/lib/modules/publisher.ts`, generalized — see §9).

## Inputs (left panel, Solutions mode)

- **Industry segment** — free-text `<input>` + `<datalist>` suggestions.
- **Geography** — free-text `<input>` + `<datalist>` suggestions.
  - Validation: **≥1 of {Industry, Geography}** must be non-empty.
- **Services** — multi-select (checkboxes) over the 5 services from the site's
  `service-data.ts`, mirrored into a local constant (`src/lib/solutionsData.ts`).
  Optional (0..N).
- **Case studies** — multi-select checklist over the 24 projects from the site's
  `work-data.ts`, mirrored locally. Grouped by category; projects whose category
  matches a selected service are surfaced first. **Required: ≥1.**
- **Primary CTA label** — defaults to `Schedule a call`.

Generate is enabled only when: (≥1 of industry/geo) **AND** (≥1 case study).

## Data flow

```
SolutionInputs ─► POST /api/solutions/generate
  1. assembleSpec(inputs)      → SolutionPageSpec (skeleton + resolved
                                  service + case-study data, no prose yet)
  2. solutionGenerator(spec)   → Claude writes each section's prose,
                                  grounded in inputs + real data
  3. buildSlug(inputs)         → unique, keyword-rich slug (collision-checked)
  4. buildSchema(page)         → Service + FAQPage + BreadcrumbList JSON-LD
  5. seoGeoAuditor(page)       → SEO/GEO/human-voice scorecards + publishable flag
  ─► returns { page: SolutionPage, audit }

UI: preview (rendered sections) + editable slug + audit checklist + Publish

SolutionPage ─► POST /api/solutions/publish
  → append object to src/lib/lp-data.ts on the site repo via GitHub PR
```

## Page skeleton (fixed 8 sections)

Rendered top-to-bottom; order is fixed (approved):

1. **Hero** — H1 = `{Service(s)} for {Industry} {in Geography}`, one-line value
   prop, primary `Schedule a call` CTA.
2. **AEO answer block** — 40–55 word direct answer to the page's implied query
   (featured-snippet / AI-Overview shaped).
3. **Problem framing** — the specific pain for this industry/geo segment.
4. **What we deliver** — the selected service(s), sourced from `service-data.ts`
   (deliverables, process); if no service selected, a concise all-services frame.
5. **Proof / case studies** — the selected projects, using **only real fields**
   (client, title, category, year, tags, brief) + a link to `/work/[slug]`.
6. **Process** — how an engagement runs (trust before the ask).
7. **FAQ** — 4–6 Q&As tailored to the combo; emitted as `FAQPage` JSON-LD.
8. **Final CTA band** — repeats `Schedule a call`.

## Grounding & honesty rules

- LLM receives Zyra's real context + the resolved service/case-study data and is
  instructed to never invent clients, numbers, or claims.
- **Case-study proof uses real fields only.** The site's `work-data.ts` has **no
  metrics** — so no "3× ROI"/view-count style numbers may appear. Verified in the
  source during design.
- Anything ungroundable becomes a visible `[source needed]` tag.
- **Publish is blocked** (server-side, reusing the existing guard) if any
  `[source needed]` / `REPLACE-ME` / `TODO` / `lorem ipsum` remains.

## SEO / AEO layer (§6)

Per generated page:

- **Meta title + description** tailored to the combo.
- **Canonical**: `https://www.thezyra.in/solutions/{slug}`.
- **JSON-LD**: `Service` (with `areaServed` when Geography is set),
  `FAQPage`, `BreadcrumbList`.
- **Internal links**: to each selected `/services/[slug]` and each cited
  `/work/[slug]`.
- **Thin/duplicate guardrails**: minimum word-count floor + a uniqueness signal
  in the auditor so near-identical combos don't ship boilerplate; flagged before
  publish.

## Slug & uniqueness (§7)

- Built deterministically from inputs, e.g.
  `ai-brand-films-for-fintech-brands-in-bengaluru`.
  Pattern: `{service-part?}-for-{industry?}-{in-geo?}`, lowercased, hyphenated,
  ASCII-folded, stop-words trimmed, length-capped.
- **Editable** in the UI before publish.
- **Collision handling**: checked against existing `lp-data.ts` slugs (fetched at
  publish time); a numeric suffix (`-2`, `-3`) is appended on collision.
- No `Date.now()`/random in library code — the caller supplies any nonce, matching
  the existing publisher contract.

## Site-repo rendering (§8)

On `~/Documents/GitHub/ZyraUpdated` (thezyra.in), added **once** as a scaffold
(first PR), then appended to per page:

- `src/lib/lp-data.ts` — `SolutionPage[]` + `getSolutionBySlug()`, mirroring the
  `blog-data.ts` / `work-data.ts` pattern.
- `src/app/solutions/[slug]/page.tsx` — renders the 8 sections in the existing
  design system, with `generateStaticParams`, `generateMetadata` (title, desc,
  canonical, OG), and the JSON-LD script tags.

## Publish flow (§9)

- Generalize the existing `publisher.ts` so it can target a configurable
  `{ dataPath, arraySymbol, serialize() }` — blog posts keep their current
  behavior; solutions append a `SolutionPage` literal into `lp-data.ts`.
- Flow unchanged in shape: read file on base branch → insert literal → new branch
  → commit → **open PR** (never main).
- Server-side placeholder guard rejects unresolved pages before PR creation.
- Operator reviews PR + preview before merge; page goes live only on merge.

## Types (new, in `src/lib/types.ts`)

```ts
interface SolutionInputs {
  industry: string;            // "" allowed if geography set
  geography: string;           // "" allowed if industry set
  serviceSlugs: string[];      // 0..N of the 5 services (optional)
  caseStudySlugs: string[];    // 1..N (required)
  cta: string;                 // default "Schedule a call"
}

type SolutionSectionType =
  | 'hero' | 'answer' | 'problem' | 'services'
  | 'proof' | 'process' | 'faq' | 'cta';

interface SolutionSection {
  type: SolutionSectionType;
  heading?: string;
  blocks: DraftBlock[];        // reuse existing DraftBlock union
}

interface SolutionPage {
  slug: string;
  h1: string;
  metaTitle: string;
  metaDescription: string;
  industry: string;
  geography: string;
  serviceSlugs: string[];
  caseStudySlugs: string[];
  cta: string;
  sections: SolutionSection[];
  faq: { q: string; a: string }[];
  schema: string;              // combined JSON-LD
  wordCount: number;
  sourceNeededCount: number;
  mode: SourceMode;
}
```

## New / changed files (scope)

**`zyra-blog-studio/`**
- `src/lib/types.ts` — add the types above.
- `src/lib/solutionsData.ts` — mirrored services + case-study catalog + suggestion
  lists for industry/geo datalists.
- `src/lib/modules/solutionSpec.ts` — `assembleSpec(inputs)`.
- `src/lib/modules/solutionGenerator.ts` — LLM prose fill per section.
- `src/lib/modules/solutionSchema.ts` — `buildSchema()`.
- `src/lib/util.ts` — add `buildSolutionSlug()` (or a small `slug.ts`).
- `src/lib/modules/publisher.ts` — generalize target (see §9).
- `app/api/solutions/generate/route.ts`, `app/api/solutions/publish/route.ts`.
- `app/page.tsx` — sidebar mode toggle.
- `app/components/solutions/*` — InputsPanel, Preview, AuditPanel, PublishBar.

**Site repo (via first scaffold PR):**
- `src/lib/lp-data.ts`, `src/app/solutions/[slug]/page.tsx`.

## Testing (Node built-in runner, `test/*.test.ts`)

- `buildSolutionSlug()` — combos, ASCII-folding, stop-word trim, collision suffix.
- `assembleSpec()` — validation (≥1 of industry/geo; ≥1 case study), service/case
  resolution, skeleton shape.
- `solutionSchema` — valid `Service`/`FAQPage`/`BreadcrumbList` JSON-LD;
  `areaServed` present only when geography set.
- Placeholder/publish-block guard — page with `[source needed]` is rejected.
- Publisher insert — appends a `SolutionPage` literal into a fixture `lp-data.ts`
  without breaking the array.

## Open decisions carried into implementation

1. **Site scaffold as a first PR** — `lp-data.ts` + `solutions/[slug]/page.tsx`
   must exist before any append PR. Planned as the first publish action.
2. **Proof without metrics** — confirmed: proof uses client + brief + category +
   tags + link only; no invented numbers.
