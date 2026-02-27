import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import type { BaseTaskProof } from '../../types/task';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { ConfirmDialog } from '../ui/ConfirmDialog';

export interface ProofViewerProps {
  proofs: BaseTaskProof[];
  onDelete?: (proofId: number) => void;
  canDelete?: boolean;
}

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getFileTypeLabel = (mimeType: string): string => {
  if (mimeType.startsWith('image/')) return 'Изображение';
  if (mimeType.startsWith('video/')) return 'Видео';
  if (mimeType.startsWith('audio/')) return 'Аудио';
  if (mimeType.startsWith('text/')) return 'Текст';
  if (mimeType.includes('pdf')) return 'PDF';
  // Word документы
  if (mimeType.includes('wordprocessingml') || mimeType.includes('msword') || mimeType.includes('vnd.oasis.opendocument.text')) return 'Документ Word';
  // Excel таблицы
  if (mimeType.includes('spreadsheetml') || mimeType.includes('ms-excel') || mimeType.includes('csv')) return 'Таблица Excel';
  // Архивы
  if (mimeType.includes('zip') || mimeType.includes('tar') || mimeType.includes('7z') || mimeType.includes('compressed')) return 'Архив';
  return 'Файл';
};

const isPreviewable = (mimeType: string): boolean => {
  // PDF и text убраны - они будут скачиваться напрямую
  return (
    mimeType.startsWith('image/') ||
    mimeType.startsWith('video/') ||
    mimeType.startsWith('audio/')
  );
};

export const ProofViewer: React.FC<ProofViewerProps> = ({
  proofs,
  onDelete,
  canDelete = false,
}) => {
  const [selectedProof, setSelectedProof] = useState<BaseTaskProof | null>(null);
  const [proofToDelete, setProofToDelete] = useState<BaseTaskProof | null>(null);

  if (proofs.length === 0) {
    return null;
  }

  const handleDownload = (proof: BaseTaskProof) => {
    const link = document.createElement('a');
    link.href = proof.url;
    link.download = proof.original_filename;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDeleteClick = (proof: BaseTaskProof) => {
    setProofToDelete(proof);
  };

  const handleDeleteConfirm = () => {
    if (proofToDelete && onDelete) {
      onDelete(proofToDelete.id);
    }
    setProofToDelete(null);
  };

  const handleDeleteCancel = () => {
    setProofToDelete(null);
  };

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
        Доказательства ({proofs.length})
      </h4>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {proofs.map((proof) => (
          <ProofThumbnail
            key={proof.id}
            proof={proof}
            onClick={() => isPreviewable(proof.mime_type) ? setSelectedProof(proof) : handleDownload(proof)}
            onDelete={canDelete && onDelete ? () => handleDeleteClick(proof) : undefined}
          />
        ))}
      </div>

      {/* Preview Modal */}
      {selectedProof && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedProof(null)}
          title={selectedProof.original_filename}
          size="xl"
        >
          <Modal.Body className="flex flex-col items-center">
            <ProofPreview proof={selectedProof} />
            <div className="mt-4 flex gap-3">
              <Button
                variant="primary"
                onClick={() => handleDownload(selectedProof)}
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Скачать
              </Button>
              <Button
                variant="secondary"
                onClick={() => setSelectedProof(null)}
              >
                Закрыть
              </Button>
            </div>
          </Modal.Body>
        </Modal>
      )}

      {/* Delete Confirmation Dialog - rendered via Portal to avoid z-index issues with nested modals */}
      {createPortal(
        <ConfirmDialog
          isOpen={proofToDelete !== null}
          title="Удалить файл?"
          message={proofToDelete ? `Файл "${proofToDelete.original_filename}" будет удалён. Это действие нельзя отменить.` : ''}
          onConfirm={handleDeleteConfirm}
          onCancel={handleDeleteCancel}
          confirmText="Удалить"
          cancelText="Отмена"
          variant="danger"
        />,
        document.body
      )}
    </div>
  );
};

// Helper function to get file extension
const getFileExtension = (filename: string): string => {
  const parts = filename.toLowerCase().split('.');
  return parts.length > 1 ? parts[parts.length - 1] : '';
};

// Thumbnail component
interface ProofThumbnailProps {
  proof: BaseTaskProof;
  onClick: () => void;
  onDelete?: () => void;
}

const ProofThumbnail: React.FC<ProofThumbnailProps> = ({ proof, onClick, onDelete }) => {
  const isImage = proof.mime_type.startsWith('image/');
  const isVideo = proof.mime_type.startsWith('video/');
  const isAudio = proof.mime_type.startsWith('audio/');

  return (
    <div className="relative group">
      <div
        onClick={onClick}
        className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 cursor-pointer border border-gray-200 dark:border-gray-600 hover:border-accent-500 dark:hover:border-accent-400 transition-colors"
      >
        {isImage ? (
          <img
            src={proof.url}
            alt={proof.original_filename}
            className="w-full h-full object-cover"
          />
        ) : isVideo ? (
          <div className="w-full h-full flex items-center justify-center bg-gray-800">
            <svg className="w-12 h-12 text-white opacity-80" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        ) : isAudio ? (
          <div className="w-full h-full flex items-center justify-center bg-purple-100 dark:bg-purple-900/30">
            <svg className="w-12 h-12 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <FileTypeIcon mimeType={proof.mime_type} filename={proof.original_filename} />
          </div>
        )}

        {/* Overlay with file info */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2">
          <p className="text-xs text-white truncate">{proof.original_filename}</p>
          <p className="text-xs text-gray-300">{formatFileSize(proof.file_size)}</p>
        </div>
      </div>

      {/* Delete button */}
      {onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
};

// Preview component for modal
interface ProofPreviewProps {
  proof: BaseTaskProof;
}

const ProofPreview: React.FC<ProofPreviewProps> = ({ proof }) => {
  const isImage = proof.mime_type.startsWith('image/');
  const isVideo = proof.mime_type.startsWith('video/');
  const isAudio = proof.mime_type.startsWith('audio/');

  if (isImage) {
    return (
      <img
        src={proof.url}
        alt={proof.original_filename}
        className="max-w-full max-h-[70vh] object-contain rounded-lg"
      />
    );
  }

  if (isVideo) {
    return (
      <video
        src={proof.url}
        controls
        className="max-w-full max-h-[70vh] rounded-lg"
      >
        Ваш браузер не поддерживает воспроизведение видео.
      </video>
    );
  }

  if (isAudio) {
    return (
      <div className="w-full max-w-md p-6 bg-gray-100 dark:bg-gray-700 rounded-lg">
        <div className="flex items-center justify-center mb-4">
          <svg className="w-16 h-16 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
          </svg>
        </div>
        <audio src={proof.url} controls className="w-full">
          Ваш браузер не поддерживает воспроизведение аудио.
        </audio>
      </div>
    );
  }

  // Fallback for non-previewable files (не должно вызываться, т.к. isPreviewable фильтрует)
  return (
    <div className="text-center py-8">
      <FileTypeIcon mimeType={proof.mime_type} filename={proof.original_filename} size="lg" />
      <p className="mt-4 text-gray-600 dark:text-gray-400">
        {getFileTypeLabel(proof.mime_type)}
      </p>
      <p className="text-sm text-gray-500 dark:text-gray-500">
        {proof.original_filename}
      </p>
      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
        {formatFileSize(proof.file_size)}
      </p>
    </div>
  );
};

// File type icon
interface FileTypeIconProps {
  mimeType: string;
  filename: string;
  size?: 'md' | 'lg';
}

const FileTypeIcon: React.FC<FileTypeIconProps> = ({ mimeType, filename, size = 'md' }) => {
  const sizeClass = size === 'lg' ? 'w-16 h-16' : 'w-10 h-10';
  const extension = getFileExtension(filename);

  // Проверяем расширение файла СНАЧАЛА для Office документов
  // Это решает проблему, когда .docx определяется как application/zip
  if (extension === 'doc' || extension === 'docx' || extension === 'odt') {
    return (
      <svg className={`${sizeClass} text-accent-500`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    );
  }

  if (extension === 'xls' || extension === 'xlsx') {
    return (
      <svg className={`${sizeClass} text-green-500`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    );
  }

  // Затем проверяем MIME типы
  if (mimeType.startsWith('audio/')) {
    return (
      <svg className={`${sizeClass} text-purple-500`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
      </svg>
    );
  }

  if (mimeType.startsWith('text/')) {
    return (
      <svg className={`${sizeClass} text-cyan-500`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    );
  }

  if (mimeType.includes('pdf')) {
    return (
      <svg className={`${sizeClass} text-red-500`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    );
  }

  // Word документы - проверяем ПЕРЕД архивами, чтобы избежать ложных срабатываний
  if (mimeType.includes('wordprocessingml') || mimeType.includes('msword') || mimeType.includes('vnd.oasis.opendocument.text')) {
    return (
      <svg className={`${sizeClass} text-accent-500`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    );
  }

  // Excel таблицы
  if (mimeType.includes('spreadsheetml') || mimeType.includes('ms-excel') || mimeType.includes('csv')) {
    return (
      <svg className={`${sizeClass} text-green-500`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    );
  }

  // Архивы - проверяем ПОСЛЕ документов
  if (mimeType.includes('zip') || mimeType.includes('tar') || mimeType.includes('7z')) {
    return (
      <svg className={`${sizeClass} text-yellow-500`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
      </svg>
    );
  }

  // application/x-compressed может быть как архив, так и другой тип
  // Проверяем в конце, после всех специфичных типов
  if (mimeType.includes('compressed')) {
    return (
      <svg className={`${sizeClass} text-yellow-500`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
      </svg>
    );
  }

  // Default file icon
  return (
    <svg className={`${sizeClass} text-gray-500`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  );
};

export default ProofViewer;
