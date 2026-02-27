import apiClient from './client';

export interface NotificationSetting {
  id: number;
  channel_type: string;
  channel_label: string;
  is_enabled: boolean;
  notification_time?: string;
  notification_day?: string;
  notification_offset?: number;
  recipient_roles?: string[];
}

export interface UpdateNotificationSettingRequest {
  is_enabled?: boolean;
  notification_time?: string;
  notification_day?: string;
  notification_offset?: number;
  recipient_roles?: string[];
  dealership_id?: number;
}

export interface BulkUpdateRequest {
  dealership_id?: number;
  settings: Array<{
    channel_type: string;
    is_enabled?: boolean;
    notification_time?: string;
    notification_day?: string;
  }>;
}

export const notificationSettingsApi = {
  getSettings: async (dealershipId?: number): Promise<{ data: NotificationSetting[] }> => {
    const params = dealershipId ? { dealership_id: dealershipId } : {};
    const response = await apiClient.get<{ data: NotificationSetting[] }>('/notification-settings', { params });
    return response.data;
  },

  updateSetting: async (
    channelType: string,
    data: UpdateNotificationSettingRequest
  ): Promise<{ data: NotificationSetting }> => {
    const response = await apiClient.put<{ data: NotificationSetting }>(
      `/notification-settings/${channelType}`,
      data
    );
    return response.data;
  },

  bulkUpdate: async (data: BulkUpdateRequest): Promise<{ message: string; updated_count: number }> => {
    const response = await apiClient.post<{ message: string; updated_count: number }>(
      '/notification-settings/bulk',
      data
    );
    return response.data;
  },

  resetToDefaults: async (dealershipId?: number): Promise<{ message: string }> => {
    const data = dealershipId ? { dealership_id: dealershipId } : {};
    const response = await apiClient.post<{ message: string }>('/notification-settings/reset', data);
    return response.data;
  },
};
