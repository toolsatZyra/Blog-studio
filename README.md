# Zyra Blog Studio

An internal tool that automates Zyra's blog-writing workflow for [thezyra.in](https://www.thezyra.in): **research a topic space → get recommended topics with justification → pick one → generate a brief → write a human-sounding, SEO + GEO/AEO-optimised draft → audit it → export CMS-ready assets.**

It runs **fully on realistic mock data with zero API keys**, so you can click through the entire workflow immediately. Each data source flips to **live** the moment its key is added to `.env` — no code changes.

---

## Quick start

```bash
npm install
npm run dev          # http://localhost:3000  — the first screen IS the tool
```

That's it — no keys needed. To go live later, copy `.env.example` → `.env` and fill in the keys you have (see below).

```bash
npm run build        # production build
npm start            # run the production build
npm test             # unit tests (tsx + node:test)
```

> This project lives in iCloud. `node_modules` is symlinked to `node_modules.nosync` so iCloud doesn't sync it — run `npm install` and it's handled.

---

## How it works (two parts)

**Part 1 — Find the topic**
1. **Inputs** — topic/seed, editable Zyra context, audience (industries/geographies/roles), goal, tone, word count, CTA, optional competitor URLs, optional Reddit/X notes or CSV.
2. **Research** — topic clusters, Reddit/X questions, Google People-Also-Ask, autocomplete, related keywords, competitor gaps, intent. Each item badged `mock`/`live`.
3. **Recommended Topics** — every candidate scored on **Audience 30 / Demand 25 / Authority 20 / Commercial 15 / Gap 10** with a plain-English **justification**; the best is badged **Recommended**. You **pick one** → unlocks Part 2.

**Part 2 — Write the blog**
4. **Brief** — titles, meta, slug, keywords, question-led outline, internal links to Zyra service pages, FAQ, featured-snippet answer, GEO/AEO answer blocks.
5. **Draft** — `blogGenerator` writes the draft, then a separate `humanEditor` pass rewrites it for human rhythm (burstiness, contractions, banned-phrase removal) **without changing facts**.
6. **SEO/GEO Checklist** — two separate scores (SEO + GEO/AEO) with fixes, a human-voice gate, and a **Publishing preflight** (robots.txt / sitemap / AI-crawler access / schema on the live site).
7. **Export** — Markdown, HTML, meta tags, FAQ JSON-LD, blog brief JSON, **CMS-ready copy** (a `BlogPost` object that pastes into thezyra.in's `src/lib/blog-data.ts`), and a **Publish → open pull request** button (see below).

Everything persists to `localStorage`, so you can close the tab and resume.

## Publishing to thezyra.in

The Export tab has a **"Generate hero image"** button (OpenAI `gpt-image-1` when a key is set; a deterministic branded SVG sample otherwise) and an **"Open pull request →"** button. With a `GITHUB_TOKEN` set, publish:
1. reads `src/lib/blog-data.ts` on the target repo's default branch,
2. inserts the generated `BlogPost` as the newest entry in `ALL_POSTS`,
3. commits it to a fresh `blog/<slug>-<id>` branch (**plus the hero image at `public/posters/<slug>.png`** when one was generated, with the post's `poster` pointing at it), and
4. opens a **pull request** — and returns the PR link.

It **never commits to the default branch** — nothing goes live until you review, swap the placeholder poster, and merge (Vercel then deploys). Defaults target `toolsatZyra/ZyraUpdated` (`master`, `src/lib/blog-data.ts`); override via `PUBLISH_REPO` / `PUBLISH_BASE_BRANCH` / `PUBLISH_BLOG_DATA_PATH`. Without a token the button returns a clear "not configured" message.

---

## Providers & which keys to add first

All keys are **optional** — missing = mock. See [`docs/API_RECOMMENDATIONS.md`](docs/API_RECOMMENDATIONS.md) for full detail and setup steps.

| Function | Provider | Env |
|---|---|---|
| Keyword research | Google Ads Keyword Planner | `GOOGLE_ADS_*` |
| SERP + PAA + autocomplete | DataForSEO | `DATAFORSEO_LOGIN`, `DATAFORSEO_PASSWORD` |
| Reddit questions | Apify | `APIFY_TOKEN` |
| X questions | twitterapi.io | `TWITTERAPI_KEY` |
| Cheap LLM steps | OpenAI | `OPENAI_API_KEY` |
| Writing (draft + polish) | Claude Sonnet 5 | `ANTHROPIC_API_KEY` |
| Publish (open PR) | GitHub | `GITHUB_TOKEN` |

**Add first:** `ANTHROPIC_API_KEY` + `OPENAI_API_KEY` (real writing) and `DATAFORSEO_*` (real SERP). These three unblock most of the tool with almost no setup.
**Add when ready:** `GOOGLE_ADS_*` (needs an approved developer token + OAuth refresh token — the slow one; returns ad competition + volume ranges, not SEO difficulty), `APIFY_TOKEN`, `TWITTERAPI_KEY`.
**Never paste keys into chat or commit `.env`** — it's git-ignored.

---

## Principles baked in

- **Never fabricate.** No invented numbers, prices, timelines, or client outcomes. Only Zyra's site-verified proof points are asserted; unsourced external stats are tagged `[source needed]`. See [`docs/zyra-context.md`](docs/zyra-context.md).
- **Sounds human, not AI.** Burstiness + banned-phrase filtering, not detector-gaming. See [`docs/WRITING_PLAYBOOK.md`](docs/WRITING_PLAYBOOK.md).
- **Evidence-safe.** Costs shown are app-computed estimates, not quoted prices; GEO tactics are directional guidance.
- **Provider-swappable.** Every source is an adapter behind a registry; failures degrade to mock with a visible badge — never a hard crash.

---

## Project structure

```
app/                  Next.js UI (page + components) + API routes
  api/                research · write · preflight
  components/          InputsPanel + the 6 tabs + shared ui
src/lib/
  modules/            the 11 workflow modules
  providers/          registry + adapters (googleads, dataforseo, apify, twitterapi, llm) + mock
  scoring/            seoChecks · geoChecks · humanVoice · bannedPhrases
  export/             markdown · html · metaTags · faqSchema · cmsCopy
  zyraContext.ts      verified positioning, services, proof points, entities
  types.ts            shared contracts
docs/                 PRODUCT_SPEC · API_RECOMMENDATIONS · WRITING_PLAYBOOK · zyra-context · design spec
test/                 unit tests
```

## Docs

- [`docs/PRODUCT_SPEC.md`](docs/PRODUCT_SPEC.md) — what it is (product)
- [`docs/superpowers/specs/2026-07-13-zyra-blog-studio-design.md`](docs/superpowers/specs/2026-07-13-zyra-blog-studio-design.md) — how it's built (technical design)
- [`docs/API_RECOMMENDATIONS.md`](docs/API_RECOMMENDATIONS.md) — providers, costs, setup order
- [`docs/WRITING_PLAYBOOK.md`](docs/WRITING_PLAYBOOK.md) — how it writes human-sounding blogs

## Not built yet (bolt-on later)

Scheduled multi-post runs · SQLite/multi-user persistence · auth. The pipeline is structured so these add on without rework. *(PR-based publishing and hero-image generation are now built — see above.)*
