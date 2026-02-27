import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tasksApi } from '../api/tasks';
import { usePermissions } from '../hooks/usePermissions';
import { formatDateTimeShort } from '../utils/dateTime';
import {
  ClipboardDocumentCheckIcon,
  CheckIcon,
  XMarkIcon,
  EyeIcon,
  UserIcon,
  UsersIcon,
  BuildingOfficeIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

import type { Task, TaskResponse } from '../types/task';
import { TaskDetailsModal } from '../components/tasks/TaskDetailsModal';
import { ProofViewer } from '../components/tasks/ProofViewer';
import { useWorkspace } from '../hooks/useWorkspace';

import {
  Button,
  Skeleton,
  EmptyState,
  ErrorState,
  PageContainer,
  Card,
  Pagination,
  PageHeader,
  Modal,
  Textarea,
  Alert,
  useToast,
} from '../components/ui';
import { StatusBadge, PriorityBadge, ClickableTitle } from '../components/common';

export const PendingReviewPage: React.FC = () => {
  const permissions = usePermissions();
  const { dealershipId: workspaceDealershipId } = useWorkspace();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [page, setPage] = useState(1);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [rejectModal, setRejectModal] = useState<{
    task: Task;
    responses: TaskResponse[];
    mode: 'choose' | 'bulk';
  } | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const { data: tasksData, isLoading, error, refetch } = useQuery({
    queryKey: ['tasks', 'pending_review', page, workspaceDealershipId],
    queryFn: () => tasksApi.getTasks({
      status: 'pending_review',
      dealership_id: workspaceDealershipId || undefined,
      page,
      per_page: 15,
    }),
    refetchInterval: 30000,
  });

  const approveResponseMutation = useMutation({
    mutationFn: (responseId: number) => tasksApi.approveTaskResponse(responseId),
    onSuccess: async () => {
      showToast({ type: 'success', message: 'Доказательство одобрено' });
      await queryClient.invalidateQueries({ queryKey: ['tasks'] });
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      await refetch();
    },
    onError: (error: unknown) => {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Ошибка при одобрении';
      showToast({ type: 'error', message });
    },
  });

  const rejectResponseMutation = useMutation({
    mutationFn: ({ responseId, reason }: { responseId: number; reason: string }) =>
      tasksApi.rejectTaskResponse(responseId, reason),
    onSuccess: async () => {
      showToast({ type: 'success', message: 'Доказательство отклонено' });
      await queryClient.invalidateQueries({ queryKey: ['tasks'] });
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      await refetch();
      setRejectModal(null);
      setRejectReason('');
    },
    onError: (error: unknown) => {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Ошибка при отклонении';
      showToast({ type: 'error', message });
    },
  });

  const rejectAllResponsesMutation = useMutation({
    mutationFn: ({ taskId, reason }: { taskId: number; reason: string }) =>
      tasksApi.rejectAllTaskResponses(taskId, reason),
    onSuccess: async () => {
      showToast({ type: 'success', message: 'Все ответы отклонены' });
      await queryClient.invalidateQueries({ queryKey: ['tasks'] });
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      await refetch();
      setRejectModal(null);
      setRejectReason('');
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
    onError: () => {
      showToast({ type: 'error', message: 'Ошибка при удалении файла' });
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
    onError: () => {
      showToast({ type: 'error', message: 'Ошибка при удалении файла' });
    },
  });

  const handleApprove = async (response: TaskResponse) => {
    await approveResponseMutation.mutateAsync(response.id);
  };

  const handleBulkReject = async () => {
    if (rejectModal && rejectReason.trim()) {
      await rejectAllResponsesMutation.mutateAsync({
        taskId: rejectModal.task.id,
        reason: rejectReason.trim(),
      });
    }
  };

  const handleViewDetails = (task: Task) => {
    setSelectedTask(task);
    setIsDetailsOpen(true);
  };

  // Получаем ВСЕ responses со статусом pending_review для задачи
  const getPendingResponses = (task: Task): TaskResponse[] => {
    return task.responses?.filter(r => r.status === 'pending_review') || [];
  };

  /**
   * Получить имя исполнителя для задачи.
   * Для индивидуальных задач берём имя из assignments (приоритет),
   * т.к. response.user может быть менеджером при complete_for_all.
   * Для групповых задач пытаемся сопоставить response с assignment по user_id.
   */
  const getAssigneeName = (task: Task, response?: TaskResponse): string => {
    // Для индивидуальных задач - приоритет assignment
    if (task.task_type === 'individual') {
      const assignmentUser = task.assignments?.[0]?.user;
      if (assignmentUser?.full_name) {
        return assignmentUser.full_name;
      }
    }

    // Для групповых задач - ищем assignment по user_id response
    if (task.task_type === 'group' && response?.user?.id && task.assignments) {
      const matchingAssignment = task.assignments.find(
        a => a.user?.id === response.user?.id
      );
      if (matchingAssignment?.user?.full_name) {
        return matchingAssignment.user.full_name;
      }
    }

    // Fallback на response.user
    return response?.user?.full_name || 'Неизвестно';
  };

  if (!permissions.canManageTasks) {
    return (
      <PageContainer>
        <ErrorState
          title="Доступ запрещён"
          description="У вас нет прав для просмотра этой страницы"
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Задачи на проверке"
        description="Верификация выполненных задач с доказательствами"
      />

      {/* Информация о найденных задачах */}
      <div className="mb-6">
        <span className="text-sm text-gray-500 dark:text-gray-400">
          Найдено: {tasksData?.total || 0} задач
        </span>
      </div>

      {/* Контент */}
      {isLoading ? (
        <Card>
          <Card.Body>
            <Skeleton variant="list" count={5} />
          </Card.Body>
        </Card>
      ) : error ? (
        <ErrorState
          title="Ошибка загрузки"
          onRetry={() => refetch()}
        />
      ) : tasksData?.data.length === 0 ? (
        <EmptyState
          icon={<ClipboardDocumentCheckIcon />}
          title="Нет задач на проверке"
          description="Все задачи проверены или ещё не отправлены на проверку"
        />
      ) : (
        <>
          <div className="space-y-4">
            {tasksData?.data.map((task) => {
              const pendingResponses = getPendingResponses(task);
              if (pendingResponses.length === 0) return null;
              const firstResponse = pendingResponses[0];
              const multipleAssignees = pendingResponses.length > 1;

              return (
                <Card key={task.id} className="hover:shadow-md transition-shadow">
                  <Card.Body>
                    <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                      {/* Информация о задаче */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <ClickableTitle onClick={() => handleViewDetails(task)}>
                            {task.title}
                          </ClickableTitle>
                          <PriorityBadge priority={task.priority || 'medium'} />
                          <StatusBadge status="pending_review" type="task" />
                        </div>

                        {task.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                            {task.description}
                          </p>
                        )}

                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                          {multipleAssignees ? (
                            <span className="flex items-center">
                              <UsersIcon className="w-4 h-4 mr-1" />
                              {pendingResponses.length} исполнителей на проверке
                            </span>
                          ) : (
                            <span className="flex items-center">
                              <UserIcon className="w-4 h-4 mr-1" />
                              {getAssigneeName(task, firstResponse)}
                            </span>
                          )}
                          <span className="flex items-center">
                            <BuildingOfficeIcon className="w-4 h-4 mr-1" />
                            {task.dealership?.name || 'Все салоны'}
                          </span>
                          {firstResponse.responded_at && (
                            <span>
                              Отправлено: {formatDateTimeShort(firstResponse.responded_at)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Доказательства */}
                      {((firstResponse.proofs && firstResponse.proofs.length > 0) || (task.shared_proofs && task.shared_proofs.length > 0)) && (
                        <div className="lg:w-64 flex-shrink-0">
                          <ProofViewer proofs={firstResponse.proofs && firstResponse.proofs.length > 0 ? firstResponse.proofs : task.shared_proofs || []} />
                        </div>
                      )}

                      {/* Действия */}
                      <div className="flex flex-col gap-2 lg:w-40 flex-shrink-0">
                        {!multipleAssignees && (
                          <Button
                            variant="primary"
                            size="sm"
                            icon={<CheckIcon className="w-4 h-4" />}
                            onClick={() => handleApprove(firstResponse)}
                            disabled={approveResponseMutation.isPending}
                            isLoading={approveResponseMutation.isPending}
                            fullWidth
                          >
                            Одобрить
                          </Button>
                        )}
                        <Button
                          variant="danger"
                          size="sm"
                          icon={<XMarkIcon className="w-4 h-4" />}
                          onClick={() => {
                            if (multipleAssignees) {
                              setRejectModal({ task, responses: pendingResponses, mode: 'choose' });
                            } else {
                              setRejectModal({ task, responses: pendingResponses, mode: 'bulk' });
                            }
                          }}
                          disabled={rejectResponseMutation.isPending || rejectAllResponsesMutation.isPending}
                          fullWidth
                        >
                          Отклонить
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          icon={<EyeIcon className="w-4 h-4" />}
                          onClick={() => handleViewDetails(task)}
                          fullWidth
                        >
                          Подробнее
                        </Button>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              );
            })}
          </div>

          {/* Пагинация */}
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
      )}

      {/* Модальное окно отклонения */}
      <Modal
        isOpen={!!rejectModal}
        onClose={() => {
          setRejectModal(null);
          setRejectReason('');
        }}
        title={rejectModal?.mode === 'choose' ? 'Отклонение задачи' : 'Отклонение доказательства'}
        size="md"
      >
        {rejectModal?.mode === 'choose' ? (
          <>
            <Modal.Body>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30">
                    <ExclamationTriangleIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-base font-medium text-gray-900 dark:text-white mb-1">
                      {rejectModal.task.title}
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {rejectModal.responses.length} исполнителей ожидают проверки
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Выберите способ отклонения:
                  </p>
                  <button
                    className="w-full p-4 text-left rounded-xl border border-gray-200 dark:border-gray-600 hover:border-red-300 dark:hover:border-red-700 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                    onClick={() => setRejectModal({ ...rejectModal, mode: 'bulk' })}
                  >
                    <div className="font-medium text-gray-900 dark:text-white mb-1">
                      Отклонить всем с одной причиной
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Все {rejectModal.responses.length} исполнителей получат одинаковую причину отклонения
                    </div>
                  </button>
                  <button
                    className="w-full p-4 text-left rounded-xl border border-gray-200 dark:border-gray-600 hover:border-accent-300 dark:hover:border-accent-700 hover:bg-accent-50 dark:hover:bg-accent-900/10 transition-colors"
                    onClick={() => {
                      setRejectModal(null);
                      setRejectReason('');
                      handleViewDetails(rejectModal.task);
                    }}
                  >
                    <div className="font-medium text-gray-900 dark:text-white mb-1">
                      Отклонить индивидуально
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Открыть подробности задачи и отклонить каждому исполнителю отдельно с разными причинами
                    </div>
                  </button>
                </div>
              </div>
            </Modal.Body>
            <Modal.Footer>
              <Button
                variant="secondary"
                onClick={() => {
                  setRejectModal(null);
                  setRejectReason('');
                }}
              >
                Отмена
              </Button>
            </Modal.Footer>
          </>
        ) : (
          <>
            <Modal.Body>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30">
                    <ExclamationTriangleIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-base font-medium text-gray-900 dark:text-white mb-1">
                      {rejectModal?.task.title}
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {rejectModal && rejectModal.responses.length > 1
                        ? `Будет отклонено для ${rejectModal.responses.length} исполнителей`
                        : `Исполнитель: ${rejectModal ? getAssigneeName(rejectModal.task, rejectModal.responses[0]) : 'Неизвестно'}`
                      }
                    </p>
                  </div>
                </div>

                {rejectModal && rejectModal.responses.length > 1 && (
                  <div className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-xl">
                    <p className="font-medium mb-1">Исполнители:</p>
                    <ul className="list-disc list-inside space-y-0.5">
                      {rejectModal.responses.map(r => (
                        <li key={r.id}>{getAssigneeName(rejectModal.task, r)}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <Alert
                  variant="warning"
                  message="При отклонении все загруженные файлы будут удалены. Сотрудники смогут повторно отправить доказательства."
                />

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
                    Причина будет показана сотрудникам
                  </p>
                </div>
              </div>
            </Modal.Body>
            <Modal.Footer>
              <Button
                variant="secondary"
                onClick={() => {
                  setRejectModal(null);
                  setRejectReason('');
                }}
                disabled={rejectAllResponsesMutation.isPending}
              >
                Отмена
              </Button>
              <Button
                variant="danger"
                icon={<XMarkIcon className="w-4 h-4" />}
                onClick={handleBulkReject}
                disabled={!rejectReason.trim() || rejectAllResponsesMutation.isPending}
                isLoading={rejectAllResponsesMutation.isPending}
              >
                {rejectModal && rejectModal.responses.length > 1
                  ? `Отклонить всем (${rejectModal.responses.length})`
                  : 'Отклонить'
                }
              </Button>
            </Modal.Footer>
          </>
        )}
      </Modal>

      {/* Детали задачи */}
      <TaskDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        task={selectedTask}
        onApproveResponse={async (responseId) => { await approveResponseMutation.mutateAsync(responseId); }}
        onRejectResponse={async (responseId, reason) => { await rejectResponseMutation.mutateAsync({ responseId, reason }); }}
        onDeleteProof={async (proofId) => { await deleteProofMutation.mutateAsync(proofId); }}
        onDeleteSharedProof={async (proofId) => { await deleteSharedProofMutation.mutateAsync(proofId); }}
        onVerificationComplete={async () => {
          // Обновить selectedTask из свежих данных
          const freshData = await refetch();
          if (selectedTask && freshData.data?.data) {
            const updated = freshData.data.data.find(t => t.id === selectedTask.id);
            if (updated) {
              setSelectedTask(updated);
            } else {
              // Задача больше не в pending_review списке - закрыть модалку
              setIsDetailsOpen(false);
            }
          }
        }}
        isVerifying={approveResponseMutation.isPending || rejectResponseMutation.isPending}
      />
    </PageContainer>
  );
};
