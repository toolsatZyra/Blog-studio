// Mirror of the live site's real services + case studies.
//
// GENERATED from ~/Documents/GitHub/ZyraUpdated (work-data.ts, service-data.ts)
// on 2026-07-16 - transcribing these by hand is how invented clients and wrong
// stream ids get in. Re-generate rather than edit.
//
// HARD RULE: work-data.ts carries NO metrics. There is deliberately no results/
// metrics field here. Proof may use only these fields plus a /work/[slug] link.

export interface ServiceOption {
  slug: string;
  title: string;
  label: string;
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
  { slug: "ott-production", title: "AI Native Film Production", label: "Service 01" },
  { slug: "ai-brand-films", title: "AI Brand Films & Commercials", label: "Service 02" },
  { slug: "micro-drama-production", title: "AI Micro Drama Production", label: "Service 03" },
  { slug: "ai-ad-creatives", title: "Performance Marketing Ads", label: "Service 04" },
  { slug: "social-media-content", title: "Social Media Content", label: "Service 05" },
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
