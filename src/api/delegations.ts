import apiClient from './client';
import type { TaskDelegation } from '../types/task';

export interface DelegationsFilters {
  status?: string;
  direction?: 'incoming' | 'outgoing';
  task_id?: number;
  per_page?: number;
  page?: number;
}

export const delegationsApi = {
  createDelegation: async (taskId: number, toUserId: number, reason?: string): Promise<TaskDelegation> => {
    const response = await apiClient.post<{ data: TaskDelegation }>(`/tasks/${taskId}/delegations`, {
      to_user_id: toUserId,
      reason: reason || undefined,
    });
    return response.data.data;
  },

  getDelegations: async (filters?: DelegationsFilters): Promise<TaskDelegation[]> => {
    const response = await apiClient.get<{ data: TaskDelegation[] }>('/task-delegations', {
      params: filters,
    });
    return response.data.data;
  },

  getDelegation: async (id: number): Promise<TaskDelegation> => {
    const response = await apiClient.get<{ data: TaskDelegation }>(`/task-delegations/${id}`);
    return response.data.data;
  },

  acceptDelegation: async (id: number): Promise<TaskDelegation> => {
    const response = await apiClient.post<{ data: TaskDelegation }>(`/task-delegations/${id}/accept`);
    return response.data.data;
  },

  rejectDelegation: async (id: number, reason: string): Promise<TaskDelegation> => {
    const response = await apiClient.post<{ data: TaskDelegation }>(`/task-delegations/${id}/reject`, { reason });
    return response.data.data;
  },

  cancelDelegation: async (id: number): Promise<TaskDelegation> => {
    const response = await apiClient.post<{ data: TaskDelegation }>(`/task-delegations/${id}/cancel`);
    return response.data.data;
  },
};
