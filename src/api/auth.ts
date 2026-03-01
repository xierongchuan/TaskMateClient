import apiClient from './client';
import type { LoginRequest, LoginResponse, User } from '../types/user';
import type { ApiSuccessResponse } from '../types/api';

export const authApi = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await apiClient.post<ApiSuccessResponse<LoginResponse>>(
      '/session',
      credentials,
    );
    return response.data.data;
  },

  logout: async (): Promise<void> => {
    await apiClient.delete('/session');
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await apiClient.get<ApiSuccessResponse<{ user: User }>>(
      '/session/current',
    );
    return response.data.data.user;
  },
};
