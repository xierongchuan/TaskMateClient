import React from 'react';
import { WrenchScrewdriverIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

export const MaintenancePage: React.FC = () => {
  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="w-24 h-24 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
                <WrenchScrewdriverIcon className="w-12 h-12 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center animate-pulse">
                <ArrowPathIcon className="w-5 h-5 text-yellow-900 animate-spin" />
              </div>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
            Технические работы
          </h1>

          {/* Description */}
          <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
            Система временно недоступна. Мы проводим плановое обслуживание для улучшения качества работы.
          </p>

          {/* Info */}
          <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-4 mb-6">
            <p className="text-sm text-orange-800 dark:text-orange-300">
              <strong>Пожалуйста, попробуйте позже.</strong>
              <br />
              Обычно работы занимают не более 15-30 минут.
            </p>
          </div>

          {/* Retry Button */}
          <button
            onClick={handleRetry}
            className="w-full bg-accent-600 hover:bg-accent-700 text-white font-medium py-3 px-6 rounded-xl transition-colors duration-200 flex items-center justify-center gap-2"
          >
            <ArrowPathIcon className="w-5 h-5" />
            Попробовать снова
          </button>

          {/* Footer */}
          <p className="mt-6 text-xs text-gray-500 dark:text-gray-400">
            Если проблема сохраняется длительное время, свяжитесь с администратором системы.
          </p>
        </div>
      </div>
    </div>
  );
};
