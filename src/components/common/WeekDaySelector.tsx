import React from 'react';

interface WeekDaySelectorProps {
  value: number[];
  onChange: (days: number[]) => void;
  disabled?: boolean;
  className?: string;
}

const WEEK_DAYS = [
  { value: 1, label: 'Пн', fullLabel: 'Понедельник' },
  { value: 2, label: 'Вт', fullLabel: 'Вторник' },
  { value: 3, label: 'Ср', fullLabel: 'Среда' },
  { value: 4, label: 'Чт', fullLabel: 'Четверг' },
  { value: 5, label: 'Пт', fullLabel: 'Пятница' },
  { value: 6, label: 'Сб', fullLabel: 'Суббота' },
  { value: 7, label: 'Вс', fullLabel: 'Воскресенье' },
];

/**
 * Multi-select component for week days.
 * Uses ISO weekday format: 1 = Monday, 7 = Sunday
 */
export const WeekDaySelector: React.FC<WeekDaySelectorProps> = ({
  value = [],
  onChange,
  disabled = false,
  className = '',
}) => {
  const toggleDay = (day: number) => {
    if (disabled) return;

    if (value.includes(day)) {
      onChange(value.filter((d) => d !== day));
    } else {
      onChange([...value, day].sort((a, b) => a - b));
    }
  };

  const selectAll = () => {
    if (disabled) return;
    onChange([1, 2, 3, 4, 5, 6, 7]);
  };

  const selectWeekdays = () => {
    if (disabled) return;
    onChange([1, 2, 3, 4, 5]);
  };

  const selectWeekend = () => {
    if (disabled) return;
    onChange([6, 7]);
  };

  const clearAll = () => {
    if (disabled) return;
    onChange([]);
  };

  return (
    <div className={className}>
      <div className="flex flex-wrap gap-2 mb-2">
        {WEEK_DAYS.map((day) => (
          <button
            key={day.value}
            type="button"
            onClick={() => toggleDay(day.value)}
            disabled={disabled}
            title={day.fullLabel}
            className={`
              px-3 py-2 rounded-lg text-sm font-medium transition-all
              ${value.includes(day.value)
                ? 'bg-accent-600 text-white shadow-sm'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              ${day.value >= 6 ? 'border-2 border-dashed border-orange-300 dark:border-orange-600' : ''}
            `}
          >
            {day.label}
          </button>
        ))}
      </div>

      {/* Quick select buttons */}
      <div className="flex flex-wrap gap-1 mt-2">
        <button
          type="button"
          onClick={selectWeekdays}
          disabled={disabled}
          className="text-xs px-2 py-1 rounded bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          Будни
        </button>
        <button
          type="button"
          onClick={selectWeekend}
          disabled={disabled}
          className="text-xs px-2 py-1 rounded bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          Выходные
        </button>
        <button
          type="button"
          onClick={selectAll}
          disabled={disabled}
          className="text-xs px-2 py-1 rounded bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          Все
        </button>
        <button
          type="button"
          onClick={clearAll}
          disabled={disabled}
          className="text-xs px-2 py-1 rounded bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          Очистить
        </button>
      </div>

      {value.length > 0 && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          Выбрано дней: {value.length}
          {value.length === 7 && ' (каждый день)'}
        </p>
      )}
    </div>
  );
};
