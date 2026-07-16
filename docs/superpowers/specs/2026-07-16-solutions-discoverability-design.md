# /solutions discoverability — sitemap, index hub, and the breadcrumb fix

**Date:** 2026-07-16
**Status:** Approved — design locked (user, 2026-07-16)
**Scope:** Site repo (`~/Documents/GitHub/ZyraUpdated`) only. No studio changes.
**Parent:** [`2026-07-16-programmatic-solutions-pages-design.md`](2026-07-16-programmatic-solutions-pages-design.md) — this resolves that spec's open item "/solutions pages in the sitemap (they aren't discoverable by search until added)".

## Problem

`/solutions/fintech/bengaluru` is live and correct, and **Google cannot find it.**
Nothing links to it and it is in no sitemap. For a programmatic SEO feature whose
entire premise is ranking one page per market segment, this is the blocker: the
generator can produce pages faster than search can discover them.

Verified live 2026-07-16:

```
GET https://www.thezyra.in/sitemap.xml   → 0 occurrences of "solutions"
GET /solutions                           → 404
GET /solutions/fintech                   → 404
GET /solutions/fintech/bengaluru         → 200   ← the only page that exists
```

**And a live bug found while scoping this.** `[...path]/page.tsx:79` builds
`BreadcrumbList` crumbs from the path segments unconditionally, so the live page
ships JSON-LD asserting that `/solutions` and `/solutions/fintech` exist. Both
404. Two causes:

1. `/solutions` can never resolve — `[...path]` is a **required** catch-all, so it
   does not match its own parent segment. Only an index page at
   `src/app/solutions/page.tsx` can serve it.
2. An intermediate crumb (`/solutions/fintech`) resolves only if someone happened
   to publish that exact one-segment page. For `fintech/bengaluru`, nobody did.

Structured data pointing at 404s is a real defect, not a cosmetic one, and the
index page this spec adds is also the fix for half of it.

## Decisions (user, 2026-07-16)

| # | Decision | Rejected alternative, and why |
|---|---|---|
| 1 | **Sitemap + a real `/solutions` index.** | *Sitemap only* — pages get crawled but stay orphans, which reads to Google as "the site itself doesn't rank these". A sitemap passes **no** authority; a link does. |
| 2 | **The index is a real page, indexable.** Own H1 + intro + link grid. | *noindex/follow hub* — Google eventually treats long-lived `noindex` as `nofollow`, so the authority benefit decays, and the page can never rank itself. *Hold indexing until N pages* — adds a manual step someone must remember. |
| 3 | **Footer link only.** | *Nav menu* — `NAV_LINKS` feeds both the hamburger and the footer, so it is one edit for maximum authority, but it puts "Solutions" beside "Services" in the main menu: two words meaning nearly the same thing, one a real offering and one an SEO surface. Not worth the IA confusion. *Nowhere* — leaves the hub itself an orphan, buying little over the bare sitemap. |
| 4 | **Text-only cards.** | *Featured thumbnails* — better-looking on a film studio's site, but mixes 16:9 and 9:16 across cards, and at n=1 a single video card reads as a broken grid where a single text card reads as deliberate. |
| 5 | **Service-page links deferred.** | Linking `/ai-brand-films` → its solutions passes the most authority (established pages), but edits five live, ranking pages. Revisit once more than one solution exists. |

## Design

### 1. `src/app/solutions/page.tsx` — new index

A **static segment resolves before the catch-all**, exactly as
`/solutions/preview` already does, so this needs no routing change.

- Hand-written eyebrow + H1 + one intro paragraph on building per market segment.
- A card grid over `ALL_SOLUTIONS`. Each card: `eyebrow`, `h1` as the link text,
  `subline`. Text only.
- Metadata: title, description, canonical `https://www.thezyra.in/solutions`.
- Schema: `BreadcrumbList` (Home > Solutions). Nothing else — the child pages
  already point here.

**Why this inherits the honesty rules for free:** every word on a card comes from
`lp-data.ts`, which `guards.ts` already checked before its PR was opened. The
index writes **no per-solution prose**, so it adds no new surface where a price
or a fabricated metric could appear. Only the fixed intro is new copy, and it is
written once, by hand, to the same rules — **contrast on time, never cost**.

**Known:** it ships with exactly one card. The intro carries it; it will look
sparse until more pages publish. Accepted.

### 2. `src/app/sitemap.ts`

- `import { ALL_SOLUTIONS } from '@/lib/lp-data'`.
- `/solutions` as a static route: priority **0.8**, `monthly` — alongside `/work`.
- Each solution: priority **0.7**, `monthly` — the blog-post tier, deliberately
  **below** the five service pages at 0.9, which are the pages that should win
  brand queries.
- `lastModified: now`, matching every existing entry in the file.

### 3. `src/app/solutions/[...path]/page.tsx` — breadcrumb fix

Emit an intermediate crumb **only when `getSolutionBySlug` resolves that prefix**.
The final crumb is always the page itself. `/solutions` now always resolves, so
crumb 2 becomes true rather than aspirational.

### 4. `src/components/Footer.tsx`

```ts
const FOOTER_LINKS = [...NAV_LINKS, { label: 'Solutions', href: '/solutions' }]
```

used by the "Navigate" column, mirroring the `ALL_LINKS = [...NAV_LINKS, Contact]`
pattern already at `Navbar.tsx:12`. **`NAV_LINKS` is untouched**, so the hamburger
menu does not change. The footer is in the root layout, so the link lands on every
page — including the `/solutions` pages themselves.

*(Note: `NAV_LINKS` lives in `dummy-content.ts`, whose name misleads. That export
is real and live via Navbar + Footer. The fabricated content in that file is
`STATS` and the testimonial — see the parent spec's dead-code section.)*

## Verification

This repo has **no test runner** — `package.json` has `dev`, `build`, `lint` only.
So verification is a build plus DOM checks, not unit tests.

1. `npm run build` — `/solutions` prerenders; `generateStaticParams` still emits
   `fintech/bengaluru`.
2. Dev server on **port 3007** (not 3000).
3. `/solutions` returns 200 and links to `/solutions/fintech/bengaluru`.
4. The breadcrumb JSON-LD on the live page contains **no URL that 404s**.
5. `sitemap.xml` contains `/solutions` and `/solutions/fintech/bengaluru`.
6. The footer link renders.

**Do not screenshot scrolled content** — it comes back black in this harness
(a cream section captured black proved it). Verify via DOM/curl, or a tall
viewport at scroll 0.

## Out of scope

- Service-page links (decision 5 — revisit at >1 solution).
- The URL-shape question: service as a third segment vs. today's industry×geo key.
- The studio repo. The generator needs no change; it already writes the slug that
  the sitemap reads.
