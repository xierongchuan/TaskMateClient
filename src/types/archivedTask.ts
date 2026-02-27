import type { TaskResponse, TaskSharedProof } from './task';

export type TaskArchiveReason = 'completed' | 'completed_late' | 'expired' | 'expired_after_shift';

export interface ArchivedTask {
  id: number;
  generator_id: number | null;
  title: string;
  description: string | null;
  comment: string | null;
  task_type: 'individual' | 'group';
  response_type: 'notification' | 'completion' | 'completion_with_proof';
  priority: 'low' | 'medium' | 'high';
  appear_date: string | null;
  deadline: string | null;
  scheduled_date: string | null;
  tags: string[] | null;
  archived_at: string;
  archive_reason: TaskArchiveReason;
  created_at: string;
  updated_at: string;

  // Computed
  status: string;
  completion_percentage?: number;

  // Relations
  creator?: {
    id: number;
    full_name: string;
  };
  dealership?: {
    id: number;
    name: string;
  };
  generator?: {
    id: number;
    title: string;
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
}

export interface ArchivedTaskFilters {
  dealership_id?: number;
  archive_reason?: TaskArchiveReason;
  generator_id?: number;
  assignee_id?: number;
  priority?: string;
  task_type?: 'individual' | 'group';
  response_type?: 'notification' | 'completion' | 'completion_with_proof';
  date_from?: string;
  date_to?: string;
  tags?: string[];
  search?: string;
  sort_by?: string;
  sort_dir?: 'asc' | 'desc';
  page?: number;
  per_page?: number;
}

export interface ArchivedTaskStatistics {
  total: number;
  completed: number;
  completed_late: number;
  expired: number;
}
