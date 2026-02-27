import React from 'react';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

/**
 * Компонент для отображения пустого состояния.
 *
 * @example
 * <EmptyState
 *   icon={<CalendarIcon />}
 *   title="Задачи не найдены"
 *   description="Создайте первую задачу для начала работы"
 *   action={<Button onClick={handleCreate}>Создать</Button>}
 * />
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className = '',
}) => {
  const containerClasses = [
    'bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center transition-colors',
    className,
  ].filter(Boolean).join(' ');

  const iconClasses = 'w-16 h-16';

  const renderIcon = (iconElement: React.ReactNode) => {
    if (React.isValidElement<{ className?: string }>(iconElement)) {
      return React.cloneElement(iconElement, {
        className: `${iconClasses} mx-auto text-gray-300 dark:text-gray-600 mb-4 ${iconElement.props.className || ''}`.trim(),
      });
    }
    return iconElement;
  };

  return (
    <div className={containerClasses}>
      {icon && renderIcon(icon)}
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
        {title}
      </h3>
      {description && (
        <p className="text-gray-500 dark:text-gray-400 mb-4">
          {description}
        </p>
      )}
      {action && (
        <div className="mt-4">
          {action}
        </div>
      )}
    </div>
  );
};
