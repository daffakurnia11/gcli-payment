import type { NextFunction, Request, Response } from 'express';
import { logger } from '../config/logger';
import { HttpError } from '../utils/http-error';

export const errorMiddleware = (
  error: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  logger.error({ err: error }, 'Unhandled error');

  if (error instanceof HttpError) {
    res.status(error.statusCode).json({
      message: error.message,
      ...(error.details !== undefined ? { details: error.details } : {})
    });
    return;
  }

  res.status(500).json({
    message: 'Internal server error'
  });
};
