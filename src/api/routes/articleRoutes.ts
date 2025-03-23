import { Router } from 'express';
import * as articlesController from '../controllers/articlesController';
import { authenticate } from '../middlewares/authMiddleware';

const router = Router();

// Protected routes
router.get('/', authenticate, articlesController.getArticles);
router.get('/url', authenticate, articlesController.getArticleByUrl);
router.get('/:id', authenticate, articlesController.getArticleById);

export default router;
