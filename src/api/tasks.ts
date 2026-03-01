import apiClient from './client';
import type { Task, CreateTaskRequest } from '../types/task';
import type { ApiSuccessResponse, PaginatedResponse } from '../types/api';

export interface TasksFilters {
  search?: string;
  status?: string;
  task_type?: string;
  response_type?: string;
  dealership_id?: number;
  created_by?: number;
  assigned_to?: number;
  per_page?: number;
  page?: number;
  priority?: string;
}

export interface MyHistoryFilters {
  response_status?: string;
  dealership_id?: number;
  per_page?: number;
  page?: number;
}

export const tasksApi = {
  getTasks: async (filters?: TasksFilters): Promise<PaginatedResponse<Task>> => {
    const response = await apiClient.get<PaginatedResponse<Task>>('/tasks', {
      params: filters,
    });
    return response.data;
  },

  getTask: async (id: number): Promise<Task> => {
    const response = await apiClient.get<ApiSuccessResponse<Task>>(`/tasks/${id}`);
    return response.data.data;
  },

  createTask: async (data: CreateTaskRequest): Promise<Task> => {
    const response = await apiClient.post<ApiSuccessResponse<Task>>('/tasks', data);
    return response.data.data;
  },

  updateTask: async (id: number, data: Partial<CreateTaskRequest>): Promise<Task> => {
    const response = await apiClient.put<ApiSuccessResponse<Task>>(`/tasks/${id}`, data);
    return response.data.data;
  },

  updateTaskStatus: async (
    id: number,
    status: string,
    completeForAll?: boolean,
    preserveProofs?: boolean
  ): Promise<Task> => {
    const payload: { status: string; complete_for_all?: boolean; preserve_proofs?: boolean } = { status };
    if (completeForAll !== undefined) {
      payload.complete_for_all = completeForAll;
    }
    if (preserveProofs !== undefined) {
      payload.preserve_proofs = preserveProofs;
    }
    const response = await apiClient.patch<ApiSuccessResponse<Task>>(`/tasks/${id}/status`, payload);
    return response.data.data;
  },

  /**
   * Update task status with proof files (for completion_with_proof tasks)
   */
  updateTaskStatusWithProofs: async (
    id: number,
    status: string,
    files: File[],
    completeForAll?: boolean,
    onProgress?: (progress: number) => void
  ): Promise<Task> => {
    const formData = new FormData();
    formData.append('status', status);
    if (completeForAll) {
      formData.append('complete_for_all', '1');
    }
    files.forEach((file) => {
      formData.append('proof_files[]', file);
    });
    const response = await apiClient.patch<ApiSuccessResponse<Task>>(`/tasks/${id}/status`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 300000, // 5 минут для загрузки файлов
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percent);
        }
      },
    });
    return response.data.data;
  },

  /**
   * Approve a task response (manager/owner only).
   * Returns the updated Task from the backend.
   */
  approveTaskResponse: async (taskResponseId: number): Promise<ApiSuccessResponse<Task>> => {
    const response = await apiClient.post<ApiSuccessResponse<Task>>(`/task-responses/${taskResponseId}/approve`);
    return response.data;
  },

  /**
   * Reject a task response with reason (manager/owner only).
   * Returns the updated Task from the backend.
   */
  rejectTaskResponse: async (taskResponseId: number, reason: string): Promise<ApiSuccessResponse<Task>> => {
    const response = await apiClient.post<ApiSuccessResponse<Task>>(`/task-responses/${taskResponseId}/reject`, { reason });
    return response.data;
  },

  /**
   * Reject all pending_review responses for a task at once (manager/owner only).
   * Returns the updated Task from the backend.
   */
  rejectAllTaskResponses: async (taskId: number, reason: string): Promise<ApiSuccessResponse<Task>> => {
    const response = await apiClient.post<ApiSuccessResponse<Task>>(`/tasks/${taskId}/reject-all-responses`, { reason });
    return response.data;
  },

  /**
   * Delete a task proof (manager/owner only)
   */
  deleteTaskProof: async (proofId: number): Promise<void> => {
    await apiClient.delete(`/task-proofs/${proofId}`);
  },

  /**
   * Delete a shared task proof (manager/owner only)
   */
  deleteTaskSharedProof: async (proofId: number): Promise<void> => {
    await apiClient.delete(`/task-shared-proofs/${proofId}`);
  },

  deleteTask: async (id: number): Promise<void> => {
    await apiClient.delete(`/tasks/${id}`);
  },

  /**
   * Get history of tasks completed by current user
   */
  getMyHistory: async (filters?: MyHistoryFilters): Promise<PaginatedResponse<Task>> => {
    const response = await apiClient.get<PaginatedResponse<Task>>('/tasks/my-history', {
      params: filters,
    });
    return response.data;
  },
};
