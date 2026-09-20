import express from 'express';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { createServer as createViteServer } from 'vite';
import { connectDB } from './server/config/db.js';
import { ENV } from './server/config/env.js';
import apiRouter from './server/routes/index.js';
import { errorHandler } from './server/middlewares/errorHandler.js';
import { requestLogger } from './server/middlewares/requestLogger.js';
import { mongoSanitize } from './server/middlewares/mongoSanitize.js';
import { generalLimiter, authLimiter } from './server/middlewares/rateLimiter.js';

async function startServer() {
  const app = express();
  const PORT = Number(ENV.PORT) || 3000;

  // Enable trust proxy for Cloud Run and reverse proxy deployments
  app.set('trust proxy', 1);

  // 1. HTTP Security Headers with Helmet
  app.use(
    helmet({
      contentSecurityPolicy: ENV.IS_PRODUCTION
        ? {
            directives: {
              defaultSrc: ["'self'"],
              scriptSrc: ["'self'", "'unsafe-inline'"],
              styleSrc: ["'self'", "'unsafe-inline'"],
              imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
              connectSrc: ["'self'", 'https:', 'wss:', 'ws:'],
              fontSrc: ["'self'", 'https:', 'data:'],
              objectSrc: ["'none'"],
              mediaSrc: ["'self'"],
              frameSrc: ["'self'"],
            },
          }
        : false, // In development, allow Vite HMR and inline script tags
      crossOriginEmbedderPolicy: false,
    })
  );

  // 2. Production CORS configuration
  const allowedOrigins = ENV.CORS_ORIGIN
    ? ENV.CORS_ORIGIN.split(',').map((origin) => origin.trim())
    : [];

  const corsOptions: cors.CorsOptions = {
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g., mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);
      // In development, allow all origins
      if (!ENV.IS_PRODUCTION) return callback(null, true);
      // In production, match configured origins
      if (allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`Origin ${origin} not permitted by CORS policy`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    exposedHeaders: ['RateLimit-Limit', 'RateLimit-Remaining', 'RateLimit-Reset'],
    maxAge: 86400, // 24 hours preflight cache
  };
  app.use(cors(corsOptions));

  // 3. Request logging middleware
  app.use(requestLogger);

  // 4. Secure cookie parser with cryptographic signing secret
  app.use(cookieParser(ENV.COOKIE_SECRET));

  // 5. Body parsers with payload size limits
  app.use(express.json({ limit: '5mb' }));
  app.use(express.urlencoded({ extended: true, limit: '5mb' }));

  // 6. MongoDB NoSQL Injection Sanitization
  app.use(mongoSanitize);

  // 7. Rate limiters
  app.use(['/api/v1/auth', '/api/auth'], authLimiter);
  app.use(['/api/v1', '/api'], generalLimiter);

  // Health check endpoint for external monitoring, Docker, and Render probes
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Attempt database connection with non-blocking graceful fallback
  connectDB().catch((err) => {
    console.warn(
      'Notice: MongoDB connection not available in current environment. API will respond, but persistence requires MongoDB:',
      err.message
    );
  });

  // Primary API router (supports both /api/v1 versioned and /api alias)
  app.use('/api/v1', apiRouter);
  app.use('/api', apiRouter);

  // Error handling middleware
  app.use(errorHandler);

  // Vite integration
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Feature Portal Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

