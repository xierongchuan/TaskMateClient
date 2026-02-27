import React, { useState, useRef, useEffect } from 'react';
import { ChevronDownIcon, BuildingOffice2Icon, CheckIcon } from '@heroicons/react/24/outline';
import { useWorkspace } from '../../hooks/useWorkspace';

export const WorkspaceSwitcher: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const {
    dealershipId,
    setDealershipId,
    availableDealerships,
    currentDealership,
    canSwitchWorkspace,
    canSelectAll,
    isAllDealerships,
    isLoading
  } = useWorkspace();

  // Закрытие dropdown при клике вне его
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Закрытие по Escape
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen]);

  const handleSelect = (id: number | null) => {
    setDealershipId(id);
    setIsOpen(false);
  };

  // Показываем название текущего автосалона
  const displayName = isLoading
    ? 'Загрузка...'
    : isAllDealerships
      ? 'Все автосалоны'
      : currentDealership?.name || 'Выберите автосалон';

  return (
    <div className="relative min-w-0" ref={dropdownRef}>
      <button
        onClick={() => canSwitchWorkspace && setIsOpen(!isOpen)}
        disabled={!canSwitchWorkspace || isLoading}
        className={`
          flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-2 rounded-lg transition-colors min-w-0
          ${canSwitchWorkspace
            ? 'hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer'
            : 'cursor-default'
          }
          ${isOpen ? 'bg-gray-100 dark:bg-gray-700' : ''}
        `}
        title={canSwitchWorkspace ? 'Переключить автосалон' : displayName}
      >
        <BuildingOffice2Icon className="w-5 h-5 text-gray-500 dark:text-gray-400 shrink-0" />
        <span className="text-sm font-medium text-gray-700 dark:text-gray-200 max-w-[100px] sm:max-w-[180px] truncate">
          {displayName}
        </span>
        {canSwitchWorkspace && (
          <ChevronDownIcon
            className={`w-4 h-4 text-gray-400 transition-transform shrink-0 ${isOpen ? 'rotate-180' : ''}`}
          />
        )}
      </button>

      {/* Dropdown меню */}
      {isOpen && canSwitchWorkspace && (
        <div className="absolute top-full left-0 mt-1 w-72 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
          {/* Опция "Все автосалоны" для owner */}
          {canSelectAll && (
            <>
              <button
                onClick={() => handleSelect(null)}
                className={`
                  w-full flex items-center justify-between px-4 py-2.5 text-left
                  hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors
                  ${isAllDealerships ? 'bg-accent-50 dark:bg-accent-900/20' : ''}
                `}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-500 to-accent-700 flex items-center justify-center">
                    <BuildingOffice2Icon className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      Все автосалоны
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Сводные данные
                    </div>
                  </div>
                </div>
                {isAllDealerships && (
                  <CheckIcon className="w-5 h-5 text-accent-600 dark:text-accent-400" />
                )}
              </button>
              <div className="border-t border-gray-100 dark:border-gray-700 my-1" />
            </>
          )}

          {/* Список автосалонов */}
          <div className="max-h-64 overflow-y-auto">
            {availableDealerships.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 text-center">
                Нет доступных автосалонов
              </div>
            ) : (
              availableDealerships.map((dealership) => (
                <button
                  key={dealership.id}
                  onClick={() => handleSelect(dealership.id)}
                  className={`
                    w-full flex items-center justify-between px-4 py-2.5 text-left
                    hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors
                    ${dealershipId === dealership.id ? 'bg-accent-50 dark:bg-accent-900/20' : ''}
                  `}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                      <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">
                        {dealership.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {dealership.name}
                      </div>
                      {'address' in dealership && dealership.address && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {dealership.address}
                        </div>
                      )}
                    </div>
                  </div>
                  {dealershipId === dealership.id && (
                    <CheckIcon className="w-5 h-5 text-accent-600 dark:text-accent-400 flex-shrink-0" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
