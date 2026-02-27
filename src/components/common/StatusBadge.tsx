import React from 'react';
import { Badge } from '../ui/Badge';
import {
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';

export type TaskStatus = 'pending' | 'completed' | 'completed_late' | 'overdue' | 'acknowledged' | 'pending_review';
export type ShiftStatus = 'open' | 'closed' | 'late' | 'replaced';

export interface StatusBadgeProps {
  status: TaskStatus | ShiftStatus | string;
  type?: 'task' | 'shift';
  className?: string;
}

const taskStatusConfig: Record<TaskStatus, { label: string; variant: 'warning' | 'success' | 'danger' | 'info'; icon: React.ElementType }> = {
  pending: { label: 'Ожидает', variant: 'warning', icon: ClockIcon },
  pending_review: { label: 'На проверке', variant: 'info', icon: EyeIcon },
  completed: { label: 'Выполнено', variant: 'success', icon: CheckCircleIcon },
  completed_late: { label: 'Выполнено с опозданием', variant: 'warning', icon: CheckCircleIcon },
  overdue: { label: 'Просрочено', variant: 'danger', icon: XCircleIcon },
  acknowledged: { label: 'Принято', variant: 'info', icon: CheckCircleIcon },
};

const shiftStatusConfig: Record<ShiftStatus, { label: string; variant: 'success' | 'gray' | 'danger' | 'warning' }> = {
  open: { label: 'Открыта', variant: 'success' },
  closed: { label: 'Закрыта', variant: 'gray' },
  late: { label: 'Открыта (Опоздание)', variant: 'danger' },
  replaced: { label: 'Заменена', variant: 'warning' },
};

/**
 * Бейдж статуса задачи или смены.
 *
 * @example
 * <StatusBadge status="pending" type="task" />
 * <StatusBadge status="open" type="shift" />
 */
export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  type = 'task',
  className = '',
}) => {
  if (type === 'shift') {
    const config = shiftStatusConfig[status as ShiftStatus] || { label: status, variant: 'gray' as const };
    return (
      <Badge variant={config.variant} className={className}>
        {config.label}
      </Badge>
    );
  }

  const config = taskStatusConfig[status as TaskStatus] || { label: status, variant: 'gray' as const, icon: ClockIcon };
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} icon={<Icon />} className={className}>
      {config.label}
    </Badge>
  );
};
