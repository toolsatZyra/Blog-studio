# Blog hero light signature — a consistent pattern across every blog hero

**Date:** 2026-07-24
**Status:** Approved — design locked (user, 2026-07-24)
**Scope:** Site repo (`~/Documents/GitHub/ZyraUpdated`) only. Two files. No studio change.

## Problem

Blog hero images have no shared visual signature. The studio's `imageGenerator.ts`
prompts OpenAI for a "dark, gold-accent, filmic" look, but an image model varies
every generation, so the prompt gives a vibe, never a repeatable pattern. Posts
sit side by side on `/blog` looking like unrelated images rather than one set.

The user wants every blog hero on the site — existing posts and future ones — to
carry the same recognizable pattern.

## Decision (user, 2026-07-24)

Two decisions, both made against alternatives:

**1. The pattern is a "light signature", option C of four shown.**

| Option | What it is | Why not |
|---|---|---|
| A · Film texture | grain + scanlines | too subtle; a texture you sense, not a pattern you see |
| B · Branded frame | gold corner marks + ZYRA wordmark | reads as a watermark; competes with the H1 the site lays over the hero |
| **C · Light signature** | **top-right gold glow + bottom fade + gold rule** | **chosen** |
| D · Duotone grade | recolour everything black+gold | flattens the AI's colour work; strongest unifier but kills image richness |

C won because it is already the look of the studio's deterministic SVG fallback
(`imageGenerator.ts` `brandedSvg`), so live photos and fallbacks finally match,
and it is subtle enough not to fight the generated image underneath.

**2. Applied as a site-render overlay, not baked into the image file.**

| Approach | Covers | Cost | Rejected because |
|---|---|---|---|
| **Site overlay (chosen)** | every blog, existing + future, on deploy | 2 files, no dependency, no reprocessing | — |
| Bake into PNG (studio, canvas) | new images only, everywhere incl. OG | ~40 lines canvas | only NEW posts get it; existing posters unchanged |
| Both | everything | most work; must tune so the signature is not applied twice | YAGNI for now |

The site overlay covers **all existing blogs instantly**, which is what "all blogs
on my website" asks for. The image model's output stays pristine underneath.

### Accepted limits of the site-overlay approach

1. **The OG / social-share thumbnail does not carry the pattern.** That is the raw
   image file, which social platforms render directly; only the on-site hero is
   overlaid. Accepted.
2. **The studio's Export-tab preview will not show the pattern.** The signature
   lives on the site, not in the generated file, so the studio preview and the
   published hero differ. Minor; noted so it is not mistaken for a bug.

## Design

### One component, used everywhere a hero renders

`src/components/blog/BlogHeroSignature.tsx` — a positioned overlay layer, stacked
over the existing `<Image>`. Three elements, matching the fallback SVG's palette
(gold `#c9a876`):

- **Top-right radial glow** — `#c9a876` fading to transparent, upper-right origin.
- **Bottom fade** — dark vertical gradient. Doubles as legibility: the post page
  lays the H1 over the hero, so the fade keeps it readable (it replaces the
  current flat `bg-black/30`, which it improves on).
- **Gold rule** — a short 3px `#c9a876` bar in the lower-left, the accent mark
  from the fallback SVG.

Pure CSS/SVG gradients — nothing rasterised, no per-render cost, cannot fail. A
`variant` prop (`hero` | `card`) scales the rule and glow down for the smaller
index thumbnails so the same signature reads at both sizes.

Extracted as one component precisely so the post hero and the index cards cannot
drift apart — one definition, used twice.

### Two touch points

| File | Line (approx.) | Change |
|---|---|---|
| `src/app/blog/[slug]/page.tsx` | 116–118 | Replace the `bg-black/30` overlay div with `<BlogHeroSignature variant="hero" />` |
| `src/app/blog/page.tsx` | index card thumbnail | Add `<BlogHeroSignature variant="card" />` inside the card's image container |

Both are already `relative` containers with an absolutely-positioned `<Image fill>`,
so the overlay drops in with no layout change.

## Prerequisite

Local `master` is stale — the last merge happened on GitHub and this repo's CLI
credential cannot fetch. **Pull `master` in GitHub Desktop before implementing**,
or the edits apply to old files.

## Verification

No test runner in the site repo (`dev`, `build`, `lint` only). Verify by render:

1. `npm run build` — the blog post and index pages still prerender.
2. Dev server on **port 3007**; open a real post and `/blog`.
3. Confirm the glow, fade and rule appear over the hero and on the cards, and the
   H1 stays legible over the fade.
4. Screenshot for the user. (Scrolled screenshots come back black in this harness —
   capture at scroll 0 or a tall viewport.)

## Out of scope

- Baking the pattern into the image file (OG/social coverage) — revisit if social
  thumbnails matter later.
- Any studio change. `imageGenerator.ts` already produces this look as its
  fallback; the live PNG stays clean by design.
- Reprocessing existing posters — unnecessary, the overlay covers them at render.
