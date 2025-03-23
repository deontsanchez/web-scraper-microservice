import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../../config';
import User, { IUser } from '../../models/User';
import { logger } from '../../utils/logger';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

/**
 * Authentication middleware to protect routes
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    const token = authHeader.split(' ')[1];

    // Verify token
    const decoded = jwt.verify(token, config.auth.jwtSecret) as { id: string };

    // Find user
    const user = await User.findById(decoded.id);

    if (!user) {
      res.status(401).json({ message: 'User not found' });
      return;
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    res.status(401).json({ message: 'Invalid token' });
  }
};

/**
 * Role-based authorization middleware
 */
export const authorize = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    if (roles.includes(req.user.role)) {
      next();
    } else {
      res.status(403).json({ message: 'Insufficient permissions' });
    }
  };
};
