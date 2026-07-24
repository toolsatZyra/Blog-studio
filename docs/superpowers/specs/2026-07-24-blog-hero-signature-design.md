# Blog hero light signature — baked into the image, in the studio

**Date:** 2026-07-24
**Status:** Approved — design locked (user, 2026-07-24)
**Scope:** Studio repo (`Programmatic-SEO`) only. **The website repo is never touched.**

## Problem

Blog hero images have no shared visual signature. `imageGenerator.ts` prompts
OpenAI for a "dark, gold-accent, filmic" look, but an image model varies every
generation, so the prompt gives a vibe, never a repeatable pattern. Posts sit
side by side on the blog looking like unrelated images rather than one set.

The user wants every blog hero to carry the same recognizable pattern.

## Decisions (user, 2026-07-24)

**1. The pattern is a "light signature" (option C of four shown).**

Top-right gold glow + dark bottom fade + a short gold rule. Chosen over film
texture (too subtle), a branded frame/wordmark (reads as a watermark, competes
with the H1 the site lays over the hero), and a duotone grade (flattens the AI's
colour work). C is already the look of the studio's own SVG fallback
(`imageGenerator.ts` `brandedSvg`), so live photos and fallbacks finally agree.

**2. Baked into the image in the studio — NOT a website change.**

An earlier draft of this spec applied the pattern as a render-time overlay in the
website repo (`ZyraUpdated`). The user ruled that out: the website's code is not
to be touched from here. So the signature is composited onto the generated PNG
inside the studio instead. It lives entirely in `Programmatic-SEO`.

| Consequence | Detail |
|---|---|
| Travels with the file | The pattern is part of the PNG, so it shows on-site, in OG/social thumbnails, everywhere the poster is used. |
| **New images only** | Already-published posters are unchanged. A post gets the signature only when its hero is (re)generated. Accepted. |
| No website edit | Nothing in `ZyraUpdated` changes. The site keeps rendering `post.poster` exactly as it does today. |

## Design

### Where it happens: client-side, on the generated PNG

Image generation returns a PNG from `/api/image` (server) to the Export tab
(browser). The signature is composited **in the browser** using the Canvas 2D
API — so it adds **no dependency** (the project stays at next/react/docx) and is
deterministic: the same overlay math runs every time.

The composite replaces `hero.base64` / `hero.dataUrl` before anything is
previewed or published, so **what you see is what publishes** — the existing
principle of this tool.

### Two units, split so the math is testable

1. `src/lib/export/heroSignature.ts` — **pure, unit-tested.**
   `heroSignatureSvg(width, height): string` returns the overlay as an SVG
   string: the three C elements, sized relative to the image dimensions
   (glow radius, fade stops, rule position/length all derived from w/h). No DOM,
   so `node:test` can assert its structure and that it scales with dimensions.

2. `applyHeroSignature(pngBase64, width, height): Promise<string>` — **thin
   browser wrapper**, not unit-tested (needs Canvas). Draws the PNG to a canvas,
   draws the SVG overlay on top (via an `Image` from the SVG data URI), returns
   the composited PNG as base64. The overlay content comes entirely from unit 1,
   so the untested part is only the canvas plumbing.

The PNG is a same-origin data URI (our own server's base64), so the canvas is not
tainted and `toDataURL` succeeds.

### Signature parameters (match fallback + mockup C)

- **Bottom fade** — vertical linear gradient, transparent to ~55%, to near-black
  (`#050403`, ~0.9) at the base. Keeps any H1 the site overlays legible.
- **Top-right glow** — radial, gold `#c9a876` ~0.35 at ~(76%, 22%) fading to 0.
- **Gold rule** — a short `#c9a876` bar (~8% of width, 3px scaled) at lower-left.

### Only live PNGs are composited

The mock SVG fallback already carries this look, so compositing it would double
the signature. `applyHeroSignature` runs only when `hero.mode === 'live'`.

## Wiring

`app/components/ExportTab.tsx` — after `generateImage()` receives a live hero,
composite before setting state, so `hero` holds the patterned image for both
preview and publish. A visible note already distinguishes the live/mock badge; no
new UI needed.

## Testing (Node built-in runner)

- `heroSignatureSvg()` — returns valid SVG; contains the glow, fade and rule;
  the rule position and glow radius scale with `width`/`height`; gold is the
  brand `#c9a876`.
- No test for the canvas wrapper (no DOM in `node:test`); it is deliberately thin
  and delegates all content to the tested function.
- Existing image tests still pass.

## Verification

The studio runs on Vercel. After deploy: generate a hero in the Export tab and
confirm the glow, fade and rule appear on the live image, and that the mock
fallback is not double-stamped. Screenshot for the user.

## Out of scope

- Any change to the website repo (`ZyraUpdated`).
- Reprocessing existing posters — the pattern applies to newly generated images.
- A raster image dependency (sharp/canvas-node) — the browser Canvas avoids it.
