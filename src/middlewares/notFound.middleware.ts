import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError';

export const notFound = (req: Request, _res: Response, next: NextFunction) => {
  const error = ApiError.notFound(
    `Route not found: ${req.method} ${req.originalUrl}`
  );
  next(error);
};

