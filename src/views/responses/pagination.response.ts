import { Response } from 'express';
import { PaginatedResponse } from '../../types/common.types';
import { HTTP_STATUS } from '../../config/constants';
import { PaginationResult } from '../../utils/pagination.utils';

export const paginatedResponse = <T>(
  res: Response,
  message: string,
  data: T,
  pagination: Omit<PaginationResult, 'skip'>
): Response => {
  const response: PaginatedResponse<T> = {
    success: true,
    message,
    data,
    pagination,
  };
  
  return res.status(HTTP_STATUS.OK).json(response);
};

