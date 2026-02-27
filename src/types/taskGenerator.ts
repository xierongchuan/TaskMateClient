import type { ResponseType } from './task';

export type GeneratorRecurrence = 'daily' | 'weekly' | 'monthly';

export interface TaskGenerator {
  id: number;
  title: string;
  description: string | null;
  comment: string | null;
  creator_id: number;
  dealership_id: number;
  recurrence: GeneratorRecurrence;
  recurrence_time: string;
  deadline_time: string;
  recurrence_days_of_week: number[] | null;  // [1,2,5] = Mon, Tue, Fri (ISO weekday)
  recurrence_days_of_month: number[] | null; // [1,15,-1] = 1st, 15th, last day
  start_date: string;
  end_date: string | null;
  last_generated_at: string | null;
  task_type: 'individual' | 'group';
  response_type: ResponseType;
  priority: 'low' | 'medium' | 'high';
  tags: string[] | null;
  notification_settings: Record<string, { enabled?: boolean; offset?: number }> | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  next_run_at?: string;

  // Computed fields from API
  total_generated?: number;
  completed_count?: number;
  expired_count?: number;

  // Relations
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
}

export interface PeriodStats {
  total_generated: number;
  completed_count: number;
  expired_count: number;
  pending_count: number;
  on_time_count: number;
  completion_rate: number;
  on_time_rate: number;
}

export interface TaskGeneratorStatistics {
  generator_id: number;
  all_time: PeriodStats;
  week: PeriodStats;
  month: PeriodStats;
  year: PeriodStats;
  average_completion_time_minutes: number | null;
}

export interface CreateTaskGeneratorRequest {
  title: string;
  description?: string;
  comment?: string;
  dealership_id: number;
  recurrence: GeneratorRecurrence;
  recurrence_time: string;
  deadline_time: string;
  recurrence_days_of_week?: number[];  // [1,2,5] for Mon, Tue, Fri
  recurrence_days_of_month?: number[]; // [1,15,-1] for 1st, 15th, last
  start_date: string;
  end_date?: string;
  task_type?: 'individual' | 'group';
  response_type?: ResponseType;
  priority?: 'low' | 'medium' | 'high';
  tags?: string[];
  notification_settings?: Record<string, { enabled?: boolean; offset?: number }>;
  assignments: number[];
}

export interface UpdateTaskGeneratorRequest extends Partial<CreateTaskGeneratorRequest> { }

export interface TaskGeneratorFilters {
  dealership_id?: number;
  is_active?: boolean;
  recurrence?: GeneratorRecurrence;
  search?: string;
  sort_by?: string;
  sort_dir?: 'asc' | 'desc';
  page?: number;
  per_page?: number;
}

