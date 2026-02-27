import React from 'react';
import { Badge } from '../ui/Badge';
import {
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';

export type ArchiveReason = 'completed' | 'completed_late' | 'expired' | 'expired_after_shift';

interface ArchiveReasonBadgeProps {
  reason: ArchiveReason | string;
  className?: string;
}

const reasonConfig: Record<ArchiveReason, { label: string; variant: 'success' | 'warning' | 'danger'; icon: React.ElementType }> = {
  completed: {
    label: 'Выполнено',
    variant: 'success',
    icon: CheckCircleIcon,
  },
  completed_late: {
    label: 'С опозданием',
    variant: 'warning',
    icon: ClockIcon,
  },
  expired: {
    label: 'Просрочено',
    variant: 'danger',
    icon: XCircleIcon,
  },
  expired_after_shift: {
    label: 'Просрочено (смена)',
    variant: 'danger',
    icon: XCircleIcon,
  },
};

/**
 * Бейдж причины архивации задачи.
 *
 * @example
 * <ArchiveReasonBadge reason="completed" />
 * <ArchiveReasonBadge reason="expired_after_shift" />
 */
export const ArchiveReasonBadge: React.FC<ArchiveReasonBadgeProps> = ({
  reason,
  className = '',
}) => {
  const config = reasonConfig[reason as ArchiveReason] || {
    label: reason,
    variant: 'gray' as const,
    icon: CheckCircleIcon,
  };
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} icon={<Icon />} className={className}>
      {config.label}
    </Badge>
  );
};
