import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationSettingsApi } from '../api/notification-settings';
import { InformationCircleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { NotificationSettingsContent } from '../components/notifications/NotificationSettingsContent';
import { useAuth } from '../hooks/useAuth';
import { PageContainer, Button, ConfirmDialog, Card, PageHeader } from '../components/ui';
import { useToast } from '../components/ui/Toast';

export const NotificationSettingsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { showToast } = useToast();
  const dealershipId = user?.dealership_id;
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const resetMutation = useMutation({
    mutationFn: () => notificationSettingsApi.resetToDefaults(dealershipId || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-settings', dealershipId] });
      showToast({ type: 'success', message: 'Настройки сброшены по умолчанию' });
      setIsConfirmOpen(false);
    },
    onError: (error: any) => {
      console.error('Failed to reset settings:', error);
      showToast({ type: 'error', message: 'Не удалось сбросить настройки' });
      setIsConfirmOpen(false);
    },
  });

  const handleResetToDefaults = () => {
    setIsConfirmOpen(true);
  };

  const confirmReset = () => {
    resetMutation.mutate();
  };

  return (
    <PageContainer>
      {/* Header */}
      <PageHeader
        title="Настройки уведомлений"
        description="Управляйте каналами уведомлений для вашего автосалона"
      >
        <Button
          variant="outline"
          onClick={handleResetToDefaults}
          disabled={resetMutation.isPending}
          icon={<ArrowPathIcon className="w-4 h-4" />}
        >
          Сбросить
        </Button>
      </PageHeader>

      {/* Notification Settings Content */}
      <div className="space-y-6">
        <NotificationSettingsContent dealershipId={dealershipId || undefined} />

        {/* Info Box */}
        <Card className="bg-accent-50 dark:bg-gray-700/50 border-accent-100 dark:border-gray-600">
          <Card.Body>
            <div className="flex">
              <div className="flex-shrink-0">
                <InformationCircleIcon className="h-5 w-5 text-accent-400 dark:text-accent-300" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-accent-800 dark:text-accent-200">Информация</h3>
                <div className="mt-2 text-sm text-accent-700 dark:text-accent-300">
                  <p>
                    • Отключенные каналы не будут отправлять уведомления сотрудникам<br />
                    • Настройки применяются только к вашему автосалону<br />
                    • Изменения вступают в силу немедленно
                  </p>
                </div>
              </div>
            </div>
          </Card.Body>
        </Card>
      </div>

      <ConfirmDialog
        isOpen={isConfirmOpen}
        title="Сбросить настройки?"
        message="Вы уверены, что хотите сбросить все настройки на значения по умолчанию? Это действие нельзя отменить."
        variant="danger"
        confirmText="Сбросить"
        cancelText="Отмена"
        onConfirm={confirmReset}
        onCancel={() => setIsConfirmOpen(false)}
        isLoading={resetMutation.isPending}
      />
    </PageContainer>
  );
};
