import React from 'react';
import type { Dealership } from '../../types/dealership';

interface DealershipCheckboxListProps {
  dealerships: Dealership[];
  selectedIds: number[];
  onToggle: (dealershipId: number) => void;
  isLoading?: boolean;
  emptyMessage?: string;
  loadingMessage?: string;
  label?: string;
  showCount?: boolean;
  description?: string;
  maxHeight?: string;
}

/**
 * Унифицированный компонент для выбора автосалонов с чекбоксами.
 * Используется в UserModal для выбора салонов для менеджеров.
 *
 * @example
 * <DealershipCheckboxList
 *   dealerships={dealerships}
 *   selectedIds={selectedDealershipIds}
 *   onToggle={(id) => handleDealershipToggle(id)}
 *   label="Автосалоны"
 *   description="Выберите салоны для управления"
 * />
 */
export const DealershipCheckboxList: React.FC<DealershipCheckboxListProps> = ({
  dealerships,
  selectedIds,
  onToggle,
  isLoading = false,
  emptyMessage = 'Нет автосалонов',
  loadingMessage = 'Загрузка автосалонов...',
  label,
  showCount = false,
  description,
  maxHeight = 'max-h-48',
}) => {
  const renderLabel = () => {
    if (!label) return null;

    return (
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {label}
        {showCount && ` (${selectedIds.length} выбрано)`}
      </label>
    );
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <p className="text-sm text-gray-500 dark:text-gray-400 p-2 text-center">
          {loadingMessage}
        </p>
      );
    }

    if (dealerships.length === 0) {
      return (
        <p className="text-sm text-gray-500 dark:text-gray-400 p-2 text-center">
          {emptyMessage}
        </p>
      );
    }

    return (
      <div className="space-y-2">
        {dealerships.map((dealership) => (
          <label
            key={dealership.id}
            className="flex items-center p-2 hover:bg-gray-50 dark:hover:bg-gray-600 rounded cursor-pointer"
          >
            <input
              type="checkbox"
              checked={selectedIds.includes(dealership.id)}
              onChange={() => onToggle(dealership.id)}
              className="h-4 w-4 text-accent-600 focus:ring-accent-500 border-gray-300 dark:border-gray-600 dark:bg-gray-800 rounded"
            />
            <span className="ml-2 text-sm text-gray-900 dark:text-white">
              {dealership.name}
            </span>
          </label>
        ))}
      </div>
    );
  };

  return (
    <div>
      {renderLabel()}
      <div className={`border border-gray-300 dark:border-gray-600 rounded-lg ${maxHeight} overflow-y-auto p-2 bg-white dark:bg-gray-700`}>
        {description && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2 p-2">
            {description}
          </p>
        )}
        {renderContent()}
      </div>
    </div>
  );
};
