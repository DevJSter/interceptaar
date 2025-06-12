import { Request, Response, NextFunction } from 'express';
import { createResponse } from '../utils/helpers';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Error:', err.stack);

  const statusCode = (err as any).statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json(
    createResponse(false, message, null, err.message)
  );
};

export const notFound = (req: Request, res: Response) => {
  res.status(404).json(
    createResponse(false, `Route ${req.originalUrl} not found`)
  );
};
