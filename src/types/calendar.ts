export interface CalendarDay {
  id: number;
  date: string; // "2026-01-18"
  type: 'holiday' | 'workday';
  description?: string;
  dealership_id?: number;
}

export interface YearCalendarResponse {
  year: number;
  dealership_id: number | null;
  uses_global: boolean;
  months: Record<number, CalendarDay[]>; // { 1: [...], 2: [...], ... }
  holidays_count: number;
}

export interface HolidaysResponse {
  year: number;
  dealership_id: number | null;
  uses_global: boolean;
  dates: string[];
  count: number;
}

export interface CalendarCheckResponse {
  date: string;
  is_holiday: boolean;
  is_workday: boolean;
  day_of_week: number;
  dealership_id: number | null;
}

export interface UpdateCalendarDayRequest {
  type: 'holiday' | 'workday';
  description?: string;
  dealership_id?: number;
}

export interface BulkCalendarRequest {
  operation: 'set_weekdays' | 'set_dates' | 'clear_year';
  year: number;
  dealership_id?: number;
  weekdays?: number[]; // For set_weekdays: [6, 7] for Sat, Sun
  dates?: string[]; // For set_dates: ["2026-01-01", "2026-05-01"]
  type?: 'holiday' | 'workday';
}

export interface BulkCalendarResponse {
  operation: string;
  year: number;
  dealership_id: number | null;
  affected_count: number;
  uses_global: boolean;
}

export interface ResetCalendarResponse {
  year: number;
  dealership_id: number;
  deleted_count: number;
}
