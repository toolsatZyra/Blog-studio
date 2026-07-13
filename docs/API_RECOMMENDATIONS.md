# API Recommendations — Zyra Blog Studio

**Last reviewed:** 2026-07-13. **Read this first:** prices and free-tier terms change often. Below, **verified structural facts** (e.g. "pay-as-you-go", "requires a separate agreement") are separated from **cost estimates** (which the app computes from call/token counts and labels as estimates — they are **not** quoted prices). Confirm any number on the vendor's live pricing page before you buy. Sources are linked; where a figure is only directional it is marked *(estimate — verify)*.

## Principles
1. **Provider-swappable.** Every source sits behind an adapter with a shared interface, so any provider can be replaced without touching pipeline logic.
2. **Mocks are the default.** With no keys set, the whole workflow runs on realistic mock data. A source goes live only when its key is present.
3. **Buy the fewest keys that unblock the most value.** See "What to buy first" at the end.

---

## The set of APIs needed (by function)

The tool needs five capabilities. You do **not** need five vendors — DataForSEO alone can cover functions 1–4.

### 1. Keyword research (search volume + difficulty + intent)
- **Recommended (cheapest reliable): DataForSEO** — Labs + Keyword Data endpoints.
  - *Verified:* pay-as-you-go, **~$50 minimum top-up**, no monthly subscription, credits don't expire. Source: [dataforseo.com/pricing](https://dataforseo.com/pricing).
  - *Estimate — verify:* fractions of a cent per keyword at the volumes this tool uses.
- **Alternatives / swap-ins:**
  - **Google Keyword Planner** — free, but needs an active Google Ads account and returns bucketed ranges without spend. Source: [Google Ads API](https://developers.google.com/google-ads/api).
  - **Keywords Everywhere** — prepaid credits (annual), predictable. Source: [keywordseverywhere.com](https://keywordseverywhere.com/).
  - **Semrush / Ahrefs APIs** — powerful but **much** more expensive (entry in the hundreds/month); only worth it if you already subscribe.

### 2. SERP results + People Also Ask + autocomplete
- **Recommended: DataForSEO SERP API** — structured organic + PAA + related searches; consolidates with function 1 on one key.
- **Simplest single-purpose option: SerpApi** — very clean SERP/PAA/autocomplete parsing.
  - *Your note:* Starter ~**$25/mo for 1,000 searches**. *My live check found* a common entry around **$75 / 5,000 searches** (free 250/mo). **Discrepancy — confirm the current plan on [serpapi.com/pricing](https://serpapi.com/pricing) before purchase.**
- **Cheap swap-in: Serper.dev** — low per-query Google SERP; confirm PAA field coverage in their docs.

### 3. Reddit question/topic discovery
- **Recommended default: search-index discovery** — run `site:reddit.com "<topic>"` (optionally `site:reddit.com/r/marketing "<topic>"`) through the SERP provider above. No Reddit key required; you get titles/snippets to mine questions from.
- **Compliance (verified, important):** Reddit's Data API terms state that **commercial or high-volume access requires a separate agreement, with fees at Reddit's discretion** — there is **no assumed fixed public per-call price**, and unauthenticated scraping is not permitted. Source: [Reddit Data API Terms](https://www.redditinc.com/policies/data-api-terms). Treat a direct Reddit API integration as an optional, licensed swap-in — not the MVP path.
- **Do not** scrape Reddit pages directly.

### 4. X / Twitter discussion discovery
- **Recommended default: search-index discovery** (`site:x.com "<topic>"`) **or manual CSV / notes upload** in the Inputs panel.
- **Treat the official X API as optional** — access and pricing change frequently and the paid tiers are expensive. Source: [X API pricing](https://docs.x.com/x-api).
- **Optional cheaper third party:** twitterapi.io / socialdata.tools for real X data behind an adapter (per-call billing; verify current rates).
- **Do not** scrape X pages directly.

### 5. Writing model (LLM) — brief, draft, human-edit, audit assist
- **Recommended: Anthropic Claude.**
  - **Claude Haiku 4.5** (`claude-haiku-4-5`) for the cheap, high-volume steps: query expansion, clustering, scoring, first draft.
  - **Claude Sonnet 5** (`claude-sonnet-5`) — or the latest strong Claude model — for final writing/polish (`humanEditor`) when budget allows.
  - Source: [Anthropic pricing](https://platform.claude.com/docs/en/about-claude/pricing).
- **Optional fallback: OpenAI.** Cheaper small model for classification/scoring; a stronger model only for final polish. **Model IDs are env-configurable** — set them to whatever the current cheapest suitable models are and verify on [OpenAI pricing](https://platform.openai.com/docs/pricing). The app does not hardcode model names as fact.

### Not recommended as a primary path
- **Google Custom Search / Programmable Search JSON API** — availability and quotas have changed; don't build the main discovery path on it unless you've verified it works for your use. Use DataForSEO/SerpApi instead.

---

## Zyra's chosen stack (FINAL — 2026-07-13)

| Function | Chosen provider | Notes |
|---|---|---|
| **Keyword** research | **Google Ads API (Keyword Planner)** | Free with your Ads account; see setup + caveats below. Volume ranges + ad competition/CPC, **not** SEO difficulty. |
| **SERP + PAA + autocomplete** | **DataForSEO** (my pick) | Most versatile + cheapest pay-as-you-go; also covers competitor SERPs. SerpApi = swap-in. |
| **Reddit** questions | **Apify** (Zyra's account) | Licensed actor pulls threads/questions — no direct scraping. Usage-based. |
| **X** questions | **twitterapi.io** | Cheap third-party X data behind an adapter. |
| **Writing (LLM)** | **OpenAI (cheap) + Claude Sonnet 5 (writer)** | OpenAI cheapest model for grunt work (expansion, clustering, scoring, research summarising); Claude Sonnet 5 for the draft + human-edit (best prose). |

**Why DataForSEO for SERP (my call):** you asked me to pick — SERP is the more versatile box to tick (Google organic + PAA + autocomplete + related + competitor SERPs from one API), and DataForSEO is pay-as-you-go with no monthly subscription, so it's the cheapest versatile option. SerpApi stays wired as a one-line swap-in if you prefer its parsing.

### Google Ads Keyword Planner — setup + caveats (read before relying on it)
- **Free**, but requires: a Google Cloud project with OAuth2 credentials, an **approved Google Ads API developer token** (application/approval can take a few days), and a **refresh token** generated once via the OAuth consent flow. These go in `.env` (`GOOGLE_ADS_*`).
- **You'll set up OAuth yourself** — I can't run Google's consent flow for you, and you should never paste the client secret / developer token / refresh token into chat. Put them in `.env`.
- **Data limits:** returns **bucketed monthly volume ranges** and **ad competition + CPC**, which is *not* the same as SEO keyword difficulty. The app labels difficulty as an approximation. If you want true SEO KD later, add a DataForSEO Labs key and the app will use it.
- Until this is set up, the keyword step runs on **mock** and nothing else breaks.

## What to buy/set up first vs defer
- **Set up first:** **Claude Sonnet 5** (`ANTHROPIC_API_KEY`) + **OpenAI** (`OPENAI_API_KEY`) → real writing works immediately; and **DataForSEO** → real SERP/PAA. These three unblock ~90% of the tool with almost no setup friction.
- **Set up when ready:** **Google Ads** (developer-token approval is the slow part), **Apify** (`APIFY_TOKEN`), **twitterapi.io** (`TWITTERAPI_KEY`) — each flips its source from mock to live independently.
- **Skip:** Google Custom Search.

## How the app talks about cost
The tool can show a **per-run estimate** computed from actual call counts and token usage × configured unit rates. It is always labelled **"estimate"** and is **not** a quoted price. Update the unit rates in config after confirming live pricing. Nothing in the app asserts a vendor's price as verified fact.

## Verification checklist before purchasing
- [ ] DataForSEO minimum top-up and current per-endpoint rates on their pricing page.
- [ ] SerpApi current entry plan (resolve the $25/1k vs $75/5k discrepancy).
- [ ] Claude Haiku/Sonnet current per-token prices and exact model IDs.
- [ ] OpenAI current cheapest model IDs + prices (set env vars accordingly).
- [ ] Reddit Data API terms if you intend a licensed integration.
- [ ] Whether you need real X data at all, or SERP/CSV discovery is sufficient.
