import apiClient from './client';
import type { DashboardData } from '../types/dashboard';
import type { ApiSuccessResponse } from '../types/api';

export const dashboardApi = {
  getData: async (dealership_id?: number): Promise<DashboardData> => {
    const response = await apiClient.get<ApiSuccessResponse<DashboardData>>('/dashboard', {
      params: { dealership_id },
    });
    return response.data.data;
  },
};
