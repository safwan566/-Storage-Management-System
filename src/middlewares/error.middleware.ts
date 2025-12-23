import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError';
import { logger } from '../config/logger';
import { config } from '../config/environment';
import { HTTP_STATUS } from '../config/constants';

export const errorHandler = (
  err: Error | ApiError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
) => {
  let error = err;
  
  // Log error
  logger.error('Error:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
  });
  
  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Invalid ID format';
    error = ApiError.badRequest(message);
  }
  
  // Mongoose duplicate key
  if (err.name === 'MongoServerError' && 'code' in err && err.code === 11000) {
    const message = 'Duplicate field value entered';
    error = ApiError.conflict(message);
  }
  
  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = 'Validation error';
    error = ApiError.badRequest(message);
  }
  
  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    error = ApiError.unauthorized(message);
  }
  
  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired';
    error = ApiError.unauthorized(message);
  }
  
  // API Error
  if (error instanceof ApiError) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
      error: {
        message: error.message,
        ...(config.env === 'development' && { stack: error.stack }),
      },
    });
  }
  
  // Default error
  return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
    success: false,
    message: 'Internal server error',
    error: {
      message: err.message,
      ...(config.env === 'development' && { stack: err.stack }),
    },
  });
};

