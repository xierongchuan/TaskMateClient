import React from 'react';
import { useDealerships } from '../../hooks/useDealerships';
import { useAuth } from '../../hooks/useAuth';

interface DealershipSelectorProps {
  value?: number | null;
  onChange: (dealershipId: number | null) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  showAllOption?: boolean;
  allOptionLabel?: string;
}

export const DealershipSelector: React.FC<DealershipSelectorProps> = ({
  value,
  onChange,
  placeholder = "Все автосалоны",
  className = "",
  disabled = false,
  required = false,
  showAllOption = false,
  allOptionLabel = "Все салоны"
}) => {
  const { user } = useAuth();
  const { data: dealershipsData, isLoading, error } = useDealerships();

  // If user has assigned dealerships, use them. Otherwise use all dealerships.
  const availableDealerships = user?.dealerships && user.dealerships.length > 0
    ? user.dealerships
    : dealershipsData?.data || [];

  const isDataLoading = !user?.dealerships && isLoading;

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = e.target.value;
    console.log('[DealershipSelector] Selected value:', newValue, 'parsed:', newValue === "" ? null : parseInt(newValue));
    if (newValue === "") {
      onChange(null);
    } else {
      onChange(parseInt(newValue));
    }
  };

  if (error) {
    return (
      <div className={`text-red-600 text-sm ${className}`}>
        Ошибка загрузки автосалонов
      </div>
    );
  }

  return (
    <select
      value={value || ""}
      onChange={handleChange}
      disabled={disabled || isLoading}
      required={required}
      className={`unified-input block w-full rounded-xl border-gray-200 dark:border-gray-600 shadow-sm focus:outline-none focus:border-accent-500 sm:text-sm px-3 py-2 border disabled:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200 ${className}`}
    >
      {isDataLoading ? (
        <option value="">Загрузка...</option>
      ) : (
        <>
          {/* Always show placeholder when no value is selected, even for required fields */}
          {!showAllOption && (
            <option value="" disabled={required}>
              {placeholder}
            </option>
          )}
          {showAllOption && (
            <option value="">
              {allOptionLabel}
            </option>
          )}
          {availableDealerships.map((dealership) => (
            <option key={dealership.id} value={dealership.id}>
              {dealership.name}
              {dealership.address && ` (${dealership.address})`}
            </option>
          ))}
        </>
      )}
    </select>
  );
};
