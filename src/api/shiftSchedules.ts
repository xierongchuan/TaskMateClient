import apiClient from './client';
import type { ShiftSchedule } from '../types/shift';

export interface CreateShiftScheduleRequest {
  dealership_id: number;
  name: string;
  start_time: string;
  end_time: string;
  sort_order?: number;
  is_active?: boolean;
}

export interface UpdateShiftScheduleRequest {
  name?: string;
  start_time?: string;
  end_time?: string;
  sort_order?: number;
  is_active?: boolean;
}

export const shiftSchedulesApi = {
  getAll: async (dealershipId?: number, activeOnly?: boolean): Promise<{ data: ShiftSchedule[] }> => {
    const response = await apiClient.get<{ data: ShiftSchedule[] }>('/shift-schedules', {
      params: {
        dealership_id: dealershipId,
        active_only: activeOnly ? 'true' : undefined,
      },
    });
    return response.data;
  },

  get: async (id: number): Promise<{ data: ShiftSchedule }> => {
    const response = await apiClient.get<{ data: ShiftSchedule }>(`/shift-schedules/${id}`);
    return response.data;
  },

  create: async (data: CreateShiftScheduleRequest): Promise<{ data: ShiftSchedule }> => {
    const response = await apiClient.post<{ data: ShiftSchedule }>('/shift-schedules', data);
    return response.data;
  },

  update: async (id: number, data: UpdateShiftScheduleRequest): Promise<{ data: ShiftSchedule }> => {
    const response = await apiClient.put<{ data: ShiftSchedule }>(`/shift-schedules/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/shift-schedules/${id}`);
  },
};
