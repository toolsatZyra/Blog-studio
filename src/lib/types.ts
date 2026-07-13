// Shared contracts for the whole pipeline. Kept in one place so every module,
// provider, and API route speaks the same shapes.

export type SourceMode = 'mock' | 'live';

export type BlogGoal =
  | 'awareness'
  | 'lead generation'
  | 'thought leadership'
  | 'comparison'
  | 'educational';

export type Tone =
  | 'cinematic but useful'
  | 'founder-led'
  | 'expert editorial'
  | 'simple and direct';

export interface TargetAudience {
  industries: string;
  geographies: string;
  roles: string;
}

/** Everything captured in the Inputs panel (Part 1). */
export interface Inputs {
  topic: string;
  zyraContext: string;
  audience: TargetAudience;
  goal: BlogGoal;
  tone: Tone;
  wordCount: number;
  cta: string;
  competitorUrls: string[];
  manualNotes: string; // pasted Reddit/X notes or CSV text
}

export type SearchIntent =
  | 'informational'
  | 'commercial'
  | 'transactional'
  | 'navigational';

export type QuestionSource =
  | 'autocomplete'
  | 'paa'
  | 'reddit'
  | 'x'
  | 'competitor'
  | 'manual';

export interface DiscoveredQuestion {
  text: string;
  source: QuestionSource;
  mode: SourceMode;
  url?: string;
  rank?: number; // SERP rank of the discovering query, when known
}

export interface KeywordMetric {
  keyword: string;
  volume: number | null; // null when unknown
  volumeRange?: string; // Google Ads returns buckets, e.g. "1K–10K"
  difficulty: number | null; // 0-100; approximate when derived from ad competition
  difficultyBasis: 'seo-kd' | 'ad-competition-approx' | 'mock';
  cpc?: number | null;
  intent: SearchIntent;
  mode: SourceMode;
}

export interface CompetitorGap {
  url: string;
  title: string;
  coversTopic: boolean;
  gapNote: string;
}

export interface TopicCluster {
  label: string;
  queries: string[];
}

/** Output of the Research tab (topicExpander + questionDiscovery + keyword + serp). */
export interface Research {
  expandedQueries: string[];
  clusters: TopicCluster[];
  questions: DiscoveredQuestion[];
  autocomplete: string[];
  relatedKeywords: KeywordMetric[];
  competitorGaps: CompetitorGap[];
  intent: SearchIntent;
  modes: Record<string, SourceMode>; // per-source badges
}

export interface ScoreBreakdown {
  audienceRelevance: number; // 0-100
  searchQuestionDemand: number;
  zyraAuthorityFit: number;
  commercialIntent: number;
  competitionGap: number;
}

/** A scored, recommendable topic candidate (Recommended Topics tab). */
export interface TopicCandidate {
  topic: string;
  intent: SearchIntent;
  breakdown: ScoreBreakdown;
  score: number; // weighted total 0-100
  justification: string; // grounded, plain-English rationale
  recommended: boolean;
  signals: {
    paaCount: number;
    redditHits: number;
    xHits: number;
    serviceMatch: string | null; // which Zyra service it maps to
    volume: number | null;
  };
}

export interface BriefSection {
  heading: string; // H2/H3 text (often a question)
  level: 2 | 3;
  intent: string;
  targetWords: number;
  answerBlock: string; // the direct GEO/AEO answer to lead the section
  questionsToAnswer: string[];
}

/** Output of the Content Brief tab (Part 2). */
export interface Brief {
  recommendedTitle: string;
  alternativeTitles: string[];
  metaTitle: string;
  metaDescription: string;
  slug: string;
  primaryKeyword: string;
  secondaryKeywords: string[];
  intent: SearchIntent;
  targetReader: string;
  angle: string;
  outline: BriefSection[];
  questionsToAnswer: string[];
  internalLinks: { anchor: string; href: string }[];
  externalSourceSuggestions: string[];
  faq: { q: string; a: string }[];
  featuredSnippetAnswer: string;
  geoAnswerBlocks: string[];
}

export type BlockType = 'p' | 'h2' | 'h3' | 'blockquote' | 'ul' | 'ol' | 'table';

export interface DraftBlock {
  type: BlockType;
  text?: string; // for p/h2/h3/blockquote
  items?: string[]; // for ul/ol
  table?: { headers: string[]; rows: string[][] }; // for table
}

/** Output of the Blog Draft tab (blogGenerator -> humanEditor). */
export interface Draft {
  title: string;
  blocks: DraftBlock[];
  faq: { q: string; a: string }[];
  wordCount: number;
  sourceNeededCount: number; // how many [source needed] tags remain
  mode: SourceMode;
}

export type CheckStatus = 'pass' | 'warn' | 'fail' | 'unknown';

export interface CheckResult {
  id: string;
  label: string;
  status: CheckStatus;
  detail: string; // actionable fix or evidence
}

export interface ScoreCard {
  score: number; // 0-100
  checks: CheckResult[];
}

export interface Audit {
  seo: ScoreCard;
  geo: ScoreCard;
  humanVoice: ScoreCard;
  preflight?: ScoreCard; // site-level; filled by accessPreflight
}

/** Zyra's existing CMS post shape (src/lib/blog-data.ts on thezyra.in). */
export interface BlogPostObject {
  slug: string;
  title: string;
  excerpt: string;
  body: { type: 'p' | 'h2' | 'h3' | 'blockquote'; text: string }[];
  date: string;
  readTime: string;
  category: string;
  poster: string;
  featured?: boolean;
}

export interface Exports {
  markdown: string;
  html: string;
  metaTags: string;
  faqSchema: string; // JSON-LD string
  briefJson: string;
  blogPost: BlogPostObject; // CMS-ready copy
}

/** The single object persisted to localStorage and grown across the tabs. */
export interface RunState {
  inputs: Inputs;
  research?: Research;
  candidates?: TopicCandidate[];
  selectedTopic?: TopicCandidate;
  brief?: Brief;
  draft?: Draft;
  audit?: Audit;
  exports?: Exports;
  providerStatus: Record<string, SourceMode>;
}

// ── Provider interfaces (mock or live implement these) ───────────────────────

export interface KeywordProvider {
  name: string;
  mode: SourceMode;
  metrics(keywords: string[]): Promise<KeywordMetric[]>;
}

export interface SerpProvider {
  name: string;
  mode: SourceMode;
  serp(query: string): Promise<{
    organic: { title: string; url: string; snippet: string }[];
    paa: string[];
    related: string[];
    autocomplete: string[];
  }>;
}

export interface SocialProvider {
  name: string;
  mode: SourceMode;
  platform: 'reddit' | 'x';
  questions(topic: string): Promise<DiscoveredQuestion[]>;
}

export type LLMRole = 'cheap' | 'writer';

export interface LLMProvider {
  name: string;
  mode: SourceMode;
  generate(args: {
    role: LLMRole;
    system: string;
    prompt: string;
    maxTokens?: number;
    temperature?: number;
  }): Promise<string>;
}
