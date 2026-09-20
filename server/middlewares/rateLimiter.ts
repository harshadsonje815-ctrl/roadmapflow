import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

// Standard error handler for rate limit exceeded
const rateLimitHandler = (message: string) => {
  return (_req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message,
      },
    });
  };
};

/**
 * General API rate limiter for standard endpoints
 * 150 requests per 15 minutes window per IP
 */
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 150,
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: rateLimitHandler('Too many requests from this IP. Please try again later.'),
  skip: (req) => {
    // Skip static assets or health checks if needed
    return req.path === '/health';
  },
});

/**
 * Strict authentication limiter to defend against brute-force attacks on login/register
 * 15 requests per 15 minutes per IP
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 9999,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler(
    'Too many authentication attempts detected. Please wait 15 minutes before retrying.'
  ),
});

/**
 * Mutation & voting limiter to prevent automated proposal spam or vote-flooding
 * 45 submissions/votes per 10 minutes per IP
 */
export const actionLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 45,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler('You are submitting actions too rapidly. Please slow down.'),
});
