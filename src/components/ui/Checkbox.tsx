import React from 'react';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: React.ReactNode;
  description?: string;
  error?: string;
}

/**
 * Универсальный компонент чекбокса.
 *
 * @example
 * <Checkbox label="Только повторяемые" description="Задачи с расписанием" />
 */
export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(({
  label,
  description,
  error,
  className = '',
  id,
  ...props
}, ref) => {
  const checkboxId = id || `checkbox-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className={className}>
      <label
        htmlFor={checkboxId}
        className="flex items-start cursor-pointer group"
      >
        <div className="flex items-center h-5">
          <input
            ref={ref}
            type="checkbox"
            id={checkboxId}
            className="h-4 w-4 text-accent-600 focus:ring-accent-500 border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-700 dark:border-gray-600"
            {...props}
          />
        </div>
        {(label || description) && (
          <div className="ml-3">
            {label && (
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                {label}
              </span>
            )}
            {description && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {description}
              </p>
            )}
          </div>
        )}
      </label>
      {error && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400 ml-7">{error}</p>
      )}
    </div>
  );
});

Checkbox.displayName = 'Checkbox';
