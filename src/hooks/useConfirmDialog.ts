import { useState, useCallback } from 'react';
import type { ConfirmDialogVariant } from '../components/ui/ConfirmDialog';

interface ConfirmOptions {
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmDialogVariant;
}

interface ConfirmState extends ConfirmOptions {
  isOpen: boolean;
  resolve: ((value: boolean) => void) | null;
}

/**
 * Hook для использования унифицированного диалога подтверждения.
 *
 * @example
 * const { showConfirm, confirmState, handleConfirm, handleCancel } = useConfirmDialog();
 *
 * const handleDelete = async () => {
 *   const confirmed = await showConfirm({
 *     title: 'Удалить задачу?',
 *     message: 'Это действие нельзя отменить',
 *     variant: 'danger',
 *   });
 *
 *   if (confirmed) {
 *     // Выполнить удаление
 *   }
 * };
 *
 * return (
 *   <>
 *     <button onClick={handleDelete}>Удалить</button>
 *     <ConfirmDialog
 *       isOpen={confirmState.isOpen}
 *       title={confirmState.title}
 *       message={confirmState.message}
 *       confirmText={confirmState.confirmText}
 *       cancelText={confirmState.cancelText}
 *       variant={confirmState.variant}
 *       onConfirm={handleConfirm}
 *       onCancel={handleCancel}
 *     />
 *   </>
 * );
 */
export const useConfirmDialog = () => {
  const [state, setState] = useState<ConfirmState>({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Подтвердить',
    cancelText: 'Отмена',
    variant: 'danger',
    resolve: null,
  });

  const showConfirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setState({
        ...options,
        isOpen: true,
        resolve,
      });
    });
  }, []);

  const handleConfirm = useCallback(() => {
    if (state.resolve) {
      state.resolve(true);
    }
    setState((prev) => ({ ...prev, isOpen: false, resolve: null }));
  }, [state]);

  const handleCancel = useCallback(() => {
    if (state.resolve) {
      state.resolve(false);
    }
    setState((prev) => ({ ...prev, isOpen: false, resolve: null }));
  }, [state]);

  return {
    showConfirm,
    confirmState: state,
    handleConfirm,
    handleCancel,
  };
};
