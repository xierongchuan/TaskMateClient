import React from 'react';

export interface ViewModeOption {
  value: string;
  icon: React.ReactNode;
  label?: string;
}

export interface ViewModeToggleProps {
  mode: string;
  onChange: (mode: string) => void;
  options: ViewModeOption[];
  className?: string;
}

/**
 * Переключатель режима отображения (список/карточки и т.д.)
 *
 * @example
 * <ViewModeToggle
 *   mode={viewMode}
 *   onChange={setViewMode}
 *   options={[
 *     { value: 'list', icon: <ListBulletIcon />, label: 'Список' },
 *     { value: 'grid', icon: <Squares2X2Icon />, label: 'Карточки' }
 *   ]}
 * />
 */
export const ViewModeToggle: React.FC<ViewModeToggleProps> = ({
  mode,
  onChange,
  options,
  className = '',
}) => {
  const containerClasses = [
    'flex items-center bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 transition-colors',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={containerClasses}>
      {options.map((option, index) => {
        const isActive = mode === option.value;
        const isFirst = index === 0;
        const isLast = index === options.length - 1;

        const buttonClasses = [
          'px-3 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-accent-500',
          isActive
            ? 'bg-accent-100 text-accent-700 dark:bg-gray-700 dark:text-accent-300'
            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200',
          isFirst ? 'rounded-l-lg' : '',
          isLast ? 'rounded-r-lg' : '',
        ].filter(Boolean).join(' ');

        const iconClasses = 'w-4 h-4';

        const renderIcon = (iconElement: React.ReactNode) => {
          if (React.isValidElement<{ className?: string }>(iconElement)) {
            return React.cloneElement(iconElement, {
              className: `${iconClasses} ${iconElement.props.className || ''}`.trim(),
            });
          }
          return iconElement;
        };

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={buttonClasses}
            title={option.label}
          >
            {renderIcon(option.icon)}
          </button>
        );
      })}
    </div>
  );
};
