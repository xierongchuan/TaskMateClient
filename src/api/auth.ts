import apiClient from './client';
import type { LoginRequest, LoginResponse, User } from '../types/user';

export const authApi = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>('/session', credentials);
    return response.data;
  },

  logout: async (): Promise<void> => {
    await apiClient.delete('/session');
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await apiClient.get<{ user: User }>('/session/current');
    return response.data.user;
  },
};
