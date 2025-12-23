export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: {
    message: string;
    details?: unknown;
  };
}

export interface PaginatedResponse<T = unknown> extends ApiResponse<T> {
  pagination?: {
    page: number;
    limit: number;
    totalPages: number;
    totalItems: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export type SortOrder = 'asc' | 'desc' | 1 | -1;

export interface QueryOptions {
  page?: number;
  limit?: number;
  sort?: string;
  order?: SortOrder;
  search?: string;
  fields?: string;
}

