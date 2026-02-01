import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { taskGeneratorsApi } from '../api/taskGenerators';
import { usePermissions } from '../hooks/usePermissions';
import { useWorkspace } from '../hooks/useWorkspace';
import { usePagination } from '../hooks/usePagination';
import { useResponsiveViewMode } from '../hooks/useResponsiveViewMode';
import { TaskGeneratorModal } from '../components/generators/TaskGeneratorModal';
import { GeneratorDetailsModal } from '../components/generators/GeneratorDetailsModal';
import type { TaskGenerator, TaskGeneratorFilters } from '../types/taskGenerator';
import { formatDateTime, formatDateTimeShort } from '../utils/dateTime';

// UI Components
import {
  PageContainer,
  PageHeader,
  Card,
  Button,
  Input,
  Select,
  Skeleton,
  EmptyState,
  ErrorState,
  Badge,
  FilterPanel,
  Pagination,
  ViewModeToggle,
  ConfirmDialog,
} from '../components/ui';
import { useToast } from '../components/ui/Toast';

// Icons
import { ClickableTitle } from '../components/common';
import {
  PlusIcon,
  CalendarIcon,
  UserIcon,
  ClockIcon,
  CheckCircleIcon,
  PencilIcon,
  TrashIcon,
  PlayIcon,
  PauseIcon,
  ChartBarIcon,
  BuildingOfficeIcon,
  ArrowPathIcon,
  ListBulletIcon,
  Squares2X2Icon,
  UserGroupIcon,
  StopCircleIcon,
} from '@heroicons/react/24/outline';

export const TaskGeneratorsPage: React.FC = () => {
  const permissions = usePermissions();
  const { dealershipId: workspaceDealershipId } = useWorkspace();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { limit } = usePagination();
  const { viewMode, setViewMode, isMobile } = useResponsiveViewMode('list', 'grid', 768, 'view_mode_task_generators');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedGenerator, setSelectedGenerator] = useState<TaskGenerator | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [confirmDelete, setConfirmDelete] = useState<TaskGenerator | null>(null);
  const [confirmPauseAll, setConfirmPauseAll] = useState(false);
  const [detailsGenerator, setDetailsGenerator] = useState<TaskGenerator | null>(null);
  const [filters, setFilters] = useState<TaskGeneratorFilters>({
    search: '',
    is_active: undefined,
    recurrence: undefined,
    sort_by: 'created_at',
    sort_dir: 'desc',
  });

  useEffect(() => {
    setPage(1);
  }, [filters, workspaceDealershipId]);

  const { data: generatorsData, isLoading, error, refetch } = useQuery({
    queryKey: ['task-generators', filters, workspaceDealershipId, page, limit],
    queryFn: () => {
      const cleanedFilters: TaskGeneratorFilters = { page, per_page: limit };

      // Добавляем фильтр по workspace
      if (workspaceDealershipId) {
        cleanedFilters.dealership_id = workspaceDealershipId;
      }

      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '' && value !== null) {
          (cleanedFilters as Record<string, unknown>)[key] = value;
        }
      });
      return taskGeneratorsApi.getGenerators(cleanedFilters);
    },
    refetchInterval: 60000,
    placeholderData: (prev) => prev,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => taskGeneratorsApi.deleteGenerator(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-generators'] });
      showToast({ type: 'success', message: 'Генератор удалён' });
      setConfirmDelete(null);
    },
    onError: () => {
      showToast({ type: 'error', message: 'Ошибка удаления генератора' });
    },
  });

  const pauseMutation = useMutation({
    mutationFn: (id: number) => taskGeneratorsApi.pauseGenerator(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-generators'] });
      showToast({ type: 'success', message: 'Генератор приостановлен' });
    },
    onError: () => {
      showToast({ type: 'error', message: 'Ошибка приостановки генератора' });
    },
  });

  const resumeMutation = useMutation({
    mutationFn: (id: number) => taskGeneratorsApi.resumeGenerator(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-generators'] });
      showToast({ type: 'success', message: 'Генератор запущен' });
    },
    onError: () => {
      showToast({ type: 'error', message: 'Ошибка запуска генератора' });
    },
  });

  const pauseAllMutation = useMutation({
    mutationFn: () => taskGeneratorsApi.pauseAll(),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['task-generators'] });
      showToast({ type: 'success', message: data.message });
      setConfirmPauseAll(false);
    },
    onError: () => {
      showToast({ type: 'error', message: 'Ошибка при остановке генераторов' });
    },
  });

  const resumeAllMutation = useMutation({
    mutationFn: () => taskGeneratorsApi.resumeAll(),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['task-generators'] });
      showToast({ type: 'success', message: data.message });
      setConfirmPauseAll(false);
    },
    onError: () => {
      showToast({ type: 'error', message: 'Ошибка при запуске генераторов' });
    },
  });

  const handleCreate = () => {
    setSelectedGenerator(null);
    setIsModalOpen(true);
  };

  const handleEdit = (generator: TaskGenerator) => {
    setSelectedGenerator(generator);
    setIsModalOpen(true);
  };

  const handleDelete = (generator: TaskGenerator) => {
    setConfirmDelete(generator);
  };

  const handlePauseResume = (generator: TaskGenerator) => {
    if (generator.is_active) {
      pauseMutation.mutate(generator.id);
    } else {
      resumeMutation.mutate(generator.id);
    }
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      is_active: undefined,
      recurrence: undefined,
      sort_by: 'created_at',
      sort_dir: 'desc',
    });
    setPage(1);
  };

  const sortOptions = [
    { value: 'created_at_desc', label: 'Сначала новые' },
    { value: 'created_at_asc', label: 'Сначала старые' },
    { value: 'title_asc', label: 'По названию А-Я' },
    { value: 'title_desc', label: 'По названию Я-А' },
  ];

  const hasActiveFilters = filters.search || filters.is_active !== undefined || filters.recurrence;

  const statusOptions = [
    { value: '', label: 'Все' },
    { value: 'true', label: 'Активные' },
    { value: 'false', label: 'Приостановленные' },
  ];

  const recurrenceOptions = [
    { value: '', label: 'Все' },
    { value: 'daily', label: 'Ежедневно' },
    { value: 'weekly', label: 'Еженедельно' },
    { value: 'monthly', label: 'Ежемесячно' },
  ];

  const getRecurrenceLabel = (recurrence: string) => {
    const labels: Record<string, string> = {
      daily: 'Ежедневно',
      weekly: 'Еженедельно',
      monthly: 'Ежемесячно',
    };
    return labels[recurrence] || recurrence;
  };

  const getRecurrenceBadge = (recurrence: string) => {
    const variants: Record<string, 'success' | 'info' | 'purple'> = {
      daily: 'success',
      weekly: 'info',
      monthly: 'purple',
    };
    return (
      <Badge variant={variants[recurrence] || 'gray'} size="sm" icon={<ArrowPathIcon className="w-3 h-3" />}>
        {getRecurrenceLabel(recurrence)}
      </Badge>
    );
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge variant="success" size="sm" icon={<CheckCircleIcon className="w-3 h-3" />}>
        Активен
      </Badge>
    ) : (
      <Badge variant="gray" size="sm" icon={<PauseIcon className="w-3 h-3" />}>
        Приостановлен
      </Badge>
    );
  };

  const generators = generatorsData?.data || [];
  const allPaused = generators.length > 0 && generators.every(g => !g.is_active);

  return (
    <PageContainer>
      {/* Header */}
      <PageHeader
        title="Генераторы задач"
        description="Автоматическое создание периодических задач"
      >
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
        {permissions.isOwner && generators.length > 0 && (
          <Button
            variant={allPaused ? 'primary' : 'danger'}
            icon={allPaused ? <PlayIcon /> : <StopCircleIcon />}
            onClick={() => setConfirmPauseAll(true)}
            disabled={pauseAllMutation.isPending || resumeAllMutation.isPending}
          >
            {allPaused ? 'Запустить все' : 'Остановить все'}
          </Button>
        )}
        {permissions.canManageTasks && (
          <Button
            variant="primary"
            icon={<PlusIcon />}
            onClick={handleCreate}
          >
            Создать генератор
          </Button>
        )}
      </PageHeader>

      {/* Filters */}
      <FilterPanel
        isOpen={showFilters}
        onToggle={() => setShowFilters(!showFilters)}
        onClear={clearFilters}
        className="mb-6"
      >
        <FilterPanel.Grid columns={4}>
          <Input
            label="Поиск"
            placeholder="Название генератора..."
            value={filters.search || ''}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
          />

          <Select
            label="Статус"
            value={filters.is_active === undefined ? '' : String(filters.is_active)}
            onChange={(e) => setFilters(prev => ({ ...prev, is_active: e.target.value === '' ? undefined : e.target.value === 'true' }))}
            options={statusOptions}
          />

          <Select
            label="Повторяемость"
            value={filters.recurrence || ''}
            onChange={(e) => setFilters(prev => ({ ...prev, recurrence: e.target.value as TaskGeneratorFilters['recurrence'] || undefined }))}
            options={recurrenceOptions}
          />

          <Select
            label="Сортировка"
            value={`${filters.sort_by}_${filters.sort_dir}`}
            onChange={(e) => {
              const parts = e.target.value.split('_');
              const sortDir = parts.pop() as 'asc' | 'desc';
              const sortBy = parts.join('_');
              setFilters(prev => ({ ...prev, sort_by: sortBy, sort_dir: sortDir as 'asc' | 'desc' }));
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
          title="Ошибка загрузки"
          description="Не удалось загрузить генераторы задач. Попробуйте обновить страницу."
          onRetry={() => refetch()}
        />
      ) : generators.length === 0 ? (
        <EmptyState
          icon={<ArrowPathIcon className="w-16 h-16" />}
          title="Нет генераторов"
          description={hasActiveFilters ? 'Попробуйте изменить параметры поиска' : 'Начните с создания нового генератора задач'}
          action={permissions.canManageTasks && !hasActiveFilters ? (
            <Button variant="primary" icon={<PlusIcon />} onClick={handleCreate}>
              Создать генератор
            </Button>
          ) : undefined}
        />
      ) : (
        <>
          {/* List View */}
          {viewMode === 'list' && (
            <Card>
              <Card.Body className="p-4 space-y-4">
                {generators.map((generator) => (
                  <div
                    key={generator.id}
                    onClick={() => setDetailsGenerator(generator)}
                    className={`p-5 rounded-xl border transition-all cursor-pointer ${generator.is_active
                      ? 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:shadow-md'
                      : 'bg-gray-50 dark:bg-gray-900/50 border-gray-300 dark:border-gray-600 opacity-75'
                      }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <ClickableTitle onClick={() => setDetailsGenerator(generator)}>
                            {generator.title}
                          </ClickableTitle>
                          {getStatusBadge(generator.is_active)}
                          {getRecurrenceBadge(generator.recurrence)}
                        </div>

                        {generator.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                            {generator.description}
                          </p>
                        )}

                        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-500 dark:text-gray-400">
                          <span className="flex items-center gap-1">
                            <ClockIcon className="w-4 h-4" />
                            {generator.recurrence_time?.slice(0, 5)} → {generator.deadline_time?.slice(0, 5)}
                          </span>
                          <span className="flex items-center gap-1">
                            <UserIcon className="w-4 h-4" />
                            {generator.task_type === 'individual' ? 'Индивидуальная' : 'Групповая'}
                          </span>
                          <span className="flex items-center gap-1">
                            <CalendarIcon className="w-4 h-4" />
                            С {formatDateTime(generator.start_date, 'dd.MM.yyyy')}
                            {generator.end_date && ` по ${formatDateTime(generator.end_date, 'dd.MM.yyyy')}`}
                          </span>
                          <span className="flex items-center gap-1">
                            <BuildingOfficeIcon className="w-4 h-4" />
                            {generator.dealership?.name || 'Все салоны'}
                          </span>
                          {generator.total_generated !== undefined && (
                            <span className="flex items-center gap-1">
                              <ChartBarIcon className="w-4 h-4" />
                              Создано: {generator.total_generated}
                            </span>
                          )}
                        </div>

                        {generator.assignments && generator.assignments.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {generator.assignments.slice(0, 5).map((assignment) => (
                              <span
                                key={assignment.id}
                                className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-accent-100 text-accent-800 dark:bg-gray-700 dark:text-accent-300"
                              >
                                <UserIcon className="w-3 h-3 mr-1" />
                                {assignment.user?.full_name}
                              </span>
                            ))}
                            {generator.assignments.length > 5 && (
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                +{generator.assignments.length - 5} ещё
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {permissions.canManageTasks && (
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Button
                            variant="outline"
                            size="sm"
                            icon={generator.is_active ? <PauseIcon /> : <PlayIcon />}
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePauseResume(generator);
                            }}
                            disabled={pauseMutation.isPending || resumeMutation.isPending}
                            className={generator.is_active
                              ? 'text-yellow-600 border-yellow-300 hover:bg-yellow-50 dark:text-yellow-400 dark:border-yellow-700'
                              : 'text-green-600 border-green-300 hover:bg-green-50 dark:text-green-400 dark:border-green-700'
                            }
                          >
                            {generator.is_active ? 'Пауза' : 'Запустить'}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            icon={<PencilIcon />}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(generator);
                            }}
                          >
                            Изменить
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            icon={<TrashIcon />}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(generator);
                            }}
                            disabled={deleteMutation.isPending}
                            className="text-red-600 border-red-300 hover:bg-red-50 dark:text-red-400 dark:border-red-700"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </Card.Body>
            </Card>
          )}

          {/* Cards View */}
          {viewMode === 'grid' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {generators.map((generator) => (
                <Card
                  key={generator.id}
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => setDetailsGenerator(generator)}
                >
                  <Card.Body className="flex flex-col h-full">
                    <div className="flex justify-between items-start mb-4">
                      <div className="min-w-0 flex-1">
                        <ClickableTitle onClick={() => setDetailsGenerator(generator)}>
                          {generator.title}
                        </ClickableTitle>
                        <div className="flex flex-wrap items-center mt-1 gap-2">
                          {getStatusBadge(generator.is_active)}
                          <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                            <BuildingOfficeIcon className="w-3 h-3" />
                            {generator.dealership?.name || 'Все салоны'}
                          </span>
                        </div>
                      </div>

                      {permissions.canManageTasks && (
                        <div className="flex items-center gap-1 ml-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePauseResume(generator);
                            }}
                            disabled={pauseMutation.isPending || resumeMutation.isPending}
                            className={`p-1.5 rounded-xl transition-colors ${generator.is_active
                              ? 'text-yellow-600 hover:bg-yellow-50 dark:text-yellow-400 dark:hover:bg-yellow-900/20'
                              : 'text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/20'
                              }`}
                            title={generator.is_active ? 'Остановить' : 'Запустить'}
                          >
                            {generator.is_active ? <PauseIcon className="w-5 h-5" /> : <PlayIcon className="w-5 h-5" />}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(generator);
                            }}
                            className="p-1.5 text-gray-400 hover:text-accent-600 hover:bg-accent-50 dark:hover:bg-accent-900/20 rounded-xl transition-colors"
                            title="Редактировать"
                          >
                            <PencilIcon className="w-5 h-5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(generator);
                            }}
                            disabled={deleteMutation.isPending}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                            title="Удалить"
                          >
                            <TrashIcon className="w-5 h-5" />
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="space-y-3 mb-4 flex-grow">
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-300 gap-2">
                        <ClockIcon className="w-4 h-4" />
                        <span>
                          {getRecurrenceLabel(generator.recurrence)} в {generator.recurrence_time?.slice(0, 5)}
                        </span>
                      </div>

                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-300 gap-2">
                        <UserGroupIcon className="w-4 h-4" />
                        <span>
                          {generator.assignments?.length || 0} исполнителей
                        </span>
                      </div>

                      {generator.next_run_at && (
                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-300 gap-2">
                          <CalendarIcon className="w-4 h-4" />
                          <span>
                            След. запуск: {formatDateTimeShort(generator.next_run_at)}
                          </span>
                        </div>
                      )}
                    </div>

                    {getRecurrenceBadge(generator.recurrence)}
                  </Card.Body>
                </Card>
              ))}
            </div>
          )}

          {/* Pagination */}
          {generatorsData && generatorsData.last_page > 1 && (
            <Pagination
              currentPage={page}
              totalPages={generatorsData.last_page}
              total={generatorsData.total}
              perPage={generatorsData.per_page}
              onPageChange={setPage}
              className="mt-8"
            />
          )}
        </>
      )}

      <TaskGeneratorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        generator={selectedGenerator}
      />

      {/* Generator Details Modal */}
      <GeneratorDetailsModal
        isOpen={!!detailsGenerator}
        onClose={() => setDetailsGenerator(null)}
        generator={detailsGenerator}
        onEdit={(gen) => {
          setDetailsGenerator(null);
          handleEdit(gen);
        }}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!confirmDelete}
        title={`Удалить генератор "${confirmDelete?.title}"?`}
        message="Это не удалит созданные задачи."
        variant="danger"
        confirmText="Удалить"
        cancelText="Отмена"
        onConfirm={() => confirmDelete && deleteMutation.mutate(confirmDelete.id)}
        onCancel={() => setConfirmDelete(null)}
        isLoading={deleteMutation.isPending}
      />

      {/* Pause/Resume All Confirmation */}
      <ConfirmDialog
        isOpen={confirmPauseAll}
        title={allPaused ? 'Запустить все генераторы?' : 'Остановить все генераторы?'}
        message={allPaused
          ? 'Все генераторы задач будут запущены.'
          : 'Все активные генераторы задач будут приостановлены. Вы сможете запустить их снова вручную.'
        }
        variant={allPaused ? 'info' : 'danger'}
        confirmText={allPaused ? 'Запустить все' : 'Остановить все'}
        cancelText="Отмена"
        onConfirm={() => allPaused ? resumeAllMutation.mutate() : pauseAllMutation.mutate()}
        onCancel={() => setConfirmPauseAll(false)}
        isLoading={pauseAllMutation.isPending || resumeAllMutation.isPending}
      />
    </PageContainer>
  );
};
