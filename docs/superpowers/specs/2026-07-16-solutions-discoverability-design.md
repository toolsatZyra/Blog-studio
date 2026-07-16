# /solutions discoverability — sitemap entries and the breadcrumb 404 fix

**Date:** 2026-07-16
**Status:** Approved — design locked (user, 2026-07-16)
**Scope:** Site repo (`~/Documents/GitHub/ZyraUpdated`) only. Two files. **No visible change to the site.**
**Parent:** [`2026-07-16-programmatic-solutions-pages-design.md`](2026-07-16-programmatic-solutions-pages-design.md) — this resolves that spec's open item "/solutions pages in the sitemap (they aren't discoverable by search until added)".

## Problem

`/solutions/fintech/bengaluru` is live and correct, and **Google cannot find it.**
Nothing links to it and it is in no sitemap. For a programmatic SEO feature whose
premise is ranking one page per market segment, this is the blocker: the
generator can produce pages faster than search can discover them.

Verified live 2026-07-16:

```
GET https://www.thezyra.in/sitemap.xml   → 0 occurrences of "solutions"
GET /solutions                           → 404
GET /solutions/fintech                   → 404
GET /solutions/fintech/bengaluru         → 200   ← the only page that exists
```

**A live bug, found while scoping this.** `[...path]/page.tsx:79` builds
`BreadcrumbList` crumbs from the path segments unconditionally, so the live page
ships JSON-LD asserting that `/solutions` and `/solutions/fintech` exist. Both
404. Two causes:

1. `/solutions` can never resolve — `[...path]` is a **required** catch-all, so it
   does not match its own parent segment. Only an index page at
   `src/app/solutions/page.tsx` could serve it, and per the decision below, one is
   not being built.
2. An intermediate crumb (`/solutions/fintech`) resolves only if someone happened
   to publish that exact one-segment page. For `fintech/bengaluru`, nobody did.

Structured data pointing at 404s is a real defect, not a cosmetic one.

## Decisions (user, 2026-07-16)

**The governing decision: no visible change to the live site.** The user declined
a public `/solutions` index page and declined a footer link. Discovery comes from
the sitemap alone.

| # | Decision | Rejected, and why |
|---|---|---|
| 1 | **Sitemap only. No index page, no footer link, no nav change.** A visitor sees an identical site. | *Index page + footer link* — proposed and **declined**. It would have put a public "Solutions" page and a site-wide footer link on a live brand site. |
| 2 | **Delete the unresolvable breadcrumb crumbs**, including `Solutions`. | *Add the index page so the crumb becomes true* — foreclosed by decision 1. The crumb must go rather than point at a 404. |
| 3 | **Service-page links deferred.** | Linking `/ai-brand-films` → its solutions passes the most authority, but edits five live, ranking pages — a visible change, and out of bounds here. |

### The cost of decision 1, recorded honestly

A sitemap gets a page **crawled**. It passes **no authority**, and it is a
*suggestion* Google may ignore. These pages stay **orphans** — nothing on
thezyra.in links to them — and Google routinely deprioritizes orphan pages on the
reasonable inference that a site does not link to what it does not value.

So this change makes the pages *discoverable*, not *competitive*. It is a real
improvement over invisible, and it is the ceiling of what is achievable without a
link. **If these pages later underperform, the missing internal link is the first
thing to revisit** — not the copy, not the schema.

## Design

### 1. `src/app/sitemap.ts`

- `import { ALL_SOLUTIONS } from '@/lib/lp-data'`.
- Map each solution to `${base}/solutions/${p.slug}`, priority **0.7**,
  `changeFrequency: 'monthly'` — the blog-post tier, deliberately **below** the
  five service pages at 0.9, which should win brand queries.
- `lastModified: now`, matching every existing entry in the file.
- **No `/solutions` static route entry.** It 404s; submitting it to Google would
  be a self-inflicted crawl error.

### 2. `src/app/solutions/[...path]/page.tsx` — breadcrumb fix

Emit a crumb only for a URL that actually resolves:

- **`Home`** — always.
- **`Solutions`** — **removed**. `/solutions` does not exist and will not.
- **Intermediate segments** (`/solutions/fintech`) — only when
  `getSolutionBySlug` resolves that prefix.
- **The page itself** — always, last.

For `fintech/bengaluru` today this yields `Home > AI Brand Films for Fintech
Brands in Bengaluru`. A two-item `BreadcrumbList` is valid; one citing a 404 is
not.

## Verification

This repo has **no test runner** — `package.json` has `dev`, `build`, `lint` only.
Verification is a build plus DOM/curl checks.

1. `npm run build` — `generateStaticParams` still emits `fintech/bengaluru`.
2. Dev server on **port 3007** (not 3000).
3. `sitemap.xml` contains `/solutions/fintech/bengaluru` and **not** `/solutions`.
4. The page's breadcrumb JSON-LD contains **no URL that 404s** — assert every
   `item` in the graph resolves.
5. **No visible diff**: the footer, nav, and every existing page render exactly as
   before. Only `sitemap.xml` and one `<script type="application/ld+json">` change.

**Do not screenshot scrolled content** — it comes back black in this harness (a
cream section captured black proved it). Verify via DOM/curl, or a tall viewport
at scroll 0.

## Out of scope

- Any visible change: index page, footer link, nav entry, service-page links.
- The URL-shape question: service as a third segment vs. today's industry×geo key.
- The studio repo. The generator needs no change; it already writes the slug the
  sitemap reads.
