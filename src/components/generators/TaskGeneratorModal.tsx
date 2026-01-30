import React, { useState, useEffect, useMemo } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { taskGeneratorsApi } from '../../api/taskGenerators';
import { usersApi } from '../../api/users';
import { DealershipSelector } from '../common/DealershipSelector';
import { UserCheckboxList } from '../common/UserCheckboxList';
import { WeekDaySelector } from '../common/WeekDaySelector';
import { MonthDayPicker } from '../common/MonthDayPicker';
import { TaskNotificationSettings } from '../tasks/TaskNotificationSettings';
import { useShiftConfig } from '../../hooks/useSettings';
import type { TaskGenerator, CreateTaskGeneratorRequest, GeneratorRecurrence } from '../../types/taskGenerator';
import type { ApiErrorResponse } from '../../types/task';
import { Alert, Input, Textarea, Select, Button } from '../ui';
import { XMarkIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { getTodayDateString } from '../../utils/dateTime';

interface TaskGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  generator: TaskGenerator | null;
}

const RECURRENCE_OPTIONS = [
  { value: 'daily', label: 'Ежедневно' },
  { value: 'weekly', label: 'Еженедельно' },
  { value: 'monthly', label: 'Ежемесячно' },
];

const TASK_TYPE_OPTIONS = [
  { value: 'individual', label: 'Индивидуальная' },
  { value: 'group', label: 'Групповая' },
];

const RESPONSE_TYPE_OPTIONS = [
  { value: 'acknowledge', label: 'Уведомление' },
  { value: 'complete', label: 'Выполнение' },
];

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Низкий' },
  { value: 'medium', label: 'Средний' },
  { value: 'high', label: 'Высокий' },
];

export const TaskGeneratorModal: React.FC<TaskGeneratorModalProps> = ({
  isOpen,
  onClose,
  generator,
}) => {
  const queryClient = useQueryClient();
  const isEditing = !!generator;
  const [serverError, setServerError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    comment: '',
    dealership_id: null as number | null,
    recurrence: 'daily' as GeneratorRecurrence,
    recurrence_time: '09:00',
    deadline_time: '18:00',
    recurrence_days_of_week: [] as number[],
    recurrence_days_of_month: [] as number[],
    start_date: getTodayDateString(),
    end_date: '',
    task_type: 'individual' as 'individual' | 'group',
    response_type: 'acknowledge' as 'acknowledge' | 'complete',
    priority: 'medium' as 'low' | 'medium' | 'high',
    tags: '',
    assignments: [] as number[],
    notification_settings: {} as Record<string, { enabled?: boolean; offset?: number }>,
  });

  const { data: usersData } = useQuery({
    queryKey: ['users', formData.dealership_id],
    queryFn: () => usersApi.getUsers({ dealership_id: formData.dealership_id || undefined, per_page: 100 }),
    enabled: !!formData.dealership_id,
  });

  useEffect(() => {
    if (generator) {
      setFormData({
        title: generator.title,
        description: generator.description || '',
        comment: generator.comment || '',
        dealership_id: generator.dealership_id,
        recurrence: generator.recurrence,
        recurrence_time: generator.recurrence_time?.slice(0, 5) || '09:00',
        deadline_time: generator.deadline_time?.slice(0, 5) || '18:00',
        recurrence_days_of_week: generator.recurrence_days_of_week || [],
        recurrence_days_of_month: generator.recurrence_days_of_month || [],
        start_date: generator.start_date?.split('T')[0] || '',
        end_date: generator.end_date?.split('T')[0] || '',
        task_type: generator.task_type,
        response_type: generator.response_type,
        priority: generator.priority,
        tags: generator.tags?.join(', ') || '',
        assignments: generator.assignments?.map((a) => a.user?.id).filter(Boolean) as number[] || [],
        notification_settings: generator.notification_settings || {},
      });
    } else {
      setFormData({
        title: '',
        description: '',
        comment: '',
        dealership_id: null,
        recurrence: 'daily',
        recurrence_time: '09:00',
        deadline_time: '18:00',
        recurrence_days_of_week: [],
        recurrence_days_of_month: [],
        start_date: getTodayDateString(),
        end_date: '',
        task_type: 'individual',
        response_type: 'acknowledge',
        priority: 'medium',
        tags: '',
        assignments: [],
        notification_settings: {},
      });
    }
    setServerError(null);
  }, [generator, isOpen]);

  // Автоматическое определение типа задачи на основе количества исполнителей
  useEffect(() => {
    const assignmentCount = formData.assignments.length;

    // Если выбран 1 исполнитель - индивидуальная
    // Если выбрано 2+ исполнителя - групповая
    if (assignmentCount === 1 && formData.task_type !== 'individual') {
      setFormData((prev) => ({ ...prev, task_type: 'individual' }));
    } else if (assignmentCount > 1 && formData.task_type !== 'group') {
      setFormData((prev) => ({ ...prev, task_type: 'group' }));
    }
  }, [formData.assignments, formData.task_type]);

  /**
   * Обработка ошибок API с учётом error_type.
   */
  const handleApiError = (error: unknown, defaultMessage: string): void => {
    const errorData = (error as { response?: { data?: ApiErrorResponse } })?.response?.data;
    const errorType = errorData?.error_type;
    const message = errorData?.message;
    const validationErrors = errorData?.errors;

    // Проверяем валидационные ошибки
    if (validationErrors && Object.keys(validationErrors).length > 0) {
      // Берём первую ошибку из списка
      const firstErrorKey = Object.keys(validationErrors)[0];
      const firstErrorMessage = validationErrors[firstErrorKey][0];
      setServerError(firstErrorMessage || 'Проверьте правильность заполнения формы');
      return;
    }

    // Обрабатываем специфичные типы ошибок
    if (errorType === 'duplicate_task') {
      setServerError('Такой генератор уже существует. Измените название или параметры.');
    } else if (errorType === 'access_denied') {
      setServerError('У вас нет доступа для выполнения этого действия.');
    } else if (message) {
      setServerError(message);
    } else {
      setServerError(defaultMessage || 'Проверьте правильность заполнения формы и повторите попытку');
    }
  };

  const createMutation = useMutation({
    mutationFn: (data: CreateTaskGeneratorRequest) => taskGeneratorsApi.createGenerator(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-generators'] });
      onClose();
    },
    onError: (error: unknown) => {
      handleApiError(error, 'Ошибка при создании генератора');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreateTaskGeneratorRequest> }) =>
      taskGeneratorsApi.updateGenerator(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-generators'] });
      onClose();
    },
    onError: (error: unknown) => {
      handleApiError(error, 'Ошибка при обновлении генератора');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    const payload: CreateTaskGeneratorRequest = {
      title: formData.title,
      description: formData.description || undefined,
      comment: formData.comment || undefined,
      dealership_id: formData.dealership_id!,
      recurrence: formData.recurrence,
      recurrence_time: formData.recurrence_time,
      deadline_time: formData.deadline_time,
      recurrence_days_of_week: formData.recurrence === 'weekly' && formData.recurrence_days_of_week.length > 0
        ? formData.recurrence_days_of_week
        : undefined,
      recurrence_days_of_month: formData.recurrence === 'monthly' && formData.recurrence_days_of_month.length > 0
        ? formData.recurrence_days_of_month
        : undefined,
      start_date: formData.start_date,
      end_date: formData.end_date || undefined,
      task_type: formData.task_type,
      response_type: formData.response_type,
      priority: formData.priority,
      tags: formData.tags ? formData.tags.split(',').map((t) => t.trim()).filter(Boolean) : undefined,
      assignments: formData.assignments,
      notification_settings: Object.keys(formData.notification_settings).length > 0 ? formData.notification_settings : undefined,
    };

    if (isEditing && generator) {
      updateMutation.mutate({ id: generator.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleUserToggle = (userId: number) => {
    setFormData((prev) => ({
      ...prev,
      assignments: prev.assignments.includes(userId)
        ? prev.assignments.filter((id) => id !== userId)
        : [...prev.assignments, userId],
    }));
  };

  // Fetch shift config to check if generator times are within shift hours
  const { data: shiftConfigData } = useShiftConfig(formData.dealership_id || undefined);

  // Check if time is within shift hours
  const isTimeOutsideShifts = useMemo(() => {
    if (!shiftConfigData?.data || !formData.recurrence_time) return false;

    const config = shiftConfigData.data;
    const recTime = formData.recurrence_time;
    const deadTime = formData.deadline_time;

    // Convert time to minutes for comparison
    const toMinutes = (time: string) => {
      const [h, m] = time.split(':').map(Number);
      return h * 60 + m;
    };

    const recMinutes = toMinutes(recTime);
    const deadMinutes = toMinutes(deadTime);

    // Check shift 1
    const s1Start = config.shift_1_start_time ? toMinutes(config.shift_1_start_time) : null;
    const s1End = config.shift_1_end_time ? toMinutes(config.shift_1_end_time) : null;

    // Check shift 2
    const s2Start = config.shift_2_start_time ? toMinutes(config.shift_2_start_time) : null;
    const s2End = config.shift_2_end_time ? toMinutes(config.shift_2_end_time) : null;

    const isInShift1 = s1Start !== null && s1End !== null && recMinutes >= s1Start && deadMinutes <= s1End;
    const isInShift2 = s2Start !== null && s2End !== null && recMinutes >= s2Start && deadMinutes <= s2End;

    // If both shifts configured, check if time falls in either
    if (s1Start !== null && s2Start !== null) {
      return !isInShift1 && !isInShift2;
    }
    // If only shift 1 configured
    if (s1Start !== null) {
      return !isInShift1;
    }

    return false; // No shifts configured = no warning
  }, [shiftConfigData?.data, formData.recurrence_time, formData.deadline_time, formData.dealership_id]);

  if (!isOpen) return null;

  const users = usersData?.data || [];
  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />

        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-2xl text-left shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          <form onSubmit={handleSubmit}>
            <div className="bg-white dark:bg-gray-800 px-6 pt-5 pb-4 rounded-t-2xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {isEditing ? 'Редактировать генератор' : 'Создать генератор'}
                </h3>
                <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300">
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

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
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Название генератора"
                />

                {/* Description */}
                <Textarea
                  label="Описание"
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Описание задачи"
                />

                {/* Dealership */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Автосалон *</label>
                  <DealershipSelector
                    value={formData.dealership_id}
                    onChange={(id) => setFormData({ ...formData, dealership_id: id, assignments: [] })}
                    showAllOption={false}
                    className="unified-input rounded-xl"
                  />
                </div>

                {/* Recurrence */}
                <div className="space-y-4">
                  <Select
                    label="Повторяемость"
                    value={formData.recurrence}
                    onChange={(e) => setFormData({ ...formData, recurrence: e.target.value as GeneratorRecurrence })}
                    options={RECURRENCE_OPTIONS}
                  />

                  {formData.recurrence === 'weekly' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Дни недели</label>
                      <WeekDaySelector
                        value={formData.recurrence_days_of_week}
                        onChange={(days) => setFormData({ ...formData, recurrence_days_of_week: days })}
                      />
                    </div>
                  )}

                  {formData.recurrence === 'monthly' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Дни месяца</label>
                      <MonthDayPicker
                        value={formData.recurrence_days_of_month}
                        onChange={(days) => setFormData({ ...formData, recurrence_days_of_month: days })}
                      />
                    </div>
                  )}
                </div>

                {/* Times */}
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Время появления"
                    type="time"
                    value={formData.recurrence_time}
                    onChange={(e) => setFormData({ ...formData, recurrence_time: e.target.value })}
                  />
                  <Input
                    label="Дедлайн"
                    type="time"
                    value={formData.deadline_time}
                    onChange={(e) => setFormData({ ...formData, deadline_time: e.target.value })}
                  />
                </div>

                {/* Warning: Task outside shift hours */}
                {isTimeOutsideShifts && formData.dealership_id && (
                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3 flex items-start gap-3">
                    <ExclamationTriangleIcon className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                        Время вне рабочих смен
                      </p>
                      <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                        Задачи будут создаваться вне стандартного рабочего времени смен.
                        Сотрудники могут не успеть выполнить их вовремя.
                      </p>
                    </div>
                  </div>
                )}

                {/* Date Range */}
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Дата начала *"
                    type="date"
                    required
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  />
                  <div>
                    <Input
                      label="Дата окончания"
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Оставьте пустым для бессрочного</p>
                  </div>
                </div>

                {/* Type & Priority */}
                <div className="grid grid-cols-3 gap-4">
                  <Select
                    label="Тип задачи"
                    value={formData.task_type}
                    disabled
                    options={TASK_TYPE_OPTIONS}
                    hint="Определяется автоматически"
                    className="bg-gray-100 dark:bg-gray-600 opacity-75 cursor-not-allowed"
                    onChange={() => {}}
                  />
                  <Select
                    label="Тип ответа"
                    value={formData.response_type}
                    onChange={(e) => setFormData({ ...formData, response_type: e.target.value as 'acknowledge' | 'complete' })}
                    options={RESPONSE_TYPE_OPTIONS}
                  />
                  <Select
                    label="Приоритет"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as 'low' | 'medium' | 'high' })}
                    options={PRIORITY_OPTIONS}
                  />
                </div>

                {/* Tags */}
                <Input
                  label="Теги"
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="тег1, тег2, тег3"
                />

                {/* Assignments */}
                {formData.dealership_id && (
                  <UserCheckboxList
                    users={users}
                    selectedIds={formData.assignments}
                    onToggle={handleUserToggle}
                    label="Исполнители"
                    showCount
                    required
                  />
                )}

                {/* Notification Settings */}
                <div>
                  <TaskNotificationSettings
                    value={formData.notification_settings}
                    onChange={(settings) => setFormData({ ...formData, notification_settings: settings })}
                  />
                </div>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 flex flex-col-reverse gap-2 sm:flex-row-reverse sm:gap-3 rounded-b-2xl [&>button]:w-full [&>button]:sm:w-auto">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
              >
                Отмена
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={isPending || !formData.dealership_id || formData.assignments.length === 0}
              >
                {isPending ? 'Сохранение...' : isEditing ? 'Сохранить' : 'Создать'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
