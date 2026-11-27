import axios from 'axios';
import { jobFinderConfig } from '../config/jobFinder.config.js';
import { extractContacts, parsePostedAt, stripHtml, detectExperience, parseResultTitle } from './parse.js';
import { verification } from './verify.js';
import { detectEducation } from './education.js';
import { INDIAN_STATES, splitLocation } from './india.js';

const text = (v) => stripHtml(String(v || '')).trim();

export function isApifyConfigured() {
  return Boolean(jobFinderConfig.apify?.token);
}

export function apifyLinkedInConfigured() {
  return isApifyConfigured();
}

export function ensureIndiaLocation(location) {
  const s = String(location || '').trim();
  if (!s || /^india$/i.test(s)) return 'India';
  if (/\bindia\b/i.test(s)) return s;
  return `${s}, India`;
}

const FOREIGN_LOCATIONS = [
  'united states', 'usa', 'u.s.a', 'united kingdom', 'uk', 'u.k.', 'canada', 'australia',
  'singapore', 'germany', 'dubai', 'uae', 'u.a.e.', 'philippines', 'pakistan', 'bangladesh',
  'malaysia', 'netherlands', 'france', 'poland', 'ireland', 'london', 'new york', 'california',
];

const MAJOR_INDIAN_CITIES = [
  'ahmedabad', 'bengaluru', 'bangalore', 'mumbai', 'delhi', 'new delhi', 'hyderabad', 'pune',
  'chennai', 'kolkata', 'surat', 'vadodara', 'noida', 'gurugram', 'gurgaon', 'jaipur', 'kochi',
  'coimbatore', 'indore', 'nagpur', 'chandigarh', 'bhopal', 'visakhapatnam', 'rajkot', 'gandhinagar',
  'navi mumbai', 'thane', 'ghaziabad', 'ludhiana', 'nashik', 'faridabad', 'meerut', 'varanasi',
  'lucknow', 'kanpur', 'patna', 'bhubaneswar', 'mysuru', 'mysore', 'trivandrum', 'thiruvananthapuram',
];

export function isIndiaJob(job) {
  const loc = String(job.location || '').toLowerCase();
  if (/\bindia\b/i.test(loc)) return true;

  if (FOREIGN_LOCATIONS.some((fl) => loc.includes(fl))) {
    return false;
  }

  if (INDIAN_STATES.some((st) => loc.includes(st.toLowerCase()))) {
    return true;
  }

  if (MAJOR_INDIAN_CITIES.some((city) => loc.includes(city))) {
    return true;
  }

  const { city, state } = splitLocation(job.location);
  if (city || state) return true;

  return false;
}

export function mapDatePosted(postedWithin) {
  if (!postedWithin || postedWithin === 0) return undefined;
  if (typeof postedWithin === 'string') {
    if (postedWithin.includes('24h') || postedWithin.includes('day')) return 'past_24h';
    if (postedWithin.includes('week')) return 'past_week';
    if (postedWithin.includes('month')) return 'past_month';
    return postedWithin;
  }
  const days = Number(postedWithin);
  if (Number.isNaN(days) || days <= 0) return undefined;
  if (days <= 1) return 'past_24h';
  if (days <= 7) return 'past_week';
  return 'past_month';
}

export function mapApifyLinkedInJob(raw) {
  const title = text(raw.title || raw.jobTitle || raw.name);
  const parsedTitle = parseResultTitle(title);
  const companyName = text(
    raw.company ||
      raw.companyName ||
      raw.company_name ||
      raw.companyTitle ||
      raw.employer ||
      raw.employerName ||
      raw.hiringCompany ||
      raw.companyDetails?.name ||
      raw.hiringOrganization?.name ||
      parsedTitle.companyName ||
      '',
  );
  let rawLocation = text(raw.location || raw.jobLocation || raw.formattedLocation || raw.address);
  const description = text(raw.descriptionText || raw.description || raw.jobDescription || raw.descriptionHtml);
  const applyUrl = raw.link || raw.jobUrl || raw.applyUrl || raw.url || raw.linkedinUrl || raw.job_url;

  const contacts = extractContacts(description);
  const exp = detectExperience(title, description);

  const isRemote = Boolean(
    raw.workplaceTypes?.some?.((t) => String(t).toLowerCase().includes('remote')) ||
      /\bremote\b/i.test(rawLocation) ||
      /\bwork from home\b/i.test(title),
  );

  const loc = splitLocation(rawLocation);
  const location = rawLocation || (loc.city && loc.state ? `${loc.city}, ${loc.state}, India` : 'India');

  const rawPostedAt = raw.postedAt || raw.postedDate || raw.postedTime || raw.date;
  const postedAt = rawPostedAt ? (new Date(rawPostedAt).getTime() ? new Date(rawPostedAt) : parsePostedAt(rawPostedAt)) : null;

  const companyLinkedinUrl =
    raw.companyLinkedinUrl ||
    raw.companyDetails?.linkedinUrl ||
    (typeof raw.companyUrl === 'string' && raw.companyUrl.includes('linkedin.com') ? raw.companyUrl : undefined) ||
    (typeof raw.company === 'string' && raw.company.includes('linkedin.com') ? raw.company : undefined);

  const companyWebsite =
    raw.companyWebsite ||
    raw.companyDetails?.website ||
    (typeof raw.companyUrl === 'string' && !raw.companyUrl.includes('linkedin.com') ? raw.companyUrl : undefined);

  return {
    title,
    companyName,
    companyWebsite,
    companyLinkedinUrl,
    logo: raw.companyLogo || raw.logo || raw.company_logo || undefined,
    location,
    city: loc.city || '',
    state: loc.state || '',
    via: 'LinkedIn',
    platform: 'LinkedIn',
    description,
    applyUrl,
    applyOptions: applyUrl ? [{ title: 'LinkedIn', link: applyUrl }] : [],
    sourceUrl: applyUrl,
    postedAt,
    postedText: raw.postedTimeAgo || raw.postedText || '',
    employmentType: text(raw.employmentType || raw.jobType || raw.time || ''),
    salary: text(raw.salaryInfo || raw.salary || raw.baseSalary || ''),
    level: exp.level,
    experienceText: exp.text,
    education: detectEducation(title, description),
    workFromHome: isRemote,
    emails: contacts.emails,
    phones: contacts.phones,
    verification: verification('verified', 'apify_linkedin'),
    provider: 'apify_linkedin',
  };
}

export async function scrapeLinkedInJobs({
  keywords = 'jobs',
  location = 'India',
  limit = 20,
  datePosted,
  extraInput = {},
  timeout = 60000,
} = {}) {
  const token = jobFinderConfig.apify?.token;
  if (!token) {
    throw new Error('APIFY_TOKEN is not configured in server .env');
  }

  const actor = (jobFinderConfig.apify?.actor || 'kaix/linkedin-jobs-scraper').trim();
  const actorId = actor.replace('/', '~');
  const indiaLocation = ensureIndiaLocation(location);

  const payload = {
    keywords: keywords || 'jobs',
    location: indiaLocation,
    limit: Math.min(100, Math.max(1, Number(limit) || 20)),
    ...(datePosted ? { datePosted: mapDatePosted(datePosted) || datePosted } : {}),
    ...extraInput,
  };

  const url = `https://api.apify.com/v2/acts/${encodeURIComponent(actorId)}/run-sync-get-dataset-items`;

  const { data } = await axios.post(url, payload, {
    params: {
      token,
      timeout: Math.round(timeout / 1000),
    },
    headers: {
      'Content-Type': 'application/json',
    },
    timeout: timeout + 5000,
  });

  let items = Array.isArray(data) ? data : [];

  if (items.length === 0 && payload.datePosted) {
    try {
      const fallbackPayload = { ...payload };
      delete fallbackPayload.datePosted;
      const res = await axios.post(url, fallbackPayload, {
        params: {
          token,
          timeout: Math.round(timeout / 1000),
        },
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: timeout + 5000,
      });
      if (Array.isArray(res.data) && res.data.length > 0) {
        items = res.data;
      }
    } catch {
      /* fallback ignored */
    }
  }

  return items
    .map(mapApifyLinkedInJob)
    .filter((j) => Boolean(j.title) && isIndiaJob(j));
}

export async function searchApifyLinkedIn(plan, options = {}, log = () => {}) {
  if (!isApifyConfigured()) {
    log('info', 'Apify LinkedIn scraper skipped (APIFY_TOKEN not configured)');
    return [];
  }

  const keywords = [plan.userRole || plan.role, plan.levelWord === 'fresher' ? 'fresher' : ''].filter(Boolean).join(' ').trim() || plan.role || plan.q || 'jobs';
  const targetLocation = ensureIndiaLocation(plan.city || plan.state || plan.place || 'India');
  const datePosted = mapDatePosted(options.postedWithin);

  try {
    log('info', `Running Apify LinkedIn scraper for "${keywords}" in "${targetLocation}"`);
    const jobs = await scrapeLinkedInJobs({
      keywords,
      location: targetLocation,
      limit: options.limit || 25,
      datePosted,
      timeout: options.timeout || 60000,
    });
    log('info', `Apify LinkedIn scraper returned ${jobs.length} verified India jobs`);
    return jobs;
  } catch (err) {
    log('warn', `Apify LinkedIn scraper failed: ${err.message}`);
    return [];
  }
}
