import express from 'express';
import scraperRoutes from './scraper.routes';

const router = express.Router();

router.use('/scraper', scraperRoutes);

export default router;
