// Reads env and decides which providers are live. All keys optional → mock.

export const env = {
  openaiKey: process.env.OPENAI_API_KEY || '',
  openaiModelCheap: process.env.OPENAI_MODEL_CHEAP || 'gpt-4o-mini',
  openaiImageModel: process.env.OPENAI_IMAGE_MODEL || 'gpt-image-1',
  anthropicKey: process.env.ANTHROPIC_API_KEY || '',
  claudeModelWriter: process.env.CLAUDE_MODEL_WRITER || 'claude-sonnet-5',
  llmCheapProvider: process.env.LLM_CHEAP_PROVIDER || 'openai',
  llmWriterProvider: process.env.LLM_WRITER_PROVIDER || 'claude',

  googleAds: {
    developerToken: process.env.GOOGLE_ADS_DEVELOPER_TOKEN || '',
    clientId: process.env.GOOGLE_ADS_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_ADS_CLIENT_SECRET || '',
    refreshToken: process.env.GOOGLE_ADS_REFRESH_TOKEN || '',
    customerId: process.env.GOOGLE_ADS_CUSTOMER_ID || '',
    loginCustomerId: process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID || '',
    apiVersion: process.env.GOOGLE_ADS_API_VERSION || 'v22',
  },

  dataForSeo: {
    login: process.env.DATAFORSEO_LOGIN || '',
    password: process.env.DATAFORSEO_PASSWORD || '',
  },
  serpApiKey: process.env.SERPAPI_KEY || '',

  apifyToken: process.env.APIFY_TOKEN || '',
  apifyRedditActor: process.env.APIFY_REDDIT_ACTOR || 'trudax~reddit-scraper-lite',
  // Reddit questions default to the free Reddit search JSON. The heavy Apify
  // actor is a slow, credit-burning deep fallback — only used when this is '1'.
  redditDeepFallback: process.env.REDDIT_DEEP_FALLBACK === '1',

  twitterApiKey: process.env.TWITTERAPI_KEY || '',

  // Publishing: opens a PR on the thezyra.in repo appending to blog-data.ts.
  publish: {
    token: process.env.GITHUB_TOKEN || '',
    repo: process.env.PUBLISH_REPO || 'toolsatZyra/ZyraUpdated',
    baseBranch: process.env.PUBLISH_BASE_BRANCH || 'master',
    blogDataPath: process.env.PUBLISH_BLOG_DATA_PATH || 'src/lib/blog-data.ts',
  },
};

export const isLive = {
  googleAds: () =>
    !!(env.googleAds.developerToken && env.googleAds.refreshToken && env.googleAds.customerId),
  dataForSeo: () => !!(env.dataForSeo.login && env.dataForSeo.password),
  serpApi: () => !!env.serpApiKey,
  apify: () => !!env.apifyToken,
  twitterApi: () => !!env.twitterApiKey,
  openai: () => !!env.openaiKey,
  claude: () => !!env.anthropicKey,
  publish: () => !!env.publish.token,
};
