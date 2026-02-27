export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
  required_roles?: string[];
  your_role?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}
