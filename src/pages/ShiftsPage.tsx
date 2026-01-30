import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useShifts, useCurrentShifts, useShiftsStatistics } from '../hooks/useShifts';
import { useWorkspace } from '../hooks/useWorkspace';
import { useResponsiveViewMode } from '../hooks/useResponsiveViewMode';
import { usePagination } from '../hooks/usePagination';
import { formatDateTime } from '../utils/dateTime';
import { usersApi } from '../api/users';
import { dealershipsApi } from '../api/dealerships';
import type { ShiftsFilters, Shift } from '../types/shift';
import {
  BriefcaseIcon,
  ClockIcon,
  SunIcon,
  StarIcon,
  ListBulletIcon,
  Squares2X2Icon,
  ChevronDownIcon,
  ChevronUpIcon,
  UsersIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';

import { useSearchParams } from 'react-router-dom';

import {
  PageContainer,
  PageHeader,
  ViewModeToggle,
  FilterPanel,
  Pagination,
} from '../components/ui';
import { ShiftPhotoViewer } from '../components/shifts/ShiftPhotoViewer';

export const ShiftsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { dealershipId: workspaceDealershipId } = useWorkspace();
  const { viewMode, setViewMode, isMobile } = useResponsiveViewMode('list', 'grid', 768, 'view_mode_shifts');
  const { limit } = usePagination();
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<ShiftsFilters>({
    status: searchParams.get('status') || '',
    is_late: searchParams.get('is_late') === 'true' ? true : searchParams.get('is_late') === 'false' ? false : undefined,
  });
  const [showFilters, setShowFilters] = useState(false);
  const [expandedShiftId, setExpandedShiftId] = useState<number | null>(null);
  const [dealershipFilter, setDealershipFilter] = useState<string>('');
  const [employeeFilter, setEmployeeFilter] = useState<string>('');

  // Эффективный dealership_id: из навбара или из фильтра
  const effectiveDealershipId = workspaceDealershipId ?? (dealershipFilter ? Number(dealershipFilter) : undefined);

  // Список автосалонов для фильтра (только если в навбаре "Все автосалоны")
  const { data: dealershipsData } = useQuery({
    queryKey: ['dealerships-for-shift-filter'],
    queryFn: () => dealershipsApi.getDealerships({ per_page: 100 }),
    enabled: !workspaceDealershipId,
  });

  // Список сотрудников для фильтра (зависит от выбранного автосалона)
  const { data: usersData } = useQuery({
    queryKey: ['users-for-shift-filter', effectiveDealershipId],
    queryFn: () => usersApi.getUsers({
      per_page: 100,
      dealership_id: effectiveDealershipId,
    }),
  });

  const shiftsQueryFilters: ShiftsFilters = {
    ...filters,
    per_page: limit,
    page,
    ...(effectiveDealershipId ? { dealership_id: effectiveDealershipId } : {}),
    ...(employeeFilter ? { user_id: Number(employeeFilter) } : {}),
  };

  const { data: shiftsData, isLoading, error } = useShifts(shiftsQueryFilters);
  const { data: currentShiftsData } = useCurrentShifts(workspaceDealershipId ?? undefined);
  const { data: statisticsData } = useShiftsStatistics(
    workspaceDealershipId ? { dealership_id: workspaceDealershipId } : undefined
  );
  const currentShifts = React.useMemo(() => currentShiftsData?.data || [], [currentShiftsData]);
  const statistics = statisticsData?.data;

  // Группировка текущих смен по автосалонам
  const shiftsByDealership = React.useMemo(() => {
    const grouped = new Map<string, { dealership: { id: number; name: string }; shifts: Shift[] }>();
    currentShifts.forEach(shift => {
      const key = shift.dealership?.id?.toString() || 'unknown';
      const name = shift.dealership?.name || 'Без автосалона';
      if (!grouped.has(key)) {
        grouped.set(key, { dealership: { id: shift.dealership?.id || 0, name }, shifts: [] });
      }
      grouped.get(key)!.shifts.push(shift);
    });
    return Array.from(grouped.values());
  }, [currentShifts]);

  const hasActiveFilters = !!(filters.status || filters.shift_type || filters.is_late !== undefined || dealershipFilter || employeeFilter);

  const clearFilters = () => {
    setFilters({ status: '', is_late: undefined });
    setDealershipFilter('');
    setEmployeeFilter('');
    setPage(1);
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      open: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      late: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
      replaced: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    };
    const labels: Record<string, string> = {
      open: 'Открыта',
      late: 'Опоздание',
      replaced: 'Заменена',
    };
    const cls = styles[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    const label = labels[status] || 'Закрыта';
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>
        {label}
      </span>
    );
  };

  const getShiftTypeBadge = (type: string) => {
    const config: Record<string, { cls: string; icon: React.ReactNode; label: string }> = {
      regular: { cls: 'bg-accent-100 text-accent-800 dark:bg-gray-700 dark:text-accent-300', icon: <BriefcaseIcon className="w-3 h-3 mr-1" />, label: 'Обычная' },
      overtime: { cls: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300', icon: <ClockIcon className="w-3 h-3 mr-1" />, label: 'Сверхурочная' },
      weekend: { cls: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300', icon: <SunIcon className="w-3 h-3 mr-1" />, label: 'Выходная' },
      holiday: { cls: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300', icon: <StarIcon className="w-3 h-3 mr-1" />, label: 'Праздничная' },
    };
    const c = config[type] || { cls: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300', icon: null, label: type };
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${c.cls}`}>
        {c.icon}{c.label}
      </span>
    );
  };

  const toggleExpand = (id: number) => {
    setExpandedShiftId(prev => prev === id ? null : id);
  };

  const selectClass = "unified-input block w-full rounded-xl border-gray-200 dark:border-gray-600 shadow-sm focus:outline-none focus:border-accent-500 sm:text-sm px-3 py-2 border bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200";

  return (
    <PageContainer>
      <PageHeader
        title="Смены"
        description="Отслеживание смен сотрудников в реальном времени"
      >
        {!isMobile && (
          <ViewModeToggle
            mode={viewMode}
            onChange={(mode) => setViewMode(mode as 'list' | 'grid')}
            options={[
              { value: 'list', icon: <ListBulletIcon />, label: 'Список' },
              { value: 'grid', icon: <Squares2X2Icon />, label: 'Карточки' },
            ]}
          />
        )}
      </PageHeader>

      {/* 1. Статистика */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-2 mb-1">
            <ChartBarIcon className="w-4 h-4 text-gray-400" />
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Всего смен</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{statistics?.total_shifts ?? '—'}</p>
          <p className="text-xs text-gray-400 mt-0.5">за 7 дней</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-2 mb-1">
            <UsersIcon className="w-4 h-4 text-green-500" />
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Открыто сейчас</span>
          </div>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">{currentShifts.length}</p>
          <p className="text-xs text-gray-400 mt-0.5">активных</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-2 mb-1">
            <ExclamationTriangleIcon className="w-4 h-4 text-red-500" />
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Опоздания</span>
          </div>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">{statistics?.late_shifts ?? '—'}</p>
          <p className="text-xs text-gray-400 mt-0.5">за 7 дней</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-2 mb-1">
            <ClockIcon className="w-4 h-4 text-orange-500" />
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Ср. опоздание</span>
          </div>
          <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
            {statistics?.avg_late_minutes != null ? `${Math.round(statistics.avg_late_minutes)}` : '—'}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">минут</p>
        </div>
      </div>

      {/* 2. Текущие смены — сгруппированные по автосалонам */}
      {shiftsByDealership.length > 0 && (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg mb-6 border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
              Текущие смены ({currentShifts.length})
            </h2>
          </div>
          <div className="p-5 space-y-5">
            {shiftsByDealership.map(({ dealership, shifts }) => (
              <div key={dealership.id}>
                {/* Заголовок автосалона */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-7 w-7 rounded-full bg-accent-50 dark:bg-accent-900/50 flex items-center justify-center text-accent-600 dark:text-accent-400">
                    <BriefcaseIcon className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{dealership.name}</span>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                  <span className="text-xs text-gray-400">({shifts.length})</span>
                </div>
                {/* Карточки сотрудников */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 items-start">
                  {shifts.map((shift) => (
                    <div
                      key={shift.id}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-700/30 cursor-pointer hover:shadow-sm transition-all"
                      onClick={() => toggleExpand(shift.id)}
                    >
                      <div className="p-3">
                        <div className="flex items-center justify-between mb-1.5">
                          <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {shift.user?.full_name}
                          </h3>
                          <div className="flex items-center gap-1.5">
                            {getStatusBadge(shift.status)}
                            {expandedShiftId === shift.id
                              ? <ChevronUpIcon className="w-4 h-4 text-gray-400" />
                              : <ChevronDownIcon className="w-4 h-4 text-gray-400" />
                            }
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Начало: {formatDateTime(shift.shift_start)}
                        </div>
                        {shift.is_late && (
                          <div className="text-xs font-medium text-red-600 dark:text-red-400 mt-0.5">
                            Опоздание: {shift.late_minutes} мин
                          </div>
                        )}
                      </div>
                      {/* Раскрытие — детали */}
                      {expandedShiftId === shift.id && (
                        <div className="px-3 pb-3 pt-2 border-t border-gray-200 dark:border-gray-600 space-y-1.5 text-xs text-gray-500 dark:text-gray-400">
                          <div className="flex items-center gap-1.5">
                            <span>Тип:</span>
                            {getShiftTypeBadge(shift.shift_type)}
                          </div>
                          {shift.break_duration && (
                            <div>Перерыв: {shift.break_duration} мин</div>
                          )}
                          {(shift.opening_photo_url || shift.closing_photo_url) && (
                            <div className="pt-1">
                              <ShiftPhotoViewer
                                openingPhotoUrl={shift.opening_photo_url}
                                closingPhotoUrl={shift.closing_photo_url}
                                shiftId={shift.id}
                                userName={shift.user?.full_name}
                                compact
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Фильтры */}
      <FilterPanel
        isOpen={showFilters}
        onToggle={() => setShowFilters(!showFilters)}
        onClear={hasActiveFilters ? clearFilters : undefined}
        className="mb-6"
      >
        <FilterPanel.Grid columns={!workspaceDealershipId ? 5 : 4}>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Статус</label>
            <select
              value={filters.status}
              onChange={(e) => { setFilters({ ...filters, status: e.target.value }); setPage(1); }}
              className={selectClass}
            >
              <option value="">Все</option>
              <option value="open">Открыта</option>
              <option value="closed">Закрыта</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Тип смены</label>
            <select
              value={filters.shift_type || ''}
              onChange={(e) => { setFilters({ ...filters, shift_type: e.target.value || undefined }); setPage(1); }}
              className={selectClass}
            >
              <option value="">Все</option>
              <option value="regular">Обычная</option>
              <option value="overtime">Сверхурочная</option>
              <option value="weekend">Выходная</option>
              <option value="holiday">Праздничная</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Опоздания</label>
            <select
              value={filters.is_late === undefined ? '' : filters.is_late ? 'true' : 'false'}
              onChange={(e) => {
                setFilters({
                  ...filters,
                  is_late: e.target.value === '' ? undefined : e.target.value === 'true',
                });
                setPage(1);
              }}
              className={selectClass}
            >
              <option value="">Все</option>
              <option value="true">Только опоздания</option>
              <option value="false">Без опозданий</option>
            </select>
          </div>
          {!workspaceDealershipId && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Автосалон</label>
              <select
                value={dealershipFilter}
                onChange={(e) => { setDealershipFilter(e.target.value); setEmployeeFilter(''); setPage(1); }}
                className={selectClass}
              >
                <option value="">Все</option>
                {dealershipsData?.data?.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Сотрудник</label>
            <select
              value={employeeFilter}
              onChange={(e) => { setEmployeeFilter(e.target.value); setPage(1); }}
              className={selectClass}
            >
              <option value="">Все</option>
              {usersData?.data?.map((u) => (
                <option key={u.id} value={u.id}>{u.full_name}</option>
              ))}
            </select>
          </div>
        </FilterPanel.Grid>
      </FilterPanel>

      {/* 4. История смен */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">
            История смен
          </h2>
        </div>

        <div className="p-6">
          {isLoading ? (
            <div className="animate-pulse space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
              ))}
            </div>
          ) : error ? (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-red-800 dark:text-red-200 text-sm">Ошибка загрузки смен</p>
            </div>
          ) : shiftsData?.data.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400 text-sm">Смены не найдены</p>
            </div>
          ) : (
            <>
              {/* Список */}
              {viewMode === 'list' && (
                <div className="space-y-3">
                  {shiftsData?.data.map((shift) => (
                    <div key={shift.id} className="p-3 sm:p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-sm dark:hover:bg-gray-700/50 transition-all">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center flex-wrap gap-2 mb-1.5">
                            <h3 className="text-sm font-medium text-gray-900 dark:text-white">{shift.user?.full_name}</h3>
                            {getStatusBadge(shift.status)}
                            {shift.is_late && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300">
                                Опоздание {shift.late_minutes} мин
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                            <div className="flex flex-wrap gap-x-4">
                              <span>Начало: {formatDateTime(shift.shift_start)}</span>
                              {shift.shift_end && <span>Конец: {formatDateTime(shift.shift_end)}</span>}
                            </div>
                            <div className="flex flex-wrap gap-x-3 items-center">
                              <div className="flex items-center gap-1">
                                <span>Тип:</span>
                                {getShiftTypeBadge(shift.shift_type)}
                              </div>
                              {shift.break_duration && <span>Перерыв: {shift.break_duration} мин</span>}
                              {shift.dealership && <span>Автосалон: {shift.dealership.name}</span>}
                            </div>
                          </div>
                        </div>
                        {(shift.opening_photo_url || shift.closing_photo_url) && (
                          <div className="flex-shrink-0">
                            <ShiftPhotoViewer
                              openingPhotoUrl={shift.opening_photo_url}
                              closingPhotoUrl={shift.closing_photo_url}
                              shiftId={shift.id}
                              userName={shift.user?.full_name}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Сетка */}
              {viewMode === 'grid' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {shiftsData?.data.map((shift) => (
                    <div key={shift.id} className="p-3 sm:p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md dark:hover:bg-gray-700/50 transition-shadow">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">{shift.user?.full_name}</h3>
                        {getStatusBadge(shift.status)}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1.5">
                        <div>Начало: {formatDateTime(shift.shift_start)}</div>
                        {shift.shift_end && <div>Конец: {formatDateTime(shift.shift_end)}</div>}
                        <div className="flex items-center gap-1">
                          <span>Тип:</span>
                          {getShiftTypeBadge(shift.shift_type)}
                        </div>
                        {shift.is_late && (
                          <div className="text-red-600 dark:text-red-400 font-medium">
                            Опоздание: {shift.late_minutes} мин
                          </div>
                        )}
                        {shift.dealership && <div>Автосалон: {shift.dealership.name}</div>}
                        {(shift.opening_photo_url || shift.closing_photo_url) && (
                          <div className="pt-1.5 border-t border-gray-200 dark:border-gray-600">
                            <ShiftPhotoViewer
                              openingPhotoUrl={shift.opening_photo_url}
                              closingPhotoUrl={shift.closing_photo_url}
                              shiftId={shift.id}
                              userName={shift.user?.full_name}
                              compact
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {shiftsData && shiftsData.last_page > 1 && (
            <Pagination
              currentPage={page}
              totalPages={shiftsData.last_page}
              onPageChange={setPage}
              total={shiftsData.total}
              perPage={shiftsData.per_page}
              showInfo
            />
          )}
        </div>
      </div>
    </PageContainer>
  );
};
