# Zyra Studio

An internal tool that builds two things for [thezyra.in](https://www.thezyra.in). The first screen asks which:

| | **Blog** → `/blog` | **Webpage** → `/webpage` |
|---|---|---|
| **Builds** | A blog post at `thezyra.in/blog/<slug>` | A programmatic SEO landing page at `thezyra.in/solutions/<industry>/<geography>` |
| **Flow** | research → recommend → write → edit → audit → publish | industry × geography × service → generate → audit → publish |
| **Inputs** | a topic/seed idea | industry and/or geography, optional services, ≥1 case study |
| **Publishes by** | PR into `blog-data.ts` | PR into `lp-data.ts` |

Both **open a pull request — neither ever commits to the default branch.** Nothing reaches the live site until you merge.

> **Live (internal):** hosted on Vercel behind Deployment Protection (Vercel Authentication), since it carries live API keys. Deploy notes: [`DEPLOY.md`](DEPLOY.md).

The Blog flow runs **fully on mock data with zero API keys**. The Webpage flow needs `ANTHROPIC_API_KEY` for real copy; without it you get template copy, clearly badged `mock`.

---

## Quick start

```bash
npm install
npm run dev          # http://localhost:3000  — the first screen is the launcher
npm test             # unit tests (tsx + node:test)
npm run build        # production build
```

> This project lives in iCloud. `node_modules` is symlinked to `node_modules.nosync` so iCloud doesn't sync it — run `npm install` and it's handled.

---

## Blog — `/blog`

**Part 1 — find the topic**
1. **Inputs** — topic/seed, editable Zyra context, audience, goal, tone, word count, CTA, optional competitor URLs and Reddit/X notes.
2. **Research** — clusters, Reddit/X questions, People-Also-Ask, autocomplete, related keywords, competitor gaps, intent. Each badged `mock`/`live`.
3. **Recommended Topics** — demand signals are **synthesized by an LLM into publishable titles + an angle**, never raw social posts pasted verbatim. Scored **Audience 30 / Demand 25 / Authority 20 / Commercial 15 / Gap 10** with a plain-English justification. Pick one → unlocks Part 2.

**Part 2 — write it**
4. **Brief** — titles, meta, slug, keywords, question-led outline, internal links, FAQ, snippet + GEO/AEO answer blocks.
5. **Draft** — written by **Claude with live web search**, driven by a research-grounded system prompt ([`src/lib/writerSystemPrompt.ts`](src/lib/writerSystemPrompt.ts)) that requires current evidence and returns `RESEARCH_REQUIRED` rather than inventing facts. A `humanizer` pass then rewrites for human rhythm **without changing facts**.
6. **Edit** — the draft is **editable in place**: click any block to rewrite it, add/delete/reorder blocks, edit the FAQ. Every edit re-derives the audit and exports, so **Publish always ships exactly what you see** (see *Principles*).
7. **SEO/GEO Checklist** — separate SEO and GEO/AEO scores with fixes, a human-voice gate, and a site-level publishing preflight.
8. **Export** — Markdown, HTML, meta tags, FAQ JSON-LD, brief JSON, CMS-ready `BlogPost`, and **Open pull request →**.

## Webpage — `/webpage`

Programmatic SEO landing pages, one per market segment.

1. **Inputs** — **industry and/or geography** (free text, at least one required), **services** (optional multi-select of the 5 real services), **case studies** (**required, one or more**, from the 22 real projects).
2. **Generate** — one click builds the whole page. The LLM's surface is deliberately small:
   - **derived** (pure functions): slug, H1, eyebrow, trust line, proof
   - **real data**: deliverables, process, stats — from the site's own service pages
   - **LLM**: subline, AEO answer, problem copy, FAQ, meta
3. **Preview** — **View page ↗** opens the *real* page in a new tab, rendered by the **site's own template**, before any PR exists.
4. **Publish** — appends to `lp-data.ts` on a branch and opens a PR. Review it on the PR's Vercel preview, then merge.

**URL:** `/solutions/{industry}/{geography}` — e.g. `/solutions/fintech/bengaluru`. Only one input is required, so a page may be one segment (`/solutions/fintech`) or two. **The service is deliberately not in the URL**: industry × geography is the unique key, so a segment gets one strong page rather than near-duplicates competing for the same query. Generating the same segment twice renames to `…-2` rather than overwriting the live page.

**The rules the generator enforces** (in code, not just the prompt — see [`src/lib/solutions/guards.ts`](src/lib/solutions/guards.ts)):

- **No money anywhere** — no Zyra price *and no industry cost figure*; not in copy, meta, or JSON-LD. It contrasts on **time**, never cost. This is checked against the serialized schema too: a price in the FAQ reaches Google via `FAQPage` JSON-LD while staying invisible on the page.
- **No fabricated metrics** — `work-data.ts` has no results, so any number about a client outcome was invented.
- **The proof disclaimer is fixed chrome** — any combination can select case studies that match neither its industry nor its geography, so every page carries a non-removable line saying so.
- **Delivery time is per-service** — never one global number. OTT keeps its own 8–10 weeks.

Both flows persist to `localStorage` under **separate keys**, so they never disturb each other.

---

## Testing the live writer

1. Add your key to `.env` (never paste it in chat):
   ```bash
   ANTHROPIC_API_KEY=sk-ant-...
   CLAUDE_MODEL_WRITER=claude-sonnet-5   # override if the id differs for your account
   OPENAI_API_KEY=sk-...                 # optional — cheap steps (expansion/clustering)
   ```
2. Restart the server.
3. Sidebar → **Check writer connection** — pings the API and reports `live ✓ (model)` or the exact error, *before* you spend a generation.

If a live call fails, the UI shows a **warning banner** with the error and falls back to mock — it never silently pretends the key worked.

## Publishing to thezyra.in

Both flows need `GITHUB_TOKEN`. Each one:

1. reads the target data file on the default branch,
2. inserts the new entry,
3. commits to a fresh branch, and
4. opens a **pull request**, returning the link.

**Neither commits to the default branch.** Defaults target `toolsatZyra/ZyraUpdated` (`master`); override with `PUBLISH_REPO` / `PUBLISH_BASE_BRANCH` / `PUBLISH_BLOG_DATA_PATH` / `PUBLISH_LP_DATA_PATH`. Verify the token end-to-end with `POST /api/publish-check`.

> **Two destinations, don't conflate them:** this repo (the *studio*) deploys to **Vercel**; what it *produces* is published to **www.thezyra.in** via a PR into the separate `ZyraUpdated` repo.

**Webpage prerequisite:** `/solutions` must exist on the site first (`lp-data.ts` + the `/solutions/[...path]` route). Until then, publish fails with an explicit message telling you to merge it.

---

## Deployment (Vercel)

Hosted from this repo's `main`. Full guide: [`DEPLOY.md`](DEPLOY.md).

- **Use Vercel Pro** — `write` and `image` run up to 120s; Hobby caps at 60s.
- Add every key from [`.env.example`](.env.example) as a **Vercel Environment Variable**.
- **Enable Deployment Protection → Vercel Authentication** — it carries keys that spend money and can open PRs.
- Set `NEXT_PUBLIC_SITE_URL=https://www.thezyra.in` so **View page** works from the deployed studio.
- Verify a deploy: `POST /api/llm-check`, `/api/serp-check`, `/api/reddit-check`, `/api/x-check`, `/api/ads-check`, `/api/publish-check`.

---

## Providers & which keys to add first

All keys are **optional** — missing = mock. Detail: [`docs/API_RECOMMENDATIONS.md`](docs/API_RECOMMENDATIONS.md).

| Function | Provider | Env |
|---|---|---|
| Keyword research | Google Ads Keyword Planner | `GOOGLE_ADS_*` |
| SERP + PAA + autocomplete | DataForSEO | `DATAFORSEO_LOGIN`, `DATAFORSEO_PASSWORD` |
| **Reddit questions** | **DataForSEO SERP** (the reddit.com threads Google ranks — free, no extra key) | — (uses `DATAFORSEO_*`) |
| X questions | twitterapi.io | `TWITTERAPI_KEY` |
| Cheap LLM steps | OpenAI | `OPENAI_API_KEY` |
| Writing (blog draft + landing-page copy) | Claude Sonnet 5 | `ANTHROPIC_API_KEY` |
| Publish (open PR) | GitHub | `GITHUB_TOKEN` |

**Add first:** `ANTHROPIC_API_KEY` + `OPENAI_API_KEY` and `DATAFORSEO_*`.
**Add when ready:** `TWITTERAPI_KEY`, `GITHUB_TOKEN`, `GOOGLE_ADS_*` (slowest to set up).
**Never paste keys into chat or commit `.env`** — it's git-ignored.

---

## Principles baked in

- **Never fabricate Zyra's numbers.** No invented prices, timelines, or client outcomes. The writer states only site-verified proof points; landing pages state no money at all. Publishing is **blocked** on any placeholder or banned figure.
- **Rules live in code, not prompts.** A prompt is persuasion; [`guards.ts`](src/lib/solutions/guards.ts) is enforcement, and it runs again server-side before any PR is created.
- **Publish ships what you see.** Publishing sends `exports.blogPost`, not `draft` — so every hand edit re-derives the audit and exports. A regression test pins it.
- **One implementation of the design.** The studio never re-creates the site's landing-page layout; **View page** renders the site's own template, so a preview can't drift from what publishes.
- **Sounds human, not AI.** Burstiness + banned-phrase filtering, not detector-gaming. See [`docs/WRITING_PLAYBOOK.md`](docs/WRITING_PLAYBOOK.md).
- **Provider-swappable.** Every source is an adapter behind a registry; failures degrade to mock with a visible badge — never a silent crash.

---

## Project structure

```
app/
  page.tsx            the launcher — Blog | Webpage
  blog/               the blog flow (unchanged pipeline)
  webpage/            the programmatic landing-page flow
  api/                research · write · preflight · publish · image
                      solutions/generate · solutions/publish
                      debug: llm-check · serp-check · reddit-check · x-check · ads-check · publish-check
  components/         InputsPanel + blog tabs + shared ui
    webpage/          inputs panel · preview · publish bar · view-page button
src/lib/
  modules/            topicExpander · questionDiscovery · topicSynthesizer · topicScorer ·
                      categoryClassifier · briefGenerator · blogGenerator · humanizer ·
                      seoGeoAuditor · exporter · publisher · imageGenerator ·
                      solutionGenerator · solutionPublisher
  solutions/          naming (slug/H1) · delivery · disclaimer · schema · guards · parseJson
  providers/          registry + adapters (googleads, dataforseo, reddit, twitterapi, apify, llm) + mock
  scoring/            seoChecks · geoChecks · humanVoice · bannedPhrases
  export/             markdown · html · metaTags · faqSchema · cmsCopy
  draftOps.ts         pure block edits for the draft editor
  rederive.ts         recompute audit + exports from an edited draft
  solutionsData.ts    GENERATED mirror of the site's 5 services + 22 case studies
  writerSystemPrompt.ts  the research-grounded blog writer prompt
  zyraContext.ts      verified positioning, services, proof points
  categories.ts       pure category constants (kept free of provider imports)
  config.ts · types.ts
docs/                 PRODUCT_SPEC · API_RECOMMENDATIONS · WRITING_PLAYBOOK · zyra-context · specs/ · plans/
test/                 unit tests
```

## Docs

- [`docs/PRODUCT_SPEC.md`](docs/PRODUCT_SPEC.md) — what it is (product)
- [`docs/superpowers/specs/2026-07-16-programmatic-solutions-pages-design.md`](docs/superpowers/specs/2026-07-16-programmatic-solutions-pages-design.md) — the Webpage flow's design + every decision
- [`docs/superpowers/specs/2026-07-13-zyra-blog-studio-design.md`](docs/superpowers/specs/2026-07-13-zyra-blog-studio-design.md) — the Blog flow's design
- [`docs/API_RECOMMENDATIONS.md`](docs/API_RECOMMENDATIONS.md) — providers, costs, setup order
- [`docs/WRITING_PLAYBOOK.md`](docs/WRITING_PLAYBOOK.md) — how it writes human-sounding blogs

## Not built yet

Scheduled multi-post runs · SQLite/multi-user persistence · auth · `/solutions` pages in the sitemap (they aren't discoverable by search until added).
