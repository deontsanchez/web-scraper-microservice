import { Request, Response, NextFunction } from 'express';

// Simple in-memory rate limiter
const requestCounts: Record<string, { count: number; resetTime: number }> = {};
const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS = 10; // 10 requests per minute

const rateLimiter = (req: Request, res: Response, next: NextFunction): void => {
  const ip = req.ip || 'unknown';
  const now = Date.now();

  // Initialize or reset if window has passed
  if (!requestCounts[ip] || now > requestCounts[ip].resetTime) {
    requestCounts[ip] = {
      count: 1,
      resetTime: now + WINDOW_MS,
    };
    next();
    return;
  }

  // Increment request count
  requestCounts[ip].count++;

  // Check if over limit
  if (requestCounts[ip].count > MAX_REQUESTS) {
    res.status(429).json({
      success: false,
      message: 'Too many requests, please try again later.',
    });
    return;
  }

  next();
};

export default rateLimiter;
