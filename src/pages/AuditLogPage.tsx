import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { auditLogsApi, type AuditLog } from '../api/auditLogs';
import { dealershipsApi } from '../api/dealerships';
import { formatDateTime } from '../utils/dateTime';
import {
  DocumentMagnifyingGlassIcon,
  PlusCircleIcon,
  PencilSquareIcon,
  TrashIcon,
  UserIcon,
  CalendarIcon,
  BuildingStorefrontIcon,
  XMarkIcon,
  HashtagIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';

import { usePermissions } from '../hooks/usePermissions';

import {
  Button,
  Skeleton,
  EmptyState,
  ErrorState,
  PageContainer,
  Card,
  Pagination,
  PageHeader,
  Badge,
  Modal,
  Select,
  Input,
} from '../components/ui';

const getActionInfo = (action: string): { label: string; variant: 'success' | 'warning' | 'danger' | 'info' | 'gray'; icon: React.ReactNode } => {
  switch (action) {
    case 'created':
      return {
        label: 'Создание',
        variant: 'success',
        icon: <PlusCircleIcon className="w-4 h-4" />,
      };
    case 'updated':
      return {
        label: 'Обновление',
        variant: 'warning',
        icon: <PencilSquareIcon className="w-4 h-4" />,
      };
    case 'deleted':
      return {
        label: 'Удаление',
        variant: 'danger',
        icon: <TrashIcon className="w-4 h-4" />,
      };
    default:
      return {
        label: action,
        variant: 'gray',
        icon: <DocumentMagnifyingGlassIcon className="w-4 h-4" />,
      };
  }
};

const TABLE_OPTIONS = [
  { value: '', label: 'Все таблицы' },
  { value: 'tasks', label: 'Задачи' },
  { value: 'task_responses', label: 'Ответы на задачи' },
  { value: 'shifts', label: 'Смены' },
  { value: 'users', label: 'Пользователи' },
  { value: 'auto_dealerships', label: 'Автосалоны' },
];

const ACTION_OPTIONS = [
  { value: '', label: 'Все действия' },
  { value: 'created', label: 'Создание' },
  { value: 'updated', label: 'Обновление' },
  { value: 'deleted', label: 'Удаление' },
];

/**
 * Проверяет, является ли значение строкой даты.
 * Поддерживает ISO 8601 с Z суффиксом и старый формат Y-m-d H:i:s.
 */
const isDateString = (value: unknown): boolean => {
  if (typeof value !== 'string') return false;
  // ISO 8601: 2026-01-27T10:00:00Z или старый формат: 2026-01-27 10:00:00
  return /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(Z|$)/.test(value);
};

/**
 * Форматирует значение для отображения в PayloadViewer.
 * Даты конвертируются в локальное время пользователя.
 */
const formatPayloadValue = (value: unknown): string => {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (isDateString(value)) {
    // Для старого формата "Y-m-d H:i:s" добавляем Z для корректного парсинга как UTC
    const isoString = (value as string).includes('T') ? value as string : (value as string).replace(' ', 'T') + 'Z';
    return formatDateTime(isoString, 'dd.MM.yyyy HH:mm:ss');
  }
  if (typeof value === 'string') return value;
  return JSON.stringify(value, null, 2);
};

const PayloadViewer: React.FC<{ payload: Record<string, unknown>; action: string }> = ({ payload, action }) => {
  if (action === 'updated' && payload.old && payload.new) {
    const oldData = payload.old as Record<string, unknown>;
    const newData = payload.new as Record<string, unknown>;
    const changedFields = Object.keys(newData);

    return (
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Изменённые поля:</h4>
        <div className="space-y-2">
          {changedFields.map((field) => (
            <div key={field} className="bg-gray-50 dark:bg-gray-800 p-3 rounded-xl">
              <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">{field}</div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs text-red-600 dark:text-red-400 block mb-1">Было:</span>
                  <code className="text-sm bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded text-red-700 dark:text-red-300 block break-all whitespace-pre-wrap">
                    {formatPayloadValue(oldData[field])}
                  </code>
                </div>
                <div>
                  <span className="text-xs text-green-600 dark:text-green-400 block mb-1">Стало:</span>
                  <code className="text-sm bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded text-green-700 dark:text-green-300 block break-all whitespace-pre-wrap">
                    {formatPayloadValue(newData[field])}
                  </code>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Для created/deleted: рекурсивно форматируем все даты в объекте
  const formatPayloadObject = (obj: Record<string, unknown>): Record<string, unknown> => {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (isDateString(value)) {
        const isoString = (value as string).includes('T') ? value as string : (value as string).replace(' ', 'T') + 'Z';
        result[key] = formatDateTime(isoString, 'dd.MM.yyyy HH:mm:ss');
      } else if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        result[key] = formatPayloadObject(value as Record<string, unknown>);
      } else {
        result[key] = value;
      }
    }
    return result;
  };

  return (
    <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-xl overflow-auto max-h-96 text-sm">
      {JSON.stringify(formatPayloadObject(payload), null, 2)}
    </pre>
  );
};

export const AuditLogPage: React.FC = () => {
  const permissions = usePermissions();
  const [page, setPage] = useState(1);
  const [tableFilter, setTableFilter] = useState<string>('');
  const [actionFilter, setActionFilter] = useState<string>('');
  const [actorFilter, setActorFilter] = useState<string>('');
  const [dealershipFilter, setDealershipFilter] = useState<string>('');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [logIdSearch, setLogIdSearch] = useState<string>('');
  const [recordIdSearch, setRecordIdSearch] = useState<string>('');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Запрос автосалонов для фильтра
  const { data: dealershipsData } = useQuery({
    queryKey: ['dealerships-for-filter'],
    queryFn: () => dealershipsApi.getDealerships({ per_page: 100 }),
    enabled: permissions.isOwner,
  });

  // Запрос пользователей (actors) для фильтра
  const { data: actorsData } = useQuery({
    queryKey: ['audit-actors', dealershipFilter],
    queryFn: () => auditLogsApi.getActors({
      dealership_id: dealershipFilter ? Number(dealershipFilter) : undefined,
    }),
    enabled: permissions.isOwner,
  });

  // Запрос логов аудита
  const { data: logsData, isLoading, error, refetch } = useQuery({
    queryKey: ['audit-logs', page, logIdSearch, tableFilter, actionFilter, actorFilter, dealershipFilter, fromDate, toDate, recordIdSearch],
    queryFn: () => auditLogsApi.getAuditLogs({
      log_id: logIdSearch ? Number(logIdSearch) : undefined,
      table_name: tableFilter || undefined,
      action: actionFilter || undefined,
      actor_id: actorFilter ? Number(actorFilter) : undefined,
      dealership_id: dealershipFilter ? Number(dealershipFilter) : undefined,
      from_date: fromDate || undefined,
      to_date: toDate || undefined,
      record_id: recordIdSearch ? Number(recordIdSearch) : undefined,
      page,
      per_page: 25,
    }),
    enabled: permissions.isOwner,
    placeholderData: (prev) => prev,
  });

  // Опции для фильтра автосалонов
  const dealershipOptions = useMemo(() => {
    const options = [{ value: '', label: 'Все автосалоны' }];
    if (dealershipsData?.data) {
      dealershipsData.data.forEach((d) => {
        options.push({ value: String(d.id), label: d.name });
      });
    }
    return options;
  }, [dealershipsData]);

  // Опции для фильтра пользователей (с группировкой по ролям)
  const actorOptions = useMemo(() => {
    if (!actorsData?.data || actorsData.data.length === 0) {
      return [{ value: '', label: 'Все пользователи' }];
    }

    // Группируем пользователей по ролям
    const roleLabels: Record<string, string> = {
      owner: 'Владельцы',
      manager: 'Управляющие',
      employee: 'Сотрудники',
      observer: 'Наблюдающие',
    };

    const groupedActors: Record<string, typeof actorsData.data> = {
      owner: [],
      manager: [],
      employee: [],
      observer: [],
    };

    actorsData.data.forEach((actor) => {
      if (actor.role && groupedActors[actor.role]) {
        groupedActors[actor.role].push(actor);
      }
    });

    // Создаем структуру с группами (БЕЗ пустой первой группы)
    const groups: Array<{ label: string; options: Array<{ value: string; label: string }> }> = [];

    // Добавляем группы для каждой роли (только если есть пользователи)
    (['owner', 'manager', 'employee', 'observer'] as const).forEach((role) => {
      if (groupedActors[role].length > 0) {
        groups.push({
          label: roleLabels[role],
          options: groupedActors[role].map((actor) => ({
            value: String(actor.id),
            label: actor.full_name,
          })),
        });
      }
    });

    return groups;
  }, [actorsData]);

  // Проверка активности фильтров
  const hasActiveFilters = logIdSearch || tableFilter || actionFilter || actorFilter || dealershipFilter || fromDate || toDate || recordIdSearch;

  const handleResetFilters = () => {
    setLogIdSearch('');
    setTableFilter('');
    setActionFilter('');
    setActorFilter('');
    setDealershipFilter('');
    setFromDate('');
    setToDate('');
    setRecordIdSearch('');
    setPage(1);
  };

  const handleViewDetails = (log: AuditLog) => {
    setSelectedLog(log);
    setIsDetailModalOpen(true);
  };

  if (!permissions.isOwner) {
    return (
      <PageContainer>
        <ErrorState
          title="Доступ запрещён"
          description="Страница аудита доступна только владельцу системы"
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Журнал аудита"
        description="История всех изменений в системе"
      />

      {/* Фильтры */}
      <Card className="mb-6">
        <Card.Body>
          {/* Первая строка фильтров */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <Select
              label="Тип записи"
              value={tableFilter}
              onChange={(e) => {
                setTableFilter(e.target.value);
                setPage(1);
              }}
              options={TABLE_OPTIONS}
            />
            <Select
              label="Действие"
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value);
                setPage(1);
              }}
              options={ACTION_OPTIONS}
            />
            <Select
              label="Автосалон"
              value={dealershipFilter}
              onChange={(e) => {
                setDealershipFilter(e.target.value);
                setActorFilter(''); // Сбрасываем выбранного пользователя при смене автосалона
                setPage(1);
              }}
              options={dealershipOptions}
            />
            <Select
              label="Пользователь"
              value={actorFilter}
              onChange={(e) => {
                setActorFilter(e.target.value);
                setPage(1);
              }}
              options={actorOptions}
              placeholder="Все пользователи"
            />
          </div>

          {/* Вторая строка фильтров */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <Input
              type="number"
              label="ID Журнала"
              placeholder="Поиск по ID"
              value={logIdSearch}
              onChange={(e) => {
                setLogIdSearch(e.target.value);
                setPage(1);
              }}
              icon={<HashtagIcon />}
            />
            <Input
              type="date"
              label="Дата от"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value);
                setPage(1);
              }}
            />
            <Input
              type="date"
              label="Дата до"
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value);
                setPage(1);
              }}
            />
            <Input
              type="number"
              label="ID записи"
              placeholder="Поиск по ID"
              value={recordIdSearch}
              onChange={(e) => {
                setRecordIdSearch(e.target.value);
                setPage(1);
              }}
              icon={<HashtagIcon />}
            />
            <div className="flex items-end gap-2">
              {hasActiveFilters && (
                <Button
                  variant="secondary"
                  onClick={handleResetFilters}
                  className="whitespace-nowrap"
                >
                  <XMarkIcon className="w-4 h-4 mr-1" />
                  Сбросить
                </Button>
              )}
              <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 ml-auto">
                <FunnelIcon className="w-4 h-4 mr-1" />
                Найдено: {logsData?.total || 0}
              </div>
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* Контент */}
      {isLoading ? (
        <Card>
          <Card.Body>
            <Skeleton variant="list" count={10} />
          </Card.Body>
        </Card>
      ) : error ? (
        <ErrorState
          title="Ошибка загрузки"
          onRetry={() => refetch()}
        />
      ) : logsData?.data.length === 0 ? (
        <EmptyState
          icon={<DocumentMagnifyingGlassIcon />}
          title="Нет записей"
          description={hasActiveFilters
            ? "Нет записей по выбранным фильтрам. Попробуйте изменить параметры поиска."
            : "Журнал аудита пуст"
          }
          action={hasActiveFilters ? (
            <Button variant="secondary" onClick={handleResetFilters}>
              Сбросить фильтры
            </Button>
          ) : undefined}
        />
      ) : (
        <>
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Дата
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Тип записи
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Действие
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Запись
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Автосалон
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Пользователь
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Действия
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {logsData?.data.map((log) => {
                    const actionInfo = getActionInfo(log.action);
                    return (
                      <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          <span className="font-mono">#{log.id}</span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                            <CalendarIcon className="w-4 h-4 mr-2 flex-shrink-0" />
                            <span>{formatDateTime(log.created_at, 'dd.MM.yyyy HH:mm')}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="text-sm text-gray-900 dark:text-gray-100">
                            {log.table_label}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <Badge variant={actionInfo.variant}>
                            <span className="flex items-center gap-1">
                              {actionInfo.icon}
                              {actionInfo.label}
                            </span>
                          </Badge>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="text-sm font-mono text-gray-600 dark:text-gray-400">
                            #{log.record_id}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {log.dealership ? (
                            <div className="flex items-center text-sm">
                              <BuildingStorefrontIcon className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" />
                              <span className="text-gray-900 dark:text-gray-100 truncate max-w-[150px]" title={log.dealership.name}>
                                {log.dealership.name}
                              </span>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {log.actor ? (
                            <div className="flex items-center text-sm">
                              <UserIcon className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" />
                              <span className="text-gray-900 dark:text-gray-100 truncate max-w-[150px]" title={log.actor.full_name}>
                                {log.actor.full_name}
                              </span>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">Система</span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleViewDetails(log)}
                          >
                            Детали
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Пагинация */}
          {logsData && logsData.last_page > 1 && (
            <Pagination
              currentPage={page}
              totalPages={logsData.last_page}
              total={logsData.total}
              perPage={logsData.per_page}
              onPageChange={setPage}
              className="mt-8"
            />
          )}
        </>
      )}

      {/* Модальное окно деталей */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedLog(null);
        }}
        title="Детали записи аудита"
        size="lg"
      >
        <Modal.Body>
          {selectedLog && (
            <div className="space-y-6">
              {/* Основная информация */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">ID записи аудита</label>
                  <p className="text-gray-900 dark:text-gray-100 font-mono">#{selectedLog.id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Дата и время</label>
                  <p className="text-gray-900 dark:text-gray-100">
                    {formatDateTime(selectedLog.created_at, 'dd MMMM yyyy, HH:mm:ss')}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Тип записи</label>
                  <p className="text-gray-900 dark:text-gray-100">{selectedLog.table_label}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Действие</label>
                  <div className="mt-1">
                    <Badge variant={getActionInfo(selectedLog.action).variant}>
                      <span className="flex items-center gap-1">
                        {getActionInfo(selectedLog.action).icon}
                        {getActionInfo(selectedLog.action).label}
                      </span>
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">ID записи в таблице</label>
                  <p className="text-gray-900 dark:text-gray-100 font-mono">#{selectedLog.record_id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Автосалон</label>
                  <p className="text-gray-900 dark:text-gray-100">
                    {selectedLog.dealership ? selectedLog.dealership.name : '—'}
                  </p>
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Пользователь</label>
                  <p className="text-gray-900 dark:text-gray-100">
                    {selectedLog.actor
                      ? `${selectedLog.actor.full_name} (${selectedLog.actor.email})`
                      : 'Система'}
                  </p>
                </div>
              </div>

              {/* Данные изменений */}
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400 block mb-2">
                  {selectedLog.action === 'updated' ? 'Изменения' : 'Данные'}
                </label>
                <PayloadViewer payload={selectedLog.payload} action={selectedLog.action} />
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => {
              setIsDetailModalOpen(false);
              setSelectedLog(null);
            }}
          >
            Закрыть
          </Button>
        </Modal.Footer>
      </Modal>
    </PageContainer>
  );
};
