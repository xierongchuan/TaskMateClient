import React from 'react';

export interface SectionProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
  collapsible?: boolean;
  defaultOpen?: boolean;
}

/**
 * Секция с заголовком.
 *
 * @example
 * <Section title="Активные смены" icon={<UserIcon />}>
 *   {content}
 * </Section>
 */
export const Section: React.FC<SectionProps> = ({
  title,
  subtitle,
  icon,
  children,
  action,
  className = '',
}) => {
  const containerClasses = [
    'bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 transition-colors overflow-hidden',
    className,
  ].filter(Boolean).join(' ');

  const iconClasses = 'w-5 h-5';

  const renderIcon = (iconElement: React.ReactNode) => {
    if (React.isValidElement<{ className?: string }>(iconElement)) {
      return React.cloneElement(iconElement, {
        className: `${iconClasses} mr-2 text-gray-500 dark:text-gray-400 ${iconElement.props.className || ''}`.trim(),
      });
    }
    return iconElement;
  };

  return (
    <div className={containerClasses}>
      <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {icon && renderIcon(icon)}
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                {title}
              </h2>
              {subtitle && (
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          {action && <div className="flex-shrink-0">{action}</div>}
        </div>
      </div>
      <div className="p-4 sm:p-6">
        {children}
      </div>
    </div>
  );
};
