import React from 'react';
import { formatDateTime } from '../../utils/dateTime';
import {
  CalendarIcon,
  UserIcon,
  BuildingOfficeIcon,
  TagIcon,
  ChatBubbleLeftIcon,
  ClockIcon,
  CogIcon,
  ArchiveBoxIcon,
  ArrowUturnLeftIcon,
} from '@heroicons/react/24/outline';
import type { ArchivedTask } from '../../types/archivedTask';
import type { TaskResponseStatus } from '../../types/task';
import { PriorityBadge, ArchiveReasonBadge } from '../common';
import { Button, Modal, Badge, Tag } from '../ui';
import { ProofViewer } from './ProofViewer';

interface ArchivedTaskDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: ArchivedTask | null;
  onRestore?: (task: ArchivedTask) => void;
  canRestore?: boolean;
  isRestoring?: boolean;
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

export const ArchivedTaskDetailsModal: React.FC<ArchivedTaskDetailsModalProps> = ({
  isOpen,
  onClose,
  task,
  onRestore,
  canRestore = false,
  isRestoring = false,
}) => {
  if (!isOpen || !task) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={task.title} size="2xl">
      <Modal.Body>
        {/* Header badges */}
        <div className="flex flex-wrap gap-2 items-center mb-6">
          <PriorityBadge priority={task.priority} />
          <ArchiveReasonBadge reason={task.archive_reason} />
          {task.generator_id && (
            <Badge variant="info" icon={<CogIcon />}>
              Генератор
            </Badge>
          )}
        </div>

        {/* Description */}
        {task.description && (
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              Описание
            </h4>
            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg border border-gray-100 dark:border-gray-600">
              {task.description}
            </p>
          </div>
        )}

        {/* Key Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg border border-gray-100 dark:border-gray-600">
            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-1">
              <ArchiveBoxIcon className="w-4 h-4 mr-1.5" />
              Дата архивации
            </div>
            <div className="text-gray-900 dark:text-white font-medium">
              {formatDateTime(task.archived_at)}
            </div>
          </div>

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

        {/* Generator Info */}
        {task.generator && (
          <div className="mb-6 p-3 rounded-lg bg-accent-50 dark:bg-accent-900/20 border border-accent-200 dark:border-accent-800">
            <div className="flex items-center gap-2">
              <CogIcon className="w-5 h-5 text-accent-600 dark:text-accent-400" />
              <span className="text-sm text-accent-800 dark:text-accent-200">
                Создано генератором: <strong>{task.generator.title}</strong>
              </span>
            </div>
          </div>
        )}

        {/* Shared Proofs */}
        {task.shared_proofs && task.shared_proofs.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              Общие файлы задачи
            </h4>
            <ProofViewer proofs={task.shared_proofs} canDelete={false} />
          </div>
        )}

        {/* Assignees with their responses */}
        {task.assignments && task.assignments.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 flex items-center">
              <UserIcon className="w-4 h-4 mr-1.5" />
              Исполнители ({task.assignments.length})
            </h4>

            <div className="space-y-3">
              {task.assignments.map((assignment) => {
                const userResponse = task.responses?.find(r => r.user_id === assignment.user.id);
                const hasProofs = userResponse?.proofs && userResponse.proofs.length > 0;

                return (
                  <div
                    key={assignment.id}
                    className="p-4 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-accent-100 dark:bg-accent-900/50 flex items-center justify-center text-sm font-semibold text-accent-700 dark:text-accent-300 mr-3">
                          {assignment.user.full_name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {assignment.user.full_name}
                        </span>
                      </div>
                      {userResponse && (
                        <Badge variant={getResponseStatusVariant(userResponse.status)} size="sm">
                          {getResponseStatusLabel(userResponse.status)}
                        </Badge>
                      )}
                    </div>

                    {userResponse?.responded_at && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                        <ClockIcon className="w-3.5 h-3.5 inline mr-1" />
                        Ответ: {formatDateTime(userResponse.responded_at)}
                      </p>
                    )}

                    {userResponse?.comment && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 italic border-l-2 border-gray-300 dark:border-gray-500 pl-2 mb-2">
                        {userResponse.comment}
                      </p>
                    )}

                    {hasProofs && (
                      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                          Доказательства выполнения:
                        </p>
                        <ProofViewer proofs={userResponse.proofs!} canDelete={false} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>
          Закрыть
        </Button>
        {canRestore && onRestore && (
          <Button
            variant="primary"
            icon={<ArrowUturnLeftIcon />}
            onClick={() => onRestore(task)}
            isLoading={isRestoring}
          >
            Восстановить
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  );
};
