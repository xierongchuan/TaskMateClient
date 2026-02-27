import React from 'react';

interface RoleSelectorProps {
  value: string[];
  onChange: (roles: string[]) => void;
  disabled?: boolean;
}

const AVAILABLE_ROLES = [
  {
    value: 'employee',
    label: 'Сотрудники',
    lightBg: 'bg-accent-100',
    lightText: 'text-accent-800',
    darkBg: 'dark:bg-gray-700',
    darkText: 'dark:text-accent-300',
    ring: 'ring-accent-500',
  },
  {
    value: 'manager',
    label: 'Менеджеры',
    lightBg: 'bg-purple-100',
    lightText: 'text-purple-800',
    darkBg: 'dark:bg-purple-900/40',
    darkText: 'dark:text-purple-300',
    ring: 'ring-purple-500',
  },
  {
    value: 'owner',
    label: 'Владельцы',
    lightBg: 'bg-indigo-100',
    lightText: 'text-indigo-800',
    darkBg: 'dark:bg-indigo-900/40',
    darkText: 'dark:text-indigo-300',
    ring: 'ring-indigo-500',
  },
  {
    value: 'observer',
    label: 'Наблюдатели',
    lightBg: 'bg-gray-100',
    lightText: 'text-gray-800',
    darkBg: 'dark:bg-gray-700',
    darkText: 'dark:text-gray-300',
    ring: 'ring-gray-500',
  },
];

export const RoleSelector: React.FC<RoleSelectorProps> = ({ value = [], onChange, disabled = false }) => {
  const handleToggle = (roleValue: string) => {
    if (disabled) return;

    if (value.includes(roleValue)) {
      onChange(value.filter(r => r !== roleValue));
    } else {
      onChange([...value, roleValue]);
    }
  };

  const handleSelectAll = () => {
    if (disabled) return;
    onChange(AVAILABLE_ROLES.map(r => r.value));
  };

  const handleClearAll = () => {
    if (disabled) return;
    onChange([]);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Получатели уведомлений:</p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleSelectAll}
            disabled={disabled || value.length === AVAILABLE_ROLES.length}
            className="text-xs font-medium text-accent-600 dark:text-accent-400 hover:text-accent-800 dark:hover:text-accent-300 disabled:text-gray-400 dark:disabled:text-gray-600 disabled:cursor-not-allowed transition-colors"
          >
            Выбрать все
          </button>
          <span className="text-gray-300 dark:text-gray-600">|</span>
          <button
            type="button"
            onClick={handleClearAll}
            disabled={disabled || value.length === 0}
            className="text-xs font-medium text-accent-600 dark:text-accent-400 hover:text-accent-800 dark:hover:text-accent-300 disabled:text-gray-400 dark:disabled:text-gray-600 disabled:cursor-not-allowed transition-colors"
          >
            Сбросить
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {AVAILABLE_ROLES.map((role) => {
          const isSelected = value.includes(role.value);
          return (
            <button
              key={role.value}
              type="button"
              onClick={() => handleToggle(role.value)}
              disabled={disabled}
              className={`
                px-3 py-1.5 rounded-full text-xs font-medium transition-all
                ${isSelected
                  ? `${role.lightBg} ${role.lightText} ${role.darkBg} ${role.darkText} ring-2 ring-offset-2 dark:ring-offset-gray-800 ${role.ring}`
                  : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:border-accent-400 dark:hover:border-accent-500 hover:bg-gray-50 dark:hover:bg-gray-600'
                }
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
            >
              {role.label}
            </button>
          );
        })}
      </div>

      {value.length === 0 && !disabled && (
        <p className="text-xs text-amber-600 dark:text-amber-400">
          ⚠️ Без выбора ролей уведомления получат все пользователи
        </p>
      )}
    </div>
  );
};
