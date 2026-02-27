import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { usersApi } from '../../api/users';

console.log('[UserSelector] Module loaded at', new Date().toISOString());

interface UserSelectorProps {
  dealershipId?: number | null;
  value?: number | null;
  onChange: (userId: number | null) => void;
  placeholder?: string;
  orphanPlaceholder?: string;
  className?: string;
  disabled?: boolean;
  showAllOption?: boolean;
  allOptionLabel?: string;
}

/**
 * Компонент выбора сотрудника.
 *
 * - Если dealershipId указан - показывает пользователей этого автосалона
 * - Если dealershipId === null - показывает "orphan" пользователей (без привязки к автосалону)
 */
export const UserSelector: React.FC<UserSelectorProps> = ({
  dealershipId,
  value,
  onChange,
  placeholder = "Выберите сотрудника",
  orphanPlaceholder = "Пользователи без автосалона",
  className = "",
  disabled = false,
  showAllOption = false,
  allOptionLabel = "Все сотрудники",
}) => {
  // Debug log
  console.log('[UserSelector] Render with dealershipId:', dealershipId, 'type:', typeof dealershipId);

  const { data: usersData, isLoading, error, isFetching } = useQuery({
    queryKey: ['user-selector-users', dealershipId],
    queryFn: async () => {
      // Вычисляем параметры прямо здесь
      const params: { per_page: number; dealership_id?: number; orphan_only?: boolean } = {
        per_page: 100,
      };

      if (dealershipId === null) {
        params.orphan_only = true;
      } else if (dealershipId !== undefined && dealershipId !== null) {
        params.dealership_id = dealershipId;
      }

      console.log('[UserSelector] Fetching users with params:', params);
      const result = await usersApi.getUsers(params);
      console.log('[UserSelector] API response:', result);
      return result;
    },
    staleTime: 1000 * 60,
  });

  // Debug logs
  console.log('[UserSelector] Query state - isLoading:', isLoading, 'isFetching:', isFetching, 'error:', error);
  console.log('[UserSelector] Users count:', usersData?.data?.length ?? 0);

  const users = usersData?.data || [];

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = e.target.value;
    if (newValue === "") {
      onChange(null);
    } else {
      onChange(parseInt(newValue));
    }
  };

  // Определяем placeholder в зависимости от режима
  const currentPlaceholder = dealershipId === null
    ? orphanPlaceholder
    : placeholder;

  // Показать ошибку если есть
  if (error) {
    console.error('[UserSelector] Error:', error);
    return (
      <select disabled className={`block w-full rounded-md border-red-300 text-red-500 ${className}`}>
        <option value="">Ошибка загрузки</option>
      </select>
    );
  }

  return (
    <select
      value={value || ""}
      onChange={handleChange}
      disabled={disabled || isLoading}
      className={`unified-input block w-full rounded-xl border-gray-200 dark:border-gray-600 shadow-sm focus:outline-none focus:border-accent-500 sm:text-sm px-3 py-2 border disabled:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200 ${className}`}
    >
      {isLoading ? (
        <option value="">Загрузка...</option>
      ) : (
        <>
          {showAllOption ? (
            <option value="">{allOptionLabel}</option>
          ) : (
            <option value="">{currentPlaceholder}</option>
          )}
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.full_name}
            </option>
          ))}
        </>
      )}
    </select>
  );
};
