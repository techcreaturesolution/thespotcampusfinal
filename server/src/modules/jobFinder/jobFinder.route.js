import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authorizePermissions } from '../../middleware/authMiddleware.js';
import {
  getMeta,
  startSearch,
  getSearches,
  getSearchById,
  getJobDetails,
  applyJob,
  getAdminOverview,
  getAdminJobs,
  createAdminJob,
  updateAdminJob,
  deleteAdminJob,
  extractJobAi,
  getAdminRules,
  createAdminRule,
  runAdminRuleNow,
  deleteAdminRule,
  getAdminSettings,
  patchAdminSettings,
  triggerCleanupNow,
} from './jobFinder.controller.js';

const router = Router();

const searchLimiter = rateLimit({
  windowMs: 60_000,
  limit: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    message: 'Too many job search requests. Please wait a moment before searching again.',
  },
});

// -------------------------------------------------------------
// Student / General User Routes
// -------------------------------------------------------------
router.get('/meta', getMeta);
router.post('/search', searchLimiter, startSearch);
router.get('/searches', getSearches);
router.get('/searches/:id', getSearchById);
router.get('/job/:id', getJobDetails);
router.get('/jobs/:id', getJobDetails);
router.post('/job/:id/apply', applyJob);
router.post('/jobs/:id/apply', applyJob);

// -------------------------------------------------------------
// Admin Management Routes
// -------------------------------------------------------------
router.get('/admin/overview', authorizePermissions('Admin'), getAdminOverview);
router.get('/admin/jobs', authorizePermissions('Admin'), getAdminJobs);
router.post('/admin/jobs', authorizePermissions('Admin'), createAdminJob);
router.patch('/admin/jobs/:id', authorizePermissions('Admin'), updateAdminJob);
router.delete('/admin/jobs/:id', authorizePermissions('Admin'), deleteAdminJob);
router.post('/admin/extract', authorizePermissions('Admin'), extractJobAi);
router.get('/admin/rules', authorizePermissions('Admin'), getAdminRules);
router.post('/admin/rules', authorizePermissions('Admin'), createAdminRule);
router.post('/admin/rules/:id/run', authorizePermissions('Admin'), runAdminRuleNow);
router.delete('/admin/rules/:id', authorizePermissions('Admin'), deleteAdminRule);
router.get('/admin/settings', authorizePermissions('Admin'), getAdminSettings);
router.patch('/admin/settings', authorizePermissions('Admin'), patchAdminSettings);
router.post('/admin/cleanup', authorizePermissions('Admin'), triggerCleanupNow);

export default router;
