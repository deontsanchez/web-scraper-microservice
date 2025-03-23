import { Router } from 'express';
import * as sourcesController from '../controllers/sourcesController';
import { authenticate, authorize } from '../middlewares/authMiddleware';

const router = Router();

// Protected routes with role-based authorization
router.get('/', authenticate, sourcesController.getAllSources);
router.get('/:id', authenticate, sourcesController.getSourceById);

// Admin-only routes
router.post(
  '/',
  authenticate,
  authorize(['admin']),
  sourcesController.createSource
);
router.put(
  '/:id',
  authenticate,
  authorize(['admin']),
  sourcesController.updateSource
);
router.delete(
  '/:id',
  authenticate,
  authorize(['admin']),
  sourcesController.deleteSource
);

// Scraping routes
router.post(
  '/:id/scrape',
  authenticate,
  authorize(['admin']),
  sourcesController.scrapeSource
);
router.post(
  '/scrape-all',
  authenticate,
  authorize(['admin']),
  sourcesController.scrapeAllSources
);

export default router;
