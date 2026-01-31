export type ShiftStatus = 'open' | 'closed' | 'late' | 'replaced';

export type ShiftType = 'regular' | 'overtime' | 'weekend' | 'holiday';

export interface ShiftsFilters {
  user_id?: number;
  dealership_id?: number;
  status?: string;
  shift_type?: string;
  is_late?: boolean;
  date_from?: string;
  date_to?: string;
  per_page?: number;
  page?: number;
}

export interface Shift {
  id: number;
  user_id: number;
  dealership_id: number;
  shift_type: ShiftType;
  status: ShiftStatus;
  shift_start: string;
  shift_end: string | null;
  opening_photo_path: string | null;
  closing_photo_path: string | null;
  // Signed URLs for photo access (available based on user permissions)
  opening_photo_url: string | null;
  closing_photo_url: string | null;
  break_duration?: number;
  is_late: boolean;
  late_minutes: number | null;
  created_at: string;
  updated_at: string;
  user?: {
    id: number;
    full_name: string;
  };
  dealership?: {
    id: number;
    name: string;
  };
}

// Request types for API
export interface CreateShiftRequest {
  user_id: number;
  dealership_id: number;
  opening_photo: File;
}

export interface UpdateShiftRequest {
  closing_photo?: File;
  status?: ShiftStatus;
  break_duration?: number;
}
