import { Request, Response, NextFunction } from 'express';

export const requestTiming = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();

  // Add timing to response headers
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    res.setHeader('X-Response-Time', `${duration}ms`);
    console.log(`${req.method} ${req.url} - ${res.statusCode} - ${duration}ms`);
  });

  next();
};
