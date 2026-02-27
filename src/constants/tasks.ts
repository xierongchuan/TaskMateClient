export const TASK_PRIORITIES = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
} as const;

export const TASK_TYPES = {
  INDIVIDUAL: 'individual',
  GROUP: 'group',
} as const;

export const RESPONSE_TYPES = {
  NOTIFICATION: 'notification',
  COMPLETION: 'completion',
  COMPLETION_WITH_PROOF: 'completion_with_proof',
} as const;

export const TASK_PRIORITY_LABELS: Record<string, string> = {
  [TASK_PRIORITIES.LOW]: 'Низкий',
  [TASK_PRIORITIES.MEDIUM]: 'Средний',
  [TASK_PRIORITIES.HIGH]: 'Высокий',
};

export const TASK_TYPE_LABELS: Record<string, string> = {
  [TASK_TYPES.INDIVIDUAL]: 'Индивидуальная',
  [TASK_TYPES.GROUP]: 'Групповая',
};

export const RESPONSE_TYPE_LABELS: Record<string, string> = {
  [RESPONSE_TYPES.NOTIFICATION]: 'Уведомление',
  [RESPONSE_TYPES.COMPLETION]: 'На выполнение',
  [RESPONSE_TYPES.COMPLETION_WITH_PROOF]: 'С доказательством',
};

/**
 * Разрешённые расширения файлов для загрузки доказательств.
 *
 * ВАЖНО: Это fallback значения. Основной источник истины - API endpoint
 * GET /api/v1/config/file-upload. Используйте useFileUploadConfig() hook.
 */
export const PROOF_ALLOWED_EXTENSIONS = [
  // Изображения
  'jpg', 'jpeg', 'png', 'gif', 'webp',
  // Документы (MS Office)
  'pdf', 'doc', 'docx', 'xls', 'xlsx', 'csv',
  // Документы (OpenDocument)
  'odt', 'ods', 'odp', 'odf', 'odg',
  // Текстовые
  'txt', 'json',
  // Архивы
  'zip', 'tar', '7z',
  // Видео
  'mp4', 'webm', 'mov', 'avi',
];

/**
 * Максимальные размеры файлов (в байтах).
 * Fallback значения - основной источник истины в API.
 */
export const PROOF_MAX_SIZE_IMAGE = 5 * 1024 * 1024;      // 5 MB
export const PROOF_MAX_SIZE_DOCUMENT = 50 * 1024 * 1024;  // 50 MB
export const PROOF_MAX_SIZE_VIDEO = 100 * 1024 * 1024;    // 100 MB
export const PROOF_MAX_FILES_PER_RESPONSE = 5;
export const PROOF_MAX_TOTAL_SIZE = 200 * 1024 * 1024;    // 200 MB
