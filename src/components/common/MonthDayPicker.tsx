import React, { useState } from 'react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface MonthDayPickerProps {
  value: number[];
  onChange: (days: number[]) => void;
  disabled?: boolean;
  className?: string;
}

/**
 * Calendar grid component for selecting multiple days of the month.
 * Supports:
 * - Positive days (1-31): specific day of month
 * - Negative days (-1, -2): last day, second-to-last day
 */
export const MonthDayPicker: React.FC<MonthDayPickerProps> = ({
  value = [],
  onChange,
  disabled = false,
  className = '',
}) => {
  const [showWarning, setShowWarning] = useState(false);

  const toggleDay = (day: number) => {
    if (disabled) return;

    if (value.includes(day)) {
      onChange(value.filter((d) => d !== day));
    } else {
      // Show warning for days that don't exist in all months
      if (day >= 29) {
        setShowWarning(true);
      }
      onChange([...value, day].sort((a, b) => a - b));
    }
  };

  const toggleSpecialDay = (day: number) => {
    if (disabled) return;

    if (value.includes(day)) {
      onChange(value.filter((d) => d !== day));
    } else {
      onChange([...value, day].sort((a, b) => a - b));
    }
  };

  const clearAll = () => {
    if (disabled) return;
    onChange([]);
    setShowWarning(false);
  };

  // Group days into rows of 7
  const rows: number[][] = [];
  for (let i = 1; i <= 31; i += 7) {
    const row = [];
    for (let j = i; j < i + 7 && j <= 31; j++) {
      row.push(j);
    }
    rows.push(row);
  }

  const isWarningDay = (day: number) => day >= 29;
  const hasWarningDays = value.some(isWarningDay);

  return (
    <div className={className}>
      {/* Main calendar grid */}
      <div className="grid grid-cols-7 gap-1 mb-3">
        {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
          <button
            key={day}
            type="button"
            onClick={() => toggleDay(day)}
            disabled={disabled}
            className={`
              w-9 h-9 rounded-lg text-sm font-medium transition-all flex items-center justify-center
              ${value.includes(day)
                ? isWarningDay(day)
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'bg-accent-600 text-white shadow-sm'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              ${isWarningDay(day) && !value.includes(day) ? 'ring-1 ring-orange-300 dark:ring-orange-600' : ''}
            `}
          >
            {day}
          </button>
        ))}
      </div>

      {/* Special days (last, second-to-last) */}
      <div className="flex gap-2 mb-3">
        <button
          type="button"
          onClick={() => toggleSpecialDay(-1)}
          disabled={disabled}
          className={`
            flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all
            ${value.includes(-1)
              ? 'bg-purple-600 text-white shadow-sm'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          Последний день
        </button>
        <button
          type="button"
          onClick={() => toggleSpecialDay(-2)}
          disabled={disabled}
          className={`
            flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all
            ${value.includes(-2)
              ? 'bg-purple-600 text-white shadow-sm'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          Предпоследний
        </button>
      </div>

      {/* Clear button */}
      {value.length > 0 && (
        <button
          type="button"
          onClick={clearAll}
          disabled={disabled}
          className="text-xs px-2 py-1 rounded bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          Очистить выбор ({value.length})
        </button>
      )}

      {/* Warning for days 29-31 */}
      {(showWarning || hasWarningDays) && (
        <div className="mt-3 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-100 dark:border-orange-900/30">
          <div className="flex items-start gap-2">
            <ExclamationTriangleIcon className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-orange-800 dark:text-orange-300">
              <p className="font-medium mb-1">Внимание: дни 29-31</p>
              <p className="text-xs">
                Если выбранный день не существует в месяце (например, 31 февраля),
                задача будет создана в <strong>последний валидный день</strong> месяца.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Summary */}
      {value.length > 0 && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          Выбрано дней: {value.filter(d => d > 0).length}
          {value.includes(-1) && ' + последний'}
          {value.includes(-2) && ' + предпоследний'}
        </p>
      )}
    </div>
  );
};
