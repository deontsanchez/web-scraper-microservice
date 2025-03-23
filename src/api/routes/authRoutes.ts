import { Router } from 'express';
import * as authController from '../controllers/authController';
import { authenticate } from '../middlewares/authMiddleware';

const router = Router();

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);

// Protected routes
router.get('/me', authenticate, authController.getCurrentUser);

export default router;
