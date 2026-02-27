import React from 'react';
import type { User } from '../../types/user';
import { getRoleLabel } from '../../utils/roleTranslations';

interface UserCheckboxListProps {
  users: User[];
  selectedIds: number[];
  onToggle: (userId: number) => void;
  isLoading?: boolean;
  noDealership?: boolean;
  emptyMessage?: string;
  loadingMessage?: string;
  noDealershipMessage?: string;
  label?: string;
  showCount?: boolean;
  required?: boolean;
  maxHeight?: string;
}

/**
 * Унифицированный компонент для выбора пользователей с чекбоксами.
 * Используется в TaskModal, TaskGeneratorModal и других местах для выбора исполнителей.
 *
 * @example
 * <UserCheckboxList
 *   users={users}
 *   selectedIds={selectedUserIds}
 *   onToggle={(userId) => handleUserToggle(userId)}
 *   isLoading={isLoadingUsers}
 *   noDealership={!dealershipId}
 *   label="Исполнители"
 *   showCount
 *   required
 * />
 */
export const UserCheckboxList: React.FC<UserCheckboxListProps> = ({
  users,
  selectedIds,
  onToggle,
  isLoading = false,
  noDealership = false,
  emptyMessage = 'Нет сотрудников',
  loadingMessage = 'Загрузка сотрудников...',
  noDealershipMessage = 'Сначала выберите автосалон',
  label = 'Исполнители',
  showCount = false,
  required = false,
  maxHeight = 'max-h-40',
}) => {
  const renderLabel = () => {
    if (!label) return null;

    return (
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {label}
        {required && ' *'}
        {showCount && ` (${selectedIds.length} выбрано)`}
      </label>
    );
  };

  const renderContent = () => {
    if (noDealership) {
      return (
        <p className="text-sm text-gray-500 dark:text-gray-400 p-2 text-center">
          {noDealershipMessage}
        </p>
      );
    }

    if (isLoading) {
      return (
        <p className="text-sm text-gray-500 dark:text-gray-400 p-2 text-center">
          {loadingMessage}
        </p>
      );
    }

    if (users.length === 0) {
      return (
        <p className="text-sm text-gray-500 dark:text-gray-400 p-2 text-center">
          {emptyMessage}
        </p>
      );
    }

    return users.map((user) => (
      <label
        key={user.id}
        className="flex items-center p-2 hover:bg-gray-50 dark:hover:bg-gray-600 rounded cursor-pointer"
      >
        <input
          type="checkbox"
          checked={selectedIds.includes(user.id)}
          onChange={() => onToggle(user.id)}
          className="h-4 w-4 text-accent-600 focus:ring-accent-500 border-gray-300 dark:border-gray-600 dark:bg-gray-800 rounded"
        />
        <span className="ml-2 text-sm text-gray-900 dark:text-white">
          {user.full_name}
        </span>
        <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
          ({getRoleLabel(user.role)})
        </span>
      </label>
    ));
  };

  return (
    <div>
      {renderLabel()}
      <div className={`border border-gray-300 dark:border-gray-600 rounded-lg ${maxHeight} overflow-y-auto p-2 bg-white dark:bg-gray-700`}>
        {renderContent()}
      </div>
    </div>
  );
};
