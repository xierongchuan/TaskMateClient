import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { tasksApi } from '../api/tasks';
import { formatDateTime, formatDateTimeShort } from '../utils/dateTime';
import {
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  DocumentIcon,
  BuildingOfficeIcon,
} from '@heroicons/react/24/outline';

import type { Task, TaskResponse } from '../types/task';
import { TaskDetailsModal } from '../components/tasks/TaskDetailsModal';
import { ProofViewer } from '../components/tasks/ProofViewer';
import { usePermissions } from '../hooks/usePermissions';
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
  Badge,
  Select,
  Alert,
} from '../components/ui';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'gray';

const getResponseStatusInfo = (status?: string, rejectionReason?: string | null): {
  label: string;
  variant: BadgeVariant;
  icon: React.ReactNode;
} => {
  if (rejectionReason) {
    return {
      label: 'Отклонено',
      variant: 'danger',
      icon: <XCircleIcon className="w-4 h-4" />,
    };
  }
  switch (status) {
    case 'completed':
      return {
        label: 'Выполнено',
        variant: 'success',
        icon: <CheckCircleIcon className="w-4 h-4" />,
      };
    case 'pending_review':
      return {
        label: 'На проверке',
        variant: 'warning',
        icon: <ClockIcon className="w-4 h-4" />,
      };
    case 'acknowledged':
      return {
        label: 'Подтверждено',
        variant: 'info',
        icon: <CheckCircleIcon className="w-4 h-4" />,
      };
    default:
      return {
        label: status || 'Неизвестно',
        variant: 'gray',
        icon: <DocumentIcon className="w-4 h-4" />,
      };
  }
};

export const MyHistoryPage: React.FC = () => {
  const permissions = usePermissions();
  const { dealershipId: workspaceDealershipId } = useWorkspace();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const { data: historyData, isLoading, error, refetch } = useQuery({
    queryKey: ['my-history', page, statusFilter, workspaceDealershipId],
    queryFn: () => tasksApi.getMyHistory({
      response_status: statusFilter || undefined,
      dealership_id: workspaceDealershipId || undefined,
      page,
      per_page: 15,
    }),
  });

  // Получаем свой ответ из задачи
  const getMyResponse = (task: Task): TaskResponse | undefined => {
    return task.responses?.find(r => r.user_id === permissions.userId);
  };

  const handleViewDetails = (task: Task) => {
    setSelectedTask(task);
    setIsDetailsOpen(true);
  };

  return (
    <PageContainer>
      <PageHeader
        title="Моя история"
        description="Задачи, которые вы выполнили или на которые ответили"
      />

      {/* Фильтры */}
      <Card className="mb-6">
        <Card.Body>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="w-full sm:w-48">
              <Select
                label="Статус"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                options={[
                  { value: '', label: 'Все статусы' },
                  { value: 'completed', label: 'Выполнено' },
                  { value: 'pending_review', label: 'На проверке' },
                  { value: 'acknowledged', label: 'Подтверждено' },
                ]}
              />
            </div>
            <div className="flex items-end">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Найдено: {historyData?.total || 0} задач
              </span>
            </div>
          </div>
        </Card.Body>
      </Card>

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
      ) : historyData?.data.length === 0 ? (
        <EmptyState
          icon={<ClockIcon />}
          title="История пуста"
          description={
            permissions.isOwner || permissions.isManager
              ? "Эта страница показывает историю выполненных вами задач. Как руководитель, вы создаёте и проверяете задачи, а не выполняете их."
              : "Вы ещё не выполняли задачи"
          }
        />
      ) : (
        <>
          <div className="space-y-4">
            {historyData?.data.map((task) => {
              const myResponse = getMyResponse(task);
              if (!myResponse) return null;

              const statusInfo = getResponseStatusInfo(myResponse.status, myResponse.rejection_reason);

              return (
                <Card key={task.id} className="hover:shadow-md transition-shadow">
                  <Card.Body>
                    <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                      {/* Информация о задаче */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <h3
                            className="text-lg font-semibold text-gray-900 dark:text-white cursor-pointer hover:text-accent-600 dark:hover:text-accent-400 transition-colors"
                            onClick={() => handleViewDetails(task)}
                          >
                            {task.title}
                          </h3>
                          <Badge variant={statusInfo.variant}>
                            <span className="flex items-center gap-1">
                              {statusInfo.icon}
                              {statusInfo.label}
                            </span>
                          </Badge>
                        </div>

                        {task.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                            {task.description}
                          </p>
                        )}

                        {/* Причина отклонения */}
                        {myResponse.rejection_reason && (
                          <Alert
                            variant="error"
                            title="Причина отклонения"
                            message={myResponse.rejection_reason}
                            className="mb-3"
                          />
                        )}

                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                          <span className="flex items-center">
                            <BuildingOfficeIcon className="w-4 h-4 mr-1" />
                            {task.dealership?.name || 'Все салоны'}
                          </span>
                          {myResponse.responded_at && (
                            <span>
                              Ответ: {formatDateTime(myResponse.responded_at)}
                            </span>
                          )}
                          {myResponse.verified_at && (
                            <span className="text-green-600 dark:text-green-400">
                              Проверено: {formatDateTimeShort(myResponse.verified_at)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Доказательства */}
                      {((myResponse.proofs && myResponse.proofs.length > 0) || (task.shared_proofs && task.shared_proofs.length > 0)) && (
                        <div className="lg:w-64 flex-shrink-0">
                          <ProofViewer proofs={myResponse.proofs && myResponse.proofs.length > 0 ? myResponse.proofs : task.shared_proofs || []} />
                        </div>
                      )}

                      {/* Действия */}
                      <div className="flex flex-col gap-2 lg:w-32 flex-shrink-0">
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
          {historyData && historyData.last_page > 1 && (
            <Pagination
              currentPage={page}
              totalPages={historyData.last_page}
              total={historyData.total}
              perPage={historyData.per_page}
              onPageChange={setPage}
              className="mt-8"
            />
          )}
        </>
      )}

      {/* Детали задачи */}
      <TaskDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        task={selectedTask}
      />
    </PageContainer>
  );
};
