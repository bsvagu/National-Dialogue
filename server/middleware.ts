import type { Request, Response, NextFunction } from 'express';
import { db } from './db';
import { auditLogs } from '@shared/schema';
import type { AuthenticatedRequest } from './auth';

export function auditLogger(action: string, entity: string) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const originalSend = res.send;
    const originalJson = res.json;
    
    let responseData: any;

    // Capture response data
    res.json = function(obj: any) {
      responseData = obj;
      return originalJson.call(this, obj);
    };

    res.send = function(data: any) {
      if (typeof data === 'string') {
        try {
          responseData = JSON.parse(data);
        } catch {
          responseData = data;
        }
      } else {
        responseData = data;
      }
      return originalSend.call(this, data);
    };

    // Continue with request
    next();

    // Log after response is sent
    res.on('finish', async () => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        try {
          await db.insert(auditLogs).values({
            actorId: req.user?.id || null,
            action,
            entity,
            entityId: req.params.id || null,
            before: req.method === 'PUT' || req.method === 'PATCH' ? req.body : null,
            after: responseData,
          });
        } catch (error) {
          console.error('Audit logging failed:', error);
        }
      }
    });
  };
}

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  console.error(err);

  if (err.name === 'ZodError') {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request data',
        details: err.errors
      }
    });
  }

  if (err.code === '23505') { // PostgreSQL unique violation
    return res.status(409).json({
      error: {
        code: 'DUPLICATE_ENTRY',
        message: 'Resource already exists'
      }
    });
  }

  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Internal server error'
    }
  });
}

export function rateLimiter(windowMs: number = 15 * 60 * 1000, max: number = 100) {
  const requests = new Map<string, { count: number; resetTime: number }>();

  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.ip || 'unknown';
    const now = Date.now();

    const record = requests.get(key);
    
    if (!record || now > record.resetTime) {
      requests.set(key, { count: 1, resetTime: now + windowMs });
      return next();
    }

    if (record.count >= max) {
      return res.status(429).json({
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests'
        }
      });
    }

    record.count++;
    next();
  };
}
