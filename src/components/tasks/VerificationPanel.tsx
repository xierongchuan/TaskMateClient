import React, { useState } from 'react';
import {
  CheckIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import type { TaskResponse } from '../../types/task';
import { Button, Modal, Textarea, Alert } from '../ui';
import { formatDateTime } from '../../utils/dateTime';

export interface VerificationPanelProps {
  response: TaskResponse;
  onApprove: (responseId: number) => Promise<void>;
  onReject: (responseId: number, reason: string) => Promise<void>;
  isLoading?: boolean;
  /** Имя исполнителя (приоритет над response.user для индивидуальных задач) */
  assigneeName?: string;
}

export const VerificationPanel: React.FC<VerificationPanelProps> = ({
  response,
  onApprove,
  onReject,
  isLoading = false,
  assigneeName,
}) => {
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejecting, setRejecting] = useState(false);
  const [approving, setApproving] = useState(false);

  // Only show for pending_review status
  if (response.status !== 'pending_review') {
    // Show verification status if already verified
    if (response.verified_at) {
      return (
        <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
          <div className="flex items-center gap-2">
            <CheckCircleIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
            <span className="text-sm font-medium text-green-800 dark:text-green-200">
              Одобрено
            </span>
          </div>
          {response.verifier && (
            <p className="mt-1 text-xs text-green-700 dark:text-green-300">
              Проверил: {response.verifier.full_name}
            </p>
          )}
          {response.verified_at && (
            <p className="text-xs text-green-600 dark:text-green-400">
              {formatDateTime(response.verified_at)}
            </p>
          )}
        </div>
      );
    }

    // Show rejection status if rejected (using explicit status instead of rejection_reason)
    if (response.status === 'rejected') {
      return (
        <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <div className="flex items-center gap-2">
            <XCircleIcon className="w-5 h-5 text-red-600 dark:text-red-400" />
            <span className="text-sm font-medium text-red-800 dark:text-red-200">
              Отклонено{response.rejection_count && response.rejection_count > 1 ? ` (${response.rejection_count} раз)` : ''}
            </span>
          </div>
          {response.rejection_reason && (
            <p className="mt-2 text-sm text-red-700 dark:text-red-300">
              Причина: {response.rejection_reason}
            </p>
          )}
        </div>
      );
    }

    return null;
  }

  const handleApprove = async () => {
    setApproving(true);
    try {
      await onApprove(response.id);
    } finally {
      setApproving(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) return;
    setRejecting(true);
    try {
      await onReject(response.id, rejectReason.trim());
      setShowRejectModal(false);
      setRejectReason('');
    } finally {
      setRejecting(false);
    }
  };

  return (
    <>
      <div className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
        <div className="flex items-center gap-2 mb-3">
          <ClockIcon className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
          <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
            Ожидает проверки
          </span>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            variant="primary"
            size="sm"
            icon={<CheckIcon className="w-4 h-4" />}
            onClick={handleApprove}
            disabled={isLoading || approving || rejecting}
            isLoading={approving}
            fullWidth
            className="sm:w-auto"
          >
            Одобрить
          </Button>
          <Button
            variant="danger"
            size="sm"
            icon={<XMarkIcon className="w-4 h-4" />}
            onClick={() => setShowRejectModal(true)}
            disabled={isLoading || approving || rejecting}
            fullWidth
            className="sm:w-auto"
          >
            Отклонить
          </Button>
        </div>
      </div>

      {/* Reject Modal */}
      <Modal
        isOpen={showRejectModal}
        onClose={() => {
          setShowRejectModal(false);
          setRejectReason('');
        }}
        title="Отклонение доказательства"
        size="md"
      >
        <Modal.Body>
          <div className="space-y-6">
            {/* Заголовок с иконкой предупреждения */}
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30">
                <ExclamationTriangleIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-base font-medium text-gray-900 dark:text-white mb-1">
                  Отклонить доказательство
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Исполнитель: {assigneeName || response.user?.full_name || 'Неизвестно'}
                </p>
              </div>
            </div>

            {/* Предупреждение о последствиях */}
            <Alert
              variant="warning"
              message={
                response.uses_shared_proofs
                  ? 'При отклонении сотрудник должен будет загрузить свои собственные файлы доказательств.'
                  : 'При отклонении все загруженные файлы будут удалены. Сотрудник сможет повторно отправить доказательства.'
              }
            />

            {/* Поле причины */}
            <div>
              <Textarea
                label="Причина отклонения"
                placeholder="Опишите, почему доказательство отклонено и что нужно исправить...&#10;Например: Качество фото недостаточное, необходимо переснять при лучшем освещении."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={4}
                required
              />
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Причина будет показана сотруднику
              </p>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => {
              setShowRejectModal(false);
              setRejectReason('');
            }}
            disabled={rejecting}
          >
            Отмена
          </Button>
          <Button
            variant="danger"
            icon={<XMarkIcon className="w-4 h-4" />}
            onClick={handleReject}
            disabled={!rejectReason.trim() || rejecting}
            isLoading={rejecting}
          >
            Отклонить
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default VerificationPanel;
