import React from 'react';
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/solid';

type StatCardVariant = 'default' | 'success' | 'warning' | 'danger' | 'info';
type StatCardSize = 'sm' | 'md' | 'lg';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  variant?: StatCardVariant;
  size?: StatCardSize;
  className?: string;
}

const variantStyles: Record<StatCardVariant, { bg: string; accent: string; icon: string }> = {
  default: {
    bg: 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700',
    accent: 'text-gray-600 dark:text-gray-300',
    icon: 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400',
  },
  success: {
    bg: 'bg-green-50 dark:bg-gray-800 border-green-200 dark:border-green-700',
    accent: 'text-green-600 dark:text-green-400',
    icon: 'bg-green-100 dark:bg-gray-700 text-green-600 dark:text-green-400',
  },
  warning: {
    bg: 'bg-yellow-50 dark:bg-gray-800 border-yellow-200 dark:border-yellow-700',
    accent: 'text-yellow-600 dark:text-yellow-400',
    icon: 'bg-yellow-100 dark:bg-gray-700 text-yellow-600 dark:text-yellow-400',
  },
  danger: {
    bg: 'bg-red-50 dark:bg-gray-800 border-red-200 dark:border-red-700',
    accent: 'text-red-600 dark:text-red-400',
    icon: 'bg-red-100 dark:bg-gray-700 text-red-600 dark:text-red-400',
  },
  info: {
    bg: 'bg-accent-50 dark:bg-gray-800 border-accent-200 dark:border-accent-800/50',
    accent: 'text-accent-600 dark:text-accent-400',
    icon: 'bg-accent-100 dark:bg-gray-700 text-accent-600 dark:text-accent-400',
  },
};

const sizeStyles: Record<StatCardSize, { padding: string; valueSize: string; titleSize: string; iconSize: string }> = {
  sm: {
    padding: 'p-3',
    valueSize: 'text-xl',
    titleSize: 'text-xs',
    iconSize: 'w-8 h-8',
  },
  md: {
    padding: 'p-4',
    valueSize: 'text-2xl',
    titleSize: 'text-sm',
    iconSize: 'w-10 h-10',
  },
  lg: {
    padding: 'p-5',
    valueSize: 'text-3xl',
    titleSize: 'text-sm',
    iconSize: 'w-12 h-12',
  },
};

/**
 * Card component for displaying a single statistic with optional icon and trend indicator.
 *
 * @example
 * <StatCard
 *   title="Выполнено"
 *   value="85%"
 *   trend="up"
 *   trendValue="+5%"
 *   variant="success"
 *   icon={<CheckCircleIcon />}
 * />
 */
export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendValue,
  variant = 'default',
  size = 'md',
  className = '',
}) => {
  const styles = variantStyles[variant];
  const sizes = sizeStyles[size];

  return (
    <div
      className={`rounded-xl border ${styles.bg} ${sizes.padding} ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className={`${sizes.titleSize} font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1`}>
            {title}
          </p>
          <p className={`${sizes.valueSize} font-bold text-gray-900 dark:text-white truncate`}>
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {subtitle}
            </p>
          )}
          {trend && trendValue && (
            <div className="flex items-center gap-1 mt-2">
              {trend === 'up' && (
                <ArrowUpIcon className="w-4 h-4 text-green-500" />
              )}
              {trend === 'down' && (
                <ArrowDownIcon className="w-4 h-4 text-red-500" />
              )}
              <span className={`text-xs font-medium ${trend === 'up' ? 'text-green-600 dark:text-green-400' :
                  trend === 'down' ? 'text-red-600 dark:text-red-400' :
                    'text-gray-500 dark:text-gray-400'
                }`}>
                {trendValue}
              </span>
            </div>
          )}
        </div>
        {icon && (
          <div className={`${sizes.iconSize} rounded-lg flex items-center justify-center flex-shrink-0 ${styles.icon}`}>
            <div className="w-5 h-5">
              {icon}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
