import React, { useEffect, useState, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller, type SubmitHandler } from 'react-hook-form';
import { utcToDatetimeLocal, datetimeLocalToUtc } from '../../utils/dateTime';
import { tasksApi } from '../../api/tasks';
import { usersApi } from '../../api/users';
import { DealershipSelector } from '../common/DealershipSelector';
import { UserCheckboxList } from '../common/UserCheckboxList';
import { useWorkspace } from '../../hooks/useWorkspace';
import { useAuth } from '../../hooks/useAuth';
import { TaskNotificationSettings } from './TaskNotificationSettings';
import { Alert, Modal, Button, Input, Textarea, Select } from '../ui';
import {
  TASK_PRIORITIES,
  TASK_TYPES,
  RESPONSE_TYPES,
  TASK_PRIORITY_LABELS,
  TASK_TYPE_LABELS,
  RESPONSE_TYPE_LABELS
} from '../../constants/tasks';
import type { Task, CreateTaskRequest, ApiErrorResponse } from '../../types/task';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task?: Task | null;
}

export const TaskModal: React.FC<TaskModalProps> = ({ isOpen, onClose, task }) => {
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<string | null>(null);
  const { dealershipId: workspaceDealershipId } = useWorkspace();
  const { user: currentUser } = useAuth();

  // Use React Hook Form
  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    formState: { errors }
  } = useForm<CreateTaskRequest>({
    defaultValues: {
      title: '',
      description: '',
      comment: '',
      task_type: TASK_TYPES.INDIVIDUAL,
      response_type: RESPONSE_TYPES.NOTIFICATION,
      dealership_id: undefined,
      assignments: [],
      priority: TASK_PRIORITIES.MEDIUM,
      tags: [],
      appear_date: undefined,
      deadline: undefined
    }
  });

  // Watch dealership_id to fetch users
  const dealershipId = watch('dealership_id');
  const assignments = watch('assignments') || []; // Ensure array
  const taskType = watch('task_type');
  const responseType = watch('response_type');

  // Local state for tags input string
  const [tagsInput, setTagsInput] = useState('');

  // Fetch users for the selected dealership
  const { data: usersData, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['task-modal-users', dealershipId],
    queryFn: () => usersApi.getUsers({
      per_page: 100,
      dealership_id: dealershipId
    }),
    enabled: !!dealershipId,
    staleTime: 1000 * 60,
  });

  // Фильтруем пользователей: только сотрудники (employees), исключая текущего пользователя
  const assignableUsers = useMemo(() => {
    if (!usersData?.data) return [];
    return usersData.data.filter(user =>
      user.id !== currentUser?.id &&
      user.role === 'employee'
    );
  }, [usersData?.data, currentUser?.id]);

  // Reset form when task prop changes or modal opens
  useEffect(() => {
    if (isOpen) {
      if (task) {
        reset({
          title: task.title,
          description: task.description || '',
          comment: task.comment || '',
          task_type: task.task_type,
          response_type: task.response_type,
          appear_date: utcToDatetimeLocal(task.appear_date) || undefined,
          deadline: utcToDatetimeLocal(task.deadline) || undefined,
          dealership_id: task.dealership_id,
          assignments: task.assignments?.map(a => a.user.id) || [],
          notification_settings: task.notification_settings,
          priority: task.priority,
          tags: task.tags || []
        });
        setTagsInput(task.tags ? task.tags.join(', ') : '');
      } else {
        reset({
          title: '',
          description: '',
          comment: '',
          task_type: TASK_TYPES.INDIVIDUAL,
          response_type: RESPONSE_TYPES.NOTIFICATION,
          dealership_id: workspaceDealershipId || undefined,
          assignments: [],
          notification_settings: {},
          priority: TASK_PRIORITIES.MEDIUM,
          tags: [],
          appear_date: undefined,
          deadline: undefined
        });
        setTagsInput('');
      }
      setServerError(null);
    }
  }, [isOpen, task, reset, workspaceDealershipId]);

  // Автоматическое определение типа задачи на основе количества исполнителей
  useEffect(() => {
    const assignmentCount = (assignments as number[]).length;

    if (assignmentCount === 1 && taskType !== TASK_TYPES.INDIVIDUAL) {
      setValue('task_type', TASK_TYPES.INDIVIDUAL);
    } else if (assignmentCount > 1 && taskType !== TASK_TYPES.GROUP) {
      setValue('task_type', TASK_TYPES.GROUP);
    }
  }, [assignments, taskType, setValue]);

  const handleApiError = (error: unknown, defaultMessage: string): void => {
    const errorData = (error as { response?: { data?: ApiErrorResponse } })?.response?.data;
    const errorType = errorData?.error_type;
    const message = errorData?.message;
    const validationErrors = errorData?.errors;

    if (validationErrors && Object.keys(validationErrors).length > 0) {
      const firstErrorKey = Object.keys(validationErrors)[0];
      const firstErrorMessage = validationErrors[firstErrorKey][0];
      setServerError(firstErrorMessage || 'Проверьте правильность заполнения формы');
      return;
    }

    if (errorType === 'duplicate_task') {
      setServerError('Такая задача уже существует. Измените название или параметры.');
    } else if (errorType === 'access_denied') {
      setServerError('У вас нет доступа для выполнения этого действия.');
    } else if (message) {
      setServerError(message);
    } else {
      setServerError(defaultMessage || 'Проверьте правильность заполнения формы и повторите попытку');
    }
  };

  const createMutation = useMutation({
    mutationFn: (data: CreateTaskRequest) => tasksApi.createTask(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['generator-stats'] });
      queryClient.invalidateQueries({ queryKey: ['task-generators'] });
      onClose();
    },
    onError: (error: unknown) => {
      handleApiError(error, 'Ошибка при создании задачи');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<CreateTaskRequest>) => tasksApi.updateTask(task!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['generator-stats'] });
      queryClient.invalidateQueries({ queryKey: ['task-generators'] });
      onClose();
    },
    onError: (error: unknown) => {
      handleApiError(error, 'Ошибка при обновлении задачи');
    },
  });

  const onSubmit: SubmitHandler<CreateTaskRequest> = (data) => {
    setServerError(null);

    const processedTags = tagsInput
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    const finalData = {
      ...data,
      tags: processedTags,
      appear_date: datetimeLocalToUtc(data.appear_date as string | undefined) || '',
      deadline: datetimeLocalToUtc(data.deadline as string | undefined) || ''
    };

    if (task?.id) {
      updateMutation.mutate(finalData);
    } else {
      createMutation.mutate(finalData);
    }
  };

  const handleUserToggle = (userId: number) => {
    const currentAssignments = assignments as number[];
    const newAssignments = currentAssignments.includes(userId)
      ? currentAssignments.filter(id => id !== userId)
      : [...currentAssignments, userId];
    setValue('assignments', newAssignments, { shouldValidate: true });
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  // Options для Select компонентов
  const priorityOptions = Object.entries(TASK_PRIORITY_LABELS).map(([value, label]) => ({
    value,
    label
  }));

  const taskTypeOptions = Object.entries(TASK_TYPE_LABELS).map(([value, label]) => ({
    value,
    label
  }));

  const responseTypeOptions = Object.entries(RESPONSE_TYPE_LABELS).map(([value, label]) => ({
    value,
    label
  }));

  // Общий класс для DealershipSelector (сохраняем совместимость)
  const selectorClassName = 'unified-input block w-full rounded-xl border-gray-200 dark:border-gray-600 shadow-sm focus:border-accent-500 sm:text-sm px-3 py-2 border bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none transition-all duration-200';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={task?.id ? 'Редактировать задачу' : 'Создать задачу'}
      size="2xl"
    >
      <form onSubmit={handleSubmit(onSubmit)}>
        <Modal.Body>
          {serverError && (
            <Alert
              variant="error"
              title="Ошибка"
              message={serverError}
              onClose={() => setServerError(null)}
              className="mb-4"
            />
          )}

          <div className="space-y-4 max-h-[60vh] overflow-y-auto px-2 -mx-2">
            {/* Title */}
            <Input
              label="Название *"
              {...register('title', { required: 'Название обязательно' })}
              error={errors.title?.message}
            />

            {/* Description */}
            <Textarea
              label="Описание"
              rows={3}
              {...register('description')}
            />

            {/* Comment */}
            <Textarea
              label="Комментарий"
              rows={2}
              {...register('comment')}
            />

            {/* Tags */}
            <Input
              label="Теги (через запятую)"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="срочно, важно, backend"
            />

            {/* Priority */}
            <Select
              label="Приоритет"
              options={priorityOptions}
              {...register('priority')}
            />

            {/* Task Type and Response Type */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Select
                  label="Тип задачи"
                  options={taskTypeOptions}
                  disabled
                  hint="Определяется автоматически по количеству исполнителей"
                  className="bg-gray-100 dark:bg-gray-600 opacity-75 cursor-not-allowed"
                  {...register('task_type')}
                />
              </div>

              <div>
                <Select
                  label="Тип ответа"
                  options={responseTypeOptions}
                  hint={responseType === RESPONSE_TYPES.COMPLETION_WITH_PROOF
                    ? 'Исполнитель должен загрузить файлы для подтверждения'
                    : undefined}
                  {...register('response_type')}
                />
              </div>
            </div>

            {/* Dealership */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Автосалон *</label>
              <Controller
                name="dealership_id"
                control={control}
                rules={{ required: 'Автосалон обязателен' }}
                render={({ field }) => (
                  <DealershipSelector
                    value={field.value}
                    onChange={(value) => {
                      field.onChange(value);
                      setValue('assignments', []);
                    }}
                    showAllOption={false}
                    className={selectorClassName}
                    required={true}
                  />
                )}
              />
              {errors.dealership_id && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.dealership_id.message}</p>}
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Дата появления"
                type="datetime-local"
                {...register('appear_date')}
              />
              <Input
                label="Дедлайн"
                type="datetime-local"
                {...register('deadline')}
              />
            </div>

            {/* Notification Settings */}
            <div>
              <Controller
                name="notification_settings"
                control={control}
                render={({ field }) => (
                  <TaskNotificationSettings
                    value={field.value || {}}
                    onChange={field.onChange}
                  />
                )}
              />
            </div>

            {/* Assignments */}
            <UserCheckboxList
              users={assignableUsers}
              selectedIds={assignments as number[]}
              onToggle={handleUserToggle}
              isLoading={isLoadingUsers}
              noDealership={!dealershipId}
              label="Получатели"
              emptyMessage="В этом салоне нет сотрудников"
              maxHeight="max-h-48"
            />
          </div>
        </Modal.Body>

        <Modal.Footer>
          <Button
            type="submit"
            variant="primary"
            disabled={isPending}
          >
            {task ? 'Сохранить' : 'Создать'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
          >
            Отмена
          </Button>
        </Modal.Footer>
      </form>
    </Modal>
  );
};
