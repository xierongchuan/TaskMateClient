import apiClient from './client';
import type { ShiftSchedule } from '../types/shift';

export interface ShiftScheduleApiResponse {
  success?: boolean;
  message?: string;
  data: ShiftSchedule[];
}

export interface ShiftScheduleItemApiResponse {
  success?: boolean;
  message?: string;
  data: ShiftSchedule;
}

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
  getAll: async (
    dealershipId?: number,
    activeOnly?: boolean,
    deletedOnly?: boolean,
  ): Promise<ShiftScheduleApiResponse> => {
    const response = await apiClient.get<ShiftScheduleApiResponse>('/shift-schedules', {
      params: {
        dealership_id: dealershipId,
        active_only: !deletedOnly && activeOnly ? 'true' : undefined,
        deleted_only: deletedOnly ? 'true' : undefined,
      },
    });
    return response.data;
  },

  get: async (id: number): Promise<ShiftScheduleItemApiResponse> => {
    const response = await apiClient.get<ShiftScheduleItemApiResponse>(`/shift-schedules/${id}`);
    return response.data;
  },

  create: async (data: CreateShiftScheduleRequest): Promise<ShiftScheduleItemApiResponse> => {
    const response = await apiClient.post<ShiftScheduleItemApiResponse>('/shift-schedules', data);
    return response.data;
  },

  update: async (id: number, data: UpdateShiftScheduleRequest): Promise<ShiftScheduleItemApiResponse> => {
    const response = await apiClient.put<ShiftScheduleItemApiResponse>(`/shift-schedules/${id}`, data);
    return response.data;
  },

  restore: async (id: number): Promise<ShiftScheduleItemApiResponse> => {
    const response = await apiClient.post<ShiftScheduleItemApiResponse>(`/shift-schedules/${id}/restore`);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/shift-schedules/${id}`);
  },
};
