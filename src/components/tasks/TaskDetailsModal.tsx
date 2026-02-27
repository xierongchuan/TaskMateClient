import React from 'react';
import { formatDateTime, formatDate } from '../../utils/dateTime';
import {
  PencilIcon,
  CalendarIcon,
  UserIcon,
  BuildingOfficeIcon,
  TagIcon,
  ChatBubbleLeftIcon,
  ClockIcon,
  CogIcon,
  DocumentIcon,
} from '@heroicons/react/24/outline';
import type { Task, TaskResponseStatus } from '../../types/task';
import { usePermissions } from '../../hooks/usePermissions';
import { PriorityBadge, StatusBadge } from '../common';
import { Button, Modal, Badge, Tag } from '../ui';
import { ProofViewer } from './ProofViewer';
import { VerificationPanel } from './VerificationPanel';
import { DelegationSection } from './DelegationSection';
import { RESPONSE_TYPE_LABELS } from '../../constants/tasks';

interface TaskDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  onEdit?: (task: Task) => void;
  onApproveResponse?: (responseId: number) => Promise<void>;
  onRejectResponse?: (responseId: number, reason: string) => Promise<void>;
  onDeleteProof?: (proofId: number) => Promise<void>;
  onDeleteSharedProof?: (proofId: number) => Promise<void>;
  onVerificationComplete?: () => void;
  isVerifying?: boolean;
  onAcceptDelegation?: (delegationId: number) => void;
  onRejectDelegation?: (delegationId: number, reason: string) => void;
  onCancelDelegation?: (delegationId: number) => void;
  isDelegationLoading?: boolean;
}

const getResponseStatusLabel = (status?: TaskResponseStatus): string => {
  switch (status) {
    case 'completed': return 'Выполнено';
    case 'pending_review': return 'На проверке';
    case 'acknowledged': return 'Принято';
    case 'rejected': return 'Отклонено';
    case 'postponed': return 'Отложено';
    default: return 'Ожидает';
  }
};

const getResponseStatusVariant = (status?: TaskResponseStatus): 'success' | 'warning' | 'danger' | 'info' | 'gray' => {
  switch (status) {
    case 'completed': return 'success';
    case 'pending_review': return 'info';
    case 'acknowledged': return 'info';
    case 'rejected': return 'danger';
    case 'postponed': return 'warning';
    default: return 'gray';
  }
};

export const TaskDetailsModal: React.FC<TaskDetailsModalProps> = ({
  isOpen,
  onClose,
  task,
  onEdit,
  onApproveResponse,
  onRejectResponse,
  onDeleteProof,
  onDeleteSharedProof,
  onVerificationComplete,
  isVerifying = false,
  onAcceptDelegation,
  onRejectDelegation,
  onCancelDelegation,
  isDelegationLoading = false,
}) => {
  const permissions = usePermissions();

  if (!isOpen || !task) return null;

  const isProofTask = task.response_type === 'completion_with_proof';
  const isCompleted = task.status === 'completed' || task.status === 'completed_late';
  const hasAssignmentsOrResponses =
    (task.assignments && task.assignments.length > 0) ||
    (task.responses && task.responses.length > 0);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={task.title} size="2xl">
      <Modal.Body>
        {/* Header badges */}
        <div className="flex flex-wrap gap-2 items-center mb-6">
          <PriorityBadge priority={task.priority} />
          <StatusBadge status={task.status} type="task" />
          {task.generator_id && (
            <Badge variant="info" icon={<CogIcon />}>
              Генератор
            </Badge>
          )}
        </div>

        {/* Description */}
        {task.description && (
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Описание</h4>
            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg border border-gray-100 dark:border-gray-600">
              {task.description}
            </p>
          </div>
        )}

        {/* Key Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg border border-gray-100 dark:border-gray-600">
            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-1">
              <CalendarIcon className="w-4 h-4 mr-1.5" />
              Дедлайн
            </div>
            <div className="text-gray-900 dark:text-white font-medium">
              {task.deadline ? formatDateTime(task.deadline) : 'Не установлен'}
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg border border-gray-100 dark:border-gray-600">
            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-1">
              <BuildingOfficeIcon className="w-4 h-4 mr-1.5" />
              Автосалон
            </div>
            <div className="text-gray-900 dark:text-white font-medium">
              {task.dealership?.name || 'Все салоны'}
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg border border-gray-100 dark:border-gray-600">
            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-1">
              <UserIcon className="w-4 h-4 mr-1.5" />
              Создатель
            </div>
            <div className="text-gray-900 dark:text-white font-medium">
              {task.creator?.full_name || 'Неизвестно'}
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg border border-gray-100 dark:border-gray-600">
            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-1">
              <ClockIcon className="w-4 h-4 mr-1.5" />
              Создано
            </div>
            <div className="text-gray-900 dark:text-white font-medium">
              {formatDate(task.created_at)}
            </div>
          </div>
        </div>

        {/* Comment */}
        {task.comment && (
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 flex items-center">
              <ChatBubbleLeftIcon className="w-4 h-4 mr-1.5" />
              Комментарий
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 italic border-l-4 border-gray-200 dark:border-gray-600 pl-3 py-1">
              {task.comment}
            </p>
          </div>
        )}

        {/* Tags */}
        {task.tags && task.tags.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 flex items-center">
              <TagIcon className="w-4 h-4 mr-1.5" />
              Теги
            </h4>
            <div className="flex flex-wrap gap-2">
              {task.tags.map((tag, idx) => (
                <Tag key={idx} label={tag} size="md" />
              ))}
            </div>
          </div>
        )}

        {/* Response Type Info */}
        {isProofTask && (
          <div className="mb-6">
            <div className="flex items-center gap-2 p-3 rounded-lg bg-accent-50 dark:bg-gray-700/50 border border-accent-200 dark:border-gray-600">
              <DocumentIcon className="w-5 h-5 text-accent-600 dark:text-accent-400" />
              <span className="text-sm text-accent-800 dark:text-accent-200">
                Тип: {RESPONSE_TYPE_LABELS[task.response_type]} — требуется загрузка доказательств
              </span>
            </div>
          </div>
        )}

        {/* Файлы задачи (shared_proofs — загруженные менеджером/владельцем) */}
        {task.shared_proofs && task.shared_proofs.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 flex items-center">
              <DocumentIcon className="w-4 h-4 mr-1.5" />
              Файлы задачи
            </h4>
            <div className="p-4 rounded-lg bg-accent-50 dark:bg-gray-700/50 border border-accent-200 dark:border-gray-600">
              <ProofViewer
                proofs={task.shared_proofs}
                canDelete={permissions.canManageTasks && !!onDeleteSharedProof && !isCompleted}
                onDelete={onDeleteSharedProof}
              />
            </div>
          </div>
        )}

        {/* Делегирование */}
        {task.delegations && task.delegations.length > 0 && (
          <DelegationSection
            delegations={task.delegations}
            onAccept={onAcceptDelegation}
            onReject={onRejectDelegation}
            onCancel={onCancelDelegation}
            isLoading={isDelegationLoading}
          />
        )}

        {/* Assignees with Status / Responses for Individual Tasks */}
        {hasAssignmentsOrResponses && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center">
                <UserIcon className="w-4 h-4 mr-1.5" />
                Исполнители
              </h4>
            </div>

            {/* Detailed progress for group tasks */}
            {task.task_type === 'group' && task.completion_progress && (
              <div className="mb-4">
                {/* Детальный breakdown */}
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs mb-2">
                  <span className="text-green-600 dark:text-green-400">
                    {task.completion_progress.completed_count} выполнено
                  </span>
                  {task.completion_progress.pending_review_count > 0 && (
                    <span className="text-yellow-600 dark:text-yellow-400">
                      {task.completion_progress.pending_review_count} на проверке
                    </span>
                  )}
                  {task.completion_progress.rejected_count > 0 && (
                    <span className="text-red-600 dark:text-red-400">
                      {task.completion_progress.rejected_count} отклонено
                    </span>
                  )}
                  {task.completion_progress.pending_count > 0 && (
                    <span className="text-gray-500 dark:text-gray-400">
                      {task.completion_progress.pending_count} ожидает
                    </span>
                  )}
                  <span className="text-gray-400 dark:text-gray-500 ml-auto">
                    всего: {task.completion_progress.total_assignees}
                  </span>
                </div>

                {/* Многоцветный progress bar */}
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden flex">
                  {/* Completed - green */}
                  {task.completion_progress.completed_count > 0 && (
                    <div
                      className="bg-green-500 h-2 transition-all duration-300"
                      style={{ width: `${(task.completion_progress.completed_count / task.completion_progress.total_assignees) * 100}%` }}
                    />
                  )}
                  {/* Pending review - yellow */}
                  {task.completion_progress.pending_review_count > 0 && (
                    <div
                      className="bg-yellow-500 h-2 transition-all duration-300"
                      style={{ width: `${(task.completion_progress.pending_review_count / task.completion_progress.total_assignees) * 100}%` }}
                    />
                  )}
                  {/* Rejected - red */}
                  {task.completion_progress.rejected_count > 0 && (
                    <div
                      className="bg-red-500 h-2 transition-all duration-300"
                      style={{ width: `${(task.completion_progress.rejected_count / task.completion_progress.total_assignees) * 100}%` }}
                    />
                  )}
                  {/* Pending остается серым (background) */}
                </div>
              </div>
            )}

            {/* Для индивидуальных задач */}
            {task.task_type === 'individual' && task.assignments && task.assignments.length > 0 && (() => {
              // Для индивидуальных задач: статус берём из task.status (не из response, т.к. response может быть от менеджера)
              const taskStatusLabel = getResponseStatusLabel(task.status as TaskResponseStatus);
              const taskStatusVariant = getResponseStatusVariant(task.status as TaskResponseStatus);

              // Response нужен только для ID при верификации
              const pendingResponse = task.responses?.find(r => r.status === 'pending_review');

              // Proofs исполнителя (если загружал сам, не через shared)
              // Если uses_shared_proofs=true, файлы отображаются в секции "Файлы задачи"
              const userProofs = pendingResponse?.uses_shared_proofs ? [] : pendingResponse?.proofs;
              const hasUserProofs = userProofs && userProofs.length > 0;

              // Кнопки верификации: показываем если задача на проверке И есть response для API
              const canVerify = task.status === 'pending_review' &&
                pendingResponse &&
                permissions.canManageTasks &&
                onApproveResponse &&
                onRejectResponse;

              return (
                <div className="space-y-4">
                  {task.assignments.map((assignment) => (
                    <div key={assignment.id} className="p-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full bg-gray-100 dark:bg-gray-600 flex items-center justify-center text-gray-500 dark:text-gray-300 text-xs font-semibold mr-3">
                            {assignment.user.full_name.charAt(0)}
                          </div>
                          <span className="text-sm text-gray-900 dark:text-white font-medium">{assignment.user.full_name}</span>
                        </div>
                        <Badge variant={taskStatusVariant} size="sm">
                          {taskStatusLabel}
                        </Badge>
                      </div>

                      {/* Proofs исполнителя (если загружены им напрямую, не через shared) */}
                      {hasUserProofs && (
                        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-600">
                          <ProofViewer
                            proofs={userProofs}
                            canDelete={permissions.canManageTasks && !!onDeleteProof && !isCompleted}
                            onDelete={onDeleteProof}
                          />
                        </div>
                      )}

                      {/* Кнопки верификации */}
                      {canVerify && (
                        <div className={hasUserProofs ? "mt-3" : "mt-2 pt-2 border-t border-gray-100 dark:border-gray-600"}>
                          <VerificationPanel
                            response={pendingResponse}
                            assigneeName={assignment.user.full_name}
                            onApprove={async (id) => {
                              await onApproveResponse(id);
                              onVerificationComplete?.();
                            }}
                            onReject={async (id, reason) => {
                              await onRejectResponse(id, reason);
                              onVerificationComplete?.();
                            }}
                            isLoading={isVerifying}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              );
            })()}

            {/* Для индивидуальных задач без assignments но с responses */}
            {task.task_type === 'individual' && (!task.assignments || task.assignments.length === 0) && task.responses && task.responses.length > 0 && (() => {
              const taskStatusLabel = getResponseStatusLabel(task.status as TaskResponseStatus);
              const taskStatusVariant = getResponseStatusVariant(task.status as TaskResponseStatus);
              const pendingResponse = task.responses.find(r => r.status === 'pending_review');
              // Если uses_shared_proofs=true, файлы отображаются в секции "Файлы задачи"
              const userProofs = pendingResponse?.uses_shared_proofs ? [] : pendingResponse?.proofs;
              const hasUserProofs = userProofs && userProofs.length > 0;
              const canVerify = task.status === 'pending_review' &&
                pendingResponse &&
                permissions.canManageTasks &&
                onApproveResponse &&
                onRejectResponse;

              // Показываем пользователя из response (для случаев без assignments)
              const displayUser = pendingResponse?.user || task.responses[0]?.user;

              return (
                <div className="space-y-4">
                  <div className="p-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-gray-100 dark:bg-gray-600 flex items-center justify-center text-gray-500 dark:text-gray-300 text-xs font-semibold mr-3">
                          {displayUser?.full_name?.charAt(0) || '?'}
                        </div>
                        <span className="text-sm text-gray-900 dark:text-white font-medium">
                          {displayUser?.full_name || 'Неизвестно'}
                        </span>
                      </div>
                      <Badge variant={taskStatusVariant} size="sm">
                        {taskStatusLabel}
                      </Badge>
                    </div>

                    {/* Proofs исполнителя (если загружены им напрямую) */}
                    {hasUserProofs && (
                      <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-600">
                        <ProofViewer
                          proofs={userProofs}
                          canDelete={permissions.canManageTasks && !!onDeleteProof && !isCompleted}
                          onDelete={onDeleteProof}
                        />
                      </div>
                    )}

                    {/* Кнопки верификации */}
                    {canVerify && (
                      <div className={hasUserProofs ? "mt-3" : "mt-2 pt-2 border-t border-gray-100 dark:border-gray-600"}>
                        <VerificationPanel
                          response={pendingResponse}
                          assigneeName={displayUser?.full_name}
                          onApprove={async (id) => {
                            await onApproveResponse(id);
                            onVerificationComplete?.();
                          }}
                          onReject={async (id, reason) => {
                            await onRejectResponse(id, reason);
                            onVerificationComplete?.();
                          }}
                          isLoading={isVerifying}
                        />
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Для групповых задач: показываем assignments с matched responses */}
            {task.task_type === 'group' && task.assignments && task.assignments.length > 0 && (
              <div className="space-y-4">
                {task.assignments.map((assignment) => {
                  const userResponse = task.responses?.find(r => r.user_id === assignment.user.id);
                  const statusLabel = getResponseStatusLabel(userResponse?.status);
                  const statusVariant = getResponseStatusVariant(userResponse?.status);
                  const canVerify = userResponse?.status === 'pending_review' &&
                    permissions.canManageTasks &&
                    onApproveResponse &&
                    onRejectResponse;

                  // Если uses_shared_proofs=true, файлы отображаются в секции "Файлы задачи"
                  const userProofs = userResponse?.uses_shared_proofs ? [] : userResponse?.proofs;
                  const hasProofs = userProofs && userProofs.length > 0;

                  return (
                    <div key={assignment.id} className="p-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full bg-gray-100 dark:bg-gray-600 flex items-center justify-center text-gray-500 dark:text-gray-300 text-xs font-semibold mr-3">
                            {assignment.user.full_name.charAt(0)}
                          </div>
                          <span className="text-sm text-gray-900 dark:text-white font-medium">{assignment.user.full_name}</span>
                        </div>
                        <Badge variant={statusVariant} size="sm">
                          {statusLabel}
                        </Badge>
                      </div>

                      {/* Файлы доказательств исполнителя */}
                      {hasProofs && (
                        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-600">
                          <ProofViewer
                            proofs={userProofs}
                            canDelete={permissions.canManageTasks && !!onDeleteProof && !isCompleted}
                            onDelete={onDeleteProof}
                          />
                        </div>
                      )}

                      {/* Действия верификации для pending_review */}
                      {canVerify && userResponse && (
                        <div className={hasProofs ? "mt-3" : "mt-2 pt-2 border-t border-gray-100 dark:border-gray-600"}>
                          <VerificationPanel
                            response={userResponse}
                            assigneeName={assignment.user.full_name}
                            onApprove={async (id) => {
                              await onApproveResponse(id);
                              onVerificationComplete?.();
                            }}
                            onReject={async (id, reason) => {
                              await onRejectResponse(id, reason);
                              onVerificationComplete?.();
                            }}
                            isLoading={isVerifying}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>
          Закрыть
        </Button>
        {onEdit && permissions.canManageTasks && !isCompleted && (
          <Button
            variant="primary"
            icon={<PencilIcon />}
            onClick={() => onEdit(task)}
          >
            Редактировать
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  );
};
