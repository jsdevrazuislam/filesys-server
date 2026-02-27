import { NextFunction, Request, Response } from 'express';

import { env } from '../config';
import { AppError } from '../utils/AppError';
import logger from '../utils/logger';

export const globalErrorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  let statusCode = 500;
  let message = 'Something went wrong on our end.';

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token. Please log in again.';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Your token has expired. Please log in again.';
  }

  // Log the error using centralized logger
  if (statusCode === 500) {
    logger.error(`[UNEXPECTED ERROR] ${req.method} ${req.originalUrl}`, err);
  } else {
    logger.warn(`[API ERROR] ${req.method} ${req.originalUrl}: ${message}`);
  }

  res.status(statusCode).json({
    success: false,
    message,
    stack: env.NODE_ENV === 'development' ? err.stack : undefined,
  });
};
