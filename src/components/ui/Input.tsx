import React from 'react';

export type InputSize = 'sm' | 'md' | 'lg';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  inputSize?: InputSize;
  fullWidth?: boolean;
}

const sizeClasses: Record<InputSize, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-3 py-2 text-sm',
  lg: 'px-4 py-3 text-base',
};

const iconPaddingLeft: Record<InputSize, string> = {
  sm: 'pl-8',
  md: 'pl-10',
  lg: 'pl-12',
};

const iconPaddingRight: Record<InputSize, string> = {
  sm: 'pr-8',
  md: 'pr-10',
  lg: 'pr-12',
};

const iconPositionClasses: Record<InputSize, { left: string; right: string }> = {
  sm: { left: 'left-2.5', right: 'right-2.5' },
  md: { left: 'left-3', right: 'right-3' },
  lg: { left: 'left-4', right: 'right-4' },
};

const iconSizeClasses: Record<InputSize, string> = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-5 h-5',
};

/**
 * Универсальный компонент текстового поля ввода.
 *
 * @example
 * <Input label="Поиск" icon={<MagnifyingGlassIcon />} placeholder="Введите текст..." />
 * <Input label="Email" type="email" error="Неверный формат" />
 */
export const Input = React.forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  hint,
  icon,
  iconPosition = 'left',
  inputSize = 'md',
  fullWidth = true,
  className = '',
  id,
  ...props
}, ref) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

  const baseInputClasses = 'unified-input block rounded-xl border shadow-sm transition-all duration-200 focus:outline-none focus:border-accent-500 disabled:opacity-50 disabled:cursor-not-allowed';

  const stateClasses = error
    ? 'unified-input-error border-red-300 dark:border-red-600 focus:border-red-500'
    : 'border-gray-200 dark:border-gray-600';

  const colorClasses = 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500';

  const inputClasses = [
    baseInputClasses,
    sizeClasses[inputSize],
    stateClasses,
    colorClasses,
    icon && iconPosition === 'left' ? iconPaddingLeft[inputSize] : '',
    icon && iconPosition === 'right' ? iconPaddingRight[inputSize] : '',
    fullWidth ? 'w-full' : '',
    className,
  ].filter(Boolean).join(' ');

  const renderIcon = (iconElement: React.ReactNode) => {
    if (React.isValidElement<{ className?: string }>(iconElement)) {
      return React.cloneElement(iconElement, {
        className: `${iconSizeClasses[inputSize]} text-gray-400 ${iconElement.props.className || ''}`.trim(),
      });
    }
    return iconElement;
  };

  return (
    <div className={fullWidth ? 'w-full' : ''}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          {label}
        </label>
      )}
      <div className="relative">
        {icon && iconPosition === 'left' && (
          <div className={`absolute ${iconPositionClasses[inputSize].left} top-1/2 transform -translate-y-1/2 pointer-events-none`}>
            {renderIcon(icon)}
          </div>
        )}
        <input
          ref={ref}
          id={inputId}
          className={inputClasses}
          {...props}
        />
        {icon && iconPosition === 'right' && (
          <div className={`absolute ${iconPositionClasses[inputSize].right} top-1/2 transform -translate-y-1/2 pointer-events-none`}>
            {renderIcon(icon)}
          </div>
        )}
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
      {hint && !error && (
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{hint}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';
