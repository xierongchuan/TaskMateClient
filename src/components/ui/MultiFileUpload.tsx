import React, { useCallback, useMemo, useRef, useState } from 'react';
import { useFileUploadConfig } from '../../hooks/useFileUploadConfig';

export interface MultiFileUploadProps {
  files: File[];
  onChange: (files: File[]) => void;
  maxFiles?: number;
  maxTotalSize?: number;
  error?: string;
  disabled?: boolean;
  /** Пресет конфигурации ('task_proof' | 'shift_photo') */
  preset?: 'task_proof' | 'shift_photo';
}

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getFileTypeLabel = (mimeType: string): string => {
  if (mimeType.startsWith('image/')) return 'изображение';
  if (mimeType.startsWith('video/')) return 'видео';
  if (mimeType.includes('pdf')) return 'PDF';
  if (mimeType.includes('word') || mimeType.includes('document')) return 'документ';
  if (mimeType.includes('sheet') || mimeType.includes('excel')) return 'таблица';
  if (mimeType.includes('zip') || mimeType.includes('compressed') || mimeType.includes('tar')) return 'архив';
  return 'файл';
};

const getFileExtension = (filename: string): string => {
  const parts = filename.split('.');
  return parts.length > 1 ? parts.pop()?.toLowerCase() || '' : '';
};

export const MultiFileUpload: React.FC<MultiFileUploadProps> = ({
  files,
  onChange,
  maxFiles,
  maxTotalSize,
  error,
  disabled = false,
  preset = 'task_proof',
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Получаем конфигурацию из API (с fallback на локальные константы)
  const config = useFileUploadConfig(preset);

  // Применяем конфигурацию с возможностью переопределения через пропсы
  const effectiveMaxFiles = maxFiles ?? config.limits.max_files;
  const effectiveMaxTotalSize = maxTotalSize ?? config.limits.max_total_size;

  const totalSize = files.reduce((sum, file) => sum + file.size, 0);

  // Функция для получения максимального размера файла по MIME типу
  const getMaxSizeForFile = useCallback((mimeType: string): number => {
    if (mimeType.startsWith('image/')) return config.limits.max_size_image;
    if (mimeType.startsWith('video/')) return config.limits.max_size_video;
    return config.limits.max_size_document;
  }, [config.limits]);

  // Мемоизированный список разрешённых расширений
  const allowedExtensions = useMemo(() => config.extensions, [config.extensions]);

  const validateFile = useCallback((file: File): string | null => {
    const extension = getFileExtension(file.name);
    if (!allowedExtensions.includes(extension)) {
      return `Недопустимый формат файла: .${extension}`;
    }

    const maxSize = getMaxSizeForFile(file.type);
    if (file.size > maxSize) {
      return `Файл "${file.name}" слишком большой (${formatFileSize(file.size)}). Максимум для ${getFileTypeLabel(file.type)}: ${formatFileSize(maxSize)}`;
    }

    return null;
  }, [allowedExtensions, getMaxSizeForFile]);

  const handleFiles = useCallback((newFiles: FileList | File[]) => {
    setValidationError(null);

    const fileArray = Array.from(newFiles);
    const currentCount = files.length;
    const remainingSlots = effectiveMaxFiles - currentCount;

    if (fileArray.length > remainingSlots) {
      setValidationError(`Можно добавить ещё ${remainingSlots} файл(ов). Максимум: ${effectiveMaxFiles}`);
      return;
    }

    // Validate each file
    for (const file of fileArray) {
      const validationResult = validateFile(file);
      if (validationResult) {
        setValidationError(validationResult);
        return;
      }
    }

    // Check total size
    const newTotalSize = totalSize + fileArray.reduce((sum, f) => sum + f.size, 0);
    if (newTotalSize > effectiveMaxTotalSize) {
      setValidationError(`Превышен общий размер файлов. Максимум: ${formatFileSize(effectiveMaxTotalSize)}`);
      return;
    }

    onChange([...files, ...fileArray]);
  }, [files, effectiveMaxFiles, effectiveMaxTotalSize, totalSize, validateFile, onChange]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (!disabled && e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  }, [disabled, handleFiles]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
    // Reset input value to allow selecting the same file again
    e.target.value = '';
  }, [handleFiles]);

  const handleRemoveFile = useCallback((index: number) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    onChange(newFiles);
    setValidationError(null);
  }, [files, onChange]);

  const handleClick = useCallback(() => {
    if (!disabled) {
      inputRef.current?.click();
    }
  }, [disabled]);

  const acceptExtensions = useMemo(
    () => allowedExtensions.map(ext => `.${ext}`).join(','),
    [allowedExtensions]
  );

  return (
    <div className="w-full">
      {/* Drop zone */}
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${dragActive
            ? 'border-accent-500 bg-accent-50 dark:bg-gray-700'
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          ${error || validationError ? 'border-red-300 dark:border-red-600' : ''}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={acceptExtensions}
          onChange={handleInputChange}
          className="hidden"
          disabled={disabled}
        />

        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          stroke="currentColor"
          fill="none"
          viewBox="0 0 48 48"
          aria-hidden="true"
        >
          <path
            d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        <div className="mt-4">
          <span className="text-sm font-medium text-accent-600 dark:text-accent-400">
            Нажмите для выбора
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {' '}или перетащите файлы
          </span>
        </div>

        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          Фото, видео, PDF, документы, архивы (до {effectiveMaxFiles} файлов)
        </p>
      </div>

      {/* Error messages */}
      {(error || validationError) && (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400">
          {error || validationError}
        </p>
      )}

      {/* File list */}
      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
            <span>Выбрано файлов: {files.length}/{effectiveMaxFiles}</span>
            <span>Размер: {formatFileSize(totalSize)} / {formatFileSize(effectiveMaxTotalSize)}</span>
          </div>

          <ul className="divide-y divide-gray-200 dark:divide-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            {files.map((file, index) => (
              <li
                key={`${file.name}-${index}`}
                className="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-800"
              >
                <div className="flex items-center min-w-0 flex-1">
                  <FileIcon mimeType={file.type} />
                  <div className="ml-3 min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatFileSize(file.size)} • {getFileTypeLabel(file.type)}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveFile(index);
                  }}
                  className="ml-4 p-1 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                  disabled={disabled}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

// File type icon component
const FileIcon: React.FC<{ mimeType: string }> = ({ mimeType }) => {
  const baseClass = "w-8 h-8 flex-shrink-0";

  if (mimeType.startsWith('image/')) {
    return (
      <div className={`${baseClass} bg-purple-100 dark:bg-purple-900/30 rounded p-1.5`}>
        <svg className="w-full h-full text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
    );
  }

  if (mimeType.startsWith('video/')) {
    return (
      <div className={`${baseClass} bg-pink-100 dark:bg-pink-900/30 rounded p-1.5`}>
        <svg className="w-full h-full text-pink-600 dark:text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      </div>
    );
  }

  if (mimeType.includes('pdf')) {
    return (
      <div className={`${baseClass} bg-red-100 dark:bg-red-900/30 rounded p-1.5`}>
        <svg className="w-full h-full text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      </div>
    );
  }

  if (mimeType.includes('zip') || mimeType.includes('compressed') || mimeType.includes('tar') || mimeType.includes('7z')) {
    return (
      <div className={`${baseClass} bg-yellow-100 dark:bg-yellow-900/30 rounded p-1.5`}>
        <svg className="w-full h-full text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
        </svg>
      </div>
    );
  }

  // Default document icon
  return (
    <div className={`${baseClass} bg-accent-100 dark:bg-gray-700 rounded p-1.5`}>
      <svg className="w-full h-full text-accent-600 dark:text-accent-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    </div>
  );
};

export default MultiFileUpload;
