import * as dotenv from 'dotenv';
dotenv.config();

const list = (v) =>
  (v || '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

const bool = (v, def = false) => (v === undefined || v === '' ? def : ['1', 'true', 'yes'].includes(String(v).toLowerCase()));

export const jobFinderConfig = {
  // External Search Providers
  serpApiKey: process.env.SERPAPI_KEY || '',
  jsearchApiKey: process.env.JSEARCH_API_KEY || process.env.RAPIDAPI_KEY || '',
  adzunaAppId: process.env.ADZUNA_APP_ID || '',
  adzunaAppKey: process.env.ADZUNA_APP_KEY || process.env.ADZUNA_API_KEY || '',
  joobleApiKey: process.env.JOOBLE_API_KEY || '',
  careerjetApiKey: process.env.CAREERJET_API_KEY || '',
  careerjetReferer: process.env.CAREERJET_REFERER || 'https://thespotcampus.com',
  googleCseKey: process.env.GOOGLE_CSE_KEY || '',
  googleCseCx: process.env.GOOGLE_CSE_CX || '',
  enableFreeSearchFallback: bool(process.env.ENABLE_FREE_SEARCH_FALLBACK, true),
  googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY || '',

  // AI Agent (OpenAI)
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  openaiModel: process.env.OPENAI_MODEL || 'gpt-4o-mini',

  // OpenStreetMap Overpass servers
  overpassUrls: list(
    process.env.OVERPASS_URLS ||
      'https://overpass-api.de/api/interpreter,https://overpass.kumi.systems/api/interpreter,https://overpass.private.coffee/api/interpreter',
  ),

  // Apify LinkedIn Scraper
  apify: {
    token: process.env.APIFY_TOKEN || process.env.APIFY_API_KEY || '',
    actor: process.env.APIFY_ACTOR_LINKEDIN || 'kaix/linkedin-jobs-scraper',
  },

  // Auto Import Scheduler
  autoImport: {
    enabled: bool(process.env.AUTO_IMPORT_ENABLED, true),
    tickMs: Math.max(60_000, Number(process.env.AUTO_IMPORT_TICK_MS || 600_000)),
  },

  // Rate limits & timeouts
  crawlTimeoutMs: Number(process.env.CRAWL_TIMEOUT_MS || 10000),
  dailyJobSearchLimit: Number(process.env.DAILY_JOB_SEARCH_LIMIT || 20),
  jobEnrichLimit: Number(process.env.JOB_ENRICH_LIMIT || 12),
  jobSearchBudgetMs: Number(process.env.JOB_SEARCH_BUDGET_MS || 40000),
};
