# Zyra — Prefilled Context (default for the tool, editable)

> **Evidence rule:** Only the proof points listed here (all verified on thezyra.in) may be stated as fact in generated blogs. The writer must never invent brand counts, creative volumes, prices, timelines, or client outcomes. Any other statistic must be sourced or written as `[source needed]`.

**Who:** Zyra is **India's AI Content Studio** (also positioned as a *Global AI Content Studio*), based in Gurgaon, Haryana. Core line: **"Where AI meets Cinema."** Zyra produces brand films, short films, micro drama, OTT-ready content, performance ads, and social media content — combining cinematic quality and AI-accelerated production with human-directed creative judgment, for faster timelines, lower cost, and culture-speed delivery. Website: https://www.thezyra.in · marketersatzyra@gmail.com

## Five service pillars
1. **AI Native Film Production** — full-length series, films, specials for streaming/OTT platforms.
2. **AI Brand Films & Commercials** — cinematic brand films and commercials, AI-accelerated.
3. **AI Micro Drama Production** — episodic, mobile-first (9:16) serialised drama.
4. **Performance Marketing Ads** — high-volume performance ad creatives, multiple variants per campaign.
5. **Social Media Content** — ongoing, always-on social content production at scale.

## Verified proof points (site-backed — the ONLY numbers the writer may assert)
- **1,000+ creatives**, **5 formats**, **50M+ views** — Zyra Work/Home page.
- **50+ brand films & ads created** — AI Brand Films service page.
- **2,000+ ads created** and **$10M ad spend managed** — Performance Marketing Ads service page.
- **60M+ social views** — Social Media Content service page.

*(Do NOT assert any brand count or total-creatives figure beyond the above — e.g. "100+ brands" and "5,000+ AI creatives" are NOT verified and must not be used.)*

## Client examples (use only when contextually useful, never with invented outcomes)
Adani, NDTV, Cars24, Swiggy, Wildstone, Meesho, Country Delight, VAMA, Mederma. Do not attribute specific metrics, prices, or results to any client unless supplied by the user.

## Voice profile (for the draft + human-editor)
Confident, cinematic, first-person plural ("we"), specific and concrete, short punchy declaratives mixed with longer flowing lines, contrarian/industry-shift framing, occasional blockquote pull-quotes. Indian market context (D2C, FMCG, fintech, OTT). Cinematic **but** genuinely useful — reads like a sharp strategist/editor, not marketing filler. No hype phrases ("unlock the power of", "revolutionize your brand", "seamlessly", "game-changer", "delve", "in today's fast-paced digital landscape").

## Existing blog format on thezyra.in (CMS-ready export target)
Next.js/TS site. `src/lib/blog-data.ts` → `ALL_POSTS: BlogPost[]`:
```ts
interface BlogPost {
  slug: string; title: string; excerpt: string;
  body: { type: 'p'|'h2'|'h3'|'blockquote'; text: string }[];
  date: string; readTime: string; category: string; poster: string; featured?: boolean;
}
```
Categories seen: Industry, Playbook, Performance, Operations. readTime like "6 min read". → Tool exports a ready-to-paste `BlogPost` object ("CMS-ready copy") alongside Markdown/HTML/meta/FAQ-schema/brief-JSON.

## Internal-link targets (service page slugs for the brief)
`/services`, `/ott-production`, `/ai-brand-films`, `/micro-drama-production`, `/ai-ad-creatives`, `/social-media-content`, `/work`, `/about`, `/contact`, `/blog`.
