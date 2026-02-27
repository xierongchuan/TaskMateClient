import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Modal, Button } from '../ui';
import apiClient from '../../api/client';

export interface ShiftPhotoViewerProps {
  openingPhotoUrl: string | null;
  closingPhotoUrl: string | null;
  shiftId: number;
  userName?: string;
  compact?: boolean;
}

interface SelectedPhoto {
  url: string;
  type: 'opening' | 'closing';
}

const MAX_RETRIES = 3;
const RETRY_DELAYS = [1000, 2000, 4000]; // Exponential backoff: 1s, 2s, 4s

/**
 * Компонент для просмотра фото смены.
 * Отображает миниатюры фото открытия/закрытия с возможностью просмотра в модальном окне.
 *
 * Особенности:
 * - Загрузка через axios с Bearer token авторизацией
 * - Blob URLs для отображения (безопасно, не зависит от CORS)
 * - Автоматический retry с exponential backoff при ошибках
 * - Loading state с индикатором загрузки
 * - Адаптивный flex layout без пустых ячеек
 */
export const ShiftPhotoViewer: React.FC<ShiftPhotoViewerProps> = ({
  openingPhotoUrl,
  closingPhotoUrl,
  shiftId,
  userName,
  compact = false,
}) => {
  const [selectedPhoto, setSelectedPhoto] = useState<SelectedPhoto | null>(null);

  // Blob URLs для отображения (загруженные через axios с авторизацией)
  const [blobUrls, setBlobUrls] = useState<Record<string, string>>({});
  const [imageError, setImageError] = useState<Record<string, boolean>>({});
  const [imageLoading, setImageLoading] = useState<Record<string, boolean>>({
    opening: !!openingPhotoUrl,
    closing: !!closingPhotoUrl,
  });
  // Modal image states
  const [modalBlobUrl, setModalBlobUrl] = useState<string | null>(null);
  const [modalImageError, setModalImageError] = useState(false);
  const [modalImageLoading, setModalImageLoading] = useState(true);

  // Refs for cleanup and retry tracking (refs не вызывают re-render и не создают closure issues)
  const blobUrlsRef = useRef<string[]>([]);
  const retryTimeoutsRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const abortControllersRef = useRef<Record<string, AbortController>>({});
  const retryCountRef = useRef<Record<string, number>>({});
  const modalRetryCountRef = useRef(0);

  // Загрузка фото через axios с Bearer token
  const loadPhoto = useCallback(async (apiUrl: string, type: 'opening' | 'closing') => {
    // Отменяем предыдущий запрос если есть
    if (abortControllersRef.current[type]) {
      abortControllersRef.current[type].abort();
    }

    const controller = new AbortController();
    abortControllersRef.current[type] = controller;

    try {
      setImageLoading(prev => ({ ...prev, [type]: true }));
      setImageError(prev => ({ ...prev, [type]: false }));

      const response = await apiClient.get(apiUrl, {
        responseType: 'blob',
        signal: controller.signal,
      });

      // Создаём blob URL
      const blobUrl = URL.createObjectURL(response.data);
      blobUrlsRef.current.push(blobUrl);

      setBlobUrls(prev => ({ ...prev, [type]: blobUrl }));
      setImageLoading(prev => ({ ...prev, [type]: false }));
      retryCountRef.current[type] = 0; // Reset retry count
    } catch (error) {
      if ((error as Error).name === 'CanceledError') {
        return; // Запрос отменён, игнорируем
      }

      // Используем ref вместо state чтобы избежать closure issues
      const currentRetry = retryCountRef.current[type] || 0;

      if (currentRetry < MAX_RETRIES) {
        // Schedule retry with exponential backoff
        const delay = RETRY_DELAYS[currentRetry] || RETRY_DELAYS[RETRY_DELAYS.length - 1];
        retryCountRef.current[type] = currentRetry + 1;

        retryTimeoutsRef.current[type] = setTimeout(() => {
          loadPhoto(apiUrl, type);
        }, delay);
      } else {
        setImageError(prev => ({ ...prev, [type]: true }));
        setImageLoading(prev => ({ ...prev, [type]: false }));
      }
    }
  }, []); // Нет зависимостей - используем refs

  // Загрузка фото при монтировании и изменении URLs
  useEffect(() => {
    // Сброс retry counts при новых URLs
    retryCountRef.current = {};

    if (openingPhotoUrl) {
      loadPhoto(openingPhotoUrl, 'opening');
    }
    if (closingPhotoUrl) {
      loadPhoto(closingPhotoUrl, 'closing');
    }

    return () => {
      // Cleanup: отменяем запросы
      Object.values(abortControllersRef.current).forEach(c => c.abort());
    };
  }, [openingPhotoUrl, closingPhotoUrl, loadPhoto]);

  // Cleanup blob URLs при размонтировании
  useEffect(() => {
    return () => {
      blobUrlsRef.current.forEach(url => URL.revokeObjectURL(url));
      Object.values(retryTimeoutsRef.current).forEach(clearTimeout);
    };
  }, []);

  // Загрузка фото для модального окна
  const loadModalPhoto = useCallback(async (apiUrl: string) => {
    try {
      setModalImageLoading(true);
      setModalImageError(false);

      const response = await apiClient.get(apiUrl, {
        responseType: 'blob',
      });

      const blobUrl = URL.createObjectURL(response.data);
      blobUrlsRef.current.push(blobUrl);
      setModalBlobUrl(blobUrl);
      setModalImageLoading(false);
      modalRetryCountRef.current = 0; // Reset retry count
    } catch {
      const currentRetry = modalRetryCountRef.current;

      if (currentRetry < MAX_RETRIES) {
        const delay = RETRY_DELAYS[currentRetry] || RETRY_DELAYS[RETRY_DELAYS.length - 1];
        modalRetryCountRef.current = currentRetry + 1;

        setTimeout(() => {
          loadModalPhoto(apiUrl);
        }, delay);
      } else {
        setModalImageError(true);
        setModalImageLoading(false);
      }
    }
  }, []); // Нет зависимостей - используем refs

  // Загрузка при открытии модального окна
  useEffect(() => {
    if (selectedPhoto) {
      setModalBlobUrl(null);
      setModalImageError(false);
      setModalImageLoading(true);
      modalRetryCountRef.current = 0; // Reset retry count via ref
      loadModalPhoto(selectedPhoto.url);
    }
  }, [selectedPhoto, loadModalPhoto]);

  const hasPhotos = openingPhotoUrl || closingPhotoUrl;

  if (!hasPhotos) {
    return null;
  }

  const handleDownload = (apiUrl: string, type: string) => {
    // Загружаем файл для скачивания
    apiClient.get<Blob>(apiUrl, { responseType: 'blob' })
      .then((response: { data: Blob }) => {
        const blobUrl = URL.createObjectURL(response.data);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = `shift_${shiftId}_${type}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
      })
      .catch(() => {
        // Ошибка скачивания - можно добавить toast уведомление
      });
  };

  const handleManualRetry = (apiUrl: string, type: 'opening' | 'closing') => {
    // Clear any existing timeout
    if (retryTimeoutsRef.current[type]) {
      clearTimeout(retryTimeoutsRef.current[type]);
    }
    // Reset retry count via ref and try again
    retryCountRef.current[type] = 0;
    loadPhoto(apiUrl, type);
  };

  const handleModalRetry = () => {
    if (selectedPhoto) {
      modalRetryCountRef.current = 0;
      loadModalPhoto(selectedPhoto.url);
    }
  };

  const getPhotoLabel = (type: 'opening' | 'closing') => {
    return type === 'opening' ? 'Открытие' : 'Закрытие';
  };

  return (
    <>
      {/* Flex layout с фиксированными размерами - нет пустых ячеек */}
      <div className={`flex flex-wrap ${compact ? 'gap-2' : 'gap-3'}`}>
        {openingPhotoUrl && (
          <PhotoThumbnail
            blobUrl={blobUrls['opening']}
            label={getPhotoLabel('opening')}
            type="opening"
            compact={compact}
            hasError={imageError['opening']}
            isLoading={imageLoading['opening']}
            onRetry={() => handleManualRetry(openingPhotoUrl, 'opening')}
            onClick={() => !imageError['opening'] && setSelectedPhoto({ url: openingPhotoUrl, type: 'opening' })}
          />
        )}
        {closingPhotoUrl && (
          <PhotoThumbnail
            blobUrl={blobUrls['closing']}
            label={getPhotoLabel('closing')}
            type="closing"
            compact={compact}
            hasError={imageError['closing']}
            isLoading={imageLoading['closing']}
            onRetry={() => handleManualRetry(closingPhotoUrl, 'closing')}
            onClick={() => !imageError['closing'] && setSelectedPhoto({ url: closingPhotoUrl, type: 'closing' })}
          />
        )}
      </div>

      {/* Preview Modal с error handling */}
      {selectedPhoto && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedPhoto(null)}
          title={`Фото ${selectedPhoto.type === 'opening' ? 'открытия' : 'закрытия'} смены${userName ? ` - ${userName}` : ''}`}
          size="lg"
        >
          <div className="flex flex-col items-center p-4">
            {/* Loading state */}
            {modalImageLoading && !modalImageError && (
              <div className="w-full max-w-lg h-64 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-600" />
              </div>
            )}

            {/* Error state */}
            {modalImageError && (
              <div className="w-full max-w-lg h-64 flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-lg">
                <svg className="w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-gray-500 dark:text-gray-400 mb-3">Ошибка загрузки изображения</p>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleModalRetry}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Повторить
                </Button>
              </div>
            )}

            {/* Image */}
            {modalBlobUrl && !modalImageLoading && !modalImageError && (
              <img
                src={modalBlobUrl}
                alt={`Фото ${selectedPhoto.type === 'opening' ? 'открытия' : 'закрытия'}`}
                className="max-w-full max-h-[70vh] object-contain rounded-lg"
              />
            )}

            <div className="mt-4 flex gap-3">
              <Button
                variant="primary"
                onClick={() => handleDownload(selectedPhoto.url, selectedPhoto.type)}
                disabled={modalImageError || modalImageLoading}
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Скачать
              </Button>
              <Button
                variant="secondary"
                onClick={() => setSelectedPhoto(null)}
              >
                Закрыть
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};

// Thumbnail component с loading и retry
interface PhotoThumbnailProps {
  blobUrl: string | undefined;
  label: string;
  type: 'opening' | 'closing';
  compact: boolean;
  hasError: boolean;
  isLoading: boolean;
  onRetry: () => void;
  onClick: () => void;
}

const PhotoThumbnail: React.FC<PhotoThumbnailProps> = ({
  blobUrl,
  label,
  compact,
  hasError,
  isLoading,
  onRetry,
  onClick,
}) => {
  // Фиксированные размеры для thumbnails
  const sizeClasses = compact
    ? 'w-16 h-16 sm:w-20 sm:h-20'
    : 'w-20 h-20 sm:w-24 sm:h-24';

  return (
    <div
      className={`relative ${sizeClasses} rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:border-accent-500 dark:hover:border-accent-400 transition-colors flex-shrink-0 ${
        !hasError && blobUrl ? 'cursor-pointer' : ''
      }`}
      onClick={hasError || !blobUrl ? undefined : onClick}
    >
      {/* Loading spinner */}
      {isLoading && !hasError && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-gray-100 dark:bg-gray-700">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-accent-600" />
        </div>
      )}

      {/* Image */}
      {blobUrl && !hasError && (
        <img
          src={blobUrl}
          alt={label}
          className="w-full h-full object-cover"
        />
      )}

      {/* Error state с retry */}
      {hasError && (
        <div
          className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            onRetry();
          }}
          title="Нажмите для повторной загрузки"
        >
          <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <svg className="w-3 h-3 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </div>
      )}

      {/* Overlay with label - показываем только когда изображение загружено */}
      {blobUrl && !isLoading && !hasError && (
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-1.5">
          <p className="text-[10px] sm:text-xs text-white truncate text-center">{label}</p>
        </div>
      )}
    </div>
  );
};

export default ShiftPhotoViewer;
