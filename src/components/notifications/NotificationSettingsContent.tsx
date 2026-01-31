import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationSettingsApi } from '../../api/notification-settings';
import type { NotificationSetting } from '../../api/notification-settings';
import { ClockIcon, CheckCircleIcon, XCircleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import { RoleSelector } from './RoleSelector';
import { Card, Input, Select, Skeleton, ErrorState } from '../ui';

interface NotificationSettingsContentProps {
  dealershipId?: number;
}

export const NotificationSettingsContent: React.FC<NotificationSettingsContentProps> = ({ dealershipId }) => {
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: settingsData, isLoading } = useQuery({
    queryKey: ['notification-settings', dealershipId],
    queryFn: () => notificationSettingsApi.getSettings(dealershipId),
    enabled: !!dealershipId,
    placeholderData: (prev) => prev, // Сохраняем предыдущие данные во время refetch
  });

  const updateMutation = useMutation({
    mutationFn: ({ channelType, data }: { channelType: string; data: any }) =>
      notificationSettingsApi.updateSetting(channelType, { ...data, dealership_id: dealershipId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-settings', dealershipId] });
      setError(null);
    },
    onError: (error: any) => {
      setError(error?.response?.data?.message || 'Не удалось обновить настройки');
      console.error('Failed to update notification setting:', error);
    },
  });

  const handleToggle = async (setting: NotificationSetting) => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      await updateMutation.mutateAsync({
        channelType: setting.channel_type,
        data: { is_enabled: !setting.is_enabled },
      });
    } catch (error) {
      console.error('Error toggling notification:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTimeChange = async (setting: NotificationSetting, time: string) => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      await updateMutation.mutateAsync({
        channelType: setting.channel_type,
        data: { notification_time: time },
      });
    } catch (error) {
      console.error('Error updating time:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDayChange = async (setting: NotificationSetting, day: string) => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      await updateMutation.mutateAsync({
        channelType: setting.channel_type,
        data: { notification_day: day },
      });
    } catch (error) {
      console.error('Error updating day:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleOffsetChange = async (setting: NotificationSetting, offset: number) => {
    if (offset < 1 || offset > 1440) return;
    if (isSaving) return;

    setIsSaving(true);
    try {
      await updateMutation.mutateAsync({
        channelType: setting.channel_type,
        data: { notification_offset: offset },
      });
    } catch (error) {
      console.error('Error updating offset:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRolesChange = async (setting: NotificationSetting, roles: string[]) => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      await updateMutation.mutateAsync({
        channelType: setting.channel_type,
        data: { recipient_roles: roles },
      });
    } catch (error) {
      console.error('Error updating roles:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Если не выбран дилерский центр, показываем сообщение
  if (!dealershipId) {
    return (
      <div className="p-4 bg-accent-50 dark:bg-gray-700/50 border border-accent-200 dark:border-gray-600 rounded-lg">
        <div className="flex">
          <InformationCircleIcon className="w-5 h-5 text-accent-600 dark:text-accent-400 mr-2 flex-shrink-0" />
          <div>
            <h4 className="text-sm font-medium text-accent-800 dark:text-accent-300 mb-1">Выберите дилерский центр</h4>
            <p className="text-sm text-accent-700 dark:text-accent-400">
              Для настройки уведомлений необходимо выбрать дилерский центр в выпадающем списке вверху страницы.
              Настройки уведомлений применяются отдельно для каждого автосалона.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton variant="list" count={4} />
      </div>
    );
  }

  const settings = settingsData?.data || [];

  // Если настройки пусты, показываем информацию
  if (settings.length === 0) {
    return (
      <div className="p-4 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg">
        <div className="flex">
          <InformationCircleIcon className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mr-2 flex-shrink-0" />
          <div>
            <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-300 mb-1">Настройки уведомлений не найдены</h4>
            <p className="text-sm text-yellow-700 dark:text-yellow-400">
              Для выбранного дилерского центра не настроены уведомления.
              Попробуйте выбрать другой автосалон или обратитесь к администратору.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Group settings by category
  const taskNotifications = settings.filter(s =>
    ['task_assigned', 'task_deadline_30min', 'task_overdue', 'task_hour_late'].includes(s.channel_type)
  );

  const managerNotifications = settings.filter(s =>
    ['shift_late'].includes(s.channel_type)
  );

  const reports = settings.filter(s =>
    ['daily_summary', 'weekly_report'].includes(s.channel_type)
  );

  const dayOptions = [
    { value: 'monday', label: 'Понедельник' },
    { value: 'tuesday', label: 'Вторник' },
    { value: 'wednesday', label: 'Среда' },
    { value: 'thursday', label: 'Четверг' },
    { value: 'friday', label: 'Пятница' },
    { value: 'saturday', label: 'Суббота' },
    { value: 'sunday', label: 'Воскресенье' },
  ];

  const renderSettingRow = (setting: NotificationSetting) => (
    <Card key={setting.id} className="hover:shadow-sm transition-shadow">
      <Card.Body className="space-y-4">
        {/* Header row with toggle */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className={`flex-shrink-0 mt-0.5 ${setting.is_enabled ? 'text-green-500' : 'text-gray-400 dark:text-gray-500'}`}>
              {setting.is_enabled ? (
                <CheckCircleIcon className="w-5 h-5" />
              ) : (
                <XCircleIcon className="w-5 h-5" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">{setting.channel_label}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {setting.channel_type}
              </p>
            </div>
          </div>

          {/* Toggle switch - с увеличенным отступом */}
          <button
            onClick={() => handleToggle(setting)}
            disabled={isSaving}
            className={`
              relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent
              transition-colors duration-200 ease-in-out ml-4
              focus:outline-none focus:ring-2 focus:ring-accent-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800
              disabled:opacity-50 disabled:cursor-not-allowed
              ${setting.is_enabled ? 'bg-accent-600' : 'bg-gray-200 dark:bg-gray-600'}
            `}
          >
            <span
              className={`
                pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0
                transition duration-200 ease-in-out
                ${setting.is_enabled ? 'translate-x-5' : 'translate-x-0'}
              `}
            />
          </button>
        </div>

        {/* Settings row - адаптивная для мобильных */}
        {(setting.channel_type === 'daily_summary' ||
          setting.channel_type === 'weekly_report' ||
          setting.channel_type === 'task_deadline_30min' ||
          setting.channel_type === 'task_hour_late') && (
            <div className="flex flex-wrap items-center gap-3 pl-8">
              {/* Time picker for scheduled notifications */}
              {(setting.channel_type === 'daily_summary' || setting.channel_type === 'weekly_report') && (
                <div className="flex items-center gap-2">
                  <ClockIcon className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                  <span className="text-xs text-gray-500 dark:text-gray-400 hidden sm:inline">Время:</span>
                  <Input
                    type="time"
                    value={setting.notification_time || ''}
                    onChange={(e) => handleTimeChange(setting, e.target.value)}
                    disabled={!setting.is_enabled || isSaving}
                    className="w-28"
                  />
                </div>
              )}

              {/* Day picker for weekly reports */}
              {setting.channel_type === 'weekly_report' && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400 hidden sm:inline">День:</span>
                  <Select
                    value={setting.notification_day || 'monday'}
                    onChange={(e) => handleDayChange(setting, e.target.value)}
                    disabled={!setting.is_enabled || isSaving}
                    options={dayOptions}
                    className="w-36"
                  />
                </div>
              )}

              {/* Offset picker for time-based notifications */}
              {(setting.channel_type === 'task_deadline_30min' || setting.channel_type === 'task_hour_late') && (
                <div className="flex items-center gap-2">
                  <ClockIcon className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                  <span className="text-xs text-gray-500 dark:text-gray-400 hidden sm:inline">За:</span>
                  <Input
                    type="number"
                    min={1}
                    max={1440}
                    value={setting.notification_offset || (setting.channel_type === 'task_deadline_30min' ? 30 : 60)}
                    onChange={(e) => handleOffsetChange(setting, parseInt(e.target.value))}
                    disabled={!setting.is_enabled || isSaving}
                    className="w-20"
                  />
                  <span className="text-xs text-gray-500 dark:text-gray-400">мин</span>
                </div>
              )}
            </div>
          )}

        {/* Role selector - show only when enabled */}
        {setting.is_enabled && (
          <div className="pt-3 border-t border-gray-100 dark:border-gray-700">
            <RoleSelector
              value={setting.recipient_roles || []}
              onChange={(roles) => handleRolesChange(setting, roles)}
              disabled={isSaving}
            />
          </div>
        )}
      </Card.Body>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Error Banner */}
      {error && (
        <ErrorState
          title="Ошибка"
          description={error}
          onRetry={() => setError(null)}
          retryText="Закрыть"
        />
      )}

      {/* Task Notifications Section */}
      {taskNotifications.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="text-xl">📋</span> Уведомления о задачах
          </h2>
          <div className="space-y-3">
            {taskNotifications.map(renderSettingRow)}
          </div>
        </div>
      )}

      {/* Manager Notifications Section */}
      {managerNotifications.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="text-xl">👔</span> Уведомления для менеджеров
          </h2>
          <div className="space-y-3">
            {managerNotifications.map(renderSettingRow)}
          </div>
        </div>
      )}

      {/* Reports Section */}
      {reports.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="text-xl">📊</span> Отчёты
          </h2>
          <div className="space-y-3">
            {reports.map(renderSettingRow)}
          </div>
        </div>
      )}
    </div>
  );
};
