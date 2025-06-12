import { Request, Response, NextFunction } from 'express';
import { createResponse, validateEmail } from '../utils/helpers';

export const validateUserCreation = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { name, email } = req.body;

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    res.status(400).json(
      createResponse(false, 'Name is required and must be a non-empty string')
    );
    return;
  }

  if (!email || typeof email !== 'string' || !validateEmail(email)) {
    res.status(400).json(
      createResponse(false, 'Valid email is required')
    );
    return;
  }

  next();
};

export const validateUserUpdate = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { name, email } = req.body;

  if (name !== undefined && (typeof name !== 'string' || name.trim().length === 0)) {
    res.status(400).json(
      createResponse(false, 'Name must be a non-empty string if provided')
    );
    return;
  }

  if (email !== undefined && (typeof email !== 'string' || !validateEmail(email))) {
    res.status(400).json(
      createResponse(false, 'Valid email is required if provided')
    );
    return;
  }

  next();
};

export const validatePagination = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { page, limit, sortOrder } = req.query;

  if (page && isNaN(Number(page))) {
    res.status(400).json(
      createResponse(false, 'Page must be a number')
    );
    return;
  }

  if (limit && isNaN(Number(limit))) {
    res.status(400).json(
      createResponse(false, 'Limit must be a number')
    );
    return;
  }

  if (sortOrder && !['asc', 'desc'].includes(sortOrder as string)) {
    res.status(400).json(
      createResponse(false, 'Sort order must be either "asc" or "desc"')
    );
    return;
  }

  next();
};
