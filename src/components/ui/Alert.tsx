import React from 'react';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';

export type AlertVariant = 'success' | 'error' | 'warning' | 'info';

export interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  message: string;
  onClose?: () => void;
  className?: string;
}

const variantStyles: Record<AlertVariant, {
  container: string;
  icon: string;
  title: string;
  message: string;
}> = {
  success: {
    container: 'bg-green-50 dark:bg-gray-700/50 border-green-200 dark:border-gray-600',
    icon: 'text-green-500 dark:text-green-400',
    title: 'text-green-800 dark:text-green-300',
    message: 'text-green-700 dark:text-green-400',
  },
  error: {
    container: 'bg-red-50 dark:bg-gray-700/50 border-red-200 dark:border-gray-600',
    icon: 'text-red-500 dark:text-red-400',
    title: 'text-red-800 dark:text-red-300',
    message: 'text-red-700 dark:text-red-400',
  },
  warning: {
    container: 'bg-amber-50 dark:bg-gray-700/50 border-amber-200 dark:border-gray-600',
    icon: 'text-amber-500 dark:text-amber-400',
    title: 'text-amber-800 dark:text-amber-300',
    message: 'text-amber-700 dark:text-amber-400',
  },
  info: {
    container: 'bg-accent-50 dark:bg-gray-700/50 border-accent-200 dark:border-gray-600',
    icon: 'text-accent-500 dark:text-accent-400',
    title: 'text-accent-800 dark:text-accent-300',
    message: 'text-accent-700 dark:text-accent-400',
  },
};

const variantIcons: Record<AlertVariant, React.ComponentType<{ className?: string }>> = {
  success: CheckCircleIcon,
  error: XCircleIcon,
  warning: ExclamationTriangleIcon,
  info: InformationCircleIcon,
};

export const Alert: React.FC<AlertProps> = ({
  variant = 'info',
  title,
  message,
  onClose,
  className = '',
}) => {
  const styles = variantStyles[variant];
  const Icon = variantIcons[variant];

  return (
    <div
      className={`rounded-lg border px-4 py-3 ${styles.container} ${className}`}
      role="alert"
    >
      <div className="flex items-start gap-3">
        <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${styles.icon}`} />
        <div className="flex-1 min-w-0">
          {title && (
            <h4 className={`text-sm font-semibold mb-1 ${styles.title}`}>
              {title}
            </h4>
          )}
          <p className={`text-sm ${styles.message}`}>
            {message}
          </p>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className={`flex-shrink-0 ml-2 ${styles.icon} hover:opacity-70 transition-opacity`}
            aria-label="Закрыть"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};
