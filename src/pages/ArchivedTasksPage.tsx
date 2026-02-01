import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { archivedTasksApi } from '../api/archivedTasks';
import { usersApi } from '../api/users';
import { usePermissions } from '../hooks/usePermissions';
import { useWorkspace } from '../hooks/useWorkspace';
import { useResponsiveViewMode } from '../hooks/useResponsiveViewMode';
import { usePagination } from '../hooks/usePagination';
import type { ArchivedTask, ArchivedTaskFilters } from '../types/archivedTask';
import { formatDateTime } from '../utils/dateTime';

// UI Components
import {
  PageContainer,
  Card,
  Button,
  Input,
  Select,
  Skeleton,
  ErrorState,
  EmptyState,
  FilterPanel,
  Pagination,
  ViewModeToggle,
  PageHeader,
  Tag,
  ConfirmDialog,
  StatCard,
} from '../components/ui';
import { useToast } from '../components/ui/Toast';
import { PriorityBadge, ArchiveReasonBadge, GeneratorSelector, ClickableTitle } from '../components/common';
import { ArchivedTaskDetailsModal } from '../components/tasks/ArchivedTaskDetailsModal';

// Icons
import {
  MagnifyingGlassIcon,
  CalendarIcon,
  ArrowUturnLeftIcon,
  ArrowDownTrayIcon,
  BuildingOfficeIcon,
  ArchiveBoxIcon,
  ListBulletIcon,
  Squares2X2Icon,
  UserIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';

export const ArchivedTasksPage: React.FC = () => {
  const permissions = usePermissions();
  const { dealershipId: workspaceDealershipId } = useWorkspace();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { limit } = usePagination();
  const { viewMode, setViewMode, isMobile } = useResponsiveViewMode('list', 'grid', 768, 'view_mode_archived_tasks');
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [confirmRestore, setConfirmRestore] = useState<ArchivedTask | null>(null);
  const [selectedTask, setSelectedTask] = useState<ArchivedTask | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [filters, setFilters] = useState<ArchivedTaskFilters>({
    search: '',
    archive_reason: undefined,
    priority: undefined,
    task_type: undefined,
    response_type: undefined,
    assignee_id: undefined,
    generator_id: undefined,
    date_from: '',
    date_to: '',
    sort_by: 'archived_at',
    sort_dir: 'desc',
  });

  useEffect(() => {
    setPage(1);
  }, [filters]);

  // Fetch archived tasks
  const { data: tasksData, isLoading, error } = useQuery({
    queryKey: ['archived-tasks', filters, workspaceDealershipId, page, limit],
    queryFn: () => {
      const cleanedFilters: ArchivedTaskFilters = { page, per_page: limit };

      if (workspaceDealershipId) {
        cleanedFilters.dealership_id = workspaceDealershipId;
      }

      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '' && value !== null) {
          (cleanedFilters as Record<string, unknown>)[key] = value;
        }
      });
      return archivedTasksApi.getArchivedTasks(cleanedFilters);
    },
    refetchInterval: 60000,
    placeholderData: (prev) => prev,
  });

  // Fetch statistics
  const { data: statsData } = useQuery({
    queryKey: ['archived-tasks-statistics', workspaceDealershipId],
    queryFn: () => archivedTasksApi.getStatistics(workspaceDealershipId || undefined),
    staleTime: 60000,
  });

  // Fetch users for filter
  const { data: usersData } = useQuery({
    queryKey: ['archive-users', workspaceDealershipId],
    queryFn: () => usersApi.getUsers({
      dealership_id: workspaceDealershipId || undefined,
      per_page: 100
    }),
    staleTime: 60000,
  });

  // Group users by role for filter dropdown
  const assigneeOptions = useMemo(() => {
    if (!usersData?.data) return [];

    const roleLabels: Record<string, string> = {
      owner: 'Владельцы',
      manager: 'Управляющие',
      employee: 'Сотрудники',
      observer: 'Наблюдающие',
    };

    type RoleKey = 'owner' | 'manager' | 'employee' | 'observer';
    const grouped: Record<RoleKey, typeof usersData.data> = {
      owner: [], manager: [], employee: [], observer: []
    };

    usersData.data.forEach(user => {
      const role = user.role as RoleKey;
      if (grouped[role]) grouped[role].push(user);
    });

    return Object.entries(grouped)
      .filter(([, users]) => users.length > 0)
      .map(([role, users]) => ({
        label: roleLabels[role],
        options: users.map(u => ({ value: String(u.id), label: u.full_name }))
      }));
  }, [usersData]);

  const restoreMutation = useMutation({
    mutationFn: (id: number) => archivedTasksApi.restoreTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['archived-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['archived-tasks-statistics'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['generator-stats'] });
      queryClient.invalidateQueries({ queryKey: ['task-generators'] });
      showToast({ type: 'success', message: 'Задача восстановлена из архива' });
      setConfirmRestore(null);
      setIsDetailsOpen(false);
    },
    onError: () => {
      showToast({ type: 'error', message: 'Ошибка восстановления задачи' });
    },
  });

  const handleRestore = (task: ArchivedTask) => {
    setConfirmRestore(task);
  };

  const handleViewDetails = (task: ArchivedTask) => {
    setSelectedTask(task);
    setIsDetailsOpen(true);
  };

  const handleExport = async () => {
    try {
      await archivedTasksApi.downloadCsv(filters);
      showToast({ type: 'success', message: 'Экспорт CSV начат' });
    } catch (err) {
      console.error('Export failed:', err);
      showToast({ type: 'error', message: 'Ошибка экспорта' });
    }
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      archive_reason: undefined,
      priority: undefined,
      task_type: undefined,
      response_type: undefined,
      assignee_id: undefined,
      generator_id: undefined,
      date_from: '',
      date_to: '',
      sort_by: 'archived_at',
      sort_dir: 'desc',
    });
  };

  const hasActiveFilters = filters.search || filters.archive_reason || filters.priority ||
    filters.task_type || filters.response_type ||
    filters.assignee_id || filters.generator_id || filters.date_from || filters.date_to;

  const reasonOptions = [
    { value: '', label: 'Все' },
    { value: 'completed', label: 'Выполнено' },
    { value: 'completed_late', label: 'С опозданием' },
    { value: 'expired', label: 'Просрочено' },
    { value: 'expired_after_shift', label: 'Просрочено (смена)' },
  ];

  const priorityOptions = [
    { value: '', label: 'Все приоритеты' },
    { value: 'low', label: 'Низкий' },
    { value: 'medium', label: 'Средний' },
    { value: 'high', label: 'Высокий' },
  ];

  const sortOptions = [
    { value: 'archived_at_desc', label: 'Сначала новые' },
    { value: 'archived_at_asc', label: 'Сначала старые' },
    { value: 'title_asc', label: 'По названию А-Я' },
    { value: 'title_desc', label: 'По названию Я-А' },
  ];

  const taskTypeOptions = [
    { value: '', label: 'Все типы' },
    { value: 'individual', label: 'Индивидуальная' },
    { value: 'group', label: 'Групповая' },
  ];

  const responseTypeOptions = [
    { value: '', label: 'Все типы ответа' },
    { value: 'notification', label: 'Уведомление' },
    { value: 'completion', label: 'Выполнение' },
    { value: 'completion_with_proof', label: 'С доказательством' },
  ];

  const getTaskCardClass = (task: ArchivedTask) => {
    const baseClasses = 'p-5 rounded-xl border hover:shadow-sm transition-all';

    switch (task.archive_reason) {
      case 'completed':
        return `${baseClasses} border-green-200 bg-green-50 dark:bg-green-900/10 dark:border-green-800`;
      case 'completed_late':
        return `${baseClasses} border-yellow-200 bg-yellow-50 dark:bg-yellow-900/10 dark:border-yellow-800`;
      case 'expired':
      case 'expired_after_shift':
        return `${baseClasses} border-red-200 bg-red-50 dark:bg-red-900/10 dark:border-red-800`;
      default:
        return `${baseClasses} border-gray-200 dark:border-gray-700`;
    }
  };

  const tasks = tasksData?.data || [];

  // Calculate percentages for stats
  const total = statsData?.total || 0;
  const completedPercent = total > 0 ? Math.round((statsData?.completed || 0) / total * 100) : 0;
  const completedLatePercent = total > 0 ? Math.round((statsData?.completed_late || 0) / total * 100) : 0;
  const expiredPercent = total > 0 ? Math.round((statsData?.expired || 0) / total * 100) : 0;

  return (
    <PageContainer>
      {/* Header */}
      <PageHeader
        title="Архив задач"
        description="История выполненных и просроченных задач"
      >
        <div className="flex items-center gap-3">
          {!isMobile && (
            <ViewModeToggle
              mode={viewMode}
              onChange={(mode) => setViewMode(mode as 'list' | 'grid')}
              options={[
                { value: 'list', icon: <ListBulletIcon className="w-4 h-4" /> },
                { value: 'grid', icon: <Squares2X2Icon className="w-4 h-4" /> },
              ]}
            />
          )}
          <Button
            variant="secondary"
            icon={<ArrowDownTrayIcon />}
            onClick={handleExport}
          >
            Экспорт CSV
          </Button>
        </div>
      </PageHeader>

      {/* Statistics */}
      {statsData && total > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard
            title="Всего в архиве"
            value={total}
            icon={<ArchiveBoxIcon className="w-6 h-6" />}
            variant="default"
            size="sm"
          />
          <StatCard
            title="Выполнено вовремя"
            value={statsData.completed}
            icon={<CheckCircleIcon className="w-6 h-6" />}
            variant="success"
            size="sm"
            subtitle={`${completedPercent}%`}
          />
          <StatCard
            title="С опозданием"
            value={statsData.completed_late}
            icon={<ClockIcon className="w-6 h-6" />}
            variant="warning"
            size="sm"
            subtitle={`${completedLatePercent}%`}
          />
          <StatCard
            title="Просрочено"
            value={statsData.expired}
            icon={<XCircleIcon className="w-6 h-6" />}
            variant="danger"
            size="sm"
            subtitle={`${expiredPercent}%`}
          />
        </div>
      )}

      {/* Filters */}
      <FilterPanel
        isOpen={showFilters}
        onToggle={() => setShowFilters(!showFilters)}
        onClear={hasActiveFilters ? clearFilters : undefined}
        className="mb-6"
      >
        <FilterPanel.Grid columns={4}>
          <Input
            label="Поиск"
            placeholder="Название..."
            value={filters.search || ''}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            icon={<MagnifyingGlassIcon />}
          />

          <Select
            label="Причина архивации"
            value={filters.archive_reason || ''}
            onChange={(e) => setFilters({ ...filters, archive_reason: e.target.value as ArchivedTaskFilters['archive_reason'] || undefined })}
            options={reasonOptions}
          />

          <Select
            label="Приоритет"
            value={filters.priority || ''}
            onChange={(e) => setFilters({ ...filters, priority: e.target.value || undefined })}
            options={priorityOptions}
          />

          <Select
            label="Тип задачи"
            value={filters.task_type || ''}
            onChange={(e) => setFilters({ ...filters, task_type: e.target.value as ArchivedTaskFilters['task_type'] || undefined })}
            options={taskTypeOptions}
          />

          <Select
            label="Тип ответа"
            value={filters.response_type || ''}
            onChange={(e) => setFilters({ ...filters, response_type: e.target.value as ArchivedTaskFilters['response_type'] || undefined })}
            options={responseTypeOptions}
          />

          <Select
            label="Исполнитель"
            value={filters.assignee_id ? String(filters.assignee_id) : ''}
            onChange={(e) => setFilters({ ...filters, assignee_id: e.target.value ? Number(e.target.value) : undefined })}
            options={assigneeOptions}
            placeholder="Все исполнители"
          />

          <GeneratorSelector
            label="Генератор"
            dealershipId={workspaceDealershipId}
            value={filters.generator_id || null}
            onChange={(generatorId) => setFilters({ ...filters, generator_id: generatorId || undefined })}
            showAllOption={true}
            allOptionLabel="Все генераторы"
          />

          <Input
            type="date"
            label="С даты"
            value={filters.date_from || ''}
            onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
          />

          <Input
            type="date"
            label="По дату"
            value={filters.date_to || ''}
            onChange={(e) => setFilters({ ...filters, date_to: e.target.value })}
          />

          <Select
            label="Сортировка"
            value={`${filters.sort_by}_${filters.sort_dir}`}
            onChange={(e) => {
              const [sortBy, sortDir] = e.target.value.split('_');
              setFilters({ ...filters, sort_by: sortBy, sort_dir: sortDir as 'asc' | 'desc' });
            }}
            options={sortOptions}
          />
        </FilterPanel.Grid>
      </FilterPanel>

      {/* Content */}
      {isLoading ? (
        <Card>
          <Card.Body>
            <Skeleton variant="list" count={5} />
          </Card.Body>
        </Card>
      ) : error ? (
        <ErrorState
          title="Ошибка загрузки архива"
          description="Не удалось загрузить архивированные задачи. Попробуйте обновить страницу."
          onRetry={() => queryClient.invalidateQueries({ queryKey: ['archived-tasks'] })}
        />
      ) : tasks.length === 0 ? (
        <EmptyState
          icon={<ArchiveBoxIcon className="w-16 h-16" />}
          title="Архив пуст"
          description={hasActiveFilters ? 'Попробуйте изменить фильтры' : 'Архивированные задачи появятся здесь'}
        />
      ) : (
        <>
          {/* List View */}
          {viewMode === 'list' && (
            <Card>
              <Card.Body className="space-y-4">
                {tasks.map((task) => (
                  <div key={task.id} className={getTaskCardClass(task)}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0 pr-4">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <ClickableTitle onClick={() => handleViewDetails(task)}>
                            {task.title}
                          </ClickableTitle>
                          <PriorityBadge priority={task.priority || 'medium'} />
                          <ArchiveReasonBadge reason={task.archive_reason} />
                        </div>

                        {task.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                            {task.description}
                          </p>
                        )}

                        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-500 dark:text-gray-400">
                          <span className="flex items-center">
                            <UserIcon className="w-4 h-4 mr-1" />
                            {task.task_type === 'individual' ? 'Индивидуальная' : `Групповая (${task.assignments?.length || 0})`}
                          </span>
                          <span className="flex items-center">
                            <ArchiveBoxIcon className="w-4 h-4 mr-1" />
                            {formatDateTime(task.archived_at)}
                          </span>
                          {task.deadline && (
                            <span className="flex items-center">
                              <CalendarIcon className="w-4 h-4 mr-1" />
                              Дедлайн: {formatDateTime(task.deadline)}
                            </span>
                          )}
                          {task.creator && (
                            <span className="flex items-center">
                              <UserIcon className="w-4 h-4 mr-1" />
                              {task.creator.full_name}
                            </span>
                          )}
                          <span className="flex items-center">
                            <BuildingOfficeIcon className="w-4 h-4 mr-1" />
                            {task.dealership?.name || '—'}
                          </span>
                        </div>

                        {task.tags && task.tags.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {task.tags.slice(0, 5).map((tag, idx) => (
                              <Tag key={idx} label={tag} />
                            ))}
                            {task.tags.length > 5 && (
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                +{task.tags.length - 5}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col space-y-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          icon={<EyeIcon />}
                          onClick={() => handleViewDetails(task)}
                        >
                          Детали
                        </Button>
                        {permissions.canManageTasks && (
                          <Button
                            variant="outline"
                            size="sm"
                            icon={<ArrowUturnLeftIcon />}
                            onClick={() => handleRestore(task)}
                            disabled={restoreMutation.isPending}
                            className="text-green-600 border-green-300 hover:bg-green-50 dark:text-green-400 dark:border-green-700 dark:hover:bg-green-900/20"
                          >
                            Восстановить
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </Card.Body>
            </Card>
          )}

          {/* Grid View */}
          {viewMode === 'grid' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {tasks.map((task) => (
                <Card key={task.id} className={`hover:shadow-md transition-shadow ${
                  task.archive_reason === 'completed' ? 'border-green-200 dark:border-green-800' :
                  task.archive_reason === 'completed_late' ? 'border-yellow-200 dark:border-yellow-800' :
                  task.archive_reason === 'expired' || task.archive_reason === 'expired_after_shift' ? 'border-red-200 dark:border-red-800' : ''
                }`}>
                  <Card.Body>
                    <div className="flex justify-between items-start mb-3 gap-2">
                      <ClickableTitle onClick={() => handleViewDetails(task)}>
                        {task.title}
                      </ClickableTitle>
                      <PriorityBadge priority={task.priority || 'medium'} />
                    </div>

                    <div className="mb-3">
                      <ArchiveReasonBadge reason={task.archive_reason} />
                    </div>

                    {task.description && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">
                        {task.description}
                      </p>
                    )}

                    {task.tags && task.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {task.tags.slice(0, 3).map((tag, idx) => (
                          <Tag key={idx} label={tag} />
                        ))}
                        {task.tags.length > 3 && (
                          <span className="text-xs text-gray-500">+{task.tags.length - 3}</span>
                        )}
                      </div>
                    )}

                    <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1 mb-4">
                      <div className="flex items-center gap-1">
                        <ArchiveBoxIcon className="w-3.5 h-3.5" />
                        {formatDateTime(task.archived_at)}
                      </div>
                      <div className="flex items-center gap-1">
                        <UserIcon className="w-3.5 h-3.5" />
                        {task.task_type === 'individual' ? 'Индивидуальная' : `Групповая (${task.assignments?.length || 0})`}
                      </div>
                      <div className="flex items-center gap-1">
                        <BuildingOfficeIcon className="w-3.5 h-3.5" />
                        {task.dealership?.name || '—'}
                      </div>
                    </div>

                    <div className="flex flex-col space-y-2 pt-3 border-t border-gray-100 dark:border-gray-700">
                      <Button
                        variant="secondary"
                        size="sm"
                        icon={<EyeIcon />}
                        onClick={() => handleViewDetails(task)}
                        className="w-full"
                      >
                        Детали
                      </Button>
                      {permissions.canManageTasks && (
                        <Button
                          variant="outline"
                          size="sm"
                          icon={<ArrowUturnLeftIcon />}
                          onClick={() => handleRestore(task)}
                          disabled={restoreMutation.isPending}
                          className="w-full text-green-600 border-green-300 hover:bg-green-50 dark:text-green-400 dark:border-green-700 dark:hover:bg-green-900/20"
                        >
                          Восстановить
                        </Button>
                      )}
                    </div>
                  </Card.Body>
                </Card>
              ))}
            </div>
          )}

          {/* Pagination */}
          {tasksData && tasksData.last_page > 1 && (
            <Pagination
              currentPage={page}
              totalPages={tasksData.last_page}
              total={tasksData.total}
              perPage={tasksData.per_page}
              onPageChange={setPage}
              className="mt-8"
            />
          )}
        </>
      )}

      {/* Details Modal */}
      <ArchivedTaskDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        task={selectedTask}
        onRestore={handleRestore}
        canRestore={permissions.canManageTasks}
        isRestoring={restoreMutation.isPending}
      />

      {/* Restore Confirmation */}
      <ConfirmDialog
        isOpen={!!confirmRestore}
        title={`Восстановить "${confirmRestore?.title}"?`}
        message="Задача будет перемещена из архива обратно в активные задачи"
        variant="info"
        confirmText="Восстановить"
        cancelText="Отмена"
        onConfirm={() => {
          if (confirmRestore) {
            restoreMutation.mutate(confirmRestore.id);
          }
        }}
        onCancel={() => setConfirmRestore(null)}
        isLoading={restoreMutation.isPending}
      />
    </PageContainer>
  );
};
