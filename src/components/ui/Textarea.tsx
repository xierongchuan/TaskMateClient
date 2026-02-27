import React from 'react';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  fullWidth?: boolean;
}

/**
 * Универсальный компонент многострочного текстового поля.
 *
 * @example
 * <Textarea label="Описание" placeholder="Введите описание..." rows={4} />
 */
export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({
  label,
  error,
  hint,
  fullWidth = true,
  className = '',
  id,
  rows = 3,
  ...props
}, ref) => {
  const textareaId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`;

  const baseClasses = 'unified-input block rounded-xl border shadow-sm transition-all duration-200 focus:outline-none focus:border-accent-500 disabled:opacity-50 disabled:cursor-not-allowed px-3 py-2 text-sm';

  const stateClasses = error
    ? 'unified-input-error border-red-300 dark:border-red-600 focus:border-red-500'
    : 'border-gray-200 dark:border-gray-600';

  const colorClasses = 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500';

  const textareaClasses = [
    baseClasses,
    stateClasses,
    colorClasses,
    fullWidth ? 'w-full' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={fullWidth ? 'w-full' : ''}>
      {label && (
        <label
          htmlFor={textareaId}
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={textareaId}
        rows={rows}
        className={textareaClasses}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
      {hint && !error && (
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{hint}</p>
      )}
    </div>
  );
});

Textarea.displayName = 'Textarea';
