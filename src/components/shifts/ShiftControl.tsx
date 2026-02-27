import React, { useState, useEffect } from 'react';
import { useMyCurrentShift, useCreateShift, useUpdateShift } from '../../hooks/useShifts';
import { useAuth } from '../../hooks/useAuth';
import { usePermissions } from '../../hooks/usePermissions';
import { CameraIcon, PlayIcon, StopIcon } from '@heroicons/react/24/outline';
import { DealershipSelector } from '../common/DealershipSelector';
import { useToast, ConfirmDialog } from '../ui';
import { useConfirmDialog } from '../../hooks/useConfirmDialog';
import { ShiftPhotoViewer } from './ShiftPhotoViewer';
import { formatDateTime } from '../../utils/dateTime';
import type { CreateShiftRequest, UpdateShiftRequest } from '../../types/shift';

export const ShiftControl: React.FC = () => {
  const { user } = useAuth();
  const { canWorkShifts } = usePermissions();
  const [selectedDealershipId, setSelectedDealershipId] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (user?.dealership_id && selectedDealershipId === undefined) {
      setSelectedDealershipId(user.dealership_id);
    }
  }, [user, selectedDealershipId]);

  const { data: currentShiftData } = useMyCurrentShift(selectedDealershipId);
  const currentShift = currentShiftData?.data;
  const createShiftMutation = useCreateShift();
  const updateShiftMutation = useUpdateShift();

  const { showToast } = useToast();
  const { showConfirm, confirmState, handleConfirm, handleCancel } = useConfirmDialog();
  const [openingPhoto, setOpeningPhoto] = useState<File | null>(null);
  const [closingPhoto, setClosingPhoto] = useState<File | null>(null);

  const handleOpenShift = async () => {
    if (!openingPhoto || !selectedDealershipId) {
      showToast({ type: 'error', message: 'Необходимо выбрать фото открытия смены и автосалон' });
      return;
    }

    const shiftData: CreateShiftRequest = {
      user_id: user!.id,
      dealership_id: selectedDealershipId,
      opening_photo: openingPhoto,
    };

    createShiftMutation.mutate(shiftData, {
      onSuccess: () => {
        setOpeningPhoto(null);
        showToast({ type: 'success', message: 'Смена успешно открыта!' });
      },
      onError: (error: unknown) => {
        const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Неизвестная ошибка';
        showToast({ type: 'error', message: `Ошибка открытия смены: ${message}` });
      },
    });
  };

  const handleCloseShift = async () => {
    if (!currentShift) return;

    const confirmed = await showConfirm({
      title: 'Закрыть смену?',
      message: 'Вы уверены, что хотите закрыть текущую смену?',
      confirmText: 'Закрыть смену',
      cancelText: 'Отмена',
      variant: 'warning',
    });

    if (!confirmed) return;

    const updateData: UpdateShiftRequest = {
      status: 'closed',
    };

    if (closingPhoto) {
      updateData.closing_photo = closingPhoto;
    }

    updateShiftMutation.mutate(
      { id: currentShift.id, data: updateData },
      {
        onSuccess: () => {
          setClosingPhoto(null);
          showToast({ type: 'success', message: 'Смена успешно закрыта!' });
        },
        onError: (error: unknown) => {
          const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Неизвестная ошибка';
          showToast({ type: 'error', message: `Ошибка закрытия смены: ${message}` });
        },
      }
    );
  };

  if (!canWorkShifts) {
    return null;
  }

  const isShiftOpen = currentShift?.status && currentShift.status !== 'closed';

  return (
    <>
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg mb-6 border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Заголовок с статусом */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Управление сменой</h2>
        {isShiftOpen ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
            </span>
            Смена открыта
          </span>
        ) : (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400">
            Смена закрыта
          </span>
        )}
      </div>

      <div className="p-5">
        {/* Desktop: 2 колонки, Mobile: стак */}
        <div className="flex flex-col lg:flex-row lg:items-start gap-5">
          {/* Левая колонка: автосалон + инфо */}
          <div className="lg:w-1/3 space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                Автосалон
              </label>
              <DealershipSelector
                value={selectedDealershipId}
                onChange={(id) => setSelectedDealershipId(id || undefined)}
                required
              />
            </div>

            {/* Инфо об открытой смене */}
            {isShiftOpen && currentShift && (
              <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 dark:text-gray-500">Начало:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{formatDateTime(currentShift.shift_start)}</span>
                </div>
                {currentShift.is_late && (
                  <div className="flex items-center gap-2">
                    <span className="text-red-500">Опоздание:</span>
                    <span className="font-medium text-red-600 dark:text-red-400">{currentShift.late_minutes} мин</span>
                  </div>
                )}
                {currentShift.dealership && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 dark:text-gray-500">Автосалон:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{currentShift.dealership.name}</span>
                  </div>
                )}
                {currentShift.opening_photo_url && (
                  <div className="pt-2">
                    <ShiftPhotoViewer
                      openingPhotoUrl={currentShift.opening_photo_url}
                      closingPhotoUrl={null}
                      shiftId={currentShift.id}
                      compact
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Правая колонка: форма действия */}
          {selectedDealershipId && (
            <div className="lg:flex-1">
              {isShiftOpen ? (
                /* Закрытие смены */
                <div className="flex flex-col sm:flex-row sm:items-end gap-3">
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Фото закрытия (необязательно)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={(e) => setClosingPhoto(e.target.files?.[0] || null)}
                        className="hidden"
                        id="closing-photo"
                      />
                      <label
                        htmlFor="closing-photo"
                        className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer transition-colors"
                      >
                        <CameraIcon className="w-4 h-4 mr-1.5 text-gray-400" />
                        {closingPhoto ? (
                          <span className="truncate max-w-[120px]">{closingPhoto.name}</span>
                        ) : (
                          'Выбрать фото'
                        )}
                      </label>
                      {closingPhoto && (
                        <button
                          type="button"
                          onClick={() => setClosingPhoto(null)}
                          className="text-red-500 hover:text-red-700 text-xs font-medium transition-colors"
                        >
                          Удалить
                        </button>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleCloseShift}
                    disabled={updateShiftMutation.isPending}
                    className="inline-flex items-center justify-center px-5 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm whitespace-nowrap"
                  >
                    <StopIcon className="w-4 h-4 mr-1.5" />
                    {updateShiftMutation.isPending ? 'Закрытие...' : 'Закрыть смену'}
                  </button>
                </div>
              ) : (
                /* Открытие смены */
                <div className="flex flex-col sm:flex-row sm:items-end gap-3">
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Фото открытия смены *
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={(e) => setOpeningPhoto(e.target.files?.[0] || null)}
                        className="hidden"
                        id="opening-photo"
                      />
                      <label
                        htmlFor="opening-photo"
                        className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer transition-colors"
                      >
                        <CameraIcon className="w-4 h-4 mr-1.5 text-gray-400" />
                        {openingPhoto ? (
                          <span className="truncate max-w-[120px]">{openingPhoto.name}</span>
                        ) : (
                          'Выбрать фото'
                        )}
                      </label>
                      {openingPhoto && (
                        <button
                          type="button"
                          onClick={() => setOpeningPhoto(null)}
                          className="text-red-500 hover:text-red-700 text-xs font-medium transition-colors"
                        >
                          Удалить
                        </button>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                      Сделайте фото экрана компьютера с текущим временем
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleOpenShift}
                    disabled={!openingPhoto || createShiftMutation.isPending}
                    className="inline-flex items-center justify-center px-5 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm whitespace-nowrap"
                  >
                    <PlayIcon className="w-4 h-4 mr-1.5" />
                    {createShiftMutation.isPending ? 'Открытие...' : 'Открыть смену'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
    <ConfirmDialog
      isOpen={confirmState.isOpen}
      title={confirmState.title}
      message={confirmState.message}
      confirmText={confirmState.confirmText}
      cancelText={confirmState.cancelText}
      variant={confirmState.variant}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
    />
    </>
  );
};
