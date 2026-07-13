# Zyra Blog Studio — Design Spec (v3, reconciled + evidence-safe)

**Date:** 2026-07-13
**Owner:** Zyra (thezyra.in)
**Goal:** A simple internal web app that automates Zyra's blog-writing workflow. It helps the team **discover topics → validate SEO/GEO/AEO opportunity → generate a content brief → write a human-sounding blog → export CMS-ready assets** for regular website updates. It runs fully on realistic mock providers with **zero API keys**, and each data source switches to live the moment its key is present.

> v2 reconciled the original design with the detailed product requirements (Next.js/TS stack, expanded inputs, exact scoring weights, separate `humanEditor` module, anti-fabrication rule, full export set). **v3 makes it evidence-safe** per review: only site-verified Zyra proof points; costs labelled as app-computed estimates not verified prices; Reddit/X hard pricing removed (separate-agreement wording); GEO figures treated as directional/cited; upvotes optional with SERP-based demand fallbacks; "search-index discovery, don't scrape directly" wording; evidence guidance replacing any stat quota; and a new `accessPreflight` crawler/sitemap/schema check.

---

## 0. Two-part structure (top-level UX)

The app is explicitly split into two phases, with a **topic-recommendation gate** between them:

- **Part 1 — Find the blog topic.** Inputs → Research → **Recommended Topics**: the app ranks candidate topics and shows each with a **plain-English justification** (why it suits Zyra's site, the audience, the demand evidence, the authority fit, and the competition gap). The best pick is badged **"Recommended."** You **choose one topic**, which unlocks Part 2.
- **Part 2 — Write the blog.** Using only the chosen topic: Brief → Draft → SEO/GEO/AEO checklist → Export.

Part 2 stays locked until a topic is selected; the selected topic is carried in `RunState.selectedTopic`. A "Start over / pick a different topic" action returns to Part 1 without losing the research.

---

## 1. Stack & app shape

- **Next.js (App Router) + TypeScript** — one app, React UI + `/api` route handlers as the Node backend. (Matches thezyra.in's own stack.)
- **Persistence:** browser **localStorage** for saved runs/sessions in the MVP. SQLite is an easy later swap (noted, not built for MVP).
- **No landing page.** The first screen (`/`) **is** the working blog tool.
- **Provider-based** backend: every external call goes through an adapter; **mock providers** are the default so the app works offline. Env keys activate live providers per source.
- **Env vars** for all keys (see `.env.example`); all optional.

---

## 2. Inputs panel (left side of the tool)

- **Blog topic / seed idea** (text)
- **Zyra context** (textarea, **prefilled + editable** — accurate positioning from the live site, see §8)
- **Target audience:** industries · geographies · roles (three fields)
- **Blog goal:** awareness · lead generation · thought leadership · comparison · educational (select)
- **Tone:** cinematic but useful · founder-led · expert editorial · simple and direct (select)
- **Target word count** (number)
- **CTA** (text — the call to action to weave in, helpful not salesy)
- **Optional competitor URLs** (list — used for gap analysis)
- **Optional manual Reddit/X notes or CSV upload** (textarea + file input — lets the team feed real questions when APIs aren't wired)

Inputs persist to localStorage so a run can be resumed.

---

## 3. Positioning captured (drives the writer & scorer)

Zyra = **India's AI Content Studio / Global AI Content Studio**, core line **"Where AI meets Cinema."** Value: cinematic quality, AI-accelerated production, human-directed creative judgment, faster timelines, lower cost, culture-speed delivery. Five services: **AI Native Film Production, AI Brand Films & Commercials, AI Micro Drama Production, Performance Marketing Ads, Social Media Content.** Proof points (site-verified): 1,000+ creatives, 5 formats, 50M+ views, 50+ brand films/ads, 2,000+ ads, $10M ad spend managed, 60M+ social views. Clients (use only when contextually useful): Adani, NDTV, Cars24, Swiggy, Wildstone, Meesho, Country Delight, VAMA, Mederma. Full default context: `docs/zyra-context.md`; machine-readable knowledge (services, slugs for internal links, entities, proof points) in `src/lib/zyraContext.ts`.

---

## 4. Backend modules (the workflow)

Pure, testable TS modules in `src/lib/modules/`, each taking typed input → typed output, each calling providers through the registry (mock or live):

1. **`topicExpander`** — seed → search-query set (seed/long-tail/question/comparison; goal- and audience-aware). Uses the **cheap LLM (OpenAI)**.
2. **`questionDiscovery`** — gathers questions from: Google autocomplete + People-Also-Ask (**DataForSEO SERP**), **Reddit (Apify actor)**, **X (twitterapi.io)**, competitor pages, **plus any manual notes/CSV** the user supplied.
3. **`keywordResearch`** — keyword volume + ad competition + CPC via the **Google Ads API (Keyword Planner)** (or mock). Note: Google Ads gives *ad* competition + bucketed volume ranges, **not** true SEO keyword difficulty — the app labels difficulty as an approximation and can optionally take real SEO KD from a DataForSEO swap-in.
4. **`serpResearch`** — SERP results + PAA + related searches via **DataForSEO SERP** (SerpApi swap-in) (or mock); extracts competitor article gaps.
5. **`topicScorer`** (the recommender) — applies the weighted score (§5) to each candidate topic **and produces a grounded justification per topic**: a short plain-English rationale built from the *actual* signals (e.g. "maps directly to Zyra's AI Brand Films service; 6 related PAA questions + appears in 3 Reddit threads; competitors cover cost only thinly"). It flags the top pick(s) as **"Recommended."** Justifications are derived from real sub-scores/signals (never invented); the cheap LLM (OpenAI) only rephrases them, it does not add facts. This is the output the user chooses from to enter Part 2.
6. **`briefGenerator`** — produces the full SEO/GEO/AEO brief (§ Brief tab).
7. **`blogGenerator`** — writes the first full draft from brief + Zyra context. Uses the **writer LLM (Claude Sonnet 5)** (or mock).
8. **`humanEditor`** — **separate pass** that rewrites the draft to sound human: vary sentence rhythm/length, strip generic AI phrases, add concrete detail, reduce over-polished tone, **preserve factual accuracy** (never adds numbers), keep Zyra's cinematic-but-useful voice. Uses the **writer LLM (Claude Sonnet 5)**.
9. **`seoGeoAuditor`** — scores the draft against the SEO and GEO/AEO checklists and returns **actionable** fixes.
10. **`exporter`** — builds Markdown, HTML, JSON-LD, metadata, brief JSON, and CMS-ready copy. For the `BlogPost` object it **derives** `date` (today), `readTime` (word-count ÷ ~200 wpm), `category` (from the blog goal/topic), and `excerpt` (from the intro), and emits `poster` as an explicit placeholder path (e.g. `"/posters/REPLACE-ME.webp"`) since image generation is out of scope — the user swaps in the real image.
11. **`accessPreflight`** — a **pre-publish site check** (independent of the draft): fetches thezyra.in `robots.txt` and `sitemap.xml`, checks whether important crawlers are allowed — **GPTBot, OAI-SearchBot, ClaudeBot, PerplexityBot, Google-Extended, Googlebot, Bingbot** — and validates that the target blog exposes **BlogPosting** and **FAQPage** schema correctly. Runs live when reachable; returns a clear "couldn't fetch — check manually" state otherwise. Never blocks drafting; it's a publishing-readiness gate.

The pipeline runs stage-by-stage so each tab reflects one module's output; a "Run all" convenience chains them.

---

## 5. Topic scoring (exact weights)

`score = 0.30·audienceRelevance + 0.25·searchQuestionDemand + 0.20·zyraAuthorityFit + 0.15·commercialIntent + 0.10·competitionGap` (each sub-score 0–100; total 0–100). Definitions:
- **Audience relevance (30%)** — fit to the input industries/geographies/roles.
- **Search/question demand (25%)** — keyword volume + PAA count + question **recurrence** across sources + **SERP rank** of the discovering query + **freshness** + PAA overlap. Reddit/X **upvotes are optional** and only used when a real Reddit/X API is configured — the default SERP-index discovery path does not expose them reliably, so demand falls back to rank/recurrence/freshness/PAA-overlap signals.
- **Zyra authority fit (20%)** — closeness to Zyra's five services / demonstrable expertise.
- **Commercial intent (15%)** — buyer-intent signals in the query.
- **Competition gap (10%)** — how weak/incomplete competitor coverage is.
The scoring tab shows every candidate with its five sub-scores and total, sortable, so the team picks the winner that feeds the brief. Weights live in one config object so they're tunable.

---

## 6. UI tabs (grouped into the two parts)

### Part 1 — Find the blog topic
1. **Inputs** (§2).
2. **Research** — topic clusters · Reddit-style questions · X-style discussion angles · Google PAA · autocomplete queries · related keywords · competitor article gaps · search intent. Each item carries a `mock`/`live` source badge.
3. **Recommended Topics** — the ranked recommendation list. Each candidate card shows: the topic, its **total score + five sub-scores**, and a **plain-English justification** of why it fits (audience, demand evidence, Zyra authority fit, competition gap). The top pick is badged **"Recommended."** A **"Choose this topic → write the blog"** button selects it and unlocks Part 2. Sortable/filterable.

### Part 2 — Write the blog (locked until a topic is chosen)
4. **Content brief** — recommended title · alternative titles · meta title · meta description · URL slug · primary keyword · secondary keywords · search intent · target reader · angle · outline · H2/H3 structure · questions to answer · internal link suggestions (to Zyra service pages) · external source suggestions · FAQ section · **featured-snippet answer** · **GEO/AEO answer blocks**.
5. **Blog draft** — full post: strong human intro · clear POV · short paragraphs · useful examples · natural Zyra mentions · helpful (not salesy) CTA · question-led sections · direct-answer paragraphs for AI engines · FAQ at the end. **No generic filler, no fabricated stats, no exaggerated claims.**
6. **SEO/GEO/AEO checklist** — the two scorecards (§7) with pass/warn/fail + specific fixes, **plus a "Publishing preflight" panel** (robots.txt / sitemap / AI-crawler access / BlogPosting + FAQPage schema on thezyra.in).
7. **Export** — Markdown · HTML · meta title & description · FAQ schema JSON-LD · **blog brief JSON** · **CMS-ready copy** (a ready-to-paste `BlogPost` object matching thezyra.in's `src/lib/blog-data.ts`).

A persistent header shows which part you're in and the chosen topic once selected, with a "pick a different topic" link back to Part 1.

---

## 7. Checklists / scoring (two separate scores + anti-fabrication)

**SEO checks:** one H1 · logical H2/H3 hierarchy (no skipped levels) · keyword appears naturally (no stuffing, density < ~2.5%) · meta title ≤ ~60 chars · meta description ~120–158 chars · internal links present (3–5 per 1,000 words, descriptive anchors) · external citations present · readability OK · keyword in title/H1/first 100 words/slug.

**GEO/AEO checks:** direct answer in first ~100 words · each major section opens with a clear answer · question-style headings where appropriate · **entity coverage** (Zyra, AI content studio, AI brand films, micro drama, OTT, performance ads, social content, India, brands, marketers) · FAQ schema present · quotable definitions present · comparison table where useful · **specific claims backed by sources** · **no unsupported stats** · **currency matched to the target market(s)** (₹/$/AED-SAR per India/US/GCC; `$` never flagged).

**Market adaptation:** the writer adapts currency, spelling, and examples to the selected geographies (India · GCC · US) — primary-market-led, no mixed/converted currencies, no invented figures. See `docs/WRITING_PLAYBOOK.md` §5b and `src/lib/markets.ts`.

**Evidence-safety on GEO guidance:** the foundational GEO research (Aggarwal et al., "Generative Engine Optimization") supports the *directional* finding that citing sources, adding statistics, and adding quotations can improve generative-engine visibility by **up to ~40%**. The app and docs treat per-tactic figures (e.g. specific "+41%", "2.8×", "83%") as **directional guidance, cited to their study where used, or softened** — the tool never presents them as guarantees, and its own GEO checks are structural (is there a sourced claim? a direct answer? FAQ schema?) rather than promising a numeric lift.

**Anti-fabrication rule (overrides everything):** The writer must **never invent** numbers, case studies, client outcomes, prices, or timelines. Zyra proof points are used **only** if present in the Zyra context or user-supplied (and only the site-verified set in `docs/zyra-context.md`). Any external statistic that isn't fetched from a real source is emitted as **"[source needed]"**, never as a confident number.

**Evidence guidance (replaces any stat-density target):** aim for **3–6 strong, source-backed claims per post, or one per major section where it genuinely strengthens the argument** — not a fixed stat-per-N-words quota. The GEO auditor **rewards sourced claims and flags unsourced ones**; it never rewards raw stat count, so nothing in the scoring can pressure the model to fabricate. (This corrects v1, which had a "≥1 stat per 100 words" check that could have forced fake sourcing.)

**Publishing preflight (site-level, separate from the draft score):** robots.txt reachable · sitemap.xml present & references /blog · AI crawlers not blocked (GPTBot, OAI-SearchBot, ClaudeBot, PerplexityBot, Google-Extended) · Googlebot/Bingbot allowed · BlogPosting schema valid on blog template · FAQPage schema valid. Each is pass/warn/"couldn't fetch — verify manually"; this never blocks writing, it flags whether a published post can actually be crawled and cited.

**Human-voice gate:** sentence-length variance (burstiness) · avg ~15–20 words · **0 banned-phrase hits** ("in today's fast-paced digital landscape", "unlock the power of", "revolutionize your brand", "seamlessly", "game-changer", "delve", + the wider list in `scoring/bannedPhrases.ts`) · contractions present · low passive-voice ratio · varied list lengths · concrete specifics. Goal: reads like a sharp strategist/editor wrote it — we do **not** optimise to beat AI detectors (they're unreliable), we optimise for genuinely human prose.

---

## 8. Providers, mocks, config

- **Registry** (`src/lib/providers/index.ts`) returns the live adapter when its key(s) exist, else the mock. Per-source `mock`/`live` status is surfaced to the UI.
- **Chosen adapters (Zyra's stack):**
  - **Keywords** → `googleads` (Google Ads Keyword Planner). *SEO-KD swap-in:* `dataforseo` Labs.
  - **SERP + PAA + autocomplete** → `dataforseo` (primary). *Swap-in:* `serpapi`.
  - **Reddit** → `apify` (Apify actor, Zyra's account).
  - **X** → `twitterapi` (twitterapi.io).
  - **LLM by role:** cheap grunt work (expansion/clustering/scoring assist) → `openai` (cheapest model, env-configurable); writing (draft + human-edit) → `claude` **Sonnet 5**. Both behind one `llm.generate({role})` interface.
  - All via `fetch` where practical; the Google Ads adapter uses its OAuth2 flow (see below). No heavy SDK deps beyond what Google Ads auth needs.
- **Mocks** (`src/lib/mock/`) return deterministic, realistic, topic-derived fixtures for every source so the whole pipeline demos offline.
- **Google Ads caveat (setup gating):** the Google Ads API is free but needs an **approved developer token + OAuth2 refresh token** (one-time setup that can take days), and it returns **bucketed volume ranges + ad competition/CPC, not SEO difficulty**. Until it's set up, keyword data stays on **mock**; the rest of the pipeline is unaffected.
- **Apify/twitterapi/DataForSEO:** all pay-as-you-go behind their own keys; Reddit via a licensed Apify actor (no direct scraping). Costs are usage-based.
- **Costs are estimates, not verified pricing.** Only structural facts are asserted: DataForSEO is **pay-as-you-go with a ~$50 minimum top-up**; SerpApi has a paid entry plan (**verify current price** — see open items). Any per-blog figure the app shows is **computed by app config** from token/call counts, clearly labelled "estimate," not a quoted price. Full tradeoffs + what to buy first in `docs/API_RECOMMENDATIONS.md`.

---

## 9. Errors & testing

- Every stage is wrapped: a failure returns a structured error for that section; partial results still render; a live-provider failure degrades to mock with a visible badge — never a hard crash.
- **`node --test`** (Node 25 runs TS natively) over the pure modules: each module with injected mocks, each scoring check (fixtures that pass and fail), each export builder, and the banned-phrase filter. No network in tests.

---

## 10. Deliverables & files

- `README.md` (setup + workflow explanation + which APIs to buy first / defer)
- `docs/PRODUCT_SPEC.md` (this design, product-facing)
- `docs/API_RECOMMENDATIONS.md` (DataForSEO $50-min pay-as-you-go; SerpApi entry plan [verify current price]; Claude Haiku/Sonnet; OpenAI fallback; Reddit via SERP + commercial-terms caveat; X via SERP/CSV; avoid Google Custom Search; provider-swappable)
- `.env.example` (all keys optional)
- Working Next.js app source + deterministic mock data
- `docs/zyra-context.md` (prefilled context, done)

---

## 11. Open items / notes for the user
1. **SerpApi price discrepancy** — your note says ~$25/mo for 1,000 searches; my live research found ~$75/5,000 (free 250/mo). I'll document your recommendation but flag it to confirm on serpapi.com/pricing before purchase.
1b. **Model IDs kept configurable** — Claude defaults `claude-haiku-4-5` / `claude-sonnet-5`; OpenAI fallback model IDs are **env-configurable placeholders** to be set to the current cheapest models (verify on OpenAI's pricing page). The spec does not hardcode unverified future model names as fact.
2. **First cut** on mocks-only (runs with zero keys), or wire Claude + DataForSEO live immediately? (Recommend mocks-first; add keys after you see it work.)
3. **Persistence** — localStorage for MVP (recommended) vs SQLite now.
4. **Deferred/out of scope (noted, not built):** auto-publishing a PR into the thezyra.in repo, hero-image generation, scheduled/batch multi-post runs, auth/multi-user. Pipeline is structured so these bolt on without rework.
