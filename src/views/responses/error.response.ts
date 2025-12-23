import { Response } from 'express';
import { ApiResponse } from '../../types/common.types';
import { HTTP_STATUS } from '../../config/constants';

export const errorResponse = (
  res: Response,
  message: string,
  statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR,
  details?: unknown
): Response => {
  const response: ApiResponse = {
    success: false,
    message,
    error: {
      message,
      details,
    },
  };
  
  return res.status(statusCode).json(response);
};

export const validationErrorResponse = (
  res: Response,
  errors: unknown
): Response => {
  return errorResponse(
    res,
    'Validation failed',
    HTTP_STATUS.UNPROCESSABLE_ENTITY,
    errors
  );
};

export const unauthorizedResponse = (
  res: Response,
  message: string = 'Unauthorized'
): Response => {
  return errorResponse(res, message, HTTP_STATUS.UNAUTHORIZED);
};

export const forbiddenResponse = (
  res: Response,
  message: string = 'Forbidden'
): Response => {
  return errorResponse(res, message, HTTP_STATUS.FORBIDDEN);
};

export const notFoundResponse = (
  res: Response,
  message: string = 'Resource not found'
): Response => {
  return errorResponse(res, message, HTTP_STATUS.NOT_FOUND);
};

