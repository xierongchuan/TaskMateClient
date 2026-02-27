import apiClient from './client';

/**
 * Конфигурация загрузки файлов для одного пресета.
 */
export interface FileUploadPresetConfig {
  extensions: string[];
  mime_types: string[];
  limits: {
    max_files: number;
    max_total_size: number;
    max_size_image: number;
    max_size_document: number;
    max_size_archive: number;
    max_size_video: number;
  };
}

/**
 * Полная конфигурация загрузки файлов.
 */
export interface FileUploadConfig {
  task_proof: FileUploadPresetConfig;
  shift_photo: FileUploadPresetConfig;
}

/**
 * Получить конфигурацию загрузки файлов.
 *
 * @returns Конфигурация для всех пресетов
 */
export const getFileUploadConfig = async (): Promise<FileUploadConfig> => {
  const response = await apiClient.get<FileUploadConfig>('/config/file-upload');
  return response.data;
};

/**
 * Получить конфигурацию для конкретного пресета.
 *
 * @param preset Название пресета ('task_proof' | 'shift_photo')
 * @returns Конфигурация пресета
 */
export const getFileUploadPresetConfig = async (
  preset: 'task_proof' | 'shift_photo'
): Promise<FileUploadPresetConfig> => {
  const response = await apiClient.get<FileUploadPresetConfig>(`/config/file-upload/${preset}`);
  return response.data;
};
