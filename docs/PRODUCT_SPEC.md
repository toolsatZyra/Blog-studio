# Zyra Blog Studio — Product Spec

**Version:** 1.0 (2026-07-13) · **Owner:** Zyra (thezyra.in) · **Type:** Internal tool
**Related docs:** [API_RECOMMENDATIONS.md](./API_RECOMMENDATIONS.md) · [WRITING_PLAYBOOK.md](./WRITING_PLAYBOOK.md) · [zyra-context.md](./zyra-context.md) · [design spec](./superpowers/specs/2026-07-13-zyra-blog-studio-design.md)

---

## 1. Purpose

An internal web app that automates Zyra's blog-writing workflow so the team can update thezyra.in regularly with credible, human-sounding, SEO + GEO/AEO-optimised posts. It works in **two parts**: **(1) Find the topic** — research the space and **recommend the best-suited topics with justification**, from which you pick one; **(2) Write the blog** — generate a brief → write a human draft → audit for SEO/GEO/AEO → export CMS-ready assets for the chosen topic.

It runs fully on realistic **mock data with zero API keys** (so anyone can try it immediately), and each data source switches to **live** the moment its key is added.

## 2. Who uses it & why

- **Zyra content/marketing team** — turn a rough idea into a publish-ready, on-brand blog in one sitting, without hand-crafting SEO/GEO structure each time.
- **Goal:** consistent, regular, credible website updates — not one-off hero pieces.

## 3. Non-negotiables (what makes this trustworthy)

1. **Never fabricate.** No invented numbers, prices, timelines, case studies, or client outcomes. Zyra proof points come **only** from the site-verified set; unsourced external stats are tagged `[source needed]`, never stated as fact.
2. **Sounds human.** Written to read like a sharp strategist/editor — varied rhythm, concrete detail, no AI-tell phrases — not a template. We optimise for genuine human prose, not for beating AI detectors.
3. **Evidence-safe claims.** Costs are labelled estimates, GEO tactics are directional guidance (cited, not guaranteed), and provider pricing is never asserted as verified fact in-app.
4. **On-brand.** Every draft uses Zyra's real positioning, services, and voice.

## 4. Inputs

| Field | Notes |
|---|---|
| Blog topic / seed idea | Concrete title or loose theme |
| Zyra context | Prefilled + editable (site-verified positioning) |
| Target audience | Industries · geographies · roles |
| Blog goal | Awareness · lead generation · thought leadership · comparison · educational |
| Tone | Cinematic but useful · founder-led · expert editorial · simple and direct |
| Target word count | Default ~1,200–1,500 |
| CTA | The call to action to weave in (helpful, not salesy) |
| Competitor URLs | Optional — used for gap analysis |
| Manual Reddit/X notes or CSV | Optional — feed real questions when APIs aren't wired |

Inputs persist to `localStorage`; a run can be paused and resumed.

## 5. The workflow — two parts

The tool is split into two phases with a **topic-recommendation gate** between them. You must choose a topic in Part 1 before Part 2 unlocks.

### Part 1 — Find the blog topic
1. **Inputs** — the form above; "Run Research" starts the pipeline.
2. **Research** — topic clusters, Reddit questions, X discussion angles, Google People-Also-Ask, autocomplete queries, related keywords, competitor article gaps, search intent. Every item shows a `mock`/`live` source badge.
3. **Recommended Topics** — the app **recommends the best-suited blog topics for thezyra.in, each with a plain-English justification** (why it fits the audience, the demand evidence behind it, how well it maps to Zyra's services, and where competitors are weak), plus the total score and five sub-scores. The top pick is badged **"Recommended."** You **choose one topic** → this unlocks Part 2. Justifications are built from the real signals, never invented.

### Part 2 — Write the blog (locked until a topic is chosen)
4. **Content brief** — recommended + alternative titles, meta title/description, URL slug, primary/secondary keywords, search intent, target reader, angle, H2/H3 outline, questions to answer, internal links to Zyra service pages, external source suggestions, FAQ, featured-snippet answer, GEO/AEO answer blocks.
5. **Blog draft** — full post: strong human intro, clear POV, short paragraphs, useful examples, natural Zyra mentions, helpful CTA, question-led sections, direct-answer paragraphs for AI engines, FAQ at the end. No filler, no fabricated stats.
6. **SEO/GEO/AEO checklist** — two separate scores (SEO and GEO/AEO) with pass/warn/fail + specific fixes, a human-voice gate, and a **Publishing preflight** panel (robots.txt, sitemap, AI-crawler access, BlogPosting/FAQPage schema on thezyra.in).
7. **Export** — Markdown, HTML, meta title/description, FAQ schema JSON-LD, blog brief JSON, and CMS-ready copy (a `BlogPost` object that pastes into thezyra.in's `blog-data.ts`).

## 6. Topic scoring model

`score = 0.30·audienceRelevance + 0.25·searchQuestionDemand + 0.20·zyraAuthorityFit + 0.15·commercialIntent + 0.10·competitionGap` (each 0–100).

- **Audience relevance (30%)** — fit to the input industries/geographies/roles.
- **Search/question demand (25%)** — volume + PAA count + question recurrence + SERP rank + freshness + PAA overlap (Reddit/X upvotes only when a real social API is configured).
- **Zyra authority fit (20%)** — closeness to Zyra's five services/expertise.
- **Commercial intent (15%)** — buyer-intent signals.
- **Competition gap (10%)** — how weak/incomplete competitor coverage is.

Weights live in one config object so they're tunable.

## 7. Writing method (summary)

Two passes: **`blogGenerator`** writes a complete, correct, structured draft in Zyra's voice using only verified facts; **`humanEditor`** rewrites it purely for human voice (rhythm, contractions, active voice, banned-phrase removal) without changing a single fact. The **`seoGeoAuditor`** then scores it and can trigger one more humanising pass. Full method in [WRITING_PLAYBOOK.md](./WRITING_PLAYBOOK.md).

## 8. Providers (final stack)

| Function | Provider | Mock fallback |
|---|---|---|
| Keyword research | Google Ads Keyword Planner (Zyra's account) | ✅ |
| SERP + PAA + autocomplete | DataForSEO | ✅ |
| Reddit questions | Apify (Zyra's account) | ✅ |
| X questions | twitterapi.io | ✅ |
| Cheap LLM steps (expand/cluster/score) | OpenAI (cheapest model) | ✅ |
| Writing (draft + polish) | Claude Sonnet 5 | ✅ |

Every source is an adapter behind a registry; a missing key silently uses the mock and shows a badge. **Google Ads caveat:** free but needs an approved developer token + OAuth2 refresh token (one-time setup, can take days) and returns ad competition + volume ranges, not SEO difficulty — until set up, the keyword step stays on mock. Details + setup steps in [API_RECOMMENDATIONS.md](./API_RECOMMENDATIONS.md).

## 9. Architecture (product-level)

- **Next.js + TypeScript**, one app: React UI + `/api` route handlers (Node) + pure TS modules.
- **11 modules:** topicExpander, questionDiscovery, keywordResearch, serpResearch, topicScorer, briefGenerator, blogGenerator, humanEditor, seoGeoAuditor, exporter, accessPreflight.
- **State:** one `RunState` object per session, persisted to `localStorage`.
- **Resilience:** every stage wrapped — partial results always render; live-provider failure degrades to mock with a badge; no hard crashes.

## 10. Publishing & out of scope

**Built — hero image:** the Export tab's "Generate hero image" button creates a cinematic poster (OpenAI `gpt-image-1` when configured; a deterministic branded SVG sample otherwise).

**Built — PR-based publishing:** the "Open pull request" button appends the `BlogPost` to `blog-data.ts` on a new branch of `toolsatZyra/ZyraUpdated`, commits the hero image to `public/posters/` when one was generated, and opens a PR (never commits to the default branch; requires `GITHUB_TOKEN`).

**Out of scope (bolt-on later):** scheduled/batch multi-post runs · SQLite/multi-user persistence · auth. The pipeline is structured so these add on without rework.

## 11. Success criteria

- Runs end-to-end with **zero keys** on mocks.
- Each source flips to live independently by adding its key — no code change.
- Generated drafts contain **no fabricated numbers** and pass the human-voice gate.
- Export produces a `BlogPost` object that pastes into thezyra.in with only the `poster` image to fill.
- SEO and GEO/AEO reported as **two separate scores**, each with actionable fixes.
