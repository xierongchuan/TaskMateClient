import apiClient from './client';
import type { DashboardData } from '../types/dashboard';

export const dashboardApi = {
  getData: async (dealership_id?: number): Promise<DashboardData> => {
    const response = await apiClient.get<DashboardData>('/dashboard', {
      params: { dealership_id },
    });
    return response.data;
  },
};
