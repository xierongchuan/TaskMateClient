export type Role = 'employee' | 'observer' | 'manager' | 'owner';

export interface User {
  id: number;
  login: string;
  full_name: string;
  role: Role;
  dealership_id: number | null;

  phone: string | null;
  phone_number: string | null;
  dealerships?: {
    id: number;
    name: string;
    address?: string;
  }[];
  dealership?: {
    id: number;
    name: string;
  };
}

export interface LoginRequest {
  login: string;
  password: string;
}

export interface LoginResponse {
  message: string;
  token: string;
  user: User;
}

export interface CreateUserRequest {
  login: string;
  password: string;
  full_name: string;
  phone: string;
  role: Role;

  dealership_id?: number;
  dealership_ids?: number[];
}

export interface UpdateUserRequest {
  password?: string;
  current_password?: string;
  full_name?: string;
  phone_number?: string;
  phone?: string;
  role?: string;
  dealership_id?: number;
  dealership_ids?: number[];
}

/**
 * Типы ошибок от API.
 */
export type ApiErrorType = 'duplicate_task' | 'access_denied' | 'validation_error';

export interface ApiErrorResponse {
  success?: boolean;
  message: string;
  error_type?: ApiErrorType;
  errors?: Record<string, string[]>;
}
