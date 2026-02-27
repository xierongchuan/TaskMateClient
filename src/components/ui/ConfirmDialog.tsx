import React from 'react';
import { ExclamationTriangleIcon, TrashIcon, QuestionMarkCircleIcon } from '@heroicons/react/24/outline';
import { Modal } from './Modal';
import { Button } from './Button';

export type ConfirmDialogVariant = 'danger' | 'warning' | 'info';

export interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message?: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmDialogVariant;
  isLoading?: boolean;
}

const variantConfig: Record<ConfirmDialogVariant, {
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  confirmVariant: 'danger' | 'primary';
}> = {
  danger: {
    icon: TrashIcon,
    iconBg: 'bg-red-100 dark:bg-gray-700',
    iconColor: 'text-red-600 dark:text-red-400',
    confirmVariant: 'danger',
  },
  warning: {
    icon: ExclamationTriangleIcon,
    iconBg: 'bg-yellow-100 dark:bg-gray-700',
    iconColor: 'text-yellow-600 dark:text-yellow-400',
    confirmVariant: 'primary',
  },
  info: {
    icon: QuestionMarkCircleIcon,
    iconBg: 'bg-accent-100 dark:bg-gray-700',
    iconColor: 'text-accent-600 dark:text-accent-400',
    confirmVariant: 'primary',
  },
};

/**
 * Диалог подтверждения действия.
 *
 * @example
 * <ConfirmDialog
 *   isOpen={showConfirm}
 *   title="Удалить задачу?"
 *   message="Это действие нельзя отменить"
 *   onConfirm={handleDelete}
 *   onCancel={() => setShowConfirm(false)}
 *   variant="danger"
 * />
 */
export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Подтвердить',
  cancelText = 'Отмена',
  variant = 'danger',
  isLoading = false,
}) => {
  const { icon: Icon, iconBg, iconColor, confirmVariant } = variantConfig[variant];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      size="sm"
      showCloseButton={false}
    >
      <div className="p-6">
        <div className="flex items-start">
          <div className={`flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full ${iconBg}`}>
            <Icon className={`h-6 w-6 ${iconColor}`} />
          </div>
          <div className="ml-4 text-left">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              {title}
            </h3>
            {message && (
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                {message}
              </p>
            )}
          </div>
        </div>
      </div>
      <Modal.Footer>
        <Button
          variant={confirmVariant}
          onClick={onConfirm}
          isLoading={isLoading}
          disabled={isLoading}
        >
          {confirmText}
        </Button>
        <Button
          variant="secondary"
          onClick={onCancel}
          disabled={isLoading}
        >
          {cancelText}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};
