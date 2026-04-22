import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { delegationsApi } from '../api/delegations';
import { usePermissions } from '../hooks/usePermissions';
import { usePagination } from '../hooks/usePagination';
import { useResponsiveViewMode } from '../hooks/useResponsiveViewMode';
import { formatDateTime } from '../utils/dateTime';
import type { TaskDelegation } from '../types/task';

// Унифицированные компоненты
import {
  Button,
  Card,
  PageContainer,
  PageHeader,
  EmptyState,
  ErrorState,
  Skeleton,
  Pagination,
  ConfirmDialog,
  Badge,
  Modal,
  Textarea,
} from '../components/ui';

import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

type DelegationTab = 'incoming' | 'outgoing' | 'history';

export const DelegationsPage: React.FC = () => {
  const permissions = usePermissions();
  const { limit } = usePagination();
  const queryClient = useQueryClient();
  const { isMobile } = useResponsiveViewMode('list', 'list', 768);

  const [activeTab, setActiveTab] = useState<DelegationTab>('incoming');
  const [page, setPage] = useState(1);
  const [confirmReject, setConfirmReject] = useState<{ delegationId: number; reason: string } | null>(null);
  const [confirmCancel, setConfirmCancel] = useState<number | null>(null);
  const [rejectModal, setRejectModal] = useState<{ isOpen: boolean; delegationId: number; reason: string }>({
    isOpen: false,
    delegationId: 0,
    reason: '',
  });

  // Сброс страницы при смене таба
  useEffect(() => {
    setPage(1);
  }, [activeTab]);

  // Запросы для разных табов
  const getQueryFilters = () => {
    switch (activeTab) {
      case 'incoming':
        return { status: 'pending', direction: 'incoming' as const, per_page: limit, page };
      case 'outgoing':
        return { status: 'pending', direction: 'outgoing' as const, per_page: limit, page };
      case 'history':
        return {
          status: 'accepted,rejected,cancelled',
          per_page: limit,
          page,
        };
    }
  };

  const { data: delegationsData, isLoading, error, refetch } = useQuery({
    queryKey: ['delegations', activeTab, page, limit],
    queryFn: () => delegationsApi.getDelegations(getQueryFilters()),
    placeholderData: (prev) => prev,
  });

  // Отдельный запрос для счетчика входящих pending запросов
  const { data: incomingCountData } = useQuery({
    queryKey: ['delegations-incoming-count'],
    queryFn: () => delegationsApi.getDelegations({
      status: 'pending',
      direction: 'incoming',
      per_page: 1,
    }),
    placeholderData: (prev) => prev,
  });

  // Мутации
  const acceptMutation = useMutation({
    mutationFn: (delegationId: number) => delegationsApi.acceptDelegation(delegationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delegations'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ delegationId, reason }: { delegationId: number; reason: string }) =>
      delegationsApi.rejectDelegation(delegationId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delegations'] });
      setConfirmReject(null);
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (delegationId: number) => delegationsApi.cancelDelegation(delegationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delegations'] });
      setConfirmCancel(null);
    },
  });

  const handleAccept = (delegationId: number) => {
    acceptMutation.mutate(delegationId);
  };

  const handleReject = (delegationId: number) => {
    if (isMobile) {
      openRejectModal(delegationId);
    } else {
      const promptReason = prompt('Укажите причину отклонения:') || 'Без причины';
      setConfirmReject({ delegationId, reason: promptReason });
    }
  };

  const handleCancel = (delegationId: number) => {
    setConfirmCancel(delegationId);
  };

  const confirmRejectDelegation = () => {
    if (confirmReject) {
      rejectMutation.mutate(confirmReject);
    }
  };

  const confirmCancelDelegation = () => {
    if (confirmCancel) {
      cancelMutation.mutate(confirmCancel);
    }
  };

  const openRejectModal = (delegationId: number) => {
    setRejectModal({ isOpen: true, delegationId, reason: '' });
  };

  const closeRejectModal = () => {
    setRejectModal({ isOpen: false, delegationId: 0, reason: '' });
  };

  const handleRejectWithModal = () => {
    if (rejectModal.reason.trim()) {
      rejectMutation.mutate({
        delegationId: rejectModal.delegationId,
        reason: rejectModal.reason.trim(),
      });
      closeRejectModal();
    }
  };

  const getTabLabel = (tab: DelegationTab): string => {
    const labels = {
      incoming: 'Входящие',
      outgoing: 'Исходящие',
      history: 'История',
    };
    return labels[tab];
  };

  const getTabIcon = (tab: DelegationTab): React.ComponentType<{ className?: string }> => {
    switch (tab) {
      case 'incoming':
        return ArrowLeftIcon;
      case 'outgoing':
        return ArrowRightIcon;
      case 'history':
        return ClockIcon;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="warning">Ожидает</Badge>;
      case 'accepted':
        return <Badge variant="success">Принято</Badge>;
      case 'rejected':
        return <Badge variant="danger">Отклонено</Badge>;
      case 'cancelled':
        return <Badge variant="gray">Отменено</Badge>;
      default:
        return <Badge variant="gray">{status}</Badge>;
    }
  };

  const renderDelegationCard = (delegation: TaskDelegation) => {
    const isIncoming = delegation.to_user_id === permissions.userId;
    const canAccept = isIncoming && delegation.status === 'pending';
    const canReject = isIncoming && delegation.status === 'pending';
    const canCancel =
      delegation.status === 'pending' &&
      (delegation.from_user_id === permissions.userId || permissions.canCancelDelegations);

    return (
      <Card key={delegation.id} className="overflow-hidden">
        {/* Заголовок карточки */}
        <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-base sm:text-lg text-gray-900 dark:text-white truncate mb-1">
                Задача #{delegation.task?.id}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 truncate">
                {delegation.task?.title || 'Задача не найдена'}
              </p>
            </div>
            <div className="flex flex-col items-end gap-2 flex-shrink-0">
              {getStatusBadge(delegation.status)}
              <span className="text-xs text-gray-500 whitespace-nowrap">
                {formatDateTime(delegation.created_at)}
              </span>
            </div>
          </div>
        </div>

        {/* Основное содержимое */}
        <div className="px-4 py-4 sm:px-6 sm:py-5">
          <div className="space-y-4">
            {/* Информация о делегировании */}
            <div className="flex items-center gap-2 text-sm">
              {isIncoming ? (
                <>
                  <ArrowLeftIcon className="w-4 h-4 text-blue-500 flex-shrink-0" />
                  <span className="text-gray-600 dark:text-gray-300">
                    <strong className="text-gray-900 dark:text-white">{delegation.from_user?.full_name || 'Сотрудник'}</strong> предлагает вам взять эту задачу
                  </span>
                </>
              ) : (
                <>
                  <ArrowRightIcon className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span className="text-gray-600 dark:text-gray-300">
                    Вы предложили задачу <strong className="text-gray-900 dark:text-white">{delegation.to_user?.full_name || 'сотруднику'}</strong>
                  </span>
                </>
              )}
            </div>

            {/* Описание задачи */}
            {delegation.task?.description && (
              <div className="text-sm text-gray-600 dark:text-gray-300 border-l-2 border-blue-500 pl-3">
                <div className="font-medium text-gray-700 dark:text-gray-200 mb-1">Описание задачи:</div>
                <div className="whitespace-pre-wrap">{delegation.task.description}</div>
              </div>
            )}

            {/* Детали задачи */}
            {delegation.task && (
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 space-y-2">
                <div className="flex flex-wrap gap-2 text-xs">
                  {delegation.task.priority && (
                    <span className={`px-2 py-0.5 rounded-full ${
                      delegation.task.priority === 'high' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                      delegation.task.priority === 'medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                      'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    }`}>
                      {delegation.task.priority === 'high' ? '🔴 Высокий' : delegation.task.priority === 'medium' ? '🟡 Средний' : '🟢 Низкий'}
                    </span>
                  )}
                  {delegation.task.task_type && (
                    <span className="px-2 py-0.5 rounded-full bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                      {delegation.task.task_type === 'group' ? '👥 Групповая' : '👤 Индивидуальная'}
                    </span>
                  )}
                  {delegation.task.response_type && (
                    <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                      {delegation.task.response_type === 'completion' ? '✅ Выполнение' :
                       delegation.task.response_type === 'completion_with_proof' ? '📎 С доказательствами' :
                       '📢 Уведомление'}
                    </span>
                  )}
                </div>
                {delegation.task.deadline && (
                  <div className="text-xs text-gray-500 flex items-center gap-1">
                    <ClockIcon className="w-3 h-3" />
                    Дедлайн: {formatDateTime(delegation.task.deadline)}
                  </div>
                )}
                {delegation.task.dealership && (
                  <div className="text-xs text-gray-500">
                    🏢 {delegation.task.dealership.name}
                  </div>
                )}
              </div>
            )}

            {/* Причина */}
            {delegation.reason && (
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
                <div className="flex items-start gap-2">
                  <div className="w-1 h-1 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <div className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-1">Причина делегирования:</div>
                    <div className="text-sm text-blue-800 dark:text-blue-200">{delegation.reason}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Причина отклонения */}
            {delegation.rejection_reason && delegation.status === 'rejected' && (
              <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 border border-red-200 dark:border-red-800">
                <div className="flex items-start gap-2">
                  <div className="w-1 h-1 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <div className="text-xs font-medium text-red-700 dark:text-red-300 mb-1">Причина отклонения:</div>
                    <div className="text-sm text-red-800 dark:text-red-200">{delegation.rejection_reason}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Дата ответа */}
            {delegation.responded_at && (
              <div className="text-xs text-gray-500 flex items-center gap-1">
                <ClockIcon className="w-3 h-3" />
                Реагировали: {formatDateTime(delegation.responded_at)}
              </div>
            )}
          </div>
        </div>

        {/* Действия */}
        {delegation.status === 'pending' && (canAccept || canReject || canCancel) && (
          <div className="px-4 py-3 sm:px-6 sm:py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700">
            <div className={`flex ${isMobile ? 'flex-col gap-2' : 'flex-row gap-3'} justify-end`}>
              {canAccept && (
                <Button
                  variant="primary"
                  size={isMobile ? "md" : "sm"}
                  icon={<CheckCircleIcon className={`${isMobile ? 'w-5 h-5' : 'w-4 h-4'}`} />}
                  onClick={() => handleAccept(delegation.id)}
                  isLoading={acceptMutation.isPending}
                  fullWidth={isMobile}
                >
                  Принять
                </Button>
              )}

              {canReject && (
                <Button
                  variant="danger"
                  size={isMobile ? "md" : "sm"}
                  icon={<XCircleIcon className={`${isMobile ? 'w-5 h-5' : 'w-4 h-4'}`} />}
                  onClick={() => handleReject(delegation.id)}
                  isLoading={rejectMutation.isPending}
                  fullWidth={isMobile}
                >
                  Отклонить
                </Button>
              )}

              {canCancel && (
                <Button
                  variant="outline"
                  size={isMobile ? "md" : "sm"}
                  icon={<XMarkIcon className={`${isMobile ? 'w-5 h-5' : 'w-4 h-4'}`} />}
                  onClick={() => handleCancel(delegation.id)}
                  isLoading={cancelMutation.isPending}
                  fullWidth={isMobile}
                >
                  Отменить
                </Button>
              )}
            </div>
          </div>
        )}
      </Card>
    );
  };

  return (
    <PageContainer>
      <PageHeader
        title="Делегирование задач"
        description="Управление запросами на передачу задач между сотрудниками"
      />

      {/* Tabs Navigation */}
      <div className="bg-gray-100 dark:bg-gray-800 p-1 rounded-xl mb-6">
        <div className="flex gap-1 overflow-x-auto">
          {(['incoming', 'outgoing', 'history'] as const).map((tab) => {
            const Icon = getTabIcon(tab);
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`
                  flex-1 flex items-center justify-center gap-2 py-2.5 px-3 sm:px-4 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap
                  ${isActive
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm ring-1 ring-black/5 dark:ring-white/5'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200/50 dark:hover:bg-gray-700/50'
                  }
                `}
                title={getTabLabel(tab)}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-accent-500 dark:text-accent-400' : 'opacity-70'}`} />
                <span className="hidden sm:inline">{getTabLabel(tab)}</span>
                {tab === 'incoming' &&
                  incomingCountData &&
                  incomingCountData?.total > 0 && (
                    <span className={`ml-1 bg-accent-500 text-white text-xs px-2 py-0.5 rounded-full min-w-fit ${
                      isActive ? 'bg-accent-600' : ''
                    }`}>
                      {incomingCountData.total}
                    </span>
                  )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Содержимое */}
      {isLoading ? (
        <Card>
          <Card.Body>
            <Skeleton variant="list" count={5} />
          </Card.Body>
        </Card>
      ) : error ? (
        <ErrorState
          title="Ошибка загрузки делегирований"
          onRetry={() => refetch()}
        />
      ) : !delegationsData?.data?.length ? (
        <EmptyState
          icon={<ClockIcon />}
          title={`Нет ${activeTab === 'history' ? 'истории' : 'запросов'} делегирования`}
          description={
            activeTab === 'history'
              ? 'Здесь появится история принятых, отклонённых и отменённых запросов'
              : activeTab === 'incoming'
              ? 'Вам ещё не предлагали задач для делегирования'
              : 'Вы ещё не отправляли запросов на делегирование задач'
          }
        />
      ) : (
        <>
          <div className="space-y-4 mb-6">
            {delegationsData?.data.map(renderDelegationCard)}
          </div>

          {/* Пагинация */}
          {delegationsData && delegationsData.last_page > 1 && (
            <Pagination
              currentPage={page}
              totalPages={delegationsData.last_page}
              total={delegationsData.total}
              perPage={delegationsData.per_page}
              onPageChange={setPage}
              showInfo={!isMobile}
              className={isMobile ? "px-0" : ""}
            />
          )}
        </>
      )}

      {/* Диалог подтверждения отклонения */}
      <ConfirmDialog
        isOpen={!!confirmReject}
        title="Отклонить запрос на делегирование?"
        message={`Причина: ${confirmReject?.reason}`}
        variant="danger"
        confirmText="Отклонить"
        cancelText="Отмена"
        onConfirm={confirmRejectDelegation}
        onCancel={() => setConfirmReject(null)}
        isLoading={rejectMutation.isPending}
      />

      {/* Диалог подтверждения отмены */}
      <ConfirmDialog
        isOpen={!!confirmCancel}
        title="Отменить запрос на делегирование?"
        message="Это действие нельзя отменить"
        variant="warning"
        confirmText="Отменить"
        cancelText="Отмена"
        onConfirm={confirmCancelDelegation}
        onCancel={() => setConfirmCancel(null)}
        isLoading={cancelMutation.isPending}
      />

      {/* Модальное окно для отклонения */}
      <Modal
        isOpen={rejectModal.isOpen}
        onClose={closeRejectModal}
        title="Отклонить запрос на делегирование"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Укажите причину отклонения запроса:
          </p>
          <Textarea
            label="Причина отклонения"
            placeholder="Например: У меня нет времени на эту задачу"
            value={rejectModal.reason}
            onChange={(e) => setRejectModal(prev => ({ ...prev, reason: e.target.value }))}
            rows={3}
            required
          />
          <div className="flex gap-3 pt-4">
            <Button
              variant="danger"
              onClick={handleRejectWithModal}
              disabled={!rejectModal.reason.trim()}
              isLoading={rejectMutation.isPending}
              fullWidth
            >
              Отклонить запрос
            </Button>
            <Button
              variant="outline"
              onClick={closeRejectModal}
              fullWidth
            >
              Отмена
            </Button>
          </div>
        </div>
      </Modal>
    </PageContainer>
  );
};