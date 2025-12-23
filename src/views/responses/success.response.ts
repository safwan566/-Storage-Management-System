import { Response } from 'express';
import { ApiResponse } from '../../types/common.types';
import { HTTP_STATUS } from '../../config/constants';

export const successResponse = <T>(
  res: Response,
  message: string,
  data?: T,
  statusCode: number = HTTP_STATUS.OK
): Response => {
  const response: ApiResponse<T> = {
    success: true,
    message,
    data,
  };
  
  return res.status(statusCode).json(response);
};

export const createdResponse = <T>(
  res: Response,
  message: string,
  data?: T
): Response => {
  return successResponse(res, message, data, HTTP_STATUS.CREATED);
};

export const noContentResponse = (res: Response): Response => {
  return res.status(HTTP_STATUS.NO_CONTENT).send();
};

