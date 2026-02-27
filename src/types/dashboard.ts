import type { Task } from './task';

export interface DashboardData {
  total_users: number;
  active_users: number;
  total_tasks: number;
  active_tasks: number;
  completed_tasks: number;
  overdue_tasks: number;
  overdue_tasks_list?: Task[];
  pending_review_count?: number;
  pending_review_tasks?: Task[];
  open_shifts: number;
  late_shifts_today: number;
  // Generator metrics
  active_generators?: number;
  total_generators?: number;
  tasks_generated_today?: number;
  active_shifts?: Array<{
    id: number;
    user?: {
      id: number;
      full_name: string;
    };
    dealership?: {
      id: number;
      name: string;
    };
    status: string;
    opened_at: string;
    closed_at: string | null;
    scheduled_start: string | null;
    scheduled_end: string | null;
    is_late: boolean;
    late_minutes: number | null;
  }>;
  dealership_shift_stats?: Array<{
    dealership_id: number;
    dealership_name: string;
    total_employees: number;
    on_shift_count: number;
    shift_schedules?: Array<{
      id: number;
      name: string;
      start_time: string;
      end_time: string;
    }>;
    current_or_next_schedule?: {
      id: number;
      name: string;
      start_time: string;
      end_time: string;
      is_current: boolean;
    } | null;
    is_today_holiday?: boolean;
  }>;
  today_tasks_list?: Task[];
}

