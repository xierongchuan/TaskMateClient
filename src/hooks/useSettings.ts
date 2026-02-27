import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsApi } from '../api/settings';
import type {
  UpdateSettingRequest,
  UpdateShiftConfigRequest,
  UpdateNotificationConfigRequest,
  UpdateArchiveConfigRequest,
  UpdateTaskConfigRequest
} from '../types/setting';

// Hook for getting all settings
export const useSettings = (dealershipId?: number) => {
  return useQuery({
    queryKey: ['settings', dealershipId],
    queryFn: () => settingsApi.getSettings(dealershipId),
    placeholderData: (prev) => prev,
  });
};

// Hook for getting a setting by key
export const useSetting = (key: string) => {
  return useQuery({
    queryKey: ['setting', key],
    queryFn: () => settingsApi.getSettingByKey(key),
    enabled: !!key,
    placeholderData: (prev) => prev,
  });
};

// Hook for getting shift configuration
export const useShiftConfig = (dealershipId?: number) => {
  return useQuery({
    queryKey: ['settings', 'shift-config', dealershipId],
    queryFn: () => settingsApi.getShiftConfig(dealershipId),
    placeholderData: (prev) => prev,
  });
};

// Hook for getting notification configuration
export const useNotificationConfig = (dealershipId?: number) => {
  return useQuery({
    queryKey: ['settings', 'notification-config', dealershipId],
    queryFn: () => settingsApi.getNotificationConfig(dealershipId),
    placeholderData: (prev) => prev,
  });
};

// Hook for getting archive configuration
export const useArchiveConfig = (dealershipId?: number) => {
  return useQuery({
    queryKey: ['settings', 'archive-config', dealershipId],
    queryFn: () => settingsApi.getArchiveConfig(dealershipId),
    placeholderData: (prev) => prev,
  });
};

// Hook for getting task configuration (shift requirements, archiving)
export const useTaskConfig = (dealershipId?: number) => {
  return useQuery({
    queryKey: ['settings', 'task-config', dealershipId],
    queryFn: () => settingsApi.getTaskConfig(dealershipId),
    placeholderData: (prev) => prev,
  });
};

// Hook for dealership-specific settings (legacy compatibility)
export const useDealershipSettings = (dealershipId: number) => {
  return useQuery({
    queryKey: ['settings', 'dealership', dealershipId],
    queryFn: () => settingsApi.getDealershipSettings(dealershipId),
    enabled: !!dealershipId,
    placeholderData: (prev) => prev,
  });
};

// Hook for updating a setting by ID
export const useUpdateSetting = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateSettingRequest }) =>
      settingsApi.updateSettingById(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
  });
};

// Hook for updating a setting by key (creates if doesn't exist)
export const useUpdateSettingByKey = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ key, value, type }: { key: string; value: string; type?: string }) =>
      settingsApi.updateSettingByKey(key, { value, type }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      queryClient.invalidateQueries({ queryKey: ['setting', variables.key] });
    },
  });
};

// Hook for updating shift configuration
export const useUpdateShiftConfig = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateShiftConfigRequest) => settingsApi.updateShiftConfig(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'shift-config'] });
      queryClient.invalidateQueries({ queryKey: ['settings', 'shift-config', variables.dealership_id] });
      queryClient.invalidateQueries({ queryKey: ['settings', 'dealership', variables.dealership_id] });
    },
  });
};

// Hook for updating notification configuration
export const useUpdateNotificationConfig = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateNotificationConfigRequest) => settingsApi.updateNotificationConfig(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'notification-config'] });
      if (variables.dealership_id) {
        queryClient.invalidateQueries({ queryKey: ['settings', 'notification-config', variables.dealership_id] });
      }
    },
  });
};

// Hook for updating archive configuration
export const useUpdateArchiveConfig = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateArchiveConfigRequest) => settingsApi.updateArchiveConfig(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'archive-config'] });
      if (variables.dealership_id) {
        queryClient.invalidateQueries({ queryKey: ['settings', 'archive-config', variables.dealership_id] });
      }
    },
  });
};

// Hook for updating task configuration
export const useUpdateTaskConfig = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateTaskConfigRequest) => settingsApi.updateTaskConfig(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'task-config'] });
      if (variables.dealership_id) {
        queryClient.invalidateQueries({ queryKey: ['settings', 'task-config', variables.dealership_id] });
      }
    },
  });
};

// Hook for updating dealership settings (legacy compatibility)
export const useUpdateDealershipSettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateShiftConfigRequest) => settingsApi.updateDealershipShiftConfig(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'shift-config'] });
      queryClient.invalidateQueries({ queryKey: ['settings', 'shift-config', variables.dealership_id] });
      queryClient.invalidateQueries({ queryKey: ['settings', 'dealership', variables.dealership_id] });
    },
  });
};

// Hook for resetting dealership settings to global
export const useResetDealershipSettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dealershipId: number) => settingsApi.resetDealershipToGlobal(dealershipId),
    onSuccess: (_, dealershipId) => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'shift-config'] });
      queryClient.invalidateQueries({ queryKey: ['settings', 'shift-config', dealershipId] });
      queryClient.invalidateQueries({ queryKey: ['settings', 'dealership', dealershipId] });
    },
  });
};
