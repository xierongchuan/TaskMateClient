import React from 'react';
import { MoonIcon, ClockIcon } from '@heroicons/react/24/outline';
import { Modal } from '../ui/Modal';
import type { ShiftSchedule } from '../../types/shift';

interface ShiftScheduleSelectorProps {
  isOpen: boolean;
  schedules: ShiftSchedule[];
  onSelect: (id: number) => void;
  onCancel: () => void;
}

function formatTime(time: string): string {
  // time is "HH:MM:SS" — strip seconds
  return time.slice(0, 5);
}

export const ShiftScheduleSelector: React.FC<ShiftScheduleSelectorProps> = ({
  isOpen,
  schedules,
  onSelect,
  onCancel,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      title="Выберите график смены"
      size="sm"
      closeOnOverlayClick={false}
    >
      <Modal.Body>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Несколько графиков подходят для текущего времени. Выберите нужный:
        </p>
        <div className="space-y-2">
          {schedules.map((schedule) => (
            <button
              key={schedule.id}
              type="button"
              onClick={() => onSelect(schedule.id)}
              className="w-full text-left px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-300 dark:hover:border-blue-600 transition-colors group"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-blue-700 dark:group-hover:text-blue-300 truncate">
                    {schedule.name}
                  </p>
                  <p className="flex items-center gap-1 mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                    <ClockIcon className="w-3.5 h-3.5 flex-shrink-0" />
                    {formatTime(schedule.start_time)} — {formatTime(schedule.end_time)}
                  </p>
                </div>
                {schedule.is_night_shift && (
                  <span className="inline-flex items-center gap-1 flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
                    <MoonIcon className="w-3 h-3" />
                    Ночная
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      </Modal.Body>
      <Modal.Footer>
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
        >
          Отмена
        </button>
      </Modal.Footer>
    </Modal>
  );
};
