import express, { Router } from 'express';
import { scrapeWebsite } from '../controllers/scraper.controller';
const router: Router = express.Router();

// POST /api/scraper - Scrape website from URL
router.post('/', scrapeWebsite);

export default router;
