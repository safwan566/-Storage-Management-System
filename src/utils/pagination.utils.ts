import { PAGINATION } from '../config/constants';

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginationResult {
  page: number;
  limit: number;
  skip: number;
  totalPages: number;
  totalItems: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export const getPaginationParams = (params: PaginationParams) => {
  const page = Math.max(1, params.page || PAGINATION.DEFAULT_PAGE);
  const limit = Math.min(
    Math.max(1, params.limit || PAGINATION.DEFAULT_LIMIT),
    PAGINATION.MAX_LIMIT
  );
  const skip = (page - 1) * limit;
  
  return { page, limit, skip };
};

export const getPaginationResult = (
  page: number,
  limit: number,
  totalItems: number
): Omit<PaginationResult, 'skip'> => {
  const totalPages = Math.ceil(totalItems / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;
  
  return {
    page,
    limit,
    totalPages,
    totalItems,
    hasNextPage,
    hasPrevPage,
  };
};

