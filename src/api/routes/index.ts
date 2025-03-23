import { Router } from 'express';
import authRoutes from './authRoutes';
import articleRoutes from './articleRoutes';
import sourceRoutes from './sourceRoutes';

const router = Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'API is healthy' });
});

// API routes
router.use('/auth', authRoutes);
router.use('/articles', articleRoutes);
router.use('/sources', sourceRoutes);

export default router;
