import apiClient from './client';
import type { Dealership, CreateDealershipRequest } from '../types/dealership';
import type { PaginatedResponse } from '../types/api';

export interface DealershipsFilters {
  search?: string;
  name?: string;
  address?: string;
  phone?: string;
  per_page?: number;
  page?: number;
}

export type { CreateDealershipRequest } from '../types/dealership';

export const dealershipsApi = {
  // Получить список автосалонов
  getDealerships: async (filters?: DealershipsFilters): Promise<PaginatedResponse<Dealership>> => {
    const response = await apiClient.get<{
      success: boolean;
      data: Dealership[];
      current_page: number;
      last_page: number;
      per_page: number;
      total: number;
      links: unknown;
    }>('/dealerships', {
      params: filters,
    });
    return {
      data: response.data.data,
      current_page: response.data.current_page,
      last_page: response.data.last_page,
      per_page: response.data.per_page,
      total: response.data.total,
    };
  },

  // Получить автосалон по ID
  getDealership: async (id: number): Promise<Dealership> => {
    const response = await apiClient.get<{ success: boolean; data: Dealership }>(`/dealerships/${id}`);
    return response.data.data;
  },

  // Создать автосалон (только Manager/Owner)
  createDealership: async (data: CreateDealershipRequest): Promise<{ data: Dealership }> => {
    const response = await apiClient.post<{ data: Dealership }>('/dealerships', data);
    return response.data;
  },

  // Обновить автосалон (только Manager/Owner)
  updateDealership: async (id: number, data: Partial<CreateDealershipRequest>): Promise<{ data: Dealership }> => {
    const response = await apiClient.put<{ data: Dealership }>(`/dealerships/${id}`, data);
    return response.data;
  },

  // Удалить автосалон (только Manager/Owner)
  deleteDealership: async (id: number): Promise<void> => {
    await apiClient.delete(`/dealerships/${id}`);
  },
};
