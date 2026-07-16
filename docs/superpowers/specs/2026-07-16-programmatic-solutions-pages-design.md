# Programmatic Solutions Pages — SEO/AEO landing pages from Industry × Geo × Service

**Date:** 2026-07-16
**Status:** Draft — **layout LOCKED** (Option E — Hybrid), awaiting review of the rest

## Locked template (authoritative reference)

The page layout is **decided and frozen**: **Option E — Hybrid**.

- **Approved reference:** `solutions-template-mockups/option-e-hybrid.html`
  (repo-relative to the ZYRA iCloud folder). This file is the **visual source of
  truth** for the implementation — match it, don't reinterpret it.
- **Decision record + rationale + rejected options:**
  `solutions-template-mockups/TEMPLATE-DECISION.md`
- **Tokens, approved copy, honesty rules:** `solutions-template-mockups/_SHARED-KIT.md`

Verified against the reference file: **14 body slots**, exactly **3 CTAs**
(hero, sticky bar, final band), valid `FAQPage` schema, and no price leak.

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
| **convert … click a CTA … schedule a call** | Primary goal = book a call | Exactly 3 "Schedule a Call" CTAs (hero, sticky bar, final band) → Calendly |
| **ask us to choose from the list of case studies … one or more** | Case-study selection is a **required step**, min 1 | UI blocks Generate until ≥1 case study is selected |
| **On click, the whole page should be generated** | Single action produces the full page | One "Generate" click assembles all sections |
| **unique url slug** | Deterministic, keyword-rich, collision-free | See §7 |

**Key correction from brainstorming:** case-study selection is **required
(minimum one)**, not optional. Service selection **is** optional.

## Goal

Turn the studio into a two-flow tool behind a **home screen with two cards**:

- **Blog** → the existing Blog Studio pipeline, relocated to `/blog`, unchanged.
- **Webpage** → a new flow at `/webpage` that turns (Industry and/or Geography)
  + (optional Services) + (≥1 Case Study) into a complete `/solutions/[slug]`
  landing page on thezyra.in — generated on a single click, SEO/AEO-optimized,
  grounded only in real Zyra data, and published via a GitHub PR (never direct
  to main).

## Non-goals (YAGNI)

- No bulk/CSV batch generation — one page per Generate click.
- No fabricated metrics or results (site case-study data has none — see §5).
- No A/B testing, analytics wiring, or live-editing of published pages here
  (GA4 lead events already exist site-wide; this feature only emits the CTAs).
- No new LLM providers, config, or auth — reuse Blog Studio's existing infra.

## Approach (approved)

Hybrid generation: a **fixed conversion/AEO skeleton** with **LLM-written prose**
per section, grounded in real structured data. Reuses Blog Studio's Claude
writer, config, SEO/GEO auditor, and GitHub-PR publisher. Delivered behind a new
**home screen with two cards** (Blog, Webpage), each flow on its own route, so
the existing blog pipeline is untouched.

## Placement & architecture

### Entry point: home screen with two cards

The studio root becomes a **launcher**, not the blog tool:

```
/            → Home. Two cards:
                 ┌─────────────┐   ┌─────────────┐
                 │   Blog      │   │  Webpage    │
                 │ research →  │   │ industry ×  │
                 │ write →     │   │ geo × svc → │
                 │ publish     │   │ landing pg  │
                 └─────────────┘   └─────────────┘
                       │                  │
/blog        ←─────────┘                  │
                 existing Blog Studio     │
                 (unchanged pipeline)     │
/webpage     ←────────────────────────────┘
                 new programmatic SEO flow
```

- `/` — new home screen. Two cards: **Blog** and **Webpage**. Each card carries a
  title, a one-line description of the flow, and navigates on click.
- `/blog` — the **existing Blog Studio, moved wholesale and otherwise
  unchanged**: same tabs, same pipeline, same `zyra-blog-studio:v1` localStorage
  key, same API routes. This is a relocation, not a rewrite.
- `/webpage` — the new programmatic SEO landing-page flow specified here.

**Naming note (deliberate):** the studio's internal route is `/webpage`; the
*published* pages live on the live site at `thezyra.in/solutions/[slug]`. Two
different apps — no collision — but the names differ on purpose: `/webpage` is
where the operator works, `/solutions` is the public URL namespace.

### Code organization

- Existing blog UI moves from `app/page.tsx` to `app/blog/page.tsx` with no
  behavioral change; a shared `app/components/ui.tsx` and the studio chrome
  (brand, provider chips, LLM check) are reused by both flows.
- New Webpage-only components, API routes, and modules. Reuses:
  `src/lib/providers/llm/*`, `src/lib/config.ts`, the SEO/GEO auditor
  (`src/lib/scoring/*`, `src/lib/modules/seoGeoAuditor.ts`), and the GitHub
  publisher (`src/lib/modules/publisher.ts`, generalized — see §9).

## Inputs (left panel, `/webpage`)

- **Industry segment** — free-text `<input>` + `<datalist>` suggestions.
- **Geography** — free-text `<input>` + `<datalist>` suggestions.
  - Validation: **≥1 of {Industry, Geography}** must be non-empty.
- **Services** — multi-select (checkboxes) over the 5 services from the site's
  `service-data.ts`, mirrored into a local constant (`src/lib/solutionsData.ts`).
  Optional (0..N).
- **Case studies** — multi-select checklist over the **22** projects from the
  site's `work-data.ts`, mirrored locally. Grouped by category; projects whose
  category matches a selected service are surfaced first. **Required: ≥1.**
  - **Only the first 3 selections are rendered** (see Edge case 2). The picker
    **must say so at selection time** — e.g. once a 4th is ticked, show
    "Only the first 3 are shown on the page, plus a View all link" — rather than
    silently discarding the operator's choices.
  - **Selection order is meaningful**: the first-picked case study becomes the
    featured one in the contact sheet.
- **Primary CTA label** — defaults to `Schedule a Call`.

Generate is enabled only when: (≥1 of industry/geo) **AND** (≥1 case study).

## Edge cases — DECIDED (user, 2026-07-16)

1. **No service selected** (services are optional):
   - H1 = **"AI Content Production for {Industry} in {Geo}"** — one neutral
     umbrella phrase covering all 5 services, so the H1 stays keyword-rich and
     predictable for every combo.
   - "What we deliver" widens to a concise **all-services frame**.
   - `{{eyebrow}}` drops the service segment → "{Industry} · {Geo}".
2. **5+ case studies selected:**
   - The contact sheet **caps at 3** (featured + 2 stacked) plus a **"View all"**
     link to `/work`. Extras are dropped rather than breaking the 58/42
     composition.
   - Consequence surfaced in the operator UI (see Inputs above).

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

## Page skeleton — Option E — Hybrid (LOCKED)

Top-to-bottom. **Fixed chrome** never varies; **slots** are generator-filled.
Authoritative rendering: `option-e-hybrid.html`.

| # | Section | Fixed chrome | Variable slots |
|---|---|---|---|
| 0 | **Nav** | Real `Navbar.tsx`: hamburger + "MENU" left, **centered `zyra-logo.webp` image**, empty right spacer. **No links, no CTA.** | — |
| 1 | **Hero** (88vh, 2-col) | Home-hero media treatment; grain; overlay gradient; 180px bottom fade; gold CTA; glass answer card; scroll indicator | `{{eyebrow}}` `{{h1}}` `{{subline}}` `{{trust_line}}` `{{aeo_answer}}` `{{proof_strip[]}}` |
| 2 | **Client strip** | Layout, hairlines, label | `{{client_strip[]}}` (derived from proof) |
| 3 | **Problem** (cream) | Curve divider; ghost numeral; 2-col | `{{problem_heading}}` `{{problem_stat}}` `{{problem_body[]}}` ×3 |
| 4 | **What we deliver** (cream, continuous) | "Everything / included." heading; divide-y list; ghost number column | `{{deliverables[]}}` |
| 5 | **Proof** (dark) | Curve divider; contact-sheet layout; badges; ghost indices; **honesty disclaimer** | `{{proof[]}}` |
| 6 | **Process** | Sticky left column; ghost numbers | `{{process[]}}` |
| 7 | **FAQ** | Accordion; `FAQPage` JSON-LD | `{{faq[]}}` (4–6) |
| 8 | **Final CTA** (cream) | Curve divider; "Let's make something / impossible."; gold pill + email | — |
| — | **Sticky CTA bar** | Slides in after hero; gold pill | context string |

**Shape:** 88vh cinematic hero split two columns (copy + gold CTA left, glass
"short answer" card with 3 real thumbnails right) → client strip → one continuous
cream stretch (Problem + Deliverables) → dark contact-sheet proof → process →
FAQ → cream final CTA.

**Head slots** (not `{{}}`-marked in the mockup): `slug` · `meta_title` ·
`meta_description` · `canonical` · `schema_jsonld` (Service + FAQPage +
BreadcrumbList; `areaServed` only when geography is set).

**Why Option E won:** it is the only layout where the AEO answer, real
case-study proof, and the CTA are **all above the fold together** — serving the
AI answer engine and the skeptical human at once — while the home-page hero still
does the emotional work in the first three seconds. Runner-up was Option C
(service-led): cheaper to ship (reuses `ServicePageTemplate` near-verbatim) but
buries the answer. Fall back to C only if speed to ship beats AEO.

## CTA rule (LOCKED)

Exactly **3 CTAs per page**: hero, sticky bar, final band. **None in the nav.**
- Label default: `Schedule a Call` → `https://calendly.com/marketersatzyra/30min`
- Each fires its own GA4 `lead_*` event (the site-wide GA4 lead tracking is
  already live — reuse those event names, don't invent new ones).

## Grounding & honesty rules (non-negotiable — generator must enforce)

- LLM receives Zyra's real context + the resolved service/case-study data and is
  instructed to never invent clients, numbers, or claims.
- **1. No fabricated metrics.** `work-data.ts` carries **no results**. Proof =
  client, title, category, year, tags, brief, thumbnail, `/work/[slug]` link.
  Nothing else. Verified in source.
- **2. Never state Zyra's own price.** Not in copy, not in the trust line, and
  **not in the `FAQPage` JSON-LD** — schema leaks to Google and AI answer engines
  even when invisible on the page. *This was a real near-miss caught in the
  mockups.* The `₹30–80L` **industry** figure is fine; it's the contrast the pitch
  rests on. (See the standing pricing rule.)
- **3. The proof disclaimer is fixed chrome and cannot be removed:**
  > Selected from Zyra's full body of work. Not all projects shown are fintech or
  > Bengaluru-based — each links to its full case study.

  *(Industry/geo words in that line are slot-filled per combo.)* Any combo can
  select case studies that don't match its own H1 — e.g. Fintech × Bengaluru,
  where only Goodscore is fintech and none are Bengaluru projects. Without this
  line the page implies client relationships and geographies that do not exist.
  **Proof honesty is structural here, not cosmetic.**
- **4. Never label proof by the page's own industry/geo** (e.g. "Our Fintech
  clients in Bengaluru"). Use **"Selected work"**.
- Anything ungroundable becomes a visible `[source needed]` tag.
- **Publish is blocked** (server-side, reusing the existing guard) if any
  `[source needed]` / `REPLACE-ME` / `TODO` / `lorem ipsum` remains. **Extend the
  guard to reject any page whose copy or JSON-LD contains Zyra's own price.**

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

## Design-system truths (verified — do NOT trust `globals.css`)

Found during the template session and **independently verified in source**:

- **`globals.css` is STALE.** It declares `--color-gold: #FFFFFF` and strict
  monochrome, but the live site ships a **gold `#C9A96E`** hero CTA
  (`src/components/home/HeroSection.tsx:128`, `src/components/work/LogoTicker.tsx:38`)
  and `ServicePageTemplate` alternates black with **cream `#F5F4F0`** panels via
  SVG curve dividers. **The components are the truth, not the CSS file.**
  Approved: gold CTA + cream panels. *(Fixing the variable in the site repo is
  out of scope here — tracked as a follow-up.)*
- **Nav is NOT wordmark + links + CTA.** The real `Navbar.tsx` is hamburger +
  "MENU" left, a **centered `zyra-logo.webp` image**, and an empty right spacer.
  No links, no CTA in the nav.
- **`work-data.ts` has 22 projects, not 24.** *(This spec previously said 24 in
  two places — corrected. The original miscount came from a grep that also
  matched the `slug: string` interface line and the `getProjectBySlug` signature.)*
- **Mixed aspect ratios are structural.** Brand Films are 16:9; Micro Drama /
  Social / Ad Creative are 9:16. Option E crops via `object-fit: cover`.

## Site-repo rendering (§8)

On `~/Documents/GitHub/ZyraUpdated` (thezyra.in), added **once** as a scaffold
(first PR), then appended to per page:

- `src/lib/lp-data.ts` — `SolutionPage[]` + `getSolutionBySlug()`, mirroring the
  `blog-data.ts` / `work-data.ts` pattern.
- `src/app/solutions/[slug]/page.tsx` — renders the **locked Option E — Hybrid**
  layout (see the skeleton table above; `option-e-hybrid.html` is the visual
  source of truth), with `generateStaticParams`, `generateMetadata` (title, desc,
  canonical, OG), and the JSON-LD script tags. Recomposes existing components
  (`ServicePageTemplate`, `FAQ`, `ProcessSteps`, `SectionHeader`, home
  `HeroSection` treatment, `LogoTicker`, `LazyVideo`/`LazyCFIframe`) rather than
  redesigning.

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
  cta: string;                 // default "Schedule a Call"
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
- `app/page.tsx` — **replaced** by the new home screen (two cards: Blog, Webpage).
- `app/blog/page.tsx` — **moved** from the current `app/page.tsx`, unchanged
  behavior (same tabs, pipeline, and `zyra-blog-studio:v1` storage key).
- `app/components/HomeCards.tsx` — the two launcher cards.
- `app/webpage/page.tsx` — the new flow's screen.
- `app/components/webpage/*` — InputsPanel, Preview, AuditPanel, PublishBar.

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
- **Blog regression** — the existing blog publisher/pipeline tests must still
  pass unchanged after the `app/page.tsx` → `app/blog/page.tsx` move, proving the
  relocation is behavior-preserving.

## Open decisions carried into implementation

1. **Site scaffold as a first PR** — `lp-data.ts` + `solutions/[slug]/page.tsx`
   must exist before any append PR. Planned as the first publish action.
2. ~~Proof without metrics~~ — **RESOLVED**: proof uses client + brief +
   category + tags + thumbnail + link only; no invented numbers. Now a
   non-negotiable rule above.
3. ~~Template/layout~~ — **RESOLVED**: Option E — Hybrid, locked.
   `option-e-hybrid.html` is the visual source of truth.
4. ~~Edge cases (no service / 5+ case studies)~~ — **RESOLVED**, see above.

## Follow-ups (out of scope here — site repo, non-blocking)

- `--color-gold: #FFFFFF` in `globals.css` contradicts the shipped gold
  `#C9A96E` CTA. Worth fixing the variable so future work stops inheriting the
  stale value. Does not block this feature (we match the components).
- Stale "verified ₹60k" reference at
  `docs/superpowers/specs/2026-07-14-topic-synthesis-design.md:37` — inert
  documentation; the live writer grounding never carried the price. Should be
  scrubbed so no future session treats it as a fact to state.
