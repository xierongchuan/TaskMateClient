import React from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}

/**
 * Unified page header component with title, optional description, and action buttons.
 * Provides consistent styling across all pages.
 */
export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  actions,
  className = '',
}) => {
  return (
    <div className={`mb-8 ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight transition-colors">
            {title}
          </h1>
          {description && (
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 transition-colors">
              {description}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex items-center space-x-3 flex-shrink-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};
