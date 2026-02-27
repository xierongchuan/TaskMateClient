import React from 'react';

export type IconButtonVariant = 'default' | 'primary' | 'danger' | 'ghost';
export type IconButtonSize = 'sm' | 'md' | 'lg';

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  tooltip?: string;
  isLoading?: boolean;
}

const variantClasses: Record<IconButtonVariant, string> = {
  default: 'text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700',
  primary: 'text-accent-600 hover:text-accent-700 hover:bg-accent-50 dark:text-accent-400 dark:hover:text-accent-300 dark:hover:bg-gray-700',
  danger: 'text-gray-400 hover:text-red-600 hover:bg-red-50 dark:text-gray-400 dark:hover:text-red-400 dark:hover:bg-gray-700',
  ghost: 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200',
};

const sizeClasses: Record<IconButtonSize, string> = {
  sm: 'p-1',
  md: 'p-2',
  lg: 'p-3',
};

const iconSizeClasses: Record<IconButtonSize, string> = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
};

/**
 * Кнопка-иконка для компактных действий.
 *
 * @example
 * <IconButton icon={<PencilIcon />} variant="default" tooltip="Редактировать" />
 * <IconButton icon={<TrashIcon />} variant="danger" tooltip="Удалить" />
 */
export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  variant = 'default',
  size = 'md',
  tooltip,
  isLoading = false,
  disabled,
  className = '',
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-500 disabled:opacity-50 disabled:cursor-not-allowed';

  const classes = [
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    className,
  ].filter(Boolean).join(' ');

  const iconClasses = iconSizeClasses[size];

  const renderIcon = () => {
    if (isLoading) {
      return (
        <svg
          className={`animate-spin ${iconClasses}`}
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      );
    }

    if (React.isValidElement<{ className?: string }>(icon)) {
      return React.cloneElement(icon, {
        className: `${iconClasses} ${icon.props.className || ''}`.trim(),
      });
    }
    return icon;
  };

  return (
    <button
      className={classes}
      disabled={disabled || isLoading}
      title={tooltip}
      {...props}
    >
      {renderIcon()}
    </button>
  );
};
