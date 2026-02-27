import { useEffect, useCallback } from 'react';
import { useConfirmDialog } from './useConfirmDialog';

/**
 * Хук для предупреждения о несохранённых изменениях.
 * - Показывает браузерное предупреждение при перезагрузке/закрытии страницы
 * - Предоставляет функцию confirmLeave для проверки перед переходом
 */
export const useUnsavedChanges = (hasChanges: boolean) => {
  const { showConfirm, confirmState, handleConfirm, handleCancel } = useConfirmDialog();

  // Предупреждение при перезагрузке/закрытии страницы
  useEffect(() => {
    if (!hasChanges) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasChanges]);

  // Функция для проверки перед сменой таба/страницы
  const confirmLeave = useCallback(async (): Promise<boolean> => {
    if (!hasChanges) return true;

    return showConfirm({
      title: 'Несохранённые изменения',
      message: 'У вас есть несохранённые изменения. Вы уверены, что хотите уйти без сохранения?',
      confirmText: 'Уйти без сохранения',
      cancelText: 'Остаться',
      variant: 'warning',
    });
  }, [hasChanges, showConfirm]);

  return {
    confirmLeave,
    hasChanges,
    // Для рендеринга ConfirmDialog
    confirmState,
    handleConfirm,
    handleCancel,
  };
};
