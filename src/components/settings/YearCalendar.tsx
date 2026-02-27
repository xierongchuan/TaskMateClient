import React, { useState, useMemo, useImperativeHandle, forwardRef, useEffect } from 'react';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CalendarDaysIcon,
  ArrowPathIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { useHolidays, useBulkCalendarUpdate, useResetCalendarToGlobal } from '../../hooks/useCalendar';
import { GlobeAltIcon, BuildingStorefrontIcon } from '@heroicons/react/24/outline';
import { Button, ConfirmDialog } from '../ui';
import { useConfirmDialog } from '../../hooks/useConfirmDialog';
import { getDaysInMonth, getFirstDayOfMonth } from '../../utils/dateTime';

export interface YearCalendarRef {
  save: () => Promise<void>;
  hasPendingChanges: () => boolean;
}

interface YearCalendarProps {
  year?: number;
  dealershipId?: number;
  onYearChange?: (year: number) => void;
  onPendingChange?: (hasPending: boolean) => void;
}

const MONTHS = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
];

const WEEKDAY_LABELS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

// Получить все даты определённых дней недели за год
// weekdays: массив дней недели (1=Пн, ..., 6=Сб, 7=Вс)
const getDatesForWeekdays = (year: number, weekdays: number[]): string[] => {
  const dates: string[] = [];
  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year, 11, 31);

  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    // JS: 0=Вс, 1=Пн, ..., 6=Сб
    // Нужно: 1=Пн, ..., 6=Сб, 7=Вс
    const jsDay = d.getDay();
    const isoDay = jsDay === 0 ? 7 : jsDay;

    if (weekdays.includes(isoDay)) {
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      dates.push(dateStr);
    }
  }
  return dates;
};

interface MonthCalendarProps {
  year: number;
  month: number; // 1-12
  holidays: Set<string>;
  pendingDates: Set<string>;
  onDayClick: (date: string) => void;
  isLoading: boolean;
}

const MonthCalendar: React.FC<MonthCalendarProps> = ({
  year,
  month,
  holidays,
  pendingDates,
  onDayClick,
  isLoading,
}) => {
  // Get first day of month and days in month using centralized utilities
  const daysInMonthCount = getDaysInMonth(year, month);
  const startDayOfWeek = getFirstDayOfMonth(year, month); // Already returns Mon=0

  // Create calendar grid
  const days: (number | null)[] = [];

  // Empty cells before first day
  for (let i = 0; i < startDayOfWeek; i++) {
    days.push(null);
  }

  // Days of month
  for (let i = 1; i <= daysInMonthCount; i++) {
    days.push(i);
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 text-center">
        {MONTHS[month - 1]}
      </h3>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-0.5 mb-1">
        {WEEKDAY_LABELS.map((day, i) => (
          <div
            key={day}
            className={`text-center text-xs font-medium py-1 ${i >= 5 ? 'text-orange-500' : 'text-gray-500 dark:text-gray-400'
              }`}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-0.5">
        {days.map((day, idx) => {
          if (day === null) {
            return <div key={`empty-${idx}`} className="w-6 h-6" />;
          }

          const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const isHoliday = holidays.has(dateStr);
          const isPending = pendingDates.has(dateStr);
          const dayOfWeek = new Date(year, month - 1, day).getDay();
          const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

          return (
            <button
              key={day}
              type="button"
              onClick={() => onDayClick(dateStr)}
              disabled={isLoading}
              className={`
                w-6 h-6 rounded text-xs font-medium transition-all flex items-center justify-center
                ${isHoliday
                  ? 'bg-red-500 text-white'
                  : isWeekend
                    ? 'bg-transparent text-orange-600 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/30'
                    : 'bg-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }
                ${isPending ? 'ring-2 ring-amber-400 ring-offset-1' : ''}
                ${isLoading ? 'opacity-50 cursor-wait' : 'cursor-pointer'}
              `}
              title={isPending ? 'Несохранённое изменение' : isHoliday ? 'Выходной (кликните для отмены)' : 'Кликните чтобы отметить как выходной'}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export const YearCalendar = forwardRef<YearCalendarRef, YearCalendarProps>(({
  year: initialYear,
  dealershipId,
  onYearChange,
  onPendingChange,
}, ref) => {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(initialYear || currentYear);
  const { showConfirm, confirmState, handleConfirm, handleCancel } = useConfirmDialog();

  const { data: holidaysData, isLoading, refetch } = useHolidays(year, dealershipId);

  const bulkUpdateMutation = useBulkCalendarUpdate();
  const resetMutation = useResetCalendarToGlobal();

  // Получаем флаг uses_global из ответа API
  const usesGlobal = holidaysData?.data?.uses_global ?? true;

  // Локальное состояние для несохранённых изменений
  const [pendingChanges, setPendingChanges] = useState<Map<string, 'holiday' | 'workday'>>(new Map());

  // Convert holidays array to Set for fast lookup
  const holidaysSet = useMemo(() => {
    if (!holidaysData?.data?.dates) return new Set<string>();
    return new Set(holidaysData.data.dates);
  }, [holidaysData]);

  // Эффективный набор выходных с учётом pending изменений
  const effectiveHolidaysSet = useMemo(() => {
    const effective = new Set(holidaysSet);
    pendingChanges.forEach((type, date) => {
      if (type === 'holiday') {
        effective.add(date);
      } else {
        effective.delete(date);
      }
    });
    return effective;
  }, [holidaysSet, pendingChanges]);

  const hasPendingChanges = pendingChanges.size > 0;

  // Уведомляем родителя об изменении pending состояния
  useEffect(() => {
    onPendingChange?.(hasPendingChanges);
  }, [hasPendingChanges, onPendingChange]);

  const handleYearChange = (newYear: number) => {
    setPendingChanges(new Map()); // Очистить pending при смене года
    setYear(newYear);
    onYearChange?.(newYear);
  };

  const handleDayClick = (dateStr: string) => {
    const serverIsHoliday = holidaysSet.has(dateStr);
    const pendingType = pendingChanges.get(dateStr);
    const effectiveIsHoliday = pendingType ? pendingType === 'holiday' : serverIsHoliday;
    const newType = effectiveIsHoliday ? 'workday' : 'holiday';

    setPendingChanges(prev => {
      const newChanges = new Map(prev);
      // Если новое состояние совпадает с серверным — убираем из pending
      if ((newType === 'holiday') === serverIsHoliday) {
        newChanges.delete(dateStr);
      } else {
        newChanges.set(dateStr, newType);
      }
      return newChanges;
    });
  };

  const handleSaveChanges = async () => {
    if (pendingChanges.size === 0) return;

    try {
      const holidays = [...pendingChanges.entries()]
        .filter(([, type]) => type === 'holiday')
        .map(([date]) => date);
      const workdays = [...pendingChanges.entries()]
        .filter(([, type]) => type === 'workday')
        .map(([date]) => date);

      if (holidays.length > 0) {
        await bulkUpdateMutation.mutateAsync({
          operation: 'set_dates',
          year,
          dates: holidays,
          type: 'holiday',
          dealership_id: dealershipId,
        });
      }
      if (workdays.length > 0) {
        await bulkUpdateMutation.mutateAsync({
          operation: 'set_dates',
          year,
          dates: workdays,
          type: 'workday',
          dealership_id: dealershipId,
        });
      }

      setPendingChanges(new Map());
      // Toast показывает родительский компонент (SettingsPage)
    } catch (error) {
      // Ошибку пробрасываем наверх для обработки в родительском компоненте
      throw error;
    }
  };

  const handleDiscardChanges = () => {
    setPendingChanges(new Map());
  };

  // Expose методы через ref для родительского компонента
  useImperativeHandle(ref, () => ({
    save: handleSaveChanges,
    hasPendingChanges: () => pendingChanges.size > 0,
  }), [pendingChanges, year, dealershipId, bulkUpdateMutation]);

  // Добавить даты в pending как выходные
  const addWeekdaysToHolidays = (weekdays: number[]) => {
    const dates = getDatesForWeekdays(year, weekdays);
    setPendingChanges(prev => {
      const newChanges = new Map(prev);
      for (const date of dates) {
        // Если на сервере уже выходной — не добавляем в pending
        if (!holidaysSet.has(date)) {
          newChanges.set(date, 'holiday');
        }
      }
      return newChanges;
    });
  };

  const handleSetAllSaturdays = () => {
    addWeekdaysToHolidays([6]);
  };

  const handleSetAllSundays = () => {
    addWeekdaysToHolidays([7]);
  };

  const handleSetAllWeekends = () => {
    addWeekdaysToHolidays([6, 7]);
  };

  const handleClearYear = async () => {
    const confirmed = await showConfirm({
      title: 'Очистить календарь',
      message: `Вы уверены, что хотите отметить все выходные за ${year} год как рабочие дни?`,
      confirmText: 'Очистить',
      cancelText: 'Отмена',
      variant: 'danger',
    });

    if (!confirmed) {
      return;
    }

    // Все текущие выходные (с сервера + pending) отметить как workday
    setPendingChanges(prev => {
      const newChanges = new Map(prev);
      // Очистить все pending holidays
      for (const [date, type] of prev) {
        if (type === 'holiday') {
          newChanges.delete(date);
        }
      }
      // Все серверные выходные отметить как workday
      holidaysSet.forEach(date => {
        newChanges.set(date, 'workday');
      });
      return newChanges;
    });
  };

  const handleResetToGlobal = async () => {
    if (!dealershipId) return;

    const confirmed = await showConfirm({
      title: 'Сбросить к глобальному календарю',
      message: `Вы уверены? Все настройки выходных дней за ${year} год для этого автосалона будут удалены. Будет использоваться глобальный календарь.`,
      confirmText: 'Сбросить',
      cancelText: 'Отмена',
      variant: 'danger',
    });

    if (confirmed) {
      try {
        await resetMutation.mutateAsync({ year, dealershipId });
        setPendingChanges(new Map());
      } catch {
        // Ошибку обработает родительский компонент через onError
      }
    }
  };

  const isMutating = bulkUpdateMutation.isPending || resetMutation.isPending;

  return (
    <div className="space-y-6">
      {/* Header with year navigation */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <CalendarDaysIcon className="w-6 h-6 text-accent-500" />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleYearChange(year - 1)}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <ChevronLeftIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
            <span className="text-2xl font-bold text-gray-900 dark:text-white min-w-[80px] text-center">
              {year}
            </span>
            <button
              type="button"
              onClick={() => handleYearChange(year + 1)}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <ChevronRightIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
            icon={<ArrowPathIcon className={isLoading ? 'animate-spin' : ''} />}
          >
            Обновить
          </Button>
        </div>
      </div>

      {/* Calendar type indicator - только для автосалона */}
      {dealershipId && (
        <div className={`flex items-center justify-between p-3 rounded-lg border ${
          usesGlobal
            ? 'bg-accent-50 dark:bg-gray-700/50 border-accent-200 dark:border-gray-600'
            : 'bg-green-50 dark:bg-gray-700/50 border-green-200 dark:border-gray-600'
        }`}>
          <div className="flex items-center gap-2">
            {usesGlobal ? (
              <GlobeAltIcon className="w-5 h-5 text-accent-500" />
            ) : (
              <BuildingStorefrontIcon className="w-5 h-5 text-green-500" />
            )}
            <span className={`text-sm font-medium ${
              usesGlobal
                ? 'text-accent-700 dark:text-accent-300'
                : 'text-green-700 dark:text-green-300'
            }`}>
              {usesGlobal ? 'Глобальный календарь' : 'Собственный календарь автосалона'}
            </span>
          </div>
          {!usesGlobal && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleResetToGlobal}
              disabled={isMutating}
              className="text-red-600 hover:text-red-700 dark:text-red-400"
            >
              Сбросить к глобальному
            </Button>
          )}
        </div>
      )}

      {/* Warning on first edit when using global calendar */}
      {dealershipId && usesGlobal && hasPendingChanges && (
        <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
          <p className="text-sm text-amber-700 dark:text-amber-300">
            <strong>Внимание:</strong> При сохранении изменений будет создана копия глобального
            календаря для этого автосалона. После этого изменения глобального календаря
            не будут влиять на этот автосалон.
          </p>
        </div>
      )}

      {/* Quick action buttons */}
      <div className="flex flex-wrap gap-2 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={handleSetAllSaturdays}
          disabled={isMutating}
        >
          Все субботы — выходные
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={handleSetAllSundays}
          disabled={isMutating}
        >
          Все воскресенья — выходные
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={handleSetAllWeekends}
          disabled={isMutating}
        >
          Все выходные (Сб+Вс)
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleClearYear}
          disabled={isMutating}
          icon={<TrashIcon />}
          className="text-red-600 hover:text-red-700 dark:text-red-400"
        >
          Очистить год
        </Button>
      </div>

      {/* Pending changes indicator */}
      {hasPendingChanges && (
        <div className="flex items-center justify-between p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
          <span className="text-sm text-amber-700 dark:text-amber-300">
            Несохранённых изменений: <strong>{pendingChanges.size}</strong>
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleDiscardChanges}
            disabled={isMutating}
          >
            Сбросить
          </Button>
        </div>
      )}

      {/* Statistics */}
      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-500 rounded" />
          <span className="text-gray-600 dark:text-gray-400">
            Выходные: <strong className="text-gray-900 dark:text-white">{holidaysData?.data?.count || 0}</strong>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-100 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600" />
          <span className="text-gray-600 dark:text-gray-400">Рабочие дни</span>
        </div>
      </div>

      {/* Calendar grid - 4 columns x 3 rows = 12 months */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
          <MonthCalendar
            key={month}
            year={year}
            month={month}
            holidays={effectiveHolidaysSet}
            pendingDates={new Set(pendingChanges.keys())}
            onDayClick={handleDayClick}
            isLoading={isLoading || isMutating}
          />
        ))}
      </div>

      {/* Help text */}
      <div className="text-sm text-gray-500 dark:text-gray-400 bg-accent-50 dark:bg-gray-700/50 rounded-lg p-4">
        <p className="font-medium text-accent-800 dark:text-accent-300 mb-1">💡 Подсказка</p>
        <p>
          Кликните на любой день, чтобы переключить его между рабочим и выходным.
          В выходные дни задачи генераторов создаваться не будут.
        </p>
      </div>

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        confirmText={confirmState.confirmText}
        cancelText={confirmState.cancelText}
        variant={confirmState.variant}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </div>
  );
});

YearCalendar.displayName = 'YearCalendar';
