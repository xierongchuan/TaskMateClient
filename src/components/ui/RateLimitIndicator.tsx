import React, { useEffect, useCallback } from 'react';
import { ClockIcon } from '@heroicons/react/24/outline';
import { useRateLimit } from '../../hooks/useRateLimit';
import { useToast } from './Toast';

/**
 * Компонент для отображения индикатора rate limit.
 * Показывает countdown до возможности повторных запросов.
 * Автоматически показывает toast при получении 429 ошибки.
 */
export const RateLimitIndicator: React.FC = () => {
  const { isLimited, countdown } = useRateLimit();
  const { showToast } = useToast();

  const handleRateLimitError = useCallback(
    (event: Event) => {
      const customEvent = event as CustomEvent<{ retryAfter: number | null }>;
      const retryAfter = customEvent.detail?.retryAfter;

      const message = retryAfter
        ? `Слишком много запросов. Подождите ${retryAfter} сек.`
        : 'Слишком много запросов. Пожалуйста, подождите.';

      showToast({
        type: 'warning',
        message,
        duration: Math.min((retryAfter || 5) * 1000, 10000),
      });
    },
    [showToast]
  );

  useEffect(() => {
    window.addEventListener('rate-limit-error', handleRateLimitError);
    return () => {
      window.removeEventListener('rate-limit-error', handleRateLimitError);
    };
  }, [handleRateLimitError]);

  // Показываем индикатор только если есть активный countdown
  if (!isLimited || countdown === null || countdown <= 0) {
    return null;
  }

  return (
    <div
      className="fixed bottom-20 right-4 z-40 flex items-center gap-2 px-4 py-2
                 bg-amber-100 dark:bg-amber-900/50 border border-amber-300 dark:border-amber-700
                 rounded-lg shadow-lg text-amber-800 dark:text-amber-200 text-sm"
      role="status"
      aria-live="polite"
    >
      <ClockIcon className="w-5 h-5 animate-pulse" />
      <span>Повторная попытка через {countdown} сек.</span>
    </div>
  );
};
