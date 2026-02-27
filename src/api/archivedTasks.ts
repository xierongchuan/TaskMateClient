import apiClient from './client';
import type { ArchivedTask, ArchivedTaskFilters, ArchivedTaskStatistics } from '../types/archivedTask';
import type { PaginatedResponse } from '../types/api';
import { getTodayDateString } from '../utils/dateTime';

export const archivedTasksApi = {
  /**
   * Get paginated list of archived tasks with optional filters
   */
  getArchivedTasks: async (filters?: ArchivedTaskFilters): Promise<PaginatedResponse<ArchivedTask>> => {
    const response = await apiClient.get<PaginatedResponse<ArchivedTask>>('/archived-tasks', {
      params: filters,
    });
    return response.data;
  },

  /**
   * Restore a task from archive
   */
  restoreTask: async (id: number): Promise<{ success: boolean; data: ArchivedTask; message: string }> => {
    const response = await apiClient.post<{ success: boolean; data: ArchivedTask; message: string }>(`/archived-tasks/${id}/restore`);
    return response.data;
  },

  /**
   * Export archived tasks to CSV
   * Returns a blob that can be downloaded
   */
  exportToCsv: async (filters?: ArchivedTaskFilters): Promise<Blob> => {
    const response = await apiClient.get('/archived-tasks/export', {
      params: filters,
      responseType: 'blob',
    });
    return response.data;
  },

  /**
   * Helper function to download the exported CSV
   */
  downloadCsv: async (filters?: ArchivedTaskFilters): Promise<void> => {
    const blob = await archivedTasksApi.exportToCsv(filters);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `archived_tasks_${getTodayDateString()}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },

  /**
   * Get archive statistics
   */
  getStatistics: async (dealershipId?: number): Promise<ArchivedTaskStatistics> => {
    const params = dealershipId ? { dealership_id: dealershipId } : {};
    const response = await apiClient.get<ArchivedTaskStatistics>('/archived-tasks/statistics', { params });
    return response.data;
  },
};
