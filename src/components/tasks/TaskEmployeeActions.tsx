import React from 'react';
import type { Task, TaskResponse } from '../../types/task';
import { Button } from '../ui';
import {
  CheckIcon,
  DocumentArrowUpIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  CheckCircleIcon,
  ArrowsRightLeftIcon,
} from '@heroicons/react/24/outline';

interface TaskEmployeeActionsProps {
  task: Task;
  userId: number;
  onComplete: (task: Task) => void;
  onUploadProof: (task: Task) => void;
  onDelegate?: (task: Task) => void;
  isLoading?: boolean;
}

export const TaskEmployeeActions: React.FC<TaskEmployeeActionsProps> = ({
  task,
  userId,
  onComplete,
  onUploadProof,
  onDelegate,
  isLoading = false,
}) => {
  // Проверяем назначен ли пользователь на эту задачу
  const isAssigned = task.assignments?.some(a => a.user.id === userId);
  if (!isAssigned) return null;

  // Находим ответ текущего пользователя
  const myResponse: TaskResponse | undefined = task.responses?.find(r => r.user_id === userId);

  // Проверяем есть ли pending исходящая делегация от текущего пользователя
  const hasPendingOutgoingDelegation = task.delegations?.some(
    d => d.from_user_id === userId && d.status === 'pending'
  );

  // Можно делегировать: назначен + нет pending/completed/pending_review response + нет pending делегации
  const canDelegate = onDelegate && !hasPendingOutgoingDelegation && (
    !myResponse || myResponse.status === 'pending' || myResponse.status === 'rejected'
  );

  // Кнопка делегирования (переиспользуемая)
  const delegateButton = canDelegate ? (
    <Button
      variant="secondary"
      size="sm"
      icon={<ArrowsRightLeftIcon className="w-4 h-4" />}
      onClick={() => onDelegate(task)}
      disabled={isLoading}
    >
      Делегировать
    </Button>
  ) : null;

  // Если задача уже выполнена или на проверке - показываем статус
  if (myResponse) {
    const { status, rejection_reason, rejection_count, verified_at } = myResponse;

    // Задача отклонена - показываем причину и кнопку повторной отправки
    // Используем явный статус 'rejected' вместо проверки rejection_reason
    if (status === 'rejected') {
      return (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
            <ExclamationTriangleIcon className="w-4 h-4 flex-shrink-0" />
            <span className="line-clamp-2">
              Отклонено{rejection_count && rejection_count > 1 ? ` (${rejection_count} раз)` : ''}
              {rejection_reason ? `: ${rejection_reason}` : ''}
            </span>
          </div>
          <div className="flex gap-2">
            {task.response_type === 'completion_with_proof' ? (
              <Button
                variant="primary"
                size="sm"
                icon={<DocumentArrowUpIcon className="w-4 h-4" />}
                onClick={() => onUploadProof(task)}
                disabled={isLoading}
              >
                Загрузить заново
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                icon={<CheckIcon className="w-4 h-4" />}
                onClick={() => onComplete(task)}
                disabled={isLoading}
              >
                Выполнить заново
              </Button>
            )}
            {delegateButton}
          </div>
        </div>
      );
    }

    // Задача на проверке
    if (status === 'pending_review') {
      return (
        <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400 text-sm">
          <ClockIcon className="w-4 h-4 flex-shrink-0" />
          <span>На проверке</span>
        </div>
      );
    }

    // Задача выполнена
    if (status === 'completed' || verified_at) {
      return (
        <div className="flex items-center gap-2 text-green-600 dark:text-green-400 text-sm">
          <CheckCircleIcon className="w-4 h-4 flex-shrink-0" />
          <span>Выполнено</span>
        </div>
      );
    }

    // Задача подтверждена (для notification)
    if (status === 'acknowledged') {
      return (
        <div className="flex items-center gap-2 text-green-600 dark:text-green-400 text-sm">
          <CheckCircleIcon className="w-4 h-4 flex-shrink-0" />
          <span>Подтверждено</span>
        </div>
      );
    }
  }

  // Задача ещё не выполнена - показываем кнопки в зависимости от типа
  const actionButton = (() => {
    switch (task.response_type) {
      case 'notification':
        return (
          <Button
            variant="secondary"
            size="sm"
            icon={<CheckIcon className="w-4 h-4" />}
            onClick={() => onComplete(task)}
            disabled={isLoading}
          >
            Подтвердить
          </Button>
        );

      case 'completion':
        return (
          <Button
            variant="primary"
            size="sm"
            icon={<CheckIcon className="w-4 h-4" />}
            onClick={() => onComplete(task)}
            disabled={isLoading}
          >
            Выполнить
          </Button>
        );

      case 'completion_with_proof':
        return (
          <Button
            variant="primary"
            size="sm"
            icon={<DocumentArrowUpIcon className="w-4 h-4" />}
            onClick={() => onUploadProof(task)}
            disabled={isLoading}
          >
            Загрузить доказательство
          </Button>
        );

      default:
        return null;
    }
  })();

  return (
    <div className="flex gap-2 flex-wrap">
      {actionButton}
      {delegateButton}
    </div>
  );
};
