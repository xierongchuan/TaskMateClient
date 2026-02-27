import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import {
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastContextValue {
  toasts: Toast[];
  showToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const DEFAULT_DURATION = 4000;

const typeConfig: Record<ToastType, { icon: React.ElementType; classes: string }> = {
  success: {
    icon: CheckCircleIcon,
    classes: 'bg-green-50 dark:bg-gray-800 border-green-200 dark:border-gray-700 text-green-800 dark:text-green-200',
  },
  error: {
    icon: XCircleIcon,
    classes: 'bg-red-50 dark:bg-gray-800 border-red-200 dark:border-gray-700 text-red-800 dark:text-red-200',
  },
  warning: {
    icon: ExclamationTriangleIcon,
    classes: 'bg-yellow-50 dark:bg-gray-800 border-yellow-200 dark:border-gray-700 text-yellow-800 dark:text-yellow-200',
  },
  info: {
    icon: InformationCircleIcon,
    classes: 'bg-accent-50 dark:bg-gray-800 border-accent-200 dark:border-gray-700 text-accent-800 dark:text-accent-200',
  },
};

/**
 * Toast Provider - оборачивает приложение для предоставления контекста уведомлений.
 *
 * @example
 * // В App.tsx:
 * <ToastProvider>
 *   <App />
 * </ToastProvider>
 */
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { ...toast, id }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, showToast, removeToast }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
};

/**
 * Hook для показа Toast уведомлений.
 *
 * @example
 * const { showToast } = useToast();
 * showToast({ type: 'success', message: 'Сохранено!' });
 */
export const useToast = (): ToastContextValue => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

// Individual Toast component
const ToastItem: React.FC<{ toast: Toast; onRemove: () => void }> = ({ toast, onRemove }) => {
  const { icon: Icon, classes } = typeConfig[toast.type];

  useEffect(() => {
    const duration = toast.duration ?? DEFAULT_DURATION;
    const timer = setTimeout(onRemove, duration);
    return () => clearTimeout(timer);
  }, [toast.duration, onRemove]);

  return (
    <div
      className={`flex items-center gap-3 p-4 rounded-lg border shadow-lg max-w-sm w-full animate-slide-in-up ${classes}`}
      role="alert"
    >
      <Icon className="w-5 h-5 flex-shrink-0" />
      <p className="text-sm font-medium flex-1">{toast.message}</p>
      <button
        onClick={onRemove}
        className="flex-shrink-0 p-1 hover:opacity-70 transition-opacity rounded"
        aria-label="Закрыть"
      >
        <XMarkIcon className="w-4 h-4" />
      </button>
    </div>
  );
};

// Container for all toasts
const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onRemove={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
};
