import apiClient from './client';
import type {
  Setting,
  NotificationConfig,
  ArchiveConfig,
  ShiftConfig,
  TaskConfig,
  DealershipBotConfig,
  DealershipSettingsResponse,
  UpdateSettingRequest,
  UpdateShiftConfigRequest,
  UpdateNotificationConfigRequest,
  UpdateArchiveConfigRequest,
  UpdateTaskConfigRequest
} from '../types/setting';

export const settingsApi = {
  // Basic settings operations
  getSettings: async (dealershipId?: number): Promise<{ data: Setting[] }> => {
    const response = await apiClient.get<{ data: Setting[] }>('/settings', {
      params: dealershipId ? { dealership_id: dealershipId } : {},
    });
    return response.data;
  },

  getSettingByKey: async (key: string): Promise<{ data: Setting }> => {
    const response = await apiClient.get<{ data: Setting }>(`/settings/${key}`);
    return response.data;
  },

  updateSettingById: async (id: number, data: UpdateSettingRequest): Promise<{ data: Setting }> => {
    const response = await apiClient.put<{ data: Setting }>(`/settings/${id}`, data);
    return response.data;
  },

  // Update or create a global setting by key
  updateSettingByKey: async (key: string, data: { value: string; type?: string }): Promise<{ data: { key: string; value: string } }> => {
    const response = await apiClient.put<{ data: { key: string; value: string } }>(`/settings/${key}`, data);
    return response.data;
  },

  // Shift Configuration
  getShiftConfig: async (dealershipId?: number): Promise<{ data: ShiftConfig }> => {
    const response = await apiClient.get<{ data: ShiftConfig }>('/settings/shift-config', {
      params: dealershipId ? { dealership_id: dealershipId } : {},
    });
    return response.data;
  },

  updateShiftConfig: async (data: UpdateShiftConfigRequest): Promise<{ data: ShiftConfig }> => {
    const response = await apiClient.post<{ data: ShiftConfig }>('/settings/shift-config', data);
    return response.data;
  },

  // Notification Configuration
  getNotificationConfig: async (dealershipId?: number): Promise<{ data: NotificationConfig }> => {
    const response = await apiClient.get<{ data: NotificationConfig }>('/settings/notification-config', {
      params: dealershipId ? { dealership_id: dealershipId } : {},
    });
    return response.data;
  },

  updateNotificationConfig: async (data: UpdateNotificationConfigRequest): Promise<{ data: NotificationConfig }> => {
    const response = await apiClient.put<{ data: NotificationConfig }>('/settings/notification-config', data);
    return response.data;
  },

  // Archive Configuration
  getArchiveConfig: async (dealershipId?: number): Promise<{ data: ArchiveConfig }> => {
    const response = await apiClient.get<{ data: ArchiveConfig }>('/settings/archive-config', {
      params: dealershipId ? { dealership_id: dealershipId } : {},
    });
    return response.data;
  },

  updateArchiveConfig: async (data: UpdateArchiveConfigRequest): Promise<{ data: ArchiveConfig }> => {
    const response = await apiClient.put<{ data: ArchiveConfig }>('/settings/archive-config', data);
    return response.data;
  },

  // Task Configuration (shift requirements, archiving)
  getTaskConfig: async (dealershipId?: number): Promise<{ data: TaskConfig }> => {
    const response = await apiClient.get<{ data: TaskConfig }>('/settings/task-config', {
      params: dealershipId ? { dealership_id: dealershipId } : {},
    });
    return response.data;
  },

  updateTaskConfig: async (data: UpdateTaskConfigRequest): Promise<{ data: TaskConfig }> => {
    const response = await apiClient.put<{ data: TaskConfig }>('/settings/task-config', data);
    return response.data;
  },

  // Legacy methods for backward compatibility
  // Dealership-specific settings (using new shift config endpoints)
  getDealershipSettings: async (dealershipId: number): Promise<DealershipSettingsResponse> => {
    if (!dealershipId) {
      throw new Error('Dealership ID is required');
    }

    const [dealershipConfig, globalNotification, globalArchive] = await Promise.all([
      apiClient.get<{ data: ShiftConfig }>(`/settings/shift-config?dealership_id=${dealershipId}`),
      apiClient.get<{ data: NotificationConfig }>('/settings/notification-config'),
      apiClient.get<{ data: ArchiveConfig }>('/settings/archive-config'),
    ]);

    // Determine which fields are inherited (not set for dealership)
    const inheritedFields: (keyof DealershipBotConfig)[] = [];
    if (!dealershipConfig.data.data.late_tolerance_minutes) inheritedFields.push('late_tolerance_minutes');

    return {
      dealership_id: dealershipId,
      settings: dealershipConfig.data.data,
      global_notification_settings: globalNotification.data.data,
      global_archive_settings: globalArchive.data.data,
      inherited_fields: inheritedFields,
    };
  },

  updateDealershipShiftConfig: async (data: UpdateShiftConfigRequest): Promise<ShiftConfig> => {
    const response = await apiClient.post<{ data: ShiftConfig }>('/settings/shift-config', data);
    return response.data.data;
  },

  resetDealershipToGlobal: async (dealershipId: number): Promise<void> => {
    // This would need to be implemented on backend side
    // For now, we can update with empty values to reset
    await apiClient.post('/settings/shift-config', {
      dealership_id: dealershipId,
      shift_1_start_time: undefined,
      shift_1_end_time: undefined,
      late_tolerance_minutes: undefined,
    });
  },
};
