import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tasksApi } from '../api/tasks';
import { usePermissions } from '../hooks/usePermissions';
import { useWorkspace } from '../hooks/useWorkspace';
import { useResponsiveViewMode } from '../hooks/useResponsiveViewMode';
import { usePagination } from '../hooks/usePagination';
import { TaskModal } from '../components/tasks/TaskModal';
import { TaskDetailsModal } from '../components/tasks/TaskDetailsModal';
import { TaskEmployeeActions } from '../components/tasks/TaskEmployeeActions';
import { UserSelector } from '../components/common/UserSelector';
import { MultiFileUpload } from '../components/ui/MultiFileUpload';
import type { Task } from '../types/task';
import { formatDateTime, formatDateTimeShort, getDeadlineStatus } from '../utils/dateTime';
import {
  PlusIcon,
  CalendarIcon,
  UserIcon,
  ClockIcon,
  BuildingOfficeIcon,
  ListBulletIcon,
  Squares2X2Icon,
  CheckCircleIcon,
  DocumentIcon,
} from '@heroicons/react/24/outline';
import { RESPONSE_TYPE_LABELS } from '../constants/tasks';

import { useSearchParams } from 'react-router-dom';

// Унифицированные компоненты
import {
  Button,
  Input,
  Select,
  ViewModeToggle,
  FilterPanel,
  Skeleton,
  EmptyState,
  ErrorState,
  PageContainer,
  Card,
  Pagination,
  ConfirmDialog,
  PageHeader,
  Tag,
  Modal,
  useToast,
} from '../components/ui';
import { StatusBadge, PriorityBadge, ActionButtons } from '../components/common';

export const TasksPage: React.FC = () => {
  const permissions = usePermissions();
  const { dealershipId: workspaceDealershipId } = useWorkspace();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const { viewMode, setViewMode, isMobile } = useResponsiveViewMode('list', 'grid', 768, 'view_mode_tasks');
  const [page, setPage] = useState(1);
  const { limit } = usePagination();
  const [confirmDelete, setConfirmDelete] = useState<Task | null>(null);
  const [proofUploadTask, setProofUploadTask] = useState<Task | null>(null);
  const [proofFiles, setProofFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [resetConfirmTask, setResetConfirmTask] = useState<Task | null>(null);
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    status: searchParams.get('status') || '',
    task_type: searchParams.get('task_type') || '',
    response_type: searchParams.get('response_type') || '',
    date_range: searchParams.get('date_range') || 'all',
    assigned_to: searchParams.get('assigned_to') ? Number(searchParams.get('assigned_to')) : null,
    tags: searchParams.getAll('tags') || [],
    priority: searchParams.get('priority') || '',
    from_generator: searchParams.get('from_generator') || '',
    sort_by: 'created_at',
    sort_dir: 'desc' as 'asc' | 'desc',
  });

  useEffect(() => {
    setPage(1);
  }, [filters, workspaceDealershipId]);

  useEffect(() => {
    const taskId = searchParams.get('task_id');
    if (taskId) {
      tasksApi.getTask(Number(taskId)).then((task) => {
        setSelectedTask(task);
        setIsDetailsModalOpen(true);
      });
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.delete('task_id');
        return next;
      }, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const { data: tasksData, isLoading, error, refetch } = useQuery({
    queryKey: ['tasks', filters, workspaceDealershipId, page, limit],
    queryFn: () => {
      const cleanedFilters: {
        search?: string;
        status?: string;
        task_type?: string;
        response_type?: string;
        date_range?: string;
        dealership_id?: number;
        assigned_to?: number;
        tags?: string[];
        priority?: string;
        from_generator?: string;
        per_page?: number;
        page?: number;
      } = { page, per_page: limit };

      // Добавляем фильтр по workspace (автосалону)
      if (workspaceDealershipId) {
        cleanedFilters.dealership_id = workspaceDealershipId;
      }

      Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          if (Array.isArray(value)) {
            if (value.length > 0) {
              cleanedFilters[key as keyof typeof cleanedFilters] = value as never;
            }
          } else {
            cleanedFilters[key as keyof typeof cleanedFilters] = value as never;
          }
        }
      });

      return tasksApi.getTasks(cleanedFilters);
    },
    refetchInterval: 30000,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => tasksApi.deleteTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      // Invalidate generator stats when task is deleted
      queryClient.invalidateQueries({ queryKey: ['generator-stats'] });
      queryClient.invalidateQueries({ queryKey: ['task-generators'] });
      setConfirmDelete(null);
    },
  });

  const handleCreate = () => {
    setSelectedTask(null);
    setIsModalOpen(true);
  };

  const handleEdit = (task: Task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  const handleView = (task: Task) => {
    setSelectedTask(task);
    setIsDetailsModalOpen(true);
  };

  const handleDelete = (task: Task) => {
    setConfirmDelete(task);
  };

  const handleDuplicate = (task: Task) => {
    const duplicateData = {
      ...task,
      id: undefined,
      title: `${task.title} (копия)`,
    };
    setSelectedTask(duplicateData as unknown as Task);
    setIsModalOpen(true);
  };

  const updateStatusMutation = useMutation({
    mutationFn: ({ taskId, status, completeForAll, preserveProofs }: { taskId: number; status: string; completeForAll?: boolean; preserveProofs?: boolean }) =>
      tasksApi.updateTaskStatus(taskId, status, completeForAll, preserveProofs),
    onMutate: async ({ taskId, status }) => {
      await queryClient.cancelQueries({ queryKey: ['tasks', filters, page, limit] });
      const previousTasks = queryClient.getQueryData(['tasks', filters, page, limit]);
      // Оптимистично обновляем кэш
      queryClient.setQueryData(['tasks', filters, page, limit], (old: unknown) => {
        if (!old || typeof old !== 'object') return old;
        const oldData = old as { data: Task[] };
        return {
          ...oldData,
          data: oldData.data.map((task: Task) =>
            task.id === taskId ? { ...task, status } : task
          ),
        };
      });
      return { previousTasks };
    },
    onError: (err, _variables, context) => {
      // Откат при ошибке
      if (context?.previousTasks) {
        queryClient.setQueryData(['tasks', filters, page, limit], context.previousTasks);
      }
      // Показать сообщение об ошибке
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        || 'Ошибка изменения статуса';
      showToast({ type: 'error', message });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      // Invalidate generator stats when task status changes
      queryClient.invalidateQueries({ queryKey: ['generator-stats'] });
      queryClient.invalidateQueries({ queryKey: ['task-generators'] });
    },
  });

  const proofUploadMutation = useMutation({
    mutationFn: ({ taskId, status, files, completeForAll }: { taskId: number; status: string; files: File[]; completeForAll?: boolean }) =>
      tasksApi.updateTaskStatusWithProofs(taskId, status, files, completeForAll, setUploadProgress),
    onMutate: () => {
      setUploadProgress(0);
    },
    onSuccess: () => {
      showToast({ type: 'success', message: 'Доказательства отправлены на проверку' });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setProofUploadTask(null);
      setProofFiles([]);
      setUploadProgress(0);
    },
    onError: (error: unknown) => {
      setUploadProgress(0);
      console.error('Upload error:', error);
      const axiosError = error as { response?: { data?: { message?: string }, status?: number }, message?: string };

      let message = 'Ошибка загрузки файлов';

      if (axiosError?.response?.status === 413) {
        message = 'Файл слишком большой для загрузки. Максимальный размер: 200 MB';
      } else if (axiosError?.response?.status === 422) {
        message = axiosError?.response?.data?.message || 'Ошибка валидации файла';
      } else if (axiosError?.response?.data?.message) {
        message = axiosError.response.data.message;
      } else if (axiosError?.message) {
        message = axiosError.message;
      }

      showToast({ type: 'error', message });
    },
  });

  const approveResponseMutation = useMutation({
    mutationFn: (responseId: number) => tasksApi.approveTaskResponse(responseId),
    onSuccess: (result) => {
      showToast({ type: 'success', message: 'Доказательство одобрено' });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      // Обновить selectedTask напрямую из ответа API (избегаем stale closure)
      setSelectedTask((current) => {
        if (current && result.data && result.data.id === current.id) {
          return result.data;
        }
        return current;
      });
    },
    onError: (error: unknown) => {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Ошибка при одобрении';
      showToast({ type: 'error', message });
    },
  });

  const rejectResponseMutation = useMutation({
    mutationFn: ({ responseId, reason }: { responseId: number; reason: string }) =>
      tasksApi.rejectTaskResponse(responseId, reason),
    onSuccess: (result) => {
      showToast({ type: 'success', message: 'Доказательство отклонено' });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      // Обновить selectedTask напрямую из ответа API (избегаем stale closure)
      setSelectedTask((current) => {
        if (current && result.data && result.data.id === current.id) {
          return result.data;
        }
        return current;
      });
    },
    onError: (error: unknown) => {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Ошибка при отклонении';
      showToast({ type: 'error', message });
    },
  });

  const deleteProofMutation = useMutation({
    mutationFn: (proofId: number) => tasksApi.deleteTaskProof(proofId),
    onSuccess: async () => {
      showToast({ type: 'success', message: 'Файл удалён' });
      await queryClient.invalidateQueries({ queryKey: ['tasks'] });
      const freshData = await refetch();
      if (selectedTask && freshData.data?.data) {
        const updated = freshData.data.data.find(t => t.id === selectedTask.id);
        if (updated) setSelectedTask(updated);
      }
    },
    onError: (error: unknown) => {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Ошибка удаления файла';
      showToast({ type: 'error', message });
    },
  });

  const deleteSharedProofMutation = useMutation({
    mutationFn: (proofId: number) => tasksApi.deleteTaskSharedProof(proofId),
    onSuccess: async () => {
      showToast({ type: 'success', message: 'Файл удалён' });
      await queryClient.invalidateQueries({ queryKey: ['tasks'] });
      const freshData = await refetch();
      if (selectedTask && freshData.data?.data) {
        const updated = freshData.data.data.find(t => t.id === selectedTask.id);
        if (updated) setSelectedTask(updated);
      }
    },
    onError: (error: unknown) => {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Ошибка удаления файла';
      showToast({ type: 'error', message });
    },
  });

  const handleStatusChange = (task: Task, newStatus: string) => {
    // Проверяем, есть ли у задачи файлы (proofs или shared_proofs)
    const hasProofs = task.responses?.some(r => r.proofs && r.proofs.length > 0)
      || (task.shared_proofs && task.shared_proofs.length > 0);

    // Если задача требует доказательства и файлов ЕЩЁ НЕТ - показать модальное окно загрузки
    if (
      task.response_type === 'completion_with_proof' &&
      (newStatus === 'completed' || newStatus === 'pending_review') &&
      !hasProofs
    ) {
      setProofUploadTask(task);
      return;
    }

    // При сбросе в pending с файлами - показываем диалог подтверждения
    if (newStatus === 'pending' && hasProofs) {
      setResetConfirmTask(task);
      return;
    }

    // Для групповых задач менеджер/владелец меняет статус сразу для всех
    if (
      task.task_type === 'group' &&
      (permissions.isManager || permissions.isOwner) &&
      (newStatus === 'completed' || newStatus === 'pending_review')
    ) {
      updateStatusMutation.mutate({
        taskId: task.id,
        status: newStatus,
        completeForAll: true,
      });
      return;
    }

    updateStatusMutation.mutate({ taskId: task.id, status: newStatus });
  };

  // Обработчики диалога сброса задачи
  const handleResetWithProofs = () => {
    if (resetConfirmTask) {
      updateStatusMutation.mutate({
        taskId: resetConfirmTask.id,
        status: 'pending',
        preserveProofs: true,
      });
      setResetConfirmTask(null);
    }
  };

  const handleResetWithoutProofs = () => {
    if (resetConfirmTask) {
      updateStatusMutation.mutate({
        taskId: resetConfirmTask.id,
        status: 'pending',
        preserveProofs: false,
      });
      setResetConfirmTask(null);
    }
  };

  const handleProofUploadSubmit = () => {
    if (proofUploadTask && proofFiles.length > 0) {
      // Менеджер/владелец всегда использует complete_for_all (файлы в "Файлы задачи")
      const shouldCompleteForAll =
        permissions.isManager || permissions.isOwner;

      proofUploadMutation.mutate({
        taskId: proofUploadTask.id,
        status: 'pending_review',
        files: proofFiles,
        completeForAll: shouldCompleteForAll,
      });
    }
  };

  const handleApproveResponse = async (responseId: number) => {
    await approveResponseMutation.mutateAsync(responseId);
  };

  const handleRejectResponse = async (responseId: number, reason: string) => {
    await rejectResponseMutation.mutateAsync({ responseId, reason });
  };

  const handleDeleteProof = async (proofId: number) => {
    await deleteProofMutation.mutateAsync(proofId);
  };

  const handleDeleteSharedProof = async (proofId: number) => {
    await deleteSharedProofMutation.mutateAsync(proofId);
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      status: '',
      task_type: '',
      response_type: '',
      date_range: 'all',
      assigned_to: null,
      tags: [],
      priority: '',
      from_generator: '',
      sort_by: 'created_at',
      sort_dir: 'desc',
    });
  };

  const getTaskCardClass = (task: Task) => {
    const deadlineStatus = getDeadlineStatus(task.deadline);
    const baseClasses = 'bg-white dark:bg-gray-800 rounded-xl shadow-sm border hover:shadow-md transition-all duration-200';

    switch (deadlineStatus) {
      case 'overdue': return `${baseClasses} border-red-200 bg-red-50 dark:bg-red-900/10 dark:border-red-800`;
      case 'urgent': return `${baseClasses} border-orange-200 bg-orange-50 dark:bg-orange-900/10 dark:border-orange-800`;
      case 'soon': return `${baseClasses} border-yellow-200 bg-yellow-50 dark:bg-yellow-900/10 dark:border-yellow-800`;
      default: return `${baseClasses} border-gray-200 dark:border-gray-700`;
    }
  };

  const statusOptions = [
    { value: '', label: 'Все статусы' },
    { value: 'pending', label: 'Ожидает' },
    { value: 'pending_review', label: 'На проверке' },
    { value: 'completed', label: 'Выполнено' },
    { value: 'completed_late', label: 'Выполнено с опозданием' },
    { value: 'overdue', label: 'Просрочено' },
  ];

  const priorityOptions = [
    { value: '', label: 'Все приоритеты' },
    { value: 'low', label: 'Низкий' },
    { value: 'medium', label: 'Средний' },
    { value: 'high', label: 'Высокий' },
  ];

  const taskTypeOptions = [
    { value: '', label: 'Все типы' },
    { value: 'individual', label: 'Индивидуальная' },
    { value: 'group', label: 'Групповая' },
  ];

  const responseTypeOptions = [
    { value: '', label: 'Все' },
    { value: 'notification', label: 'Уведомление' },
    { value: 'completion', label: 'На выполнение' },
    { value: 'completion_with_proof', label: 'С доказательством' },
  ];

  const dateRangeOptions = [
    { value: 'all', label: 'Все время' },
    { value: 'today', label: 'Сегодня' },
    { value: 'week', label: 'Эта неделя' },
    { value: 'month', label: 'Этот месяц' },
  ];

  // Базовые опции статусов (без вычисляемых)
  const baseStatusOptions = [
    { value: 'pending', label: 'Ожидает' },
    { value: 'acknowledged', label: 'Подтверждено' },
    { value: 'pending_review', label: 'На проверке' },
    { value: 'completed', label: 'Выполнено' },
  ];

  // Вычисляемые статусы (автоматические)
  const computedStatusLabels: Record<string, string> = {
    'completed_late': 'Выполнено с опозданием',
    'overdue': 'Просрочено',
  };

  // Получить опции для конкретной задачи
  const getStatusOptionsForTask = (task: Task) => {
    const currentStatus = task.status;
    // Если текущий статус вычисляемый - добавить его в начало как disabled
    if (currentStatus in computedStatusLabels) {
      return [
        { value: currentStatus, label: computedStatusLabels[currentStatus], disabled: true },
        ...baseStatusOptions,
      ];
    }
    return baseStatusOptions;
  };

  const sourceOptions = [
    { value: '', label: 'Все источники' },
    { value: 'yes', label: 'Генератор' },
    { value: 'no', label: 'Вручную' },
  ];

  const sortOptions = [
    { value: 'created_at_desc', label: 'Сначала новые' },
    { value: 'created_at_asc', label: 'Сначала старые' },
    { value: 'priority_desc', label: 'По приоритету ↓' },
    { value: 'priority_asc', label: 'По приоритету ↑' },
    { value: 'title_asc', label: 'По названию А-Я' },
    { value: 'title_desc', label: 'По названию Я-А' },
  ];

  const hasActiveFilters = filters.search || filters.status || filters.priority ||
    filters.task_type || filters.response_type || filters.from_generator ||
    filters.date_range !== 'all' || filters.assigned_to;

  return (
    <PageContainer>
      {/* Header */}
      <PageHeader
        title="Задачи"
        description="Управление задачами и отслеживание выполнения"
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
        {permissions.canManageTasks && (
          <Button
            variant="primary"
            icon={<PlusIcon />}
            onClick={handleCreate}
          >
            Создать задачу
          </Button>
        )}
      </PageHeader>

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
            placeholder="Название или описание..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />

          <Select
            label="Статус"
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            options={statusOptions}
          />

          <Select
            label="Приоритет"
            value={filters.priority}
            onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
            options={priorityOptions}
          />

          <Select
            label="Тип задачи"
            value={filters.task_type}
            onChange={(e) => setFilters({ ...filters, task_type: e.target.value })}
            options={taskTypeOptions}
          />

          <Select
            label="Тип ответа"
            value={filters.response_type}
            onChange={(e) => setFilters({ ...filters, response_type: e.target.value })}
            options={responseTypeOptions}
          />

          <Select
            label="Период"
            value={filters.date_range}
            onChange={(e) => setFilters({ ...filters, date_range: e.target.value })}
            options={dateRangeOptions}
          />

          <Select
            label="Источник"
            value={filters.from_generator}
            onChange={(e) => setFilters({ ...filters, from_generator: e.target.value })}
            options={sourceOptions}
          />

          <Select
            label="Сортировка"
            value={`${filters.sort_by}_${filters.sort_dir}`}
            onChange={(e) => {
              const parts = e.target.value.split('_');
              const sortDir = parts.pop() as 'asc' | 'desc';
              const sortBy = parts.join('_');
              setFilters({ ...filters, sort_by: sortBy, sort_dir: sortDir });
            }}
            options={sortOptions}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Исполнитель</label>
            <UserSelector
              dealershipId={workspaceDealershipId}
              value={filters.assigned_to}
              onChange={(userId) => setFilters({ ...filters, assigned_to: userId })}
              showAllOption={true}
              allOptionLabel="Все сотрудники"
            />
          </div>
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
          title="Ошибка загрузки задач"
          onRetry={() => refetch()}
        />
      ) : tasksData?.data.length === 0 ? (
        <EmptyState
          icon={<CalendarIcon />}
          title="Задачи не найдены"
          description={hasActiveFilters
            ? 'Попробуйте изменить фильтры для поиска задач'
            : 'Создайте первую задачу для начала работы'}
          action={permissions.canManageTasks && !hasActiveFilters ? (
            <Button variant="primary" icon={<PlusIcon />} onClick={handleCreate}>
              Создать задачу
            </Button>
          ) : undefined}
        />
      ) : (
        <>
          {/* List View */}
          {viewMode === 'list' && (
            <Card>
              <Card.Body className="space-y-4">
                {tasksData?.data.map((task) => (
                  <div key={task.id} className={`p-5 rounded-xl border hover:shadow-sm transition-all ${getTaskCardClass(task)}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0 pr-4">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <h3
                            className="text-lg font-semibold text-gray-900 dark:text-white truncate cursor-pointer hover:text-accent-600 dark:hover:text-accent-400 transition-colors"
                            onClick={() => handleView(task)}
                          >
                            {task.title}
                          </h3>
                          <PriorityBadge priority={task.priority || 'medium'} />
                          <StatusBadge status={task.status} type="task" />
                        </div>

                        {task.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">{task.description}</p>
                        )}

                        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-500 dark:text-gray-400">
                          <span className="flex items-center">
                            <UserIcon className="w-4 h-4 mr-1" />
                            {task.task_type === 'individual' ? 'Индивидуальная' : (
                              <span>
                                Групповая
                                {task.completion_progress && (
                                  <span className="ml-1 text-green-600 dark:text-green-400">
                                    ({task.completion_progress.completed_count}/{task.completion_progress.total_assignees})
                                  </span>
                                )}
                              </span>
                            )}
                          </span>
                          <span className="flex items-center">
                            {task.response_type === 'completion_with_proof' ?
                              <DocumentIcon className="w-4 h-4 mr-1" /> :
                              task.response_type === 'notification' ?
                                <CheckCircleIcon className="w-4 h-4 mr-1" /> :
                                <CalendarIcon className="w-4 h-4 mr-1" />
                            }
                            {RESPONSE_TYPE_LABELS[task.response_type] || task.response_type}
                          </span>
                          {task.deadline && (
                            <span className="flex items-center">
                              <ClockIcon className="w-4 h-4 mr-1" />
                              {formatDateTime(task.deadline)}
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
                            {task.dealership?.name || 'Все салоны'}
                          </span>
                        </div>

                        {task.tags && task.tags.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {task.tags.map((tag, idx) => (
                              <Tag key={idx} label={tag} />
                            ))}
                          </div>
                        )}
                      </div>

                      {permissions.canManageTasks && (
                        <div className="flex flex-col space-y-2">
                          <ActionButtons
                            onEdit={() => handleEdit(task)}
                            onDelete={() => handleDelete(task)}
                            onDuplicate={() => handleDuplicate(task)}
                            isDeleting={deleteMutation.isPending}
                          />
                          <Select
                            value={task.status}
                            onChange={(e) => handleStatusChange(task, e.target.value)}
                            options={getStatusOptionsForTask(task)}
                            selectSize="sm"
                            fullWidth={false}
                            className="min-w-[120px]"
                          />
                        </div>
                      )}

                      {/* Действия для сотрудников */}
                      {!permissions.canManageTasks && permissions.canCompleteAssignedTasks && permissions.userId && (
                        <TaskEmployeeActions
                          task={task}
                          userId={permissions.userId}
                          onComplete={(t) => handleStatusChange(t, t.response_type === 'notification' ? 'acknowledged' : 'pending_review')}
                          onUploadProof={(t) => setProofUploadTask(t)}
                          isLoading={updateStatusMutation.isPending || proofUploadMutation.isPending}
                        />
                      )}
                    </div>
                  </div>
                ))}
              </Card.Body>
            </Card>
          )}

          {/* Grid View */}
          {viewMode === 'grid' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tasksData?.data.map((task) => (
                <div key={task.id} className={`p-6 ${getTaskCardClass(task)}`}>
                  <div className="flex items-start justify-between mb-3">
                    <h3
                      className="text-lg font-semibold text-gray-900 dark:text-white truncate pr-2 cursor-pointer hover:text-accent-600 dark:hover:text-accent-400 transition-colors"
                      onClick={() => handleView(task)}
                    >
                      {task.title}
                    </h3>
                    <PriorityBadge priority={task.priority || 'medium'} />
                  </div>

                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    <StatusBadge status={task.status} type="task" />
                  </div>

                  {task.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">{task.description}</p>
                  )}

                  <div className="space-y-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
                    {task.deadline && (
                      <div className="flex items-center">
                        <ClockIcon className="w-4 h-4 mr-2" />
                        {formatDateTimeShort(task.deadline)}
                      </div>
                    )}
                    <div className="flex items-center">
                      <UserIcon className="w-4 h-4 mr-2" />
                      {task.task_type === 'individual' ? 'Индивидуальная' : (
                        <span>
                          Групповая
                          {task.completion_progress && (
                            <span className="ml-1 text-green-600 dark:text-green-400">
                              ({task.completion_progress.completed_count}/{task.completion_progress.total_assignees})
                            </span>
                          )}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center">
                      <BuildingOfficeIcon className="w-4 h-4 mr-2" />
                      {task.dealership?.name || 'Все салоны'}
                    </div>
                  </div>

                  {task.tags && task.tags.length > 0 && (
                    <div className="mb-4 flex flex-wrap gap-1">
                      {task.tags.map((tag, idx) => (
                        <Tag key={idx} label={tag} />
                      ))}
                    </div>
                  )}

                  {permissions.canManageTasks && (
                    <div className="flex flex-col space-y-2 mt-auto pt-4 border-t border-gray-100 dark:border-gray-700">
                      <ActionButtons
                        onEdit={() => handleEdit(task)}
                        onDelete={() => handleDelete(task)}
                        onDuplicate={() => handleDuplicate(task)}
                        isDeleting={deleteMutation.isPending}
                        size="sm"
                      />
                      <Select
                        value={task.status}
                        onChange={(e) => handleStatusChange(task, e.target.value)}
                        options={getStatusOptionsForTask(task)}
                        selectSize="sm"
                      />
                    </div>
                  )}

                  {/* Действия для сотрудников */}
                  {!permissions.canManageTasks && permissions.canCompleteAssignedTasks && permissions.userId && (
                    <div className="mt-auto pt-4 border-t border-gray-100 dark:border-gray-700">
                      <TaskEmployeeActions
                        task={task}
                        userId={permissions.userId}
                        onComplete={(t) => handleStatusChange(t, t.response_type === 'notification' ? 'acknowledged' : 'pending_review')}
                        onUploadProof={(t) => setProofUploadTask(t)}
                        isLoading={updateStatusMutation.isPending || proofUploadMutation.isPending}
                      />
                    </div>
                  )}
                </div>
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
      )
      }

      <TaskDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        task={selectedTask}
        onEdit={(task) => {
          setIsDetailsModalOpen(false);
          handleEdit(task);
        }}
        onApproveResponse={handleApproveResponse}
        onRejectResponse={handleRejectResponse}
        onDeleteProof={handleDeleteProof}
        onDeleteSharedProof={handleDeleteSharedProof}
        onVerificationComplete={() => {
          // Данные уже обновлены в onSuccess мутации
          // Этот callback оставлен для совместимости с TaskDetailsModal
        }}
        isVerifying={approveResponseMutation.isPending || rejectResponseMutation.isPending}
      />

      <TaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        task={selectedTask}
      />

      <ConfirmDialog
        isOpen={!!confirmDelete}
        title={`Удалить задачу "${confirmDelete?.title}"?`}
        message="Это действие нельзя отменить"
        variant="danger"
        confirmText="Удалить"
        cancelText="Отмена"
        onConfirm={() => confirmDelete && deleteMutation.mutate(confirmDelete.id)}
        onCancel={() => setConfirmDelete(null)}
        isLoading={deleteMutation.isPending}
      />

      {/* Модальное окно загрузки доказательств */}
      <Modal
        isOpen={!!proofUploadTask}
        onClose={() => {
          setProofUploadTask(null);
          setProofFiles([]);
          setUploadProgress(0);
        }}
        title="Загрузка доказательств"
        size="lg"
      >
        <Modal.Body>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            Для выполнения задачи "{proofUploadTask?.title}" необходимо загрузить доказательства.
          </p>

          {proofUploadMutation.isPending && uploadProgress > 0 && (
            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                <span>Загрузка файлов...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-accent-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          <MultiFileUpload
            files={proofFiles}
            onChange={setProofFiles}
            disabled={proofUploadMutation.isPending}
          />
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => {
              setProofUploadTask(null);
              setProofFiles([]);
              setUploadProgress(0);
            }}
            disabled={proofUploadMutation.isPending}
          >
            Отмена
          </Button>
          <Button
            variant="primary"
            onClick={handleProofUploadSubmit}
            disabled={proofFiles.length === 0 || proofUploadMutation.isPending}
            isLoading={proofUploadMutation.isPending}
          >
            Отправить на проверку
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Модальное окно подтверждения сброса задачи */}
      <Modal
        isOpen={!!resetConfirmTask}
        onClose={() => setResetConfirmTask(null)}
        title="Сброс задачи"
        size="md"
      >
        <Modal.Body>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            Задача "{resetConfirmTask?.title}" содержит загруженные файлы доказательств.
          </p>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Выберите, что сделать с файлами при сбросе задачи:
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setResetConfirmTask(null)}
            disabled={updateStatusMutation.isPending}
          >
            Отмена
          </Button>
          <Button
            variant="primary"
            onClick={handleResetWithProofs}
            disabled={updateStatusMutation.isPending}
            isLoading={updateStatusMutation.isPending}
          >
            Сохранить файлы
          </Button>
          <Button
            variant="danger"
            onClick={handleResetWithoutProofs}
            disabled={updateStatusMutation.isPending}
          >
            Удалить файлы
          </Button>
        </Modal.Footer>
      </Modal>
    </PageContainer >
  );
};
