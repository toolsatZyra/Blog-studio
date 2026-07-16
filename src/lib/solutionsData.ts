// Mirror of the live site's real services + case studies.
//
// GENERATED from ~/Documents/GitHub/ZyraUpdated (work-data.ts, service-data.ts)
// on 2026-07-16 - transcribing these by hand is how invented clients, wrong
// stream ids and made-up deliverables get in. Re-generate rather than edit.
//
// Deliverables and process are REAL: they come from the site's own service
// pages, so the generator never has to invent what Zyra actually delivers.
//
// HARD RULE: work-data.ts carries NO metrics. There is deliberately no results/
// metrics field here. Proof may use only these fields plus a /work/[slug] link.

export interface ServiceOption {
  slug: string;
  title: string;
  label: string;
  subtitle: string;
  statsHeadline: string;
  stats: { value: string; label: string }[];
  deliverables: { title: string; desc: string }[];
  process: { num: string; title: string; desc: string }[];
}

export interface CaseStudyOption {
  slug: string;
  client: string;
  title: string;
  category: string;
  year: string;
  tags: string[];
  brief: string;
  cfStream: string;
  vertical: boolean; // true = 9:16 source; the template crops via object-fit: cover
}

/** The 5 real services. Selection is OPTIONAL (0..N). */
export const SERVICE_CATALOG: ServiceOption[] = [
  {
    slug: "ott-production",
    title: "AI Native Film Production",
    label: "Service 01",
    subtitle: "Full-length series, films, and specials built for streaming platforms.",
    statsHeadline: "We made",
    stats: [{"value":"10+","label":"Episodes"},{"value":"200hr+","label":"Content Created"}],
    deliverables: [
      { title: "Feature / Series Production", desc: "Full-length films or multi-episode series, streaming-spec ready." },
      { title: "4K Cinematic Master", desc: "Colour-graded, platform-compliant 4K delivery files." },
      { title: "Original Score & Sound", desc: "Custom soundtrack composed and mixed for the project." },
      { title: "Multilingual Audio & Subs", desc: "Dubbed and subtitled versions for Hindi, English, Tamil, Telugu." },
      { title: "Platform Submission Pack", desc: "Spec-compliant exports for JioCinema, MX, Amazon, Netflix, YouTube." },
      { title: "Trailer & Promo Package", desc: "Theatrical trailer, teaser, and social promo cuts for launch." },
    ],
    process: [
      { num: "01", title: "Development & Greenlight", desc: "Story, script, lookbook, and production plan. We go into production with a fully approved creative blueprint." },
      { num: "02", title: "Pre-Production", desc: "AI-assisted visual development, storyboarding, casting brief, location design, and shoot schedule - compressed to days, not months." },
      { num: "03", title: "Production Sprint", desc: "AI-accelerated principal production with human creative oversight at every stage." },
      { num: "04", title: "Post & Finishing", desc: "Edit, VFX, colour grade, sound design, music, and delivery master - handled in a single integrated pipeline." },
      { num: "05", title: "Platform Delivery", desc: "All platform-spec exports, trailers, stills, and metadata delivered with a launch-ready press package." },
    ],
  },
  {
    slug: "ai-brand-films",
    title: "AI Brand Films & Commercials",
    label: "Service 02",
    subtitle: "Cinematic brand stories at the speed of culture. Five to seven day delivery.",
    statsHeadline: "We've made",
    stats: [{"value":"50+","label":"Brand Films & Ads Created"}],
    deliverables: [
      { title: "60–90s Hero Film", desc: "Full cinematic brand narrative, broadcast-ready." },
      { title: "Cut-downs (15s / 30s)", desc: "Social and pre-roll edits from the hero film." },
      { title: "Eye-Balls Ready Video", desc: "Colour-graded 4K delivery for streaming platforms." },
      { title: "Multilingual Versions", desc: "Hindi, Tamil, Telugu, English - same quality, every version." },
      { title: "Subtitle & Caption Pack", desc: "Burnt-in and SRT for accessibility and social." },
      { title: "A/B Creative Variants", desc: "Two alternate cut approaches to test performance." },
    ],
    process: [
      { num: "01", title: "Brief & Discovery", desc: "One structured session to extract brand truth, audience insight, and campaign objective. We leave with everything we need." },
      { num: "02", title: "Concept & Storyboard", desc: "Three distinct creative directions. Full AI-visualised storyboard. You pick one, or we hybridise." },
      { num: "03", title: "Production", desc: "AI-assisted generation, voiceover recording, music composition, and VFX in a single accelerated pipeline." },
      { num: "04", title: "Review & Refinement", desc: "Two structured rounds of feedback. No runaway revisions. Clear, fast, decisive." },
      { num: "05", title: "Delivery", desc: "All formats, all platforms, all resolutions. Delivered day 5-7." },
    ],
  },
  {
    slug: "micro-drama-production",
    title: "AI Micro Drama Production",
    label: "Service 03",
    subtitle: "India's $10B content opportunity. We make it real.",
    statsHeadline: "We've generated",
    stats: [{"value":"10M+","label":"Views Generated"}],
    deliverables: [
      { title: "5-Episode Series", desc: "3–7 minute episodes, complete narrative arc." },
      { title: "Mobile-First Format", desc: "9:16 primary cut, optimised for Reels, Shorts, TakaTak." },
      { title: "Original Score", desc: "Custom music per episode - theme + scene cues." },
      { title: "Episodic Title Cards", desc: "Branded chapter titles, recap cards, cliffhanger frames." },
      { title: "Social Trailer Pack", desc: "15s and 30s episode teasers for pre-release distribution." },
      { title: "Platform-Ready Masters", desc: "Spec-compliant exports for MX, JioCinema, YouTube, Instagram." },
    ],
    process: [
      { num: "01", title: "Story Development", desc: "Character arcs, episode breakdowns, brand integration brief. The creative foundation everything else is built on." },
      { num: "02", title: "Script & Storyboard", desc: "Full episode scripts with shot-by-shot AI storyboard. Approved before a single frame is rendered." },
      { num: "03", title: "Production Sprint", desc: "All 5 episodes produced in parallel using our AI pipeline. Voiceover, music, and VFX in one continuous flow." },
      { num: "04", title: "Series Assembly", desc: "Edit, colour grade, sound mix. Each episode reviewed and refined with one round of changes." },
      { num: "05", title: "Launch Package", desc: "All platform masters, trailers, social assets, and a release calendar. Ready to publish." },
    ],
  },
  {
    slug: "ai-ad-creatives",
    title: "Performance Marketing Ads",
    label: "Service 04",
    subtitle: "3+ variants per campaign. AI-powered. Human-approved.",
    statsHeadline: "We've managed",
    stats: [{"value":"2000+","label":"Ads Created"},{"value":"$10M","label":"Ad Spend Managed"}],
    deliverables: [
      { title: "Video Ads (6s / 15s / 30s)", desc: "Hook-first video creatives with multiple format cuts." },
      { title: "Static Display Ads", desc: "Full-bleed statics across all IAB standard sizes." },
      { title: "Carousel Sequences", desc: "Product-led carousel ads for Meta and Google." },
      { title: "UGC-Style Variations", desc: "Lo-fi, authentic-feeling creatives designed to bypass ad fatigue." },
      { title: "Refresh Packs", desc: "Monthly creative refresh to prevent audience fatigue." },
      { title: "Naming & Taxonomy System", desc: "Structured naming so your team knows exactly what to test." },
    ],
    process: [
      { num: "01", title: "Creative Brief Intake", desc: "Audience, objective, platform, budget, and winning creative benchmarks. We go into production with full context." },
      { num: "02", title: "Hook Matrix", desc: "We map 10+ hooks across pain/gain/fear/social proof. Every variant starts with a different hook." },
      { num: "03", title: "AI Production Sprint", desc: "All 3+ variants produced across video, static, and carousel formats in parallel." },
      { num: "04", title: "Quality Pass", desc: "Human review of every creative. Brand safety, messaging accuracy, and platform compliance checked." },
      { num: "05", title: "Delivery & Taxonomy", desc: "Organised delivery with naming convention, platform specs, and recommended test structure." },
    ],
  },
  {
    slug: "social-media-content",
    title: "Social Media Content",
    label: "Service 05",
    subtitle: "20+ pieces per week. Always on. Always sharp.",
    statsHeadline: "We've generated",
    stats: [{"value":"60M+","label":"Views Generated"}],
    deliverables: [
      { title: "Reels & Short-Form Video", desc: "6–60s vertical video for Instagram, YouTube Shorts, TakaTak." },
      { title: "Carousels & EDU Posts", desc: "Swipeable carousels for product, tips, and thought leadership." },
      { title: "Static Feed Posts", desc: "On-brand static posts for feed curation and announcements." },
      { title: "Story Templates", desc: "24-hour story sequences - polls, countdowns, product reveals." },
      { title: "Caption & Copy Library", desc: "Hook-led captions, hashtag sets, and CTA copy for every post." },
      { title: "Weekly Content Calendar", desc: "Structured posting schedule aligned to campaign moments." },
    ],
    process: [
      { num: "01", title: "Brand & Audience Audit", desc: "We analyse your existing content performance, competitor benchmarks, and audience behaviour patterns before writing a single brief." },
      { num: "02", title: "Monthly Content Strategy", desc: "Themes, campaigns, and a content mix mapped to your business calendar and platform algorithms." },
      { num: "03", title: "Weekly Production Sprint", desc: "20+ pieces produced each week - video, static, carousels - ahead of schedule so your team can review without pressure." },
      { num: "04", title: "Approval & Scheduling", desc: "You approve via a shared review board. We handle scheduling and platform publishing." },
      { num: "05", title: "Monthly Performance Review", desc: "Data-led review of what worked. The next month's strategy adapts based on performance." },
    ],
  },
];

/** All 22 real case studies. Selection is REQUIRED (>=1); only the
 *  first 3 render (featured + 2), in the operator's selection order. */
export const CASE_STUDY_CATALOG: CaseStudyOption[] = [
  {
    slug: "the-holy-tirthankars",
    client: "Nandi Pictures Originals",
    title: "The Holy Tirthankars",
    category: "OTT Production",
    year: "2025",
    tags: ["OTT","24 Episodes","Spiritual"],
    brief: "24 Tirthankaras: Ancient Wisdom from Daaji's Book",
    cfStream: "1e09d5e68dd02a6c6ff1f71051fd4855",
    vertical: false,
  },
  {
    slug: "kapil-muni",
    client: "Nandi Pictures Originals",
    title: "Kapil Muni",
    category: "OTT Production",
    year: "2025",
    tags: ["OTT","5 Episodes","Spiritual"],
    brief: "Story of a muni when he went to an area guarded by goons.",
    cfStream: "2781cd26fdcf6d8a83f909173cf917c1",
    vertical: false,
  },
  {
    slug: "dharmruchi-angaar",
    client: "Nandi Pictures Originals",
    title: "Dharmruchi Angaar",
    category: "OTT Production",
    year: "2025",
    tags: ["OTT","5 Episodes","Spiritual"],
    brief: "Story of a muni who sacrificed his life.",
    cfStream: "aa75b375be00df015e31fdbdf7e40a73",
    vertical: false,
  },
  {
    slug: "ramayana",
    client: "Devam Originals",
    title: "Ramayana",
    category: "OTT Production",
    year: "2025",
    tags: ["OTT","Festival","Spiritual"],
    brief: "Short film tribute to Ram Navami - joy, devotion, and storytelling.",
    cfStream: "8834f79fa14cfd6eb0c1ec544b7d0e34",
    vertical: false,
  },
  {
    slug: "adani-ndtv",
    client: "Adani X NDTV",
    title: "FutureX Quiz Announcement",
    category: "Brand Film",
    year: "2025",
    tags: ["Brand Film","TV Commercial","4K"],
    brief: "Adani X NDTV futureX quiz announcement TV video",
    cfStream: "b72bcef661201b2de0afa5edd01c7db3",
    vertical: false,
  },
  {
    slug: "meesho",
    client: "Meesho",
    title: "Animatic",
    category: "Brand Film",
    year: "2025",
    tags: ["Brand Film","Regional","4K"],
    brief: "Animatics crafted for Meesho's South India region, set against a traditional South Indian backdrop.",
    cfStream: "6a915f97456a3b7a1b363fe6e87ceab7",
    vertical: false,
  },
  {
    slug: "swiggy",
    client: "Swiggy",
    title: "New Product Launch",
    category: "Brand Film",
    year: "2025",
    tags: ["Brand Film","Launch","4K"],
    brief: "A new product launch campaign introducing Swiggy Noice - bringing bold, youthful energy to the brand's latest offering.",
    cfStream: "7fe1be5e9318f4bae80bf4ddcac39d25",
    vertical: false,
  },
  {
    slug: "cars24",
    client: "Cars24",
    title: "Service Launch",
    category: "Brand Film",
    year: "2025",
    tags: ["Brand Film","Launch","4K"],
    brief: "An ad campaign for Cars24 spotlighting their 30-day return policy - building consumer trust and redefining confidence in second-hand car buying.",
    cfStream: "466b01620c29279a0a63ee1e451fe59c",
    vertical: false,
  },
  {
    slug: "madhusudhan-ghee",
    client: "Madhusudhan Ghee",
    title: "Shakumbhari Devi Mandir",
    category: "Micro Drama",
    year: "2025",
    tags: ["Micro Drama","Temple Story","4K"],
    brief: "A devotional content series on Maa Shakumbhari Devi - weaving spiritual storytelling with seamless integration of Madhusudan's products.",
    cfStream: "ac46b166e20adfb6b0462145d06f4044",
    vertical: true,
  },
  {
    slug: "vama",
    client: "VAMA",
    title: "VAMA TV",
    category: "Micro Drama",
    year: "2025",
    tags: ["Micro Drama","OTT","4K"],
    brief: "Created original micro dramas for VAMA App's newly launched feature, VAMA TV - blending sharp storytelling with platform-native content.",
    cfStream: "83451e3dafac471452fa068ce85e6896",
    vertical: true,
  },
  {
    slug: "vaishno-devi",
    client: "Devam",
    title: "Vaishno Devi",
    category: "Micro Drama",
    year: "2025",
    tags: ["Micro Drama","Story","4K"],
    brief: "A sacred storytelling piece on Maa Vaishno Devi - capturing the divine journey, deep-rooted faith, and spiritual significance of one of India's most revered pilgrimages.",
    cfStream: "d3e154fe3eb6b08a4760f24dffc7330e",
    vertical: true,
  },
  {
    slug: "kedarnath",
    client: "Devam",
    title: "Kedarnath",
    category: "Micro Drama",
    year: "2025",
    tags: ["Micro Drama","Story","4K"],
    brief: "A sacred story of Kedarnath Dham - bringing to life the mystical legacy, ancient devotion, and divine aura of one of the holiest Shiva shrines.",
    cfStream: "7020a0f1039c9c610d2a2ac6b903b36f",
    vertical: true,
  },
  {
    slug: "wildstone-ultra-sensual",
    client: "Wildstone",
    title: "Ultra Sensual",
    category: "Ad Creative",
    year: "2025",
    tags: ["Performance","International","4K"],
    brief: "A performance marketing ad crafted for Wildstone's entry into the US market - designed to drive conversions through bold, targeted creatives.",
    cfStream: "416e9a651ab6e32a997a63167c5ef096",
    vertical: true,
  },
  {
    slug: "wildstone-edge",
    client: "Wildstone",
    title: "Edge",
    category: "Ad Creative",
    year: "2025",
    tags: ["Performance","International","4K"],
    brief: "A performance marketing ad crafted for Wildstone's entry into the US market - translating the brand's edge for an international audience.",
    cfStream: "bbd1702aedda2389ad0e9ae9e7e8f361",
    vertical: true,
  },
  {
    slug: "rabitat",
    client: "Rabitat",
    title: "Product Marketing",
    category: "Ad Creative",
    year: "2025",
    tags: ["Performance","Product","4K"],
    brief: "Extensive creation of performance marketing ads for Rabitat's bottle category - a high-volume creative suite built to test, optimise, and deliver results.",
    cfStream: "36066418062700740ca08867814d58e1",
    vertical: true,
  },
  {
    slug: "goodscore",
    client: "Goodscore",
    title: "Product Marketing",
    category: "Ad Creative",
    year: "2025",
    tags: ["Performance","Product","4K"],
    brief: "Performance marketing videos for Goodscore App - conversion-focused, data-driven creatives that communicate the app's value proposition clearly.",
    cfStream: "b1f7e94fee9ca28d6c94ef0f65b0215b",
    vertical: true,
  },
  {
    slug: "kissansay",
    client: "KissanSay",
    title: "Storytelling",
    category: "Social",
    year: "2025",
    tags: ["Social","Reels","4K"],
    brief: "Authentic, organic storytelling content for Kissansay's natural products - rooted in honesty, simplicity, and a deep respect for nature.",
    cfStream: "fb2ec13f628715cc390884d2c21c471e",
    vertical: true,
  },
  {
    slug: "bharat-ki-soch",
    client: "Bharat Ki Soch",
    title: "Storytelling",
    category: "Social",
    year: "2025",
    tags: ["Social","Reels","4K"],
    brief: "Thought leadership content exploring India's civilisational ethos - sparking meaningful conversations around culture, heritage, and identity.",
    cfStream: "38d25d2d4974f61f94c8ebfdd4933b1e",
    vertical: true,
  },
  {
    slug: "inyou",
    client: "InYou",
    title: "Product Marketing",
    category: "Social",
    year: "2025",
    tags: ["Social","Product","4K"],
    brief: "Product marketing videos for InYou - translating the brand's core essence into visually compelling narratives that connect and drive consumer intent.",
    cfStream: "1c4159bc6fce242d637766f33c9dd43c",
    vertical: true,
  },
  {
    slug: "mederma",
    client: "Mederma",
    title: "UGC",
    category: "Social",
    year: "2025",
    tags: ["Social","UGC","4K"],
    brief: "Product marketing videos for Mederma - credible, benefit-led storytelling that builds brand trust while communicating product efficacy.",
    cfStream: "53dbe3243e96592f9f09899f807a98de",
    vertical: true,
  },
  {
    slug: "country-delight",
    client: "Country Delight",
    title: "Drama",
    category: "Social",
    year: "2025",
    tags: ["Social","Product","4K"],
    brief: "A heartwarming Children's Day campaign for Country Delight - celebrating the joy, curiosity, and wholesome spirit of childhood.",
    cfStream: "dc10155ea4a6da6a8fdf4a97a6eed7a0",
    vertical: true,
  },
  {
    slug: "revision-app",
    client: "Revision App",
    title: "Education",
    category: "Social",
    year: "2025",
    tags: ["Social","Lesson","4K"],
    brief: "Engaging geography teaching videos for an EdTech platform - transforming complex concepts into visually rich, immersive content for students.",
    cfStream: "1789b86b944efc35e207364614492b76",
    vertical: true,
  },
];

/** How many case studies actually reach the page. Extras are dropped, so the
 *  picker must say so at selection time rather than discarding silently. */
export const PROOF_LIMIT = 3;

/** Free-text with suggestions: the operator can type anything; these only keep
 *  common values spelled consistently so slugs don't fragment. */
export const INDUSTRY_SUGGESTIONS = [
  'Fintech', 'D2C', 'FMCG', 'E-commerce', 'SaaS', 'Healthcare', 'EdTech',
  'Real Estate', 'Automotive', 'Hospitality', 'Beauty & Personal Care',
  'Food & Beverage', 'Gaming', 'Travel',
];

export const GEO_SUGGESTIONS = [
  'India', 'Bengaluru', 'Mumbai', 'Delhi NCR', 'Gurgaon', 'Hyderabad',
  'Chennai', 'Pune', 'GCC', 'UAE', 'Dubai', 'Saudi Arabia', 'US',
];

export function getServiceBySlug(slug: string): ServiceOption | undefined {
  return SERVICE_CATALOG.find((x) => x.slug === slug);
}

export function getCaseStudyBySlug(slug: string): CaseStudyOption | undefined {
  return CASE_STUDY_CATALOG.find((x) => x.slug === slug);
}
