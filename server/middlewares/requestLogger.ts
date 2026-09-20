import { Request, Response, NextFunction } from 'express';

export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  // Only log API routes to avoid spamming logs with Vite client assets
  if (!req.path.startsWith('/api')) {
    return next();
  }

  const startTime = process.hrtime();
  const method = req.method;
  const url = req.originalUrl || req.url;
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip;

  res.on('finish', () => {
    const elapsed = process.hrtime(startTime);
    const elapsedMs = (elapsed[0] * 1000 + elapsed[1] / 1e6).toFixed(2);
    const status = res.statusCode;

    // Color indicators for status codes in terminal
    let statusColor = '\x1b[32m'; // green for 2xx
    if (status >= 500) statusColor = '\x1b[31m'; // red for 5xx
    else if (status >= 400) statusColor = '\x1b[33m'; // yellow for 4xx
    else if (status >= 300) statusColor = '\x1b[36m'; // cyan for 3xx

    const resetColor = '\x1b[0m';
    const timestamp = new Date().toISOString();

    console.log(
      `[${timestamp}] ${method.padEnd(6)} ${url} ${statusColor}${status}${resetColor} - ${elapsedMs}ms | IP: ${ip}`
    );
  });

  next();
};
