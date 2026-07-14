# Zyra Blog Studio

An internal tool that automates Zyra's blog-writing workflow for [thezyra.in](https://www.thezyra.in): **research a topic space → get recommended topics with justification → pick one → generate a brief → write a human-sounding, SEO + GEO/AEO-optimised draft → audit it → export CMS-ready assets.**

> **Live (internal):** https://blog-studio-b82efswh9-zyras-projects-c775ae8c.vercel.app — hosted on Vercel behind Deployment Protection (Vercel Authentication), since it carries live API keys. Deploy notes: [`DEPLOY.md`](DEPLOY.md).
>
> _That link points at one specific deployment; for a URL that always tracks the latest deploy, use the project's production domain from Vercel → Project → Domains._

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
3. **Recommended Topics** — the demand signals (Reddit/X/PAA/keywords/gaps) are **synthesized by an LLM into real, publishable blog titles + a one-line angle** — never raw social posts pasted verbatim. Each candidate is scored on **Audience 30 / Demand 25 / Authority 20 / Commercial 15 / Gap 10** with a plain-English **justification**; the best is badged **Recommended**. You **pick one** → unlocks Part 2.

**Part 2 — Write the blog**
4. **Brief** — titles, meta, slug, keywords, question-led outline, internal links to Zyra service pages, FAQ, featured-snippet answer, GEO/AEO answer blocks.
5. **Draft** — `blogGenerator` writes the draft as **an expert AI filmmaker**: it's grounded in a curated *AI Filmmaking Playbook* (`src/lib/aiFilmKnowledge.ts`) so posts name the real tools (Veo, Kling, Runway, Flux, Nano Banana Pro, ElevenLabs, Sync.so…) and walk the actual workflow — not generic "AI tools" prose. A separate `humanizer` pass then rewrites for human rhythm (burstiness, contractions, banned-phrase removal) **without changing facts**.
6. **SEO/GEO Checklist** — two separate scores (SEO + GEO/AEO) with fixes, a human-voice gate, and a **Publishing preflight** (robots.txt / sitemap / AI-crawler access / schema on the live site).
7. **Export** — Markdown, HTML, meta tags, FAQ JSON-LD, blog brief JSON, **CMS-ready copy** (a `BlogPost` object that pastes into thezyra.in's `src/lib/blog-data.ts`), and a **Publish → open pull request** button (see below).

Everything persists to `localStorage`, so you can close the tab and resume.

## Testing the live Claude writer

The draft is written by **Claude Sonnet** when a key is present; otherwise a coherent mock stands in. To test the live path:

1. Add your key to `.env` (never paste it in chat):
   ```bash
   ANTHROPIC_API_KEY=sk-ant-...
   CLAUDE_MODEL_WRITER=claude-sonnet-5   # override if the id differs for your account
   OPENAI_API_KEY=sk-...                 # optional — cheap steps (expansion/clustering)
   ```
2. Restart the server (`npm run build && npm start`, or `npm run dev`).
3. In the sidebar, click **"Check writer connection"** — it pings the API and reports `live ✓ (model)` or the exact error (bad key / wrong model id) *before* you run a generation.
4. Run a topic through to the **Draft** tab. The header badge reads `live` (not `mock`), and Claude's prose is parsed into clean blocks (tables, FAQ, no markdown artifacts). The humanizer + audit still run on top.

If a live call fails mid-generation, the Draft tab shows a **warning banner** with the error and falls back to the mock — it never silently pretends the key worked.

## Publishing to thezyra.in

The Export tab has a **"Generate hero image"** button (OpenAI `gpt-image-1` when a key is set; a deterministic branded SVG sample otherwise) and an **"Open pull request →"** button. With a `GITHUB_TOKEN` set, publish:
1. reads `src/lib/blog-data.ts` on the target repo's default branch,
2. inserts the generated `BlogPost` as the newest entry in `ALL_POSTS`,
3. commits it to a fresh `blog/<slug>-<id>` branch (**plus the hero image at `public/posters/<slug>.png`** when one was generated, with the post's `poster` pointing at it), and
4. opens a **pull request** — and returns the PR link.

It **never commits to the default branch** — nothing goes live until you review, swap the placeholder poster, and merge (Vercel then deploys). Defaults target `toolsatZyra/ZyraUpdated` (`master`, `src/lib/blog-data.ts`); override via `PUBLISH_REPO` / `PUBLISH_BASE_BRANCH` / `PUBLISH_BLOG_DATA_PATH`. Without a token the button returns a clear "not configured" message.

> **Two different destinations, don't conflate them:** this repo (the *studio tool*) is hosted on **Vercel**; the *blog posts it produces* are published to **www.thezyra.in** via a PR into the separate `ZyraUpdated` repo.

---

## Deployment (Vercel)

Hosted on Vercel from this repo's `main` branch. Full guide: [`DEPLOY.md`](DEPLOY.md). The essentials:

- **Use Vercel Pro** — the `write` and `image` routes run up to 120s; Hobby (free) caps functions at 60s and the build fails.
- Add every key from [`.env.example`](.env.example) as a **Vercel Environment Variable** (Vercel never uses your local `.env`).
- **Enable Deployment Protection → Vercel Authentication** — it carries live keys that spend money and can open PRs; don't leave it public.
- Verify a live deploy with the debug endpoints: `POST /api/llm-check`, `/api/serp-check`, `/api/reddit-check`, `/api/x-check`, `/api/ads-check`, `/api/publish-check`.

---

## Providers & which keys to add first

All keys are **optional** — missing = mock. See [`docs/API_RECOMMENDATIONS.md`](docs/API_RECOMMENDATIONS.md) for full detail and setup steps.

| Function | Provider | Env |
|---|---|---|
| Keyword research | Google Ads Keyword Planner | `GOOGLE_ADS_*` |
| SERP + PAA + autocomplete | DataForSEO | `DATAFORSEO_LOGIN`, `DATAFORSEO_PASSWORD` |
| **Reddit questions** | **DataForSEO SERP** (the reddit.com threads Google ranks — free, no extra key) | — (uses `DATAFORSEO_*`) |
| X questions | twitterapi.io | `TWITTERAPI_KEY` |
| Cheap LLM steps (topic synthesis, category, expansion) | OpenAI | `OPENAI_API_KEY` |
| Writing (draft) | Claude Sonnet 5 | `ANTHROPIC_API_KEY` |
| Publish (open PR) | GitHub | `GITHUB_TOKEN` |

> **Reddit note:** Reddit topics are mined for free from the DataForSEO SERP call — no Reddit API needed. The old Apify `trudax/reddit-scraper-lite` adapter (`APIFY_TOKEN`) remains as an **off-by-default deep fallback** (`REDDIT_DEEP_FALLBACK=1`); it's slow and credit-burning, so it's not used in the normal path. Anonymous Reddit JSON is fully blocked by Reddit, so there's no free direct-Reddit path.

**Add first:** `ANTHROPIC_API_KEY` + `OPENAI_API_KEY` (real writing) and `DATAFORSEO_*` (real SERP **and Reddit topics**). These three unblock most of the tool with almost no setup.
**Add when ready:** `TWITTERAPI_KEY` (X questions), `GITHUB_TOKEN` (publish PRs), `GOOGLE_ADS_*` (needs an approved developer token + OAuth refresh token — the slow one; returns ad competition + volume ranges, not SEO difficulty, and stays `null` until Basic access is approved).
**Never paste keys into chat or commit `.env`** — it's git-ignored.

---

## Principles baked in

- **Never fabricate Zyra's numbers.** No invented prices, timelines, or client outcomes — only Zyra's site-verified proof points are asserted. The writer makes unverifiable points qualitatively instead of inventing figures, and the publish gate blocks any draft containing placeholders. Vetted **tool/workflow facts from the AI Filmmaking Playbook** (what each tool is best at) *are* stated as fact — that's domain expertise, not fabrication — but exact tool prices/versions/benchmarks are avoided so posts don't date. See [`docs/zyra-context.md`](docs/zyra-context.md).
- **Sounds human, not AI.** Burstiness + banned-phrase filtering, not detector-gaming. See [`docs/WRITING_PLAYBOOK.md`](docs/WRITING_PLAYBOOK.md).
- **Evidence-safe.** Costs shown are app-computed estimates, not quoted prices; GEO tactics are directional guidance.
- **Provider-swappable.** Every source is an adapter behind a registry; failures degrade to mock with a visible badge — never a hard crash.

---

## Project structure

```
app/                  Next.js UI (page + components) + API routes
  api/                research · write · preflight · publish · image
                      debug checks: llm-check · serp-check · reddit-check · x-check · ads-check · publish-check
  components/          InputsPanel + the 6 tabs + shared ui
src/lib/
  modules/            workflow modules — topicExpander · questionDiscovery · topicSynthesizer ·
                      topicScorer · categoryClassifier · briefGenerator · blogGenerator ·
                      humanizer · seoGeoAuditor · exporter · publisher · imageGenerator
  providers/          registry + adapters (googleads, dataforseo [SERP + Reddit], reddit, twitterapi, apify, llm) + mock
  scoring/            seoChecks · geoChecks · humanVoice · bannedPhrases
  export/             markdown · html · metaTags · faqSchema · cmsCopy
  aiFilmKnowledge.ts  curated AI-filmmaking playbook the writer is grounded in (refresh periodically)
  zyraContext.ts      verified positioning, services, proof points, entities
  config.ts           reads env, decides which providers are live
  types.ts            shared contracts
docs/                 PRODUCT_SPEC · API_RECOMMENDATIONS · WRITING_PLAYBOOK · zyra-context · specs/
DEPLOY.md             Vercel hosting guide
test/                 unit tests
```

## Docs

- [`docs/PRODUCT_SPEC.md`](docs/PRODUCT_SPEC.md) — what it is (product)
- [`docs/superpowers/specs/2026-07-13-zyra-blog-studio-design.md`](docs/superpowers/specs/2026-07-13-zyra-blog-studio-design.md) — how it's built (technical design)
- [`docs/API_RECOMMENDATIONS.md`](docs/API_RECOMMENDATIONS.md) — providers, costs, setup order
- [`docs/WRITING_PLAYBOOK.md`](docs/WRITING_PLAYBOOK.md) — how it writes human-sounding blogs

## Not built yet (bolt-on later)

Scheduled multi-post runs · SQLite/multi-user persistence · auth. The pipeline is structured so these add on without rework. *(PR-based publishing and hero-image generation are now built — see above.)*
