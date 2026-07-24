# Blog hero as a generated pattern (cinematic light rays)

**Date:** 2026-07-24
**Status:** Implemented (user approved the look, 2026-07-24)
**Scope:** Studio repo (`Programmatic-SEO`) only. The website repo is never touched.

## How this spec evolved

It began as "add a light-signature overlay to the AI photo hero" (site-render),
was revised to "bake that signature into the photo in the studio", and finally
pivoted to **replace the photo entirely with a generated pattern**. The user's
words: "generate a pattern in place of these image." Each earlier approach is
superseded; this document describes what shipped.

## Problem

Blog heroes were photorealistic images from OpenAI. Two issues:

1. **No repeatable house style** — an image model varies every run, so posts sat
   side by side looking unrelated.
2. **Cost and unpredictability** — every hero was a paid API call, and confirming
   a given hero carried any shared treatment was unreliable.

## Decision (user, 2026-07-24)

The hero is a **deterministic branded pattern**, not a photo:

- **Style: cinematic light rays** (chosen over contour-field and film-frames, and
  over a decorative repeating pattern). A near-black field, a fan of thin gold
  "projector" rays from a top corner, the studio eyebrow, the post title in cream
  serif, and the gold rule. Taste reference: Nicolas Solerieu's minimal dark
  geometric blog covers — sparse, one accent on near-black.
- **Seeded by the slug** so every post gets a hero from the same family that still
  differs post to post (ray count, spread, positions).
- **Generated in the browser, no API** — instant, free, identical every time for a
  given post.

### Consequences

| | |
|---|---|
| OpenAI photo path retired | `imageGenerator.ts` and `POST /api/image` removed. The pattern needs no server, and removing the endpoint also stops the public studio from being able to spend OpenAI credits. |
| Signature-overlay code retired | `heroSignature.ts` / `applyHeroSignature.ts` (baked a mark onto photos) are gone — the pattern carries the glow and rule itself. |
| Existing posters | Unchanged. A post gets a pattern hero when its hero is (re)generated. |
| Website | Untouched. The site still renders `post.poster` as a committed PNG exactly as before. |

## Design

Two units plus one wiring change, all in the studio:

1. `src/lib/export/heroPattern.ts` — **pure, unit-tested.**
   `heroPatternSvg({title, slug, width, height})` returns the hero as an SVG
   string. A slug hash seeds a small PRNG (mulberry32) that places the rays, so
   output is deterministic and varies per post. Every dimension is a fraction of
   width/height. No DOM, no `Date`, no `Math.random` — matching the library's
   determinism rule.

2. `src/lib/export/rasterizeSvg.ts` — **thin browser wrapper.**
   `svgToPngBase64(svg, w, h)` draws the SVG on a canvas and returns PNG base64.
   The site commits and renders a PNG poster, so the SVG is rasterised at export
   time. No unit test (needs a DOM); all design lives in unit 1.

3. `app/components/ExportTab.tsx` — `generateImage()` now builds the pattern SVG,
   rasterises it, and sets a publishable PNG hero (`/posters/{slug}.png`). No
   `fetch('/api/image')`. Card copy updated from "cinematic poster (OpenAI…)" to
   the pattern description.

## Testing

- `heroPattern.test.ts` (9): well-formed SVG at size; renders title + eyebrow;
  escapes markup in the title; brand gold; **deterministic** (same slug → identical
  bytes); **varies by slug**; scales with the canvas; wraps a long title to ≤3
  lines; inert markup (no script/href).
- Removed: the `imageGenerator` mock-SVG test in `pipeline.test.ts` and the
  `heroSignature` suite — both covered retired code.
- Suite: 170 pass, typecheck and build clean; `/api/image` absent from the build.

## Verification

Rasterised the real `heroPatternSvg` output for two posts and inspected the PNGs:
gold glow top-right, thin rays fanning from the corner, eyebrow, cream serif
title, gold rule — and the two posts visibly differ while staying one family.
Full in-browser generate on the deployed studio confirms it after Vercel deploys.

## Out of scope

- Any website-repo change.
- Reprocessing existing posters.
- Keeping the OpenAI photo path as an option — the pattern replaces it outright.
