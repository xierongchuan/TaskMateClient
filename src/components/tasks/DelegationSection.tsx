import React, { useState } from 'react';
import type { TaskDelegation } from '../../types/task';
import { usePermissions } from '../../hooks/usePermissions';
import { formatDateTime } from '../../utils/dateTime';
import { Button, Badge, Textarea } from '../ui';
import {
  ArrowsRightLeftIcon,
  CheckIcon,
  XMarkIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

interface DelegationSectionProps {
  delegations: TaskDelegation[];
  onAccept?: (delegationId: number) => void;
  onReject?: (delegationId: number, reason: string) => void;
  onCancel?: (delegationId: number) => void;
  isLoading?: boolean;
}

const getDelegationStatusLabel = (status: string): string => {
  switch (status) {
    case 'pending': return 'Ожидает';
    case 'accepted': return 'Принято';
    case 'rejected': return 'Отклонено';
    case 'cancelled': return 'Отменено';
    default: return status;
  }
};

const getDelegationStatusVariant = (status: string): 'warning' | 'success' | 'danger' | 'gray' => {
  switch (status) {
    case 'pending': return 'warning';
    case 'accepted': return 'success';
    case 'rejected': return 'danger';
    case 'cancelled': return 'gray';
    default: return 'gray';
  }
};

export const DelegationSection: React.FC<DelegationSectionProps> = ({
  delegations,
  onAccept,
  onReject,
  onCancel,
  isLoading = false,
}) => {
  const { userId, canCancelDelegations } = usePermissions();
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  if (!delegations || delegations.length === 0) return null;

  const pendingDelegations = delegations.filter(d => d.status === 'pending');
  const historyDelegations = delegations.filter(d => d.status !== 'pending');

  const handleReject = (delegationId: number) => {
    if (onReject && rejectReason.trim()) {
      onReject(delegationId, rejectReason.trim());
      setRejectingId(null);
      setRejectReason('');
    }
  };

  return (
    <div className="mb-6">
      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 flex items-center">
        <ArrowsRightLeftIcon className="w-4 h-4 mr-1.5" />
        Делегирование
      </h4>

      {/* Активные (pending) делегации */}
      {pendingDelegations.length > 0 && (
        <div className="space-y-3 mb-3">
          {pendingDelegations.map((delegation) => {
            const isTarget = delegation.to_user_id === userId;
            const isInitiator = delegation.from_user_id === userId;
            const canManagerCancel = canCancelDelegations;

            return (
              <div
                key={delegation.id}
                className="p-3 rounded-lg border border-yellow-200 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-900/20"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <ClockIcon className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {delegation.from_user?.full_name || 'Неизвестно'}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">&rarr;</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {delegation.to_user?.full_name || 'Неизвестно'}
                    </span>
                  </div>
                  <Badge variant="warning" size="sm">Ожидает</Badge>
                </div>

                {delegation.reason && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 italic">
                    {delegation.reason}
                  </p>
                )}

                {/* Кнопки для получателя */}
                {isTarget && onAccept && onReject && (
                  <div className="mt-2">
                    {rejectingId === delegation.id ? (
                      <div className="space-y-2">
                        <Textarea
                          placeholder="Укажите причину отклонения..."
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          rows={2}
                          maxLength={1000}
                          disabled={isLoading}
                        />
                        <div className="flex gap-2">
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleReject(delegation.id)}
                            disabled={!rejectReason.trim() || isLoading}
                            isLoading={isLoading}
                          >
                            Отклонить
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => { setRejectingId(null); setRejectReason(''); }}
                            disabled={isLoading}
                          >
                            Отмена
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <Button
                          variant="primary"
                          size="sm"
                          icon={<CheckIcon className="w-4 h-4" />}
                          onClick={() => onAccept(delegation.id)}
                          disabled={isLoading}
                          isLoading={isLoading}
                        >
                          Принять
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          icon={<XMarkIcon className="w-4 h-4" />}
                          onClick={() => setRejectingId(delegation.id)}
                          disabled={isLoading}
                        >
                          Отклонить
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {/* Кнопка отмены для инициатора */}
                {isInitiator && !isTarget && onCancel && (
                  <div className="mt-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={<XMarkIcon className="w-4 h-4" />}
                      onClick={() => onCancel(delegation.id)}
                      disabled={isLoading}
                      isLoading={isLoading}
                    >
                      Отменить запрос
                    </Button>
                  </div>
                )}

                {/* Кнопка отмены для менеджера/владельца */}
                {canManagerCancel && !isInitiator && !isTarget && onCancel && (
                  <div className="mt-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={<XMarkIcon className="w-4 h-4" />}
                      onClick={() => onCancel(delegation.id)}
                      disabled={isLoading}
                      isLoading={isLoading}
                    >
                      Отменить
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* История делегаций */}
      {historyDelegations.length > 0 && (
        <div className="space-y-2">
          {historyDelegations.map((delegation) => (
            <div
              key={delegation.id}
              className="p-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <span>{delegation.from_user?.full_name || 'Неизвестно'}</span>
                  <span>&rarr;</span>
                  <span>{delegation.to_user?.full_name || 'Неизвестно'}</span>
                </div>
                <Badge variant={getDelegationStatusVariant(delegation.status)} size="sm">
                  {getDelegationStatusLabel(delegation.status)}
                </Badge>
              </div>
              {delegation.rejection_reason && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 italic">
                  Причина: {delegation.rejection_reason}
                </p>
              )}
              {delegation.responded_at && (
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  {formatDateTime(delegation.responded_at)}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
