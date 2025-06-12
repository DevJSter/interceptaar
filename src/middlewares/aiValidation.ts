import { Request, Response, NextFunction } from 'express';
import { createResponse } from '../utils/helpers';

export const validateAIRequest = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { prompt } = req.body;

  if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
    res.status(400).json(
      createResponse(false, 'Prompt is required and must be a non-empty string')
    );
    return;
  }

  if (prompt.length > 5000) {
    res.status(400).json(
      createResponse(false, 'Prompt must be less than 5000 characters')
    );
    return;
  }

  next();
};

export const validateTransactionRequest = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { to, value } = req.body;

  if (!to || typeof to !== 'string') {
    res.status(400).json(
      createResponse(false, 'Recipient address (to) is required and must be a string')
    );
    return;
  }

  // Basic Ethereum address validation
  if (!/^0x[a-fA-F0-9]{40}$/.test(to)) {
    res.status(400).json(
      createResponse(false, 'Invalid Ethereum address format')
    );
    return;
  }

  if (value && isNaN(parseFloat(value))) {
    res.status(400).json(
      createResponse(false, 'Value must be a valid number if provided')
    );
    return;
  }

  next();
};

export const validateAITransactionRequest = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { prompt, transactionDetails } = req.body;

  if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
    res.status(400).json(
      createResponse(false, 'Prompt is required and must be a non-empty string')
    );
    return;
  }

  if (!transactionDetails || typeof transactionDetails !== 'object') {
    res.status(400).json(
      createResponse(false, 'Transaction details are required and must be an object')
    );
    return;
  }

  if (!transactionDetails.to || typeof transactionDetails.to !== 'string') {
    res.status(400).json(
      createResponse(false, 'Transaction recipient address (to) is required')
    );
    return;
  }

  // Basic Ethereum address validation
  if (!/^0x[a-fA-F0-9]{40}$/.test(transactionDetails.to)) {
    res.status(400).json(
      createResponse(false, 'Invalid Ethereum address format in transaction details')
    );
    return;
  }

  next();
};
