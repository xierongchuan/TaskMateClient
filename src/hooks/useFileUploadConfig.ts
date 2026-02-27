import { useQuery } from '@tanstack/react-query';
import { getFileUploadConfig, type FileUploadConfig, type FileUploadPresetConfig } from '../api/config';
import {
  PROOF_ALLOWED_EXTENSIONS,
  PROOF_MAX_SIZE_IMAGE,
  PROOF_MAX_SIZE_DOCUMENT,
  PROOF_MAX_SIZE_VIDEO,
  PROOF_MAX_FILES_PER_RESPONSE,
  PROOF_MAX_TOTAL_SIZE,
} from '../constants/tasks';

/**
 * Fallback конфигурация из локальных констант.
 * Используется если API недоступен.
 */
const FALLBACK_CONFIG: FileUploadConfig = {
  task_proof: {
    extensions: PROOF_ALLOWED_EXTENSIONS,
    mime_types: [], // Не критично для валидации на клиенте
    limits: {
      max_files: PROOF_MAX_FILES_PER_RESPONSE,
      max_total_size: PROOF_MAX_TOTAL_SIZE,
      max_size_image: PROOF_MAX_SIZE_IMAGE,
      max_size_document: PROOF_MAX_SIZE_DOCUMENT,
      max_size_archive: PROOF_MAX_SIZE_DOCUMENT,
      max_size_video: PROOF_MAX_SIZE_VIDEO,
    },
  },
  shift_photo: {
    extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    mime_types: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    limits: {
      max_files: 1,
      max_total_size: PROOF_MAX_SIZE_IMAGE,
      max_size_image: PROOF_MAX_SIZE_IMAGE,
      max_size_document: 0,
      max_size_archive: 0,
      max_size_video: 0,
    },
  },
};

/**
 * Hook для получения конфигурации загрузки файлов.
 *
 * Загружает конфигурацию с сервера и кэширует на 24 часа.
 * При ошибке использует локальные константы как fallback.
 *
 * @param preset Пресет конфигурации ('task_proof' | 'shift_photo')
 * @returns Конфигурация пресета
 */
export const useFileUploadConfig = (
  preset: 'task_proof' | 'shift_photo' = 'task_proof'
): FileUploadPresetConfig => {
  const { data } = useQuery({
    queryKey: ['file-upload-config'],
    queryFn: getFileUploadConfig,
    staleTime: 24 * 60 * 60 * 1000, // 24 часа
    gcTime: 24 * 60 * 60 * 1000, // 24 часа
    retry: 1, // Один повтор при ошибке
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Возвращаем конфигурацию из API или fallback
  return data?.[preset] ?? FALLBACK_CONFIG[preset];
};

/**
 * Hook для получения полной конфигурации (все пресеты).
 *
 * @returns Полная конфигурация или fallback
 */
export const useFullFileUploadConfig = (): FileUploadConfig => {
  const { data } = useQuery({
    queryKey: ['file-upload-config'],
    queryFn: getFileUploadConfig,
    staleTime: 24 * 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  return data ?? FALLBACK_CONFIG;
};

export default useFileUploadConfig;
