export type SettingType = 'string' | 'integer' | 'boolean' | 'json' | 'time';

export interface Setting {
  id: number;
  key: string;
  value: string;
  type: SettingType;
  description?: string;
  dealership_id?: number;
  created_at: string;
  updated_at: string;
  dealership?: {
    id: number;
    name: string;
  };
}

// Shift Schedule from shift_schedules table
export interface ShiftScheduleConfig {
  id: number;
  name: string;
  start_time: string;
  end_time: string;
  sort_order: number;
}

// Shift Configuration
export interface ShiftConfig {
  late_tolerance_minutes?: number;
  schedules?: ShiftScheduleConfig[];
  work_days?: number[]; // [1,2,3,4,5] for Mon-Fri
  timezone?: string;
}

// Notification Configuration
export interface NotificationConfig {
  notification_enabled: boolean;
  auto_close_shifts: boolean;
  shift_reminder_minutes: number;
  rows_per_page: number;
  notification_types: {
    task_overdue: boolean;
    shift_late: boolean;
    task_completed: boolean;
    system_errors: boolean;
  };
}

// Archive Configuration
export interface ArchiveConfig {
  archive_completed_time: string;
  archive_overdue_day_of_week: number; // 0 = disabled, 1-7 = Monday-Sunday
  archive_overdue_time: string;
}

// Notification Configuration Update Request
export interface UpdateNotificationConfigRequest {
  notification_enabled?: boolean;
  auto_close_shifts?: boolean;
  shift_reminder_minutes?: number;
  rows_per_page?: number;
  notification_types?: {
    task_overdue?: boolean;
    shift_late?: boolean;
    task_completed?: boolean;
    system_errors?: boolean;
  };
  dealership_id?: number;
}

// Archive Configuration Update Request
export interface UpdateArchiveConfigRequest {
  archive_completed_time?: string;
  archive_overdue_day_of_week?: number;
  archive_overdue_time?: string;
  dealership_id?: number;
}

// Request interfaces
export interface UpdateSettingRequest {
  value: string | number | boolean | object | null;
  type?: SettingType;
  description?: string;
  dealership_id?: number;
}

export interface UpdateShiftConfigRequest {
  late_tolerance_minutes?: number;
  dealership_id?: number;
}

// Legacy interfaces
export interface DealershipBotConfig {
  shift_1_start_time?: string;
  shift_1_end_time?: string;
  late_tolerance_minutes?: number;
}

export interface DealershipSettingsResponse {
  dealership_id: number;
  settings: ShiftConfig;
  global_notification_settings: NotificationConfig;
  global_archive_settings: ArchiveConfig;
  inherited_fields: (keyof DealershipBotConfig)[];
}

// Task Configuration (shift requirements, archiving)
export interface TaskConfig {
  task_requires_open_shift: boolean;
  archive_overdue_hours_after_shift: number;
}

export interface UpdateTaskConfigRequest {
  task_requires_open_shift?: boolean;
  archive_overdue_hours_after_shift?: number;
  dealership_id?: number;
}
