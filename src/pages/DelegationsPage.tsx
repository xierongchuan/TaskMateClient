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
      <Card key={delegation.id} className={`${isMobile ? 'p-3' : 'p-4'}`}>
        <div className="flex flex-col gap-4">
          {/* Заголовок и статус */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              {getStatusBadge(delegation.status)}
              <span className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-500`}>
                #{delegation.id} • {formatDateTime(delegation.created_at)}
              </span>
            </div>
          </div>

          {/* Основная информация */}
          <div className="flex-1 min-w-0">
            <h3 className={`font-semibold ${isMobile ? 'text-base' : 'text-lg'} mb-2`}>
              Задача #{delegation.task?.id}: {delegation.task?.title || 'Задача не найдена'}
            </h3>

            <div className={`${isMobile ? 'text-sm' : 'text-sm'} text-gray-600 mb-3`}>
              {isIncoming ? (
                <span>
                  <strong>{delegation.from_user?.full_name || 'Сотрудник'}</strong> предлагает вам взять задачу
                </span>
              ) : (
                <span>
                  Вы предложили задачу <strong>{delegation.to_user?.full_name || 'сотруднику'}</strong>
                </span>
              )}
            </div>

            {delegation.reason && (
              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg mb-3">
                <div className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600 dark:text-gray-400 mb-1`}>Причина:</div>
                <div className={`${isMobile ? 'text-sm' : 'text-sm'}`}>{delegation.reason}</div>
              </div>
            )}

            {delegation.rejection_reason && delegation.status === 'rejected' && (
              <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg mb-3">
                <div className={`${isMobile ? 'text-xs' : 'text-sm'} text-red-600 dark:text-red-400 mb-1`}>Причина отклонения:</div>
                <div className={`${isMobile ? 'text-sm' : 'text-sm'} text-red-700 dark:text-red-300`}>{delegation.rejection_reason}</div>
              </div>
            )}

            {delegation.responded_at && (
              <div className={`${isMobile ? 'text-xs' : 'text-xs'} text-gray-500`}>
                Реагировали: {formatDateTime(delegation.responded_at)}
              </div>
            )}
          </div>

          {/* Действия */}
          {delegation.status === 'pending' && (canAccept || canReject || canCancel) && (
            <div className={`flex ${isMobile ? 'flex-col gap-2' : 'flex-row gap-2 sm:flex-shrink-0'} pt-2 border-t border-gray-100 dark:border-gray-700`}>
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
          )}
        </div>
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
                  delegationsData &&
                  delegationsData?.total > 0 && (
                    <span className={`ml-1 bg-accent-500 text-white text-xs px-2 py-0.5 rounded-full min-w-fit ${
                      isActive ? 'bg-accent-600' : ''
                    }`}>
                      {delegationsData.total}
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