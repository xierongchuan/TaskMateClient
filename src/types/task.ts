export type TaskStatus = 'pending' | 'acknowledged' | 'pending_review' | 'completed' | 'completed_late' | 'overdue';
export type TaskType = 'individual' | 'group';
export type ResponseType = 'notification' | 'completion' | 'completion_with_proof';
export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskResponseStatus = 'pending' | 'acknowledged' | 'pending_review' | 'completed' | 'rejected' | 'postponed';
export type SubmissionSource = 'individual' | 'shared' | 'resubmitted';
export type DelegationStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled';

export interface TaskResponseUser {
  id: number;
  full_name: string;
}

// Базовый интерфейс для файлов доказательств
export interface BaseTaskProof {
  id: number;
  url: string;
  original_filename: string;
  mime_type: string;
  file_size: number;
}

// Индивидуальные файлы пользователя
export interface TaskProof extends BaseTaskProof {}

// Общие файлы задачи
export interface TaskSharedProof extends BaseTaskProof {
  created_at: string;
}

export interface TaskResponse {
  id: number;
  user_id: number;
  status: TaskResponseStatus;
  comment: string | null;
  responded_at: string | null;
  user: TaskResponseUser | null;
  proofs?: TaskProof[];
  verified_at?: string | null;
  verified_by?: number | null;
  rejection_reason?: string | null;
  rejection_count?: number;
  verifier?: TaskResponseUser | null;
  submission_source?: SubmissionSource;
  uses_shared_proofs?: boolean;
}

export interface TaskDelegation {
  id: number;
  task_id: number;
  from_user_id: number;
  to_user_id: number;
  status: DelegationStatus;
  reason: string | null;
  rejection_reason: string | null;
  responded_at: string | null;
  cancelled_by: number | null;
  created_at: string;
  updated_at: string;
  from_user?: { id: number; full_name: string };
  to_user?: { id: number; full_name: string };
  task?: { id: number; title: string; deadline: string | null; priority: string };
}

export interface CompletionProgress {
  total_assignees: number;
  completed_count: number;
  pending_review_count: number;
  rejected_count: number;
  pending_count: number;
  percentage: number;
}

export interface Task {
  id: number;
  title: string;
  description: string | null;
  comment: string | null;
  task_type: TaskType;
  response_type: ResponseType;
  appear_date: string | null;
  deadline: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dealership_id: number;
  generator_id: number | null;
  created_by: number;
  tags: string[];
  created_at: string;
  updated_at: string;
  creator?: {
    id: number;
    full_name: string;
  };
  dealership?: {
    id: number;
    name: string;
  };
  assignments?: {
    id: number;
    user: {
      id: number;
      full_name: string;
    };
  }[];
  responses?: TaskResponse[];
  shared_proofs?: TaskSharedProof[];
  delegations?: TaskDelegation[];
  completion_progress?: CompletionProgress;
  notification_settings?: Record<string, { enabled?: boolean; offset?: number }>;
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  comment?: string;
  task_type: TaskType;
  response_type: ResponseType;
  appear_date: string;  // required по StoreTaskRequest
  deadline: string;     // required по StoreTaskRequest
  dealership_id?: number; // nullable по StoreTaskRequest
  tags?: string[];
  assignments?: number[]; // nullable по StoreTaskRequest
  notification_settings?: Record<string, { enabled?: boolean; offset?: number }>;
  priority?: TaskPriority;
}

/**
 * Типы ошибок от API.
 */
export type ApiErrorType = 'duplicate_task' | 'access_denied' | 'validation_error';

export interface ApiErrorResponse {
  success?: boolean;
  message: string;
  error_type?: ApiErrorType;
  errors?: Record<string, string[]>;
}
