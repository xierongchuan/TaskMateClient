import React, { useState } from 'react';
import { ChevronDownIcon, ChevronUpIcon, ClockIcon, BellIcon } from '@heroicons/react/24/outline';

interface NotificationChannel {
  key: string;
  label: string;
  description: string;
  hasOffset: boolean;
  defaultOffset?: number;
}

const NOTIFICATION_CHANNELS: NotificationChannel[] = [
  {
    key: 'task_assigned',
    label: 'Назначение задачи',
    description: 'Уведомление при появлении задачи (по дате появления)',
    hasOffset: false,
  },
  {
    key: 'task_deadline_30min',
    label: 'Предупреждение до дедлайна',
    description: 'Напоминание за X минут до дедлайна',
    hasOffset: true,
    defaultOffset: 30,
  },
  {
    key: 'task_overdue',
    label: 'Просрочка задачи',
    description: 'Уведомление в момент дедлайна',
    hasOffset: false,
  },
  {
    key: 'task_hour_late',
    label: 'Просрочка через время',
    description: 'Уведомление через X минут после дедлайна',
    hasOffset: true,
    defaultOffset: 60,
  },
];

interface TaskNotificationSettingsProps {
  value?: Record<string, { enabled?: boolean; offset?: number }>;
  onChange: (settings: Record<string, { enabled?: boolean; offset?: number }>) => void;
}

export const TaskNotificationSettings: React.FC<TaskNotificationSettingsProps> = ({ value = {}, onChange }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [useCustomSettings, setUseCustomSettings] = useState(() => {
    // Auto-expand if there are custom settings
    return Object.keys(value).length > 0;
  });

  // Sync state when external value changes (e.g. form reset)
  React.useEffect(() => {
    if (Object.keys(value).length > 0) {
      setUseCustomSettings(true);
      // Optional: Auto-expand if we want to show the settings immediately
      // setIsExpanded(true);
    }
  }, [value]);

  const handleToggleCustomSettings = () => {
    if (!useCustomSettings) {
      setUseCustomSettings(true);
      setIsExpanded(true);
    } else {
      setUseCustomSettings(false);
      setIsExpanded(false);
      onChange({});
    }
  };

  const handleChannelToggle = (channelKey: string, enabled: boolean) => {
    const newSettings = { ...value };

    if (enabled) {
      // Enable channel - preserve offset if it exists
      newSettings[channelKey] = {
        enabled: true,
        offset: newSettings[channelKey]?.offset,
      };
    } else {
      // Disable channel
      newSettings[channelKey] = {
        ...newSettings[channelKey],
        enabled: false,
      };
    }

    onChange(newSettings);
  };

  const handleOffsetChange = (channelKey: string, offset: number) => {
    const newSettings = { ...value };
    newSettings[channelKey] = {
      ...newSettings[channelKey],
      offset: offset,
    };
    onChange(newSettings);
  };

  const hasActiveOverrides = Object.keys(value).length > 0 && Object.values(value).some(v => v.enabled !== undefined);

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden transition-colors">
      {/* Header */}
      <div
        className={`px-4 py-3 bg-gray-50 dark:bg-gray-800 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${hasActiveOverrides ? 'border-l-4 border-l-indigo-500' : ''
          }`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BellIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <h4 className="text-sm font-medium text-gray-900 dark:text-white">
              Расширенные настройки уведомлений
            </h4>
            {hasActiveOverrides && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-accent-100 dark:bg-accent-900 text-accent-800 dark:text-accent-200">
                Активны
              </span>
            )}
          </div>
          {isExpanded ? (
            <ChevronUpIcon className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDownIcon className="w-5 h-5 text-gray-400" />
          )}
        </div>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Переопределить настройки уведомлений для этой конкретной задачи
        </p>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="px-4 py-4 space-y-4 bg-white dark:bg-gray-800">
          {/* Toggle for custom settings */}
          <div className="flex items-center justify-between p-3 bg-accent-50 dark:bg-gray-700/50 rounded-md transition-colors">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Использовать индивидуальные настройки</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Переопределить настройки автосалона для этой задачи
              </p>
            </div>
            <button
              type="button"
              onClick={handleToggleCustomSettings}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-accent-600 focus:ring-offset-2 ${useCustomSettings ? 'bg-accent-600' : 'bg-gray-200 dark:bg-gray-600'
                }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${useCustomSettings ? 'translate-x-5' : 'translate-x-0'
                  }`}
              />
            </button>
          </div>

          {/* Channels */}
          {useCustomSettings && (
            <div className="space-y-3">
              {NOTIFICATION_CHANNELS.map((channel) => {
                const channelSettings = value[channel.key] || {};
                const isEnabled = channelSettings.enabled !== undefined ? channelSettings.enabled : false;
                const offset = channelSettings.offset || channel.defaultOffset || 30;

                return (
                  <div
                    key={channel.key}
                    className="p-3 border border-gray-200 dark:border-gray-700 rounded-md hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`notify-${channel.key}`}
                            checked={isEnabled}
                            onChange={(e) => handleChannelToggle(channel.key, e.target.checked)}
                            className="h-4 w-4 rounded border-gray-200 dark:border-gray-600 text-accent-600 focus:ring-accent-500 focus:ring-offset-0 bg-white dark:bg-gray-700 transition-colors"
                          />
                          <label htmlFor={`notify-${channel.key}`} className="text-sm font-medium text-gray-900 dark:text-gray-200">
                            {channel.label}
                          </label>
                        </div>
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 ml-6">{channel.description}</p>

                        {/* Offset input */}
                        {channel.hasOffset && isEnabled && (
                          <div className="mt-2 ml-6 flex items-center space-x-2">
                            <ClockIcon className="w-4 h-4 text-gray-400" />
                            <input
                              type="number"
                              min="1"
                              max="1440"
                              value={offset}
                              onChange={(e) => handleOffsetChange(channel.key, parseInt(e.target.value) || 30)}
                              className="unified-input w-20 px-2 py-1 text-sm border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:border-accent-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200"
                            />
                            <span className="text-xs text-gray-500 dark:text-gray-400">минут</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-900/50 rounded-md">
                <p className="text-xs text-yellow-800 dark:text-yellow-200">
                  💡 <strong>Совет:</strong> Снимите галочку, чтобы отключить канал уведомлений для этой задачи.
                  Если канал не отмечен, будут использованы настройки автосалона.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
