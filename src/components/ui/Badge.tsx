import React from 'react';

export type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'purple' | 'gray' | 'blue' | 'orange';
export type BadgeSize = 'sm' | 'md';

export interface BadgeProps {
  variant?: BadgeVariant;
  size?: BadgeSize;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  withBorder?: boolean;
}

const variantClasses: Record<BadgeVariant, string> = {
  success: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  danger: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  info: 'bg-accent-100 text-accent-800 dark:bg-accent-900/30 dark:text-accent-300',
  purple: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  gray: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  blue: 'bg-accent-100 text-accent-800 dark:bg-accent-900/30 dark:text-accent-300',
  orange: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
};

const borderClasses: Record<BadgeVariant, string> = {
  success: 'border-green-200 dark:border-green-700',
  warning: 'border-yellow-200 dark:border-yellow-700',
  danger: 'border-red-200 dark:border-red-700',
  info: 'border-accent-200 dark:border-accent-700',
  purple: 'border-purple-200 dark:border-purple-700',
  gray: 'border-gray-200 dark:border-gray-600',
  blue: 'border-accent-200 dark:border-accent-700',
  orange: 'border-orange-200 dark:border-orange-700',
};

const sizeClasses: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-0.5 text-xs',
};

const iconSizeClasses: Record<BadgeSize, string> = {
  sm: 'w-3 h-3',
  md: 'w-3 h-3',
};

/**
 * Универсальный компонент Badge для отображения статусов, меток и т.д.
 *
 * @example
 * <Badge variant="success" icon={<CheckCircleIcon />}>Выполнено</Badge>
 * <Badge variant="danger">Просрочено</Badge>
 * <Badge variant="warning" withBorder>Ожидает</Badge>
 */
export const Badge: React.FC<BadgeProps> = ({
  variant = 'gray',
  size = 'md',
  icon,
  children,
  className = '',
  withBorder = true,
}) => {
  const baseClasses = 'inline-flex items-center rounded-full font-medium';

  const classes = [
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    withBorder ? `border ${borderClasses[variant]}` : '',
    className,
  ].filter(Boolean).join(' ');

  const iconClasses = iconSizeClasses[size];

  const renderIcon = (iconElement: React.ReactNode) => {
    if (React.isValidElement<{ className?: string }>(iconElement)) {
      return React.cloneElement(iconElement, {
        className: `${iconClasses} ${iconElement.props.className || ''}`.trim(),
      });
    }
    return iconElement;
  };

  return (
    <span className={classes}>
      {icon && (
        <span className="mr-1">
          {renderIcon(icon)}
        </span>
      )}
      {children}
    </span>
  );
};
