import React, { type ReactNode } from 'react';

export interface PageHeaderProps {
  title: string;
  description?: ReactNode;
  children?: ReactNode;
  className?: string; // Additional classes
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  children,
  className = ''
}) => {
  return (
    <div className={`mb-8 ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            {title}
          </h1>
          {description && (
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              {description}
            </p>
          )}
        </div>

        {children && (
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            {children}
          </div>
        )}
      </div>
    </div>
  );
};
