import React from 'react';

export type SkeletonVariant = 'text' | 'circular' | 'rectangular' | 'card' | 'list' | 'table';

export interface SkeletonProps {
  variant?: SkeletonVariant;
  width?: string | number;
  height?: string | number;
  count?: number;
  className?: string;
  rows?: number; // For table variant
}

/**
 * Компонент скелетона для отображения состояния загрузки.
 *
 * @example
 * <Skeleton variant="card" count={5} />
 * <Skeleton variant="list" count={3} />
 * <Skeleton variant="table" rows={10} />
 */
export const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'rectangular',
  width,
  height,
  count = 1,
  className = '',
  rows = 5,
}) => {
  const baseClasses = 'animate-pulse bg-gray-200 dark:bg-gray-700 rounded';

  const getStyle = (): React.CSSProperties => {
    const style: React.CSSProperties = {};
    if (width) style.width = typeof width === 'number' ? `${width}px` : width;
    if (height) style.height = typeof height === 'number' ? `${height}px` : height;
    return style;
  };

  const renderSkeleton = (index: number) => {
    const key = `skeleton-${index}`;

    switch (variant) {
      case 'text':
        return (
          <div
            key={key}
            className={`${baseClasses} h-4 ${className}`}
            style={{ width: width || '100%', ...getStyle() }}
          />
        );

      case 'circular':
        return (
          <div
            key={key}
            className={`${baseClasses} rounded-full ${className}`}
            style={{ width: width || 40, height: height || 40, ...getStyle() }}
          />
        );

      case 'rectangular':
        return (
          <div
            key={key}
            className={`${baseClasses} ${className}`}
            style={{ width: width || '100%', height: height || 20, ...getStyle() }}
          />
        );

      case 'card':
        return (
          <div
            key={key}
            className={`${baseClasses} rounded-lg ${className}`}
            style={{ width: width || '100%', height: height || 96, ...getStyle() }}
          />
        );

      case 'list':
        return (
          <div key={key} className={`space-y-3 ${className}`}>
            <div className={`${baseClasses} h-5 w-3/4`} />
            <div className={`${baseClasses} h-4 w-1/2`} />
          </div>
        );

      case 'table':
        return (
          <div key={key} className={`space-y-3 ${className}`}>
            {/* Table header */}
            <div className="flex gap-4">
              <div className={`${baseClasses} h-8 flexr-1`} />
              <div className={`${baseClasses} h-8 flex-1`} />
              <div className={`${baseClasses} h-8 flex-1`} />
            </div>
            {/* Table rows */}
            {[...Array(rows)].map((_, i) => (
              <div key={i} className="flex gap-4">
                <div className={`${baseClasses} h-6 flex-1`} />
                <div className={`${baseClasses} h-6 flex-1`} />
                <div className={`${baseClasses} h-6 flex-1`} />
              </div>
            ))}
          </div>
        );

      default:
        return (
          <div
            key={key}
            className={`${baseClasses} ${className}`}
            style={getStyle()}
          />
        );
    }
  };

  if (count === 1) {
    return renderSkeleton(0);
  }

  return (
    <div className="space-y-4">
      {[...Array(count)].map((_, i) => renderSkeleton(i))}
    </div>
  );
};
