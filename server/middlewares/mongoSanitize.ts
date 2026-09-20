import { Request, Response, NextFunction } from 'express';

/**
 * Recursively sanitize an object by stripping keys containing prohibited characters like `$` or `.`
 * This prevents MongoDB NoSQL operator injection attacks (e.g. { $gt: "" } or $where)
 */
function sanitizeObject(target: any): any {
  if (!target || typeof target !== 'object') {
    return target;
  }

  if (Array.isArray(target)) {
    return target.map(sanitizeObject);
  }

  const sanitized: Record<string, any> = {};

  for (const key of Object.keys(target)) {
    // If key starts with '$' or contains '.', strip or skip it
    if (key.startsWith('$') || key.includes('.')) {
      console.warn(`[Security Warning] Stripped forbidden query/body parameter: "${key}"`);
      continue;
    }

    sanitized[key] = sanitizeObject(target[key]);
  }

  return sanitized;
}

export const mongoSanitize = (req: Request, _res: Response, next: NextFunction): void => {
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }

  if (req.query) {
    // Express 4/5 creates query as an object with getters or prototypes
    const sanitizedQuery = sanitizeObject({ ...req.query });
    for (const key of Object.keys(req.query)) {
      if (key.startsWith('$') || key.includes('.')) {
        delete (req.query as any)[key];
      }
    }
  }

  if (req.params) {
    for (const key of Object.keys(req.params)) {
      if (key.startsWith('$') || key.includes('.')) {
        delete (req.params as any)[key];
      }
    }
  }

  next();
};
