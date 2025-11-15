// Common Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  timestamp: string;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    field?: string;
  };
  timestamp: string;
}

// Pagination
export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}

// Module-specific types
export * from './auth';
export * from './leads';
export * from './quotations';
