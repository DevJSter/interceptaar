import { Request, Response, NextFunction } from 'express';
import { createResponse } from '../utils/helpers';

// Simple rate limiting middleware
const requests = new Map<string, { count: number; resetTime: number }>();

export const rateLimit = (maxRequests: number = 100, windowMs: number = 15 * 60 * 1000) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();
    
    const clientData = requests.get(ip);
    
    if (!clientData || now > clientData.resetTime) {
      requests.set(ip, {
        count: 1,
        resetTime: now + windowMs
      });
      next();
      return;
    }
    
    if (clientData.count >= maxRequests) {
      res.status(429).json(
        createResponse(false, 'Too many requests, please try again later')
      );
      return;
    }
    
    clientData.count++;
    next();
  };
};
