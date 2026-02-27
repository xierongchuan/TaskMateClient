import React from 'react';

export type SelectSize = 'sm' | 'md' | 'lg';

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

export interface SelectOptionGroup {
  label: string;
  options: SelectOption[];
}

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label?: string;
  error?: string;
  hint?: string;
  options: SelectOption[] | SelectOptionGroup[];
  placeholder?: string;
  selectSize?: SelectSize;
  fullWidth?: boolean;
}

const sizeClasses: Record<SelectSize, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-3 py-2 text-sm',
  lg: 'px-4 py-3 text-base',
};

/**
 * Универсальный компонент выпадающего списка.
 *
 * @example
 * <Select
 *   label="Статус"
 *   options={[
 *     { value: '', label: 'Все статусы' },
 *     { value: 'pending', label: 'Ожидает' },
 *     { value: 'completed', label: 'Выполнено' },
 *   ]}
 * />
 */
const isOptionGroup = (option: SelectOption | SelectOptionGroup): option is SelectOptionGroup => {
  return 'options' in option;
};

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(({
  label,
  error,
  hint,
  options,
  placeholder,
  selectSize = 'md',
  fullWidth = true,
  className = '',
  id,
  ...props
}, ref) => {
  const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`;

  const baseClasses = 'unified-input block rounded-xl border shadow-sm transition-all duration-200 focus:outline-none focus:border-accent-500 disabled:opacity-50 disabled:cursor-not-allowed';

  const stateClasses = error
    ? 'unified-input-error border-red-300 dark:border-red-600 focus:border-red-500'
    : 'border-gray-200 dark:border-gray-600';

  const colorClasses = 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white';

  const selectClasses = [
    baseClasses,
    sizeClasses[selectSize],
    stateClasses,
    colorClasses,
    fullWidth ? 'w-full' : '',
    className,
  ].filter(Boolean).join(' ');

  const hasGroups = options.length > 0 && isOptionGroup(options[0]);

  return (
    <div className={fullWidth ? 'w-full' : ''}>
      {label && (
        <label
          htmlFor={selectId}
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          {label}
        </label>
      )}
      <select
        ref={ref}
        id={selectId}
        className={selectClasses}
        {...props}
      >
        {hasGroups ? (
          // Render grouped options with optional placeholder
          <>
            {placeholder && (
              <option value="">{placeholder}</option>
            )}
            {(options as SelectOptionGroup[]).map((group, groupIndex) => (
              <optgroup key={groupIndex} label={group.label}>
                {group.options.map((option) => (
                  <option
                    key={option.value}
                    value={option.value}
                    disabled={option.disabled}
                  >
                    {option.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </>
        ) : (
          // Render flat options
          <>
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {(options as SelectOption[]).map((option) => (
              <option
                key={option.value}
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            ))}
          </>
        )}
      </select>
      {error && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
      {hint && !error && (
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{hint}</p>
      )}
    </div>
  );
});

Select.displayName = 'Select';
