import apiClient from './client';
import type { PaginatedResponse } from '../types/api';

export interface AuditActor {
  id: number;
  full_name: string;
  email: string;
  login: string;
  role: 'owner' | 'manager' | 'employee' | 'observer';
}

export interface AuditDealership {
  id: number;
  name: string;
}

export interface AuditLog {
  id: number;
  table_name: string;
  table_label: string;
  record_id: number;
  actor_id: number | null;
  actor: AuditActor | null;
  dealership_id: number | null;
  dealership: AuditDealership | null;
  action: string;
  action_label: string;
  payload: Record<string, unknown>;
  created_at: string;
}

export interface AuditLogsFilters {
  log_id?: number;
  table_name?: string;
  action?: string;
  actor_id?: number;
  dealership_id?: number;
  from_date?: string;
  to_date?: string;
  record_id?: number;
  per_page?: number;
  page?: number;
}

export interface GetActorsFilters {
  dealership_id?: number;
}

export const auditLogsApi = {
  /**
   * Get list of audit logs (owner only)
   */
  getAuditLogs: async (filters?: AuditLogsFilters): Promise<PaginatedResponse<AuditLog>> => {
    const response = await apiClient.get<{
      success: boolean;
      data: AuditLog[];
      current_page: number;
      last_page: number;
      per_page: number;
      total: number;
    }>('/audit-logs', {
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

  /**
   * Get audit history for a specific record (manager/owner)
   */
  getRecordHistory: async (tableName: string, recordId: number): Promise<{ data: AuditLog[] }> => {
    const response = await apiClient.get<{ data: AuditLog[] }>(`/audit-logs/${tableName}/${recordId}`);
    return response.data;
  },

  /**
   * Get list of users who performed actions (for filter dropdown)
   */
  getActors: async (filters?: GetActorsFilters): Promise<{ data: AuditActor[] }> => {
    const response = await apiClient.get<{ data: AuditActor[] }>('/audit-logs/actors', {
      params: filters,
    });
    return response.data;
  },
};
