import { z } from 'zod';
import mongoose from 'mongoose';
import { jobFinderConfig } from './config/jobFinder.config.js';
import { JOB_LEVELS, JobPosting } from './models/JobPosting.model.js';
import { JobSearch } from './models/JobSearch.model.js';
import { AutoImportRule } from './models/AutoImportRule.model.js';
import { AgentRun } from './models/AgentRun.model.js';
import { SearchCache } from './models/SearchCache.model.js';
import { llmEnabled } from './services/llm.js';
import { searchJobs } from './services/aggregator.js';
import { dedupeJobs, canonicalUrl, uniquePhones } from './services/dedupe.js';
import { CATEGORY_KEYS, JOB_CATEGORIES } from './services/categories.js';
import { EDUCATION_KEYS, EDUCATION_LEVELS } from './services/education.js';
import { INDIAN_STATES } from './services/india.js';
import { jobProviders } from './services/providers.js';
import { extractJobDrafts } from './services/importer.js';
import { claimRule, runImportRule, runAllActiveRules } from './services/autoImport.js';
import { closedJobFilter, removeClosedJobs } from './services/cleanup.js';
import { extractPhones } from './services/parse.js';
import { portalJobSchema, toPortalJob, assertNotDuplicate } from './services/portalJobs.js';
import { getSettings, updateSettings } from './services/settings.js';
import { startOfDay } from './services/limits.js';
import { HttpError } from './utils/httpError.js';

export const POSTED_WITHIN = [1, 3, 7, 30, 0];

// Reactivate any aggregated jobs erroneously deactivated by crawl errors
JobPosting.updateMany({ origin: 'aggregated', active: false }, { $set: { active: true } }).catch(() => {});

const searchSchema = z
  .object({
    prompt: z.string().trim().max(200).default(''),
    level: z.string().default('fresher').transform(() => 'fresher'),
    category: z.union([z.enum(CATEGORY_KEYS), z.literal('')]).default(''),
    education: z.union([z.enum(EDUCATION_KEYS), z.literal('')]).default(''),
    verifiedOnly: z.boolean().default(false),
    state: z.string().trim().max(60).default(''),
    city: z.string().trim().max(60).default(''),
    postedWithin: z.coerce.number().refine((n) => POSTED_WITHIN.includes(n), 'Invalid posted-within value').default(30),
  })
  .refine((d) => d.prompt.length >= 2 || d.category, { message: 'Describe the job you want or pick a category', path: ['prompt'] });

function serializeSearch(doc) {
  const out = doc.toObject ? doc.toObject() : { ...doc };
  delete out.jobs;
  return out;
}

async function runSearch(id, body) {
  try {
    const { plan, providers, items, hiddenUnverified, durationMs } = await searchJobs(body, (level, msg) => console.log(`[jobFinder] ${level}: ${msg}`));
    await JobSearch.updateOne(
      { _id: id },
      { $set: { status: 'completed', query: plan.q, planner: plan.planner, providers, resultCount: items.length, hiddenUnverified, durationMs, jobs: items.map((j) => j._id) } },
    );
  } catch (err) {
    console.error('[jobFinder] search failed', err);
    await JobSearch.updateOne({ _id: id }, { $set: { status: 'failed', error: err.message || 'The job search failed. Please try again.' } });
  }
}

// -------------------------------------------------------------
// CANDIDATE / STUDENT CONTROLLERS
// -------------------------------------------------------------

export const getMeta = async (req, res) => {
  const userId = req.user?.userId;
  const isAdmin = req.user?.role === 'Admin';
  const dailyLimit = jobFinderConfig.dailyJobSearchLimit || 100;

  let searchesToday = 0;
  if (userId && !isAdmin) {
    try {
      searchesToday = await JobSearch.countDocuments({ owner: userId, createdAt: { $gte: new Date(Date.now() - 86400_000) } });
    } catch {
      searchesToday = 0;
    }
  }

  res.json({
    categories: JOB_CATEGORIES.map(({ key, label }) => ({ key, label })),
    levels: ['fresher'],
    education: EDUCATION_LEVELS.map(({ key, label }) => ({ key, label })),
    states: INDIAN_STATES,
    postedWithin: POSTED_WITHIN,
    providers: jobProviders(),
    ai: llmEnabled() ? 'openai' : 'rules',
    dailyLimit,
    searchesToday,
    remainingToday: isAdmin ? 9999 : Math.max(0, dailyLimit - searchesToday),
  });
};

export const startSearch = async (req, res) => {
  const body = searchSchema.parse(req.body);
  const userId = req.user.userId;
  const isAdmin = req.user.role === 'Admin';
  const limit = jobFinderConfig.dailyJobSearchLimit || 100;

  if (!isAdmin) {
    const today = await JobSearch.countDocuments({ owner: userId, createdAt: { $gte: new Date(Date.now() - 86400_000) } });
    if (today >= limit) {
      throw new HttpError(429, `Daily job search limit (${limit}) reached. Please try again tomorrow.`);
    }
  }

  const search = await JobSearch.create({
    ...body,
    owner: userId,
    query: body.prompt || body.category,
  });

  // Run async search in background
  runSearch(search._id, body);

  res.status(201).json({ search: serializeSearch(search) });
};

export const getSearches = async (req, res) => {
  const userId = req.user.userId;
  const items = await JobSearch.find({ owner: userId }).select('-jobs').sort({ createdAt: -1 }).limit(10);
  res.json({ items: items.map(serializeSearch) });
};

export const getSearchById = async (req, res) => {
  const userId = req.user.userId;
  const search = await JobSearch.findOne({ _id: req.params.id, owner: userId });
  if (!search) throw new HttpError(404, 'Search not found');

  let items = [];
  if (search.status === 'completed' && search.jobs?.length) {
    const docs = await JobPosting.find({ _id: { $in: search.jobs } }).select('-key -postedBy -__v').lean();
    const order = new Map(search.jobs.map((id, i) => [String(id), i]));
    items = dedupeJobs(docs.sort((a, b) => order.get(String(a._id)) - order.get(String(b._id))));
  }

  res.json({ search: serializeSearch(search), items });
};

export const getJobDetails = async (req, res) => {
  const job = await JobPosting.findOne({ _id: req.params.id, active: true }).select('-key -postedBy').lean();
  if (!job) throw new HttpError(404, 'Job not found');
  res.json({ job });
};

export function resolveJobApplyUrl(job, requestedLink) {
  const allowed = [
    job.applyUrl,
    ...(job.applyOptions || []).map((o) => o.link),
    job.sourceUrl,
    job.companyWebsite,
  ].filter(Boolean);

  if (requestedLink && allowed.includes(requestedLink)) {
    return requestedLink;
  }

  const isLinkedInSource =
    job.platform === 'LinkedIn' ||
    String(job.via || '').toLowerCase().includes('linkedin') ||
    job.provider === 'apify_linkedin' ||
    /linkedin\.com/i.test(job.applyUrl || '') ||
    /linkedin\.com/i.test(job.sourceUrl || '') ||
    job.applyOptions?.some((o) => /linkedin\.com/i.test(o.link));

  if (isLinkedInSource) {
    const linkedInOption = (job.applyOptions || []).find((o) => /linkedin\.com/i.test(o.link));
    if (linkedInOption?.link) return linkedInOption.link;
    if (job.applyUrl && /linkedin\.com/i.test(job.applyUrl)) return job.applyUrl;
    if (job.sourceUrl && /linkedin\.com/i.test(job.sourceUrl)) return job.sourceUrl;
  }

  const companyOption = (job.applyOptions || []).find((o) =>
    /company|career|apply|official/i.test(o.title) && !/linkedin|naukri|indeed|shine|foundit/i.test(o.title)
  );
  if (companyOption?.link) return companyOption.link;

  if (job.applyUrl) return job.applyUrl;
  if (job.applyOptions?.[0]?.link) return job.applyOptions[0].link;
  if (job.sourceUrl) return job.sourceUrl;
  if (job.companyWebsite) return job.companyWebsite;

  if (job.emails?.[0]) {
    return `mailto:${job.emails[0]}?subject=${encodeURIComponent(`Application for ${job.title}`)}`;
  }

  return null;
}

export const applyJob = async (req, res) => {
  const job = await JobPosting.findOneAndUpdate({ _id: req.params.id, active: true }, { $inc: { applyClicks: 1 } }, { returnDocument: 'after' });
  if (!job) throw new HttpError(404, 'Job not found');
  const link = z.object({ link: z.string().url().optional() }).parse(req.body || {}).link;
  const url = resolveJobApplyUrl(job, link);
  if (!url) throw new HttpError(404, 'This job has no apply link or email');
  res.json({ url });
};

// -------------------------------------------------------------
// ADMIN CONTROLLERS
// -------------------------------------------------------------

export const getAdminOverview = async (_req, res) => {
  const today = startOfDay();
  const settings = await getSettings({ fresh: true });
  const [
    searchesToday,
    searchesTotal,
    portalJobs,
    activeRules,
    runsToday,
    lastRun,
    savedSearches,
    storedJobs,
    closedJobs,
  ] = await Promise.all([
    JobSearch.countDocuments({ createdAt: { $gte: today } }),
    JobSearch.countDocuments(),
    JobPosting.countDocuments({ origin: 'portal' }),
    AutoImportRule.countDocuments({ active: true }),
    AgentRun.aggregate([
      { $match: { createdAt: { $gte: today } } },
      {
        $group: {
          _id: '$agent',
          runs: { $sum: 1 },
          posted: { $sum: '$posted' },
          drafts: { $sum: '$drafts' },
          removed: { $sum: '$removed' },
          failed: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } },
        },
      },
    ]),
    AgentRun.findOne({ agent: 'auto_import' }).sort({ createdAt: -1 }).lean(),
    SearchCache.countDocuments(),
    JobPosting.countDocuments(),
    JobPosting.countDocuments(closedJobFilter()),
  ]);

  res.json({
    settings,
    stats: {
      searchesToday,
      searchesTotal,
      portalJobs,
      activeRules,
      savedSearches,
      storedJobs,
      closedJobs,
      runsToday,
      lastRun,
    },
  });
};

export const getAdminJobs = async (req, res) => {
  const { origin, category, search, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (origin) filter.origin = origin;
  if (category) filter.category = category;
  if (search) {
    filter.$or = [
      { title: new RegExp(search, 'i') },
      { companyName: new RegExp(search, 'i') },
      { city: new RegExp(search, 'i') },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [items, total] = await Promise.all([
    JobPosting.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
    JobPosting.countDocuments(filter),
  ]);

  res.json({ items, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
};

export const createAdminJob = async (req, res) => {
  const parsed = portalJobSchema.parse(req.body);
  const data = toPortalJob(parsed, 'manual_admin');
  const dedupeKey = await assertNotDuplicate(data);
  const job = await JobPosting.create({
    ...data,
    dedupeKey,
    key: `portal:${new mongoose.Types.ObjectId()}`,
    origin: 'portal',
    postedAt: new Date(),
    postedBy: req.user.userId,
  });
  res.status(201).json({ job });
};

export const updateAdminJob = async (req, res) => {
  const parsed = portalJobSchema.partial().parse(req.body);
  const job = await JobPosting.findByIdAndUpdate(req.params.id, { $set: parsed }, { new: true });
  if (!job) throw new HttpError(404, 'Job not found');
  res.json({ job });
};

export const deleteAdminJob = async (req, res) => {
  const job = await JobPosting.findByIdAndDelete(req.params.id);
  if (!job) throw new HttpError(404, 'Job not found');
  res.json({ message: 'Job deleted successfully' });
};

export const extractJobAi = async (req, res) => {
  const { text = '', url = '' } = req.body || {};
  const result = await extractJobDrafts({ text, url });
  res.json(result);
};

export const getAdminRules = async (_req, res) => {
  const rules = await AutoImportRule.find().sort({ createdAt: -1 }).lean();
  res.json({ rules });
};

export const createAdminRule = async (req, res) => {
  const schema = z.object({
    name: z.string().trim().min(2).max(100),
    prompt: z.string().trim().max(200).default(''),
    category: z.string().default(''),
    level: z.string().default(''),
    education: z.string().default(''),
    state: z.string().default(''),
    city: z.string().default(''),
    everyHours: z.coerce.number().min(1).max(168).default(24),
    maxJobs: z.coerce.number().min(1).max(30).default(10),
  });
  const body = schema.parse(req.body);
  const rule = await AutoImportRule.create({ ...body, createdBy: req.user.userId });
  res.status(201).json({ rule });
};

export const runAdminRuleNow = async (req, res) => {
  const rule = await claimRule({ _id: req.params.id, active: true });
  if (!rule) throw new HttpError(404, 'Rule not found or currently running');
  const result = await runImportRule(rule, { postedBy: req.user.userId });
  res.json(result);
};

export const deleteAdminRule = async (req, res) => {
  await AutoImportRule.findByIdAndDelete(req.params.id);
  res.json({ message: 'Rule deleted' });
};

export const getAdminSettings = async (_req, res) => {
  const settings = await getSettings();
  res.json({ settings });
};

export const patchAdminSettings = async (req, res) => {
  const settings = await updateSettings(req.body, req.user.userId);
  res.json({ settings });
};

export const triggerCleanupNow = async (req, res) => {
  const result = await removeClosedJobs({ trigger: 'manual', userId: req.user.userId });
  res.json(result);
};
