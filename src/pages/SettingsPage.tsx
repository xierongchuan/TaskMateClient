import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useShiftConfig, useNotificationConfig, useArchiveConfig, useUpdateShiftConfig, useUpdateNotificationConfig, useUpdateArchiveConfig, useDealershipSettings, useTaskConfig, useUpdateTaskConfig, useSetting, useUpdateSetting, useUpdateSettingByKey } from '../hooks/useSettings';
import { useDealership, useUpdateDealership } from '../hooks/useDealerships';
import { useShiftSchedules, useCreateShiftSchedule, useUpdateShiftSchedule, useDeleteShiftSchedule } from '../hooks/useShiftSchedules';
import { useTheme, ACCENT_COLOR_OPTIONS } from '../context/ThemeContext';
import { usePermissions } from '../hooks/usePermissions';
import { useWorkspace } from '../hooks/useWorkspace';
import { YearCalendar, type YearCalendarRef } from '../components/settings/YearCalendar';
import { getCurrentYear } from '../utils/dateTime';
import type { NotificationConfig, ArchiveConfig, ShiftConfig, TaskConfig } from '../types/setting';
import { TIMEZONES } from '../types/dealership';

// UI Components
import {
  PageContainer,
  Card,
  Button,
  Select,
  Checkbox,
  Input,
  Skeleton,
  ErrorState,
  PageHeader,
  EmptyState,
} from '../components/ui';
import { useToast } from '../components/ui/Toast';

// Icons
import {
  CogIcon,
  ClockIcon,
  BellIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  WrenchIcon,
  ComputerDesktopIcon,
  ClipboardDocumentListIcon,
  CalendarDaysIcon,
  SwatchIcon,
  SunIcon,
  MoonIcon,
} from '@heroicons/react/24/outline';
import { NotificationSettingsContent } from '../components/notifications/NotificationSettingsContent';
import { useUnsavedChanges } from '../hooks/useUnsavedChanges';
import { ConfirmDialog } from '../components/ui';

export const SettingsPage: React.FC = () => {
  const permissions = usePermissions();
  const {
    pendingTheme, setTheme, applyTheme, hasPendingChanges: themeHasPendingChanges,
    pendingAccentColor, setAccentColor, applyAccentColor, hasAccentPendingChanges
  } = useTheme();
  const { dealershipId: workspaceDealershipId } = useWorkspace();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'general' | 'interface' | 'tasks' | 'calendar' | 'shifts' | 'notifications' | 'maintenance'>('general');
  // Конвертируем null (все автосалоны) в undefined (глобальные настройки)
  const selectedDealershipId = workspaceDealershipId || undefined;
  const [showDetailedNotifications, setShowDetailedNotifications] = useState(false);
  const [selectedCalendarYear, setSelectedCalendarYear] = useState(getCurrentYear);
  const [calendarSaving, setCalendarSaving] = useState(false);
  const calendarRef = useRef<YearCalendarRef>(null);

  // Initialize shift config with default values
  const [shiftConfig, setShiftConfig] = useState<ShiftConfig>({
    late_tolerance_minutes: 15,
    work_days: [1, 2, 3, 4, 5],
    timezone: 'Europe/Moscow',
  });

  // Shift schedules management
  const [newScheduleName, setNewScheduleName] = useState('');
  const [newScheduleStart, setNewScheduleStart] = useState('09:00');
  const [newScheduleEnd, setNewScheduleEnd] = useState('18:00');
  const [showAddSchedule, setShowAddSchedule] = useState(false);

  // Initialize notification config with default values
  const [notificationConfig, setNotificationConfig] = useState<NotificationConfig>({
    notification_enabled: true,
    auto_close_shifts: false,
    shift_reminder_minutes: 15,
    rows_per_page: 10,
    notification_types: {
      task_overdue: true,
      shift_late: true,
      task_completed: true,
      system_errors: true,
    },
  });

  // Initialize archive config with default values
  const [archiveConfig, setArchiveConfig] = useState<ArchiveConfig>({
    archive_completed_time: '03:00',
    archive_overdue_day_of_week: 0,
    archive_overdue_time: '03:00',
  });

  // Maintenance mode (global setting)
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  // Initialize task config with default values
  const [taskConfig, setTaskConfig] = useState<TaskConfig>({
    task_requires_open_shift: false,
    archive_overdue_hours_after_shift: 2,
  });

  // Оригинальные значения для отслеживания изменений
  const [originalShiftConfig, setOriginalShiftConfig] = useState<ShiftConfig | null>(null);
  const [originalNotificationConfig, setOriginalNotificationConfig] = useState<NotificationConfig | null>(null);
  const [originalArchiveConfig, setOriginalArchiveConfig] = useState<ArchiveConfig | null>(null);
  const [originalTaskConfig, setOriginalTaskConfig] = useState<TaskConfig | null>(null);
  const [originalMaintenanceMode, setOriginalMaintenanceMode] = useState<boolean | null>(null);
  const [calendarHasPendingChanges, setCalendarHasPendingChanges] = useState(false);

  // Data fetching
  const { data: shiftConfigData, isLoading: shiftConfigLoading } = useShiftConfig(selectedDealershipId);
  const { data: notificationConfigData, isLoading: notificationConfigLoading } = useNotificationConfig(selectedDealershipId);
  const { data: archiveConfigData, isLoading: archiveConfigLoading } = useArchiveConfig(selectedDealershipId);
  const { data: taskConfigData, isLoading: taskConfigLoading } = useTaskConfig(selectedDealershipId);
  const { data: config } = useDealershipSettings(selectedDealershipId || 0);
  const { data: maintenanceModeData, isLoading: maintenanceModeLoading } = useSetting('maintenance_mode');
  const { data: globalTimezoneData, isLoading: globalTimezoneLoading } = useSetting('global_timezone');
  const { data: dealershipData, isLoading: dealershipLoading } = useDealership(selectedDealershipId || 0);
  const { data: shiftSchedulesData, isLoading: shiftSchedulesLoading } = useShiftSchedules(selectedDealershipId);
  const createShiftScheduleMutation = useCreateShiftSchedule();
  const updateShiftScheduleMutation = useUpdateShiftSchedule();
  const deleteShiftScheduleMutation = useDeleteShiftSchedule();

  // Timezone state for current dealership
  const [dealershipTimezone, setDealershipTimezone] = useState('+05:00');
  const [originalDealershipTimezone, setOriginalDealershipTimezone] = useState<string | null>(null);

  // Global timezone state (used when no dealership is selected)
  const [globalTimezone, setGlobalTimezone] = useState('+05:00');
  const [originalGlobalTimezone, setOriginalGlobalTimezone] = useState<string | null>(null);

  // Effects to filter data and save original values
  useEffect(() => {
    if (shiftConfigData?.data) {
      const newConfig = { ...shiftConfig, ...shiftConfigData.data };
      setShiftConfig(newConfig);
      setOriginalShiftConfig(newConfig);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shiftConfigData]);

  useEffect(() => {
    if (notificationConfigData?.data) {
      const newConfig = { ...notificationConfig, ...notificationConfigData.data };
      setNotificationConfig(newConfig);
      setOriginalNotificationConfig(newConfig);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notificationConfigData]);

  useEffect(() => {
    if (archiveConfigData?.data) {
      const newConfig = { ...archiveConfig, ...archiveConfigData.data };
      setArchiveConfig(newConfig);
      setOriginalArchiveConfig(newConfig);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [archiveConfigData]);

  useEffect(() => {
    if (maintenanceModeData?.data) {
      const value = maintenanceModeData.data.value === 'true' || maintenanceModeData.data.value === '1';
      setMaintenanceMode(value);
      setOriginalMaintenanceMode(value);
    }
  }, [maintenanceModeData]);

  useEffect(() => {
    if (taskConfigData?.data) {
      const newConfig = { ...taskConfig, ...taskConfigData.data };
      setTaskConfig(newConfig);
      setOriginalTaskConfig(newConfig);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskConfigData]);

  useEffect(() => {
    if (dealershipData?.timezone) {
      setDealershipTimezone(dealershipData.timezone);
      setOriginalDealershipTimezone(dealershipData.timezone);
    }
  }, [dealershipData]);

  useEffect(() => {
    if (globalTimezoneData?.data?.value) {
      setGlobalTimezone(globalTimezoneData.data.value);
      setOriginalGlobalTimezone(globalTimezoneData.data.value);
    }
  }, [globalTimezoneData]);

  // Mutations
  const updateShiftConfigMutation = useUpdateShiftConfig();
  const updateNotificationConfigMutation = useUpdateNotificationConfig();
  const updateArchiveConfigMutation = useUpdateArchiveConfig();
  const updateTaskConfigMutation = useUpdateTaskConfig();
  const updateSettingMutation = useUpdateSetting();
  const updateSettingByKeyMutation = useUpdateSettingByKey();
  const updateDealershipMutation = useUpdateDealership();

  // Определяем наличие несохранённых изменений для текущего таба
  const hasCurrentTabChanges = useMemo(() => {
    switch (activeTab) {
      case 'shifts':
        return originalShiftConfig !== null && JSON.stringify(shiftConfig) !== JSON.stringify(originalShiftConfig);
      case 'interface':
        return themeHasPendingChanges || hasAccentPendingChanges || (originalNotificationConfig !== null && JSON.stringify(notificationConfig) !== JSON.stringify(originalNotificationConfig));
      case 'general':
        return (originalNotificationConfig !== null && JSON.stringify(notificationConfig) !== JSON.stringify(originalNotificationConfig)) ||
               (selectedDealershipId && originalDealershipTimezone !== null && dealershipTimezone !== originalDealershipTimezone) ||
               (!selectedDealershipId && originalGlobalTimezone !== null && globalTimezone !== originalGlobalTimezone);
      case 'notifications':
        return originalNotificationConfig !== null && JSON.stringify(notificationConfig) !== JSON.stringify(originalNotificationConfig);
      case 'tasks':
        return (originalTaskConfig !== null && JSON.stringify(taskConfig) !== JSON.stringify(originalTaskConfig)) ||
               (originalArchiveConfig !== null && JSON.stringify(archiveConfig) !== JSON.stringify(originalArchiveConfig));
      case 'maintenance':
        return originalMaintenanceMode !== null && maintenanceMode !== originalMaintenanceMode;
      case 'calendar':
        return calendarHasPendingChanges;
      default:
        return false;
    }
  }, [activeTab, shiftConfig, originalShiftConfig, notificationConfig, originalNotificationConfig,
      taskConfig, originalTaskConfig, archiveConfig, originalArchiveConfig,
      maintenanceMode, originalMaintenanceMode, calendarHasPendingChanges, themeHasPendingChanges, hasAccentPendingChanges,
      dealershipTimezone, originalDealershipTimezone, globalTimezone, originalGlobalTimezone, selectedDealershipId]);

  // Хук для предупреждения о несохранённых изменениях
  const { confirmLeave, confirmState, handleConfirm, handleCancel } = useUnsavedChanges(hasCurrentTabChanges);

  // Обработчик смены таба с проверкой несохранённых изменений
  const handleTabChange = async (newTab: typeof activeTab) => {
    if (newTab === activeTab) return;

    const canLeave = await confirmLeave();
    if (canLeave) {
      setActiveTab(newTab);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (activeTab === 'shifts') {
      // Save shift times
      updateShiftConfigMutation.mutate({
        ...shiftConfig,
        dealership_id: selectedDealershipId,
      }, {
        onError: () => showToast({ type: 'error', message: 'Ошибка сохранения времени смен' }),
      });

      // Also save notification config (automation settings used in Shifts tab)
      updateNotificationConfigMutation.mutate({
        auto_close_shifts: notificationConfig.auto_close_shifts,
        shift_reminder_minutes: notificationConfig.shift_reminder_minutes,
        dealership_id: selectedDealershipId,
      }, {
        onSuccess: () => showToast({ type: 'success', message: 'Настройки смен и автоматизации сохранены' }),
        onError: () => showToast({ type: 'error', message: 'Ошибка сохранения настроек автоматизации' }),
      });
    } else if (activeTab === 'interface') {
      applyTheme();
      applyAccentColor();
      updateNotificationConfigMutation.mutate({
        rows_per_page: notificationConfig.rows_per_page,
        dealership_id: selectedDealershipId,
      }, {
        onSuccess: () => showToast({ type: 'success', message: 'Настройки сохранены' }),
        onError: () => showToast({ type: 'error', message: 'Ошибка сохранения настроек' }),
      });
    } else if (activeTab === 'tasks') {
      // Save task config (shift requirements, archiving)
      updateTaskConfigMutation.mutate({
        ...taskConfig,
        dealership_id: selectedDealershipId,
      }, {
        onError: () => showToast({ type: 'error', message: 'Ошибка сохранения настроек задач' }),
      });
      // Also save archive config for archive settings
      updateArchiveConfigMutation.mutate({
        ...archiveConfig,
        dealership_id: selectedDealershipId,
      }, {
        onSuccess: () => showToast({ type: 'success', message: 'Настройки задач сохранены' }),
        onError: () => showToast({ type: 'error', message: 'Ошибка сохранения настроек' }),
      });
    } else if (activeTab === 'maintenance') {
      // maintenance_mode через глобальный settings endpoint
      if (maintenanceModeData?.data?.id) {
        updateSettingMutation.mutate({
          id: maintenanceModeData.data.id,
          data: { value: maintenanceMode, type: 'boolean' },
        }, {
          onSuccess: () => showToast({ type: 'success', message: 'Режим обслуживания обновлен' }),
          onError: () => showToast({ type: 'error', message: 'Ошибка сохранения режима обслуживания' }),
        });
      }
    } else if (activeTab === 'notifications') {
      updateNotificationConfigMutation.mutate({
        ...notificationConfig,
        dealership_id: selectedDealershipId,
      }, {
        onSuccess: () => showToast({ type: 'success', message: 'Настройки уведомлений сохранены' }),
        onError: () => showToast({ type: 'error', message: 'Ошибка сохранения настроек' }),
      });
    } else if (activeTab === 'general') {
      // Сохраняем timezone автосалона если он выбран и изменён
      if (selectedDealershipId && dealershipTimezone !== originalDealershipTimezone) {
        updateDealershipMutation.mutate({
          id: selectedDealershipId,
          data: { timezone: dealershipTimezone },
        }, {
          onSuccess: () => {
            setOriginalDealershipTimezone(dealershipTimezone);
            showToast({ type: 'success', message: 'Часовой пояс автосалона сохранён' });
          },
          onError: () => showToast({ type: 'error', message: 'Ошибка сохранения часового пояса' }),
        });
      } else if (!selectedDealershipId && globalTimezone !== originalGlobalTimezone) {
        // Сохраняем глобальный timezone
        updateSettingByKeyMutation.mutate({
          key: 'global_timezone',
          value: globalTimezone,
          type: 'string',
        }, {
          onSuccess: () => {
            setOriginalGlobalTimezone(globalTimezone);
            showToast({ type: 'success', message: 'Глобальный часовой пояс сохранён' });
          },
          onError: () => showToast({ type: 'error', message: 'Ошибка сохранения глобального часового пояса' }),
        });
      } else {
        showToast({ type: 'info', message: 'Нет изменений для сохранения' });
      }
    } else if (activeTab === 'calendar') {
      if (calendarRef.current?.hasPendingChanges()) {
        setCalendarSaving(true);
        calendarRef.current.save()
          .then(() => {
            showToast({ type: 'success', message: 'Календарь сохранён' });
          })
          .catch(() => {
            showToast({ type: 'error', message: 'Ошибка сохранения календаря' });
          })
          .finally(() => {
            setCalendarSaving(false);
          });
      } else {
        showToast({ type: 'info', message: 'Нет изменений для сохранения' });
      }
    } else {
      updateNotificationConfigMutation.mutate({
        ...notificationConfig,
        dealership_id: selectedDealershipId,
      }, {
        onSuccess: () => showToast({ type: 'success', message: 'Настройки сохранены' }),
        onError: () => showToast({ type: 'error', message: 'Ошибка сохранения настроек' }),
      });
    }
  };

  // Tabs definition
  const tabs = [
    { id: 'general', name: 'Общие', icon: CogIcon },
    { id: 'interface', name: 'Интерфейс', icon: ComputerDesktopIcon },
    { id: 'tasks', name: 'Задачи', icon: ClipboardDocumentListIcon },
    { id: 'calendar', name: 'Календарь', icon: CalendarDaysIcon },
    { id: 'shifts', name: 'Смены', icon: ClockIcon },
    { id: 'notifications', name: 'Уведомления', icon: BellIcon },
    { id: 'maintenance', name: 'Обслуживание', icon: WrenchIcon },
  ];

  if (!permissions.canManageSettings) {
    return (
      <PageContainer>
        <ErrorState
          title="Доступ запрещен"
          description="У вас нет прав для просмотра этого раздела."
        />
      </PageContainer>
    );
  }

  const isLoading = shiftConfigLoading || notificationConfigLoading || archiveConfigLoading || taskConfigLoading || maintenanceModeLoading || dealershipLoading || globalTimezoneLoading || shiftSchedulesLoading;
  const isSaving = updateShiftConfigMutation.isPending || updateNotificationConfigMutation.isPending || updateArchiveConfigMutation.isPending || updateTaskConfigMutation.isPending || updateSettingMutation.isPending || updateSettingByKeyMutation.isPending || updateDealershipMutation.isPending || calendarSaving || createShiftScheduleMutation.isPending || updateShiftScheduleMutation.isPending || deleteShiftScheduleMutation.isPending;

  return (
    <PageContainer>
      {/* Header */}
      <PageHeader
        title="Настройки"
        description="Управление параметрами системы, интерфейса и автоматизации"
      />

      {isLoading ? (
        <Card>
          <Card.Body>
            <Skeleton variant="list" count={5} />
          </Card.Body>
        </Card>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden min-h-[600px] flex flex-col md:flex-row">

          {/* Sidebar Navigation */}
          <div className="w-full md:w-64 bg-gray-50 dark:bg-gray-800/50 border-r border-gray-200 dark:border-gray-800 flex-shrink-0">
            <nav className="p-4 space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id as typeof activeTab)}
                  className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all ${activeTab === tab.id
                    ? 'bg-white dark:bg-gray-800 text-accent-600 dark:text-accent-400 shadow-sm ring-1 ring-gray-200 dark:ring-gray-700'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-gray-200'
                    }`}
                >
                  <tab.icon className={`w-5 h-5 mr-3 ${activeTab === tab.id ? 'text-accent-500' : 'text-gray-400 dark:text-gray-500'}`} />
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          {/* Content Area */}
          <div className="flex-1 flex flex-col min-w-0">
            <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
              <div className="flex-1 p-6 md:p-8 overflow-y-auto">

                {/* GENERAL TAB */}
                {activeTab === 'general' && (
                  <div className="space-y-8 max-w-2xl">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Общие настройки</h2>
                      <Card>
                        <Card.Body className="space-y-6">
                          <div>
                            <Select
                              label="Язык системы"
                              disabled
                              options={[{ value: 'ru', label: 'Русский (Default)' }]}
                              value="ru"
                              onChange={() => { }}
                            />
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Смена языка пока недоступна в этой версии.</p>
                          </div>

                          {permissions.canManageDealershipSettings && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Текущая конфигурация</label>
                              <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-xl border border-gray-200 dark:border-gray-600 flex items-center">
                                <div className={`w-2 h-2 rounded-full mr-2 ${selectedDealershipId ? 'bg-green-500' : 'bg-accent-500'}`}></div>
                                <span className="text-sm text-gray-700 dark:text-gray-300">
                                  {selectedDealershipId
                                    ? 'Настройки конкретного дилерского центра'
                                    : 'Глобальные настройки системы'
                                  }
                                </span>
                              </div>
                            </div>
                          )}
                        </Card.Body>
                      </Card>

                      {/* Timezone Setting */}
                      <Card className="mt-6">
                        <Card.Body>
                          <h4 className="font-medium text-gray-900 dark:text-white mb-4">
                            {selectedDealershipId ? 'Часовой пояс автосалона' : 'Глобальный часовой пояс'}
                          </h4>
                          <Select
                            label="Часовой пояс"
                            value={selectedDealershipId ? dealershipTimezone : globalTimezone}
                            onChange={(e) => selectedDealershipId
                              ? setDealershipTimezone(e.target.value)
                              : setGlobalTimezone(e.target.value)
                            }
                            options={TIMEZONES.map(tz => ({ value: tz.value, label: tz.label }))}
                            disabled={selectedDealershipId ? dealershipLoading : globalTimezoneLoading}
                          />
                          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                            {selectedDealershipId
                              ? 'Используется для определения выходных дней в календаре этого автосалона.'
                              : 'Глобальный часовой пояс по умолчанию. Применяется к автосалонам без собственного часового пояса.'
                            }
                          </p>
                        </Card.Body>
                      </Card>
                    </div>
                  </div>
                )}

                {/* INTERFACE TAB */}
                {activeTab === 'interface' && (
                  <div className="space-y-8 max-w-2xl">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Интерфейс и Отображение</h2>

                      <div className="space-y-6">
                        {/* Theme */}
                        <Card>
                          <Card.Body>
                            <div className="flex items-start">
                              <SwatchIcon className="w-6 h-6 text-purple-500 mr-4 mt-1" />
                              <div className="w-full">
                                <label className="block text-base font-medium text-gray-900 dark:text-white mb-1">Тема оформления</label>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Выберите цветовую схему приложения</p>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                  {[
                                    { value: 'light', label: 'Светлая', icon: SunIcon },
                                    { value: 'dark', label: 'Темная', icon: MoonIcon },
                                    { value: 'system', label: 'Системная', icon: ComputerDesktopIcon },
                                  ].map((themeOption) => (
                                    <button
                                      key={themeOption.value}
                                      type="button"
                                      onClick={() => setTheme(themeOption.value as 'light' | 'dark' | 'system')}
                                      className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border font-medium transition-all ${pendingTheme === themeOption.value
                                        ? 'bg-accent-50 border-accent-500 text-accent-700 dark:bg-gray-700 dark:border-accent-500 dark:text-accent-400'
                                        : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-750'
                                        }`}
                                    >
                                      <themeOption.icon className="w-5 h-5" />
                                      <span>{themeOption.label}</span>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </Card.Body>
                        </Card>

                        {/* Accent Color */}
                        <Card>
                          <Card.Body>
                            <div className="flex items-start">
                              <SwatchIcon className="w-6 h-6 text-accent-500 mr-4 mt-1" />
                              <div className="w-full">
                                <label className="block text-base font-medium text-gray-900 dark:text-white mb-1">Акцентный цвет</label>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Выберите основной цвет интерфейса</p>

                                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                                  {ACCENT_COLOR_OPTIONS.map((option) => (
                                    <button
                                      key={option.value}
                                      type="button"
                                      onClick={() => setAccentColor(option.value)}
                                      className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${
                                        pendingAccentColor === option.value
                                          ? 'border-accent-500 ring-2 ring-accent-500/20 bg-accent-50 dark:bg-gray-700'
                                          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:bg-gray-750'
                                      }`}
                                    >
                                      <div className={`w-8 h-8 rounded-full ${option.colorClass}`} />
                                      <span className={`text-sm font-medium ${
                                        pendingAccentColor === option.value
                                          ? 'text-accent-700 dark:text-accent-400'
                                          : 'text-gray-700 dark:text-gray-300'
                                      }`}>
                                        {option.label}
                                      </span>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </Card.Body>
                        </Card>

                        {/* Pagination */}
                        <Card>
                          <Card.Body>
                            <div className="flex items-start">
                              <ClipboardDocumentListIcon className="w-6 h-6 text-accent-500 mr-4 mt-1" />
                              <div className="flex-1">
                                <label className="block text-base font-medium text-gray-900 dark:text-white mb-1">Пагинация (Строк на странице)</label>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                                  Количество элементов, отображаемых в таблицах.
                                </p>

                                <div className="flex items-center gap-4">
                                  <input
                                    type="range"
                                    min="5"
                                    max="100"
                                    step="5"
                                    value={notificationConfig.rows_per_page || 10}
                                    onChange={(e) => setNotificationConfig({ ...notificationConfig, rows_per_page: parseInt(e.target.value) })}
                                    className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-xl appearance-none cursor-pointer"
                                  />
                                  <div className="w-16 h-10 flex items-center justify-center border border-gray-300 dark:border-gray-600 rounded-xl font-mono font-bold text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-700">
                                    {notificationConfig.rows_per_page || 10}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </Card.Body>
                        </Card>
                      </div>
                    </div>
                  </div>
                )}

                {/* TASKS TAB */}
                {activeTab === 'tasks' && (
                  <div className="space-y-8 max-w-2xl">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Настройки Задач</h2>

                      <div className="space-y-6">
                        {/* Shift Requirements */}
                        <Card>
                          <Card.Body>
                            <h4 className="font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                              <ClockIcon className="w-5 h-5 text-accent-500" />
                              Связь со сменами
                            </h4>
                            <Checkbox
                              checked={taskConfig.task_requires_open_shift || false}
                              onChange={(e) => setTaskConfig({
                                ...taskConfig,
                                task_requires_open_shift: e.target.checked
                              })}
                              label="Требовать открытую смену для выполнения задач"
                            />
                            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 ml-7">
                              Если включено, сотрудники смогут выполнять задачи только при активной смене.
                              Менеджеры и владельцы могут закрывать задачи без ограничений.
                            </p>

                            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Задержка архивации
                              </label>
                              <div className="flex items-center gap-3">
                                <Input
                                  type="number"
                                  min={1}
                                  max={48}
                                  value={taskConfig.archive_overdue_hours_after_shift || 2}
                                  onChange={(e) => setTaskConfig({
                                    ...taskConfig,
                                    archive_overdue_hours_after_shift: parseInt(e.target.value) || 2
                                  })}
                                  className="w-20"
                                />
                                <span className="text-gray-500 dark:text-gray-400 text-sm">часов после закрытия смены</span>
                              </div>
                              <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
                                Просроченные задачи будут автоматически архивированы через указанное время после закрытия смены.
                              </p>
                            </div>
                          </Card.Body>
                        </Card>

                        <Card>
                          <Card.Body>
                            <h4 className="font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                              <CheckCircleIcon className="w-5 h-5 text-green-500" />
                              Архивация выполненных задач
                            </h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                              Выполненные задачи будут автоматически переноситься в архив <strong>ежедневно</strong> в указанное время.
                            </p>
                            <div className="flex items-center gap-4">
                              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Время запуска:</label>
                              <Input
                                type="time"
                                value={archiveConfig.archive_completed_time || '03:00'}
                                onChange={(e) => setArchiveConfig({
                                  ...archiveConfig,
                                  archive_completed_time: e.target.value
                                })}
                                className="w-32"
                              />
                            </div>
                          </Card.Body>
                        </Card>
                      </div>
                    </div>
                  </div>
                )}

                {/* CALENDAR TAB */}
                {activeTab === 'calendar' && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Календарь выходных дней</h2>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                        Управляйте выходными днями для генераторов задач. В дни, отмеченные как выходные,
                        задачи создаваться не будут.
                      </p>
                      <YearCalendar
                        ref={calendarRef}
                        year={selectedCalendarYear}
                        dealershipId={selectedDealershipId}
                        onYearChange={setSelectedCalendarYear}
                        onPendingChange={setCalendarHasPendingChanges}
                      />
                    </div>
                  </div>
                )}

                {/* SHIFTS TAB */}
                {activeTab === 'shifts' && (
                  <div className="space-y-8 max-w-3xl">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-white">График и Смены</h2>
                      {selectedDealershipId && (
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${config?.inherited_fields && config.inherited_fields.length > 0
                          ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'
                          : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                          }`}>
                          {config?.inherited_fields && config.inherited_fields.length > 0
                            ? 'Смешанные настройки'
                            : 'Настройки дилера'
                          }
                        </span>
                      )}
                    </div>

                    {/* Shift Schedules */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-gray-900 dark:text-white">Расписание смен</h4>
                        {selectedDealershipId && (
                          <Button
                            type="button"
                            size="sm"
                            variant="primary"
                            onClick={() => setShowAddSchedule(!showAddSchedule)}
                          >
                            {showAddSchedule ? 'Отмена' : '+ Добавить смену'}
                          </Button>
                        )}
                      </div>

                      {!selectedDealershipId && (
                        <EmptyState
                          title="Выберите автосалон"
                          description="Для управления расписанием смен выберите автосалон в навбаре"
                        />
                      )}

                      {/* Add new schedule form */}
                      {showAddSchedule && selectedDealershipId && (
                        <Card>
                          <Card.Body>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                              <Input
                                label="Название"
                                placeholder="Утренняя"
                                value={newScheduleName}
                                onChange={(e) => setNewScheduleName(e.target.value)}
                              />
                              <Input
                                type="time"
                                label="Начало"
                                value={newScheduleStart}
                                onChange={(e) => setNewScheduleStart(e.target.value)}
                              />
                              <Input
                                type="time"
                                label="Конец"
                                value={newScheduleEnd}
                                onChange={(e) => setNewScheduleEnd(e.target.value)}
                              />
                              <Button
                                type="button"
                                variant="primary"
                                disabled={!newScheduleName.trim() || createShiftScheduleMutation.isPending}
                                onClick={() => {
                                  createShiftScheduleMutation.mutate({
                                    dealership_id: selectedDealershipId,
                                    name: newScheduleName.trim(),
                                    start_time: newScheduleStart,
                                    end_time: newScheduleEnd,
                                  }, {
                                    onSuccess: () => {
                                      setNewScheduleName('');
                                      setNewScheduleStart('09:00');
                                      setNewScheduleEnd('18:00');
                                      setShowAddSchedule(false);
                                      showToast({ type: 'success', message: 'Смена создана' });
                                    },
                                    onError: (error: any) => {
                                      showToast({ type: 'error', message: error?.response?.data?.message || 'Ошибка создания смены' });
                                    },
                                  });
                                }}
                              >
                                Создать
                              </Button>
                            </div>
                          </Card.Body>
                        </Card>
                      )}

                      {/* Existing schedules */}
                      {selectedDealershipId && (shiftSchedulesLoading ? (
                        <Skeleton variant="list" count={2} />
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {(shiftSchedulesData?.data || []).map((schedule, index) => (
                            <Card key={schedule.id}>
                              <Card.Body>
                                <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100 dark:border-gray-700">
                                  <h4 className="font-medium text-gray-900 dark:text-white flex items-center">
                                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs mr-2 ${
                                      index % 2 === 0
                                        ? 'bg-accent-100 dark:bg-accent-900/50 text-accent-600 dark:text-accent-300'
                                        : 'bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-300'
                                    }`}>
                                      {index + 1}
                                    </span>
                                    {schedule.name}
                                    {schedule.is_night_shift && (
                                      <MoonIcon className="w-4 h-4 ml-1 text-indigo-400" title="Ночная смена" />
                                    )}
                                  </h4>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    className="text-red-500 hover:text-red-700"
                                    disabled={deleteShiftScheduleMutation.isPending}
                                    onClick={() => {
                                      deleteShiftScheduleMutation.mutate(schedule.id, {
                                        onSuccess: () => showToast({ type: 'success', message: 'Смена удалена' }),
                                        onError: (error: any) => showToast({ type: 'error', message: error?.response?.data?.message || 'Ошибка удаления' }),
                                      });
                                    }}
                                  >
                                    Удалить
                                  </Button>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <Input
                                    type="time"
                                    label="Начало"
                                    value={schedule.start_time?.substring(0, 5) || ''}
                                    onChange={(e) => {
                                      updateShiftScheduleMutation.mutate({
                                        id: schedule.id,
                                        data: { start_time: e.target.value },
                                      }, {
                                        onError: (error: any) => showToast({ type: 'error', message: error?.response?.data?.message || 'Ошибка обновления' }),
                                      });
                                    }}
                                  />
                                  <Input
                                    type="time"
                                    label="Конец"
                                    value={schedule.end_time?.substring(0, 5) || ''}
                                    onChange={(e) => {
                                      updateShiftScheduleMutation.mutate({
                                        id: schedule.id,
                                        data: { end_time: e.target.value },
                                      }, {
                                        onError: (error: any) => showToast({ type: 'error', message: error?.response?.data?.message || 'Ошибка обновления' }),
                                      });
                                    }}
                                  />
                                </div>
                              </Card.Body>
                            </Card>
                          ))}
                          {selectedDealershipId && (shiftSchedulesData?.data || []).length === 0 && (
                            <p className="col-span-2 text-center text-gray-500 dark:text-gray-400 py-8">
                              Нет настроенных смен. Нажмите «Добавить смену» для создания.
                            </p>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Tolerance */}
                      <Card>
                        <Card.Body>
                          <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">Допустимое опоздание</label>
                          <div className="flex items-center gap-3">
                            <Input
                              type="number"
                              min={0}
                              value={shiftConfig.late_tolerance_minutes || 0}
                              onChange={(e) => setShiftConfig({ ...shiftConfig, late_tolerance_minutes: parseInt(e.target.value) || 0 })}
                              className="w-24"
                            />
                            <span className="text-gray-500 dark:text-gray-400 text-sm">минут</span>
                          </div>
                          <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">Сотрудники могут опоздать на это время без штрафа</p>
                        </Card.Body>
                      </Card>
                    </div>

                    {/* Shift Automation */}
                    <div className="mt-6 border-t border-gray-100 dark:border-gray-800 pt-6">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-4">Автоматизация смен</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card>
                          <Card.Body>
                            <Checkbox
                              checked={notificationConfig.auto_close_shifts || false}
                              onChange={(e) => setNotificationConfig({ ...notificationConfig, auto_close_shifts: e.target.checked })}
                              label="Авто-закрытие смен"
                            />
                            <p className="mt-2 text-xs text-gray-500 ml-7">
                              Автоматически закрывать смены в конце рабочего дня, если сотрудник забыл это сделать.
                            </p>
                          </Card.Body>
                        </Card>

                        <Card>
                          <Card.Body>
                            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">Напоминание о начале смены</label>
                            <div className="flex items-center gap-3">
                              <Input
                                type="number"
                                min={0}
                                max={120}
                                value={notificationConfig.shift_reminder_minutes || 15}
                                onChange={(e) => setNotificationConfig({ ...notificationConfig, shift_reminder_minutes: parseInt(e.target.value) || 0 })}
                                className="w-24"
                              />
                              <span className="text-gray-500 dark:text-gray-400 text-sm">минут до начала</span>
                            </div>
                            <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">Система отправит уведомление сотруднику перед началом смены.</p>
                          </Card.Body>
                        </Card>
                      </div>
                    </div>
                  </div>
                )}

                {/* NOTIFICATIONS TAB */}
                {activeTab === 'notifications' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Центр уведомлений</h2>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowDetailedNotifications(!showDetailedNotifications)}
                      >
                        {showDetailedNotifications ? 'Скрыть детали' : 'Расширенные настройки'}
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      <Card>
                        <Card.Body>
                          <Checkbox
                            checked={notificationConfig.notification_enabled || false}
                            onChange={(e) => setNotificationConfig({ ...notificationConfig, notification_enabled: e.target.checked })}
                            label={<span className="font-medium">Включить уведомления</span>}
                          />
                          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 ml-7">
                            Полное отключение/включение всех уведомлений системы. Если выключено, никакие сообщения отправляться не будут.
                          </p>
                        </Card.Body>
                      </Card>

                      {notificationConfig.notification_enabled && (
                        <>
                          <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-2 mb-2">Типы уведомлений</div>
                          {[
                            { key: 'task_overdue', label: 'Просроченные задачи', desc: 'Задачи, срок которых истек' },
                            { key: 'shift_late', label: 'Опоздания', desc: 'Сотрудник не открыл смену вовремя' },
                            { key: 'task_completed', label: 'Завершение задач', desc: 'Сотрудник выполнил задачу' },
                            { key: 'system_errors', label: 'Системные ошибки', desc: 'Сбои в работе оборудования или API' },
                          ].map((item) => (
                            <Card key={item.key} className="hover:border-accent-300 dark:hover:border-accent-500 transition-colors cursor-pointer">
                              <Card.Body>
                                <div className="flex items-center justify-between">
                                  <div>
                                    <div className="font-medium text-gray-900 dark:text-white">{item.label}</div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400">{item.desc}</div>
                                  </div>
                                  <Checkbox
                                    checked={notificationConfig.notification_types?.[item.key as keyof typeof notificationConfig.notification_types] || false}
                                    onChange={(e) => setNotificationConfig({
                                      ...notificationConfig,
                                      notification_types: {
                                        ...notificationConfig.notification_types,
                                        [item.key]: e.target.checked
                                      }
                                    })}
                                  />
                                </div>
                              </Card.Body>
                            </Card>
                          ))}
                        </>
                      )}
                    </div>

                    {showDetailedNotifications && (
                      <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                        <NotificationSettingsContent dealershipId={selectedDealershipId} />
                      </div>
                    )}
                  </div>
                )}

                {/* MAINTENANCE TAB */}
                {activeTab === 'maintenance' && (
                  <div className="space-y-8 max-w-2xl">
                    <div>
                      <div className="flex items-center gap-3 mb-4">
                        <h2 className="text-xl font-semibold text-red-700 dark:text-red-400">Опасная зона</h2>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-accent-100 dark:bg-gray-700 text-accent-800 dark:text-accent-300 border border-accent-200 dark:border-gray-600">
                          Глобально
                        </span>
                      </div>

                      {/* Информационное сообщение */}
                      <div className="mb-6 bg-accent-50 dark:bg-gray-700/50 border border-accent-200 dark:border-gray-600 rounded-xl p-4">
                        <p className="text-sm text-accent-800 dark:text-accent-300">
                          <strong>Внимание:</strong> Все настройки на этой странице применяются глобально ко всей системе,
                          независимо от выбранного дилерского центра.
                        </p>
                      </div>

                      <div className="space-y-4">
                        <div className="bg-red-50 dark:bg-red-900/10 p-6 rounded-xl border border-red-100 dark:border-red-900/30">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <h4 className="font-medium text-red-900 dark:text-red-300 flex items-center gap-2">
                                Режим обслуживания
                                <span className="text-xs px-2 py-0.5 rounded bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-200">
                                  Только для владельцев
                                </span>
                              </h4>
                              <p className="text-sm text-red-700 dark:text-red-400 mt-2">
                                При активации доступ к системе будет заблокирован для всех пользователей, кроме владельцев (роль "owner").
                              </p>
                            </div>
                            <WrenchIcon className="w-8 h-8 text-red-200 dark:text-red-800 flex-shrink-0 ml-4" />
                          </div>
                          <div className="border-t border-red-200 dark:border-red-800 pt-4">
                            <Checkbox
                              checked={maintenanceMode}
                              onChange={(e) => setMaintenanceMode(e.target.checked)}
                              label={
                                <span className="font-medium">
                                  {maintenanceMode
                                    ? '✓ Режим обслуживания активен'
                                    : 'Активировать режим обслуживания'
                                  }
                                </span>
                              }
                            />
                            {maintenanceMode && (
                              <p className="mt-2 ml-7 text-xs text-red-600 dark:text-red-400">
                                ⚠ Система сейчас в режиме обслуживания! Обычные пользователи не могут войти.
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              </div>

              {/* Sticky Footer */}
              <div className="sticky bottom-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 p-4 md:px-8 flex items-center justify-between z-10 transition-colors duration-200">
                <div className="text-xs text-gray-400 hidden sm:block">
                  Изменения вступают в силу немедленно после сохранения
                </div>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={isSaving}
                  icon={isSaving ? <ArrowPathIcon className="animate-spin" /> : <CheckCircleIcon />}
                  className="w-full sm:w-auto shadow-lg shadow-blue-200 dark:shadow-blue-900/20"
                >
                  {isSaving ? 'Сохранение...' : 'Сохранить изменения'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Диалог подтверждения для несохранённых изменений */}
      <ConfirmDialog
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        confirmText={confirmState.confirmText}
        cancelText={confirmState.cancelText}
        variant={confirmState.variant}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </PageContainer>
  );
};
