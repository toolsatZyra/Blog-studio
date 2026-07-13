# Writing Playbook — Human-Sounding, SEO + GEO/AEO Blogs for Zyra

This is the method the `blogGenerator` and `humanEditor` modules implement, and what the `seoGeoAuditor` checks. Goal: posts that **rank in Google, get cited by AI answer engines, and read like a sharp human strategist wrote them** — never like a template.

---

## 1. The two-pass writing method

Great human-sounding writing rarely comes from one prompt. The tool uses two passes:

1. **`blogGenerator` (draft pass)** — writes a complete, correct, well-structured draft to the brief, in Zyra's voice, using only verified facts.
2. **`humanEditor` (humanising pass)** — rewrites that draft specifically to sound human: varies rhythm, strips AI tells, adds concrete detail, cuts over-polish — **without changing any fact**.

Splitting them matters: the first pass optimizes for completeness and structure, the second for voice. One prompt trying to do both tends to produce fluent-but-generic copy.

---

## 2. What "sounds human" actually means (and how we get it)

AI-detectors and readers both react to two statistical properties. We optimize the *writing*, not a detector.

- **Burstiness (sentence-length variance).** Humans put a 4-word sentence next to a 30-word one. AI defaults to uniform medium-length sentences. → The humanEditor deliberately mixes very short and long sentences; the auditor flags low variance.
- **Lower predictability.** Generic phrasing reads as machine-made. → Prefer specific words and concrete nouns over smooth filler.

Concrete, machine-checkable techniques:
- **Vary sentence length** — include some ≤5-word sentences and some ≥30-word ones per section.
- **Use contractions** (it's, you'll, don't).
- **Active voice** by default; first-person brand voice ("we built", "here's what we've seen").
- **Concrete specifics** over abstractions — real formats, timelines, examples, named platforms — instead of "various", "numerous", "a wide range".
- **Vary sentence openings** — no two consecutive sentences starting the same way; don't always lead with a connective.
- **Break the rule-of-three** — AI loves triads ("fast, reliable, and scalable"). Vary list lengths (2, 4, 5).
- **Short paragraphs** — 1–3 sentences; give the reader air.

## 3. Banned AI-tell phrases (the humanEditor strips/replaces these)
Openers: *in today's fast-paced digital landscape*, *in the ever-evolving world of*, *in the digital age*.
Hype: *unlock the power of*, *revolutionize your brand*, *game-changer*, *take it to the next level*, *supercharge*, *elevate your*.
Filler connectives: *moreover*, *furthermore*, *additionally*, *it's important to note*, *it's worth noting*, *that being said*.
Overused verbs/nouns: *delve*, *leverage*, *harness*, *navigate the landscape*, *tapestry*, *realm*, *testament*, *beacon*.
Overused adjectives: *seamless(ly)*, *robust*, *cutting-edge*, *world-class*, *bespoke*, *unparalleled*.
Closers: *in conclusion*, *at the end of the day*, *ultimately*.
> Full list lives in `src/lib/scoring/bannedPhrases.ts`; the human-voice gate fails on any hit.

---

## 4. Anti-fabrication (non-negotiable)
The fastest way to destroy credibility is a confident fake number. So:
- **Never invent** statistics, case studies, client outcomes, prices, or timelines.
- **Zyra proof points**: use only the site-verified set in `docs/zyra-context.md` (1,000+ creatives, 5 formats, 50M+ views, 50+ brand films, 2,000+ ads, $10M ad spend, 60M+ social views), or facts the user supplies.
- **External stats**: only if fetched from a real source. Otherwise write the claim and tag it **`[source needed]`** — never a made-up figure.
- **Client mentions**: names only, no invented results.
- Evidence target is **quality, not quantity**: 3–6 strong, source-backed claims per post — or one per major section where it genuinely strengthens the argument — not a stat quota.

---

## 5. Structure that serves SEO + GEO/AEO + humans at once

```
Title (≤ ~60 chars, primary keyword near front)
Meta description (~120–158 chars, keyword + reason to click)
H1 (one only)

Intro (2–3 short paras): answer the core question in the first ~100 words,
first-person, no hype opener. One sourced fact if it strengthens it.

Key takeaways box (3–5 bullets) — front-loaded, self-contained answers.

H2 (question-style where natural): open with a direct 2–3 sentence answer,
then expand. Repeat for each main section.
  - comparison <table> for "vs / best / cost" intent
  - numbered steps for "how to" intent
  - a concrete example or Zyra-relevant illustration

H2: FAQ — 3–6 real questions, each answered in ~40–60 words → FAQPage schema.

Natural CTA — helpful, not salesy (ties to the input CTA/goal).
Sources / references (links to any external claims).
```

**GEO/AEO levers** (directional, from GEO research — treated as guidance, not guarantees): cite sources, include verifiable statistics, add attributed quotations, front-load answers, use question-style headings, name entities explicitly (Zyra, AI content studio, AI brand films, micro drama, OTT, performance ads, social content, India), and expose FAQ/BlogPosting schema. These *can* improve generative-engine visibility by **up to ~40%** per the foundational study — we present them as levers, never as promised lift.

---

## 5b. Market adaptation (India · GCC · US)

Zyra sells across India, the GCC, and the US, so the draft adapts to the target market(s) chosen in the inputs:
- **Currency** — ₹ (INR; lakh/crore) for India, $ (USD) for US, AED/SAR for GCC. Lead with the **primary** (first-selected) market's currency; when referencing another selected market, use *its* currency. Never present one currency's number as another, never convert silently, and never invent figures.
- **Spelling** — Indian/British English for India & GCC, American English for the US.
- **Examples** — India: D2C/FMCG, Swiggy, JioCinema, IPL/festive moments. GCC: Careem/Noon/Talabat, Ramadan/Eid, UAE/KSA. US: US D2C, streaming, Super Bowl/seasonal retail.

The `seoGeoAuditor` runs a **currency-market-match** check that flags any currency belonging to a *non-target* market (e.g. ₹ in a US-only post). `$` is never flagged (it's global and appears in Zyra's verified "$10M ad spend managed" proof point).

## 6. Zyra voice
Cinematic **but genuinely useful**. Confident, first-person plural, specific. Short punchy declaratives mixed with longer flowing lines. Industry-shift framing ("this isn't a marginal improvement, it's a structural shift"). Occasional blockquote pull-quote. Indian market context (D2C, FMCG, fintech, OTT). Reads like a strategist/editor who knows the craft — not marketing filler, not an AI template. Tone is selectable per post (cinematic but useful · founder-led · expert editorial · simple and direct).

---

## 7. How the auditor enforces this
The `seoGeoAuditor` returns three things, each with specific fixes:
- **SEO score** — one H1, heading hierarchy, meta lengths, natural keyword use (no stuffing), internal + external links, readability.
- **GEO/AEO score** — direct answer in first 100 words, question headings, entity coverage, FAQ schema, quotable definitions, comparison table where useful, **claims backed by sources / no unsupported stats**.
- **Human-voice gate** — sentence-length variance, 0 banned phrases, contractions present, low passive voice, varied list lengths, concrete specifics.
Anything failing comes back as an actionable note, and can trigger one more `humanEditor` pass.
