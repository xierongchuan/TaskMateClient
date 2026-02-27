import apiClient from './client';
import type {
  YearCalendarResponse,
  HolidaysResponse,
  CalendarCheckResponse,
  UpdateCalendarDayRequest,
  BulkCalendarRequest,
  BulkCalendarResponse,
  CalendarDay,
  ResetCalendarResponse,
} from '../types/calendar';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export const calendarApi = {
  /**
   * Get calendar for a specific year
   */
  getYearCalendar: async (year: number, dealershipId?: number): Promise<ApiResponse<YearCalendarResponse>> => {
    const params = dealershipId ? { dealership_id: dealershipId } : {};
    const response = await apiClient.get<ApiResponse<YearCalendarResponse>>(`/calendar/${year}`, { params });
    return response.data;
  },

  /**
   * Get all holidays for a year (dates only)
   */
  getHolidays: async (year: number, dealershipId?: number): Promise<ApiResponse<HolidaysResponse>> => {
    const params = dealershipId ? { dealership_id: dealershipId } : {};
    const response = await apiClient.get<ApiResponse<HolidaysResponse>>(`/calendar/${year}/holidays`, { params });
    return response.data;
  },

  /**
   * Check if a specific date is a holiday
   */
  checkDate: async (date: string, dealershipId?: number): Promise<ApiResponse<CalendarCheckResponse>> => {
    const params = dealershipId ? { dealership_id: dealershipId } : {};
    const response = await apiClient.get<ApiResponse<CalendarCheckResponse>>(`/calendar/check/${date}`, { params });
    return response.data;
  },

  /**
   * Update a specific calendar day
   */
  updateDay: async (date: string, data: UpdateCalendarDayRequest): Promise<ApiResponse<CalendarDay>> => {
    const response = await apiClient.put<ApiResponse<CalendarDay>>(`/calendar/${date}`, data);
    return response.data;
  },

  /**
   * Delete a calendar day record (revert to default workday)
   */
  deleteDay: async (date: string, dealershipId?: number): Promise<ApiResponse<{ deleted: boolean }>> => {
    const params = dealershipId ? { dealership_id: dealershipId } : {};
    const response = await apiClient.delete<ApiResponse<{ deleted: boolean }>>(`/calendar/${date}`, { params });
    return response.data;
  },

  /**
   * Bulk update calendar days
   */
  bulkUpdate: async (data: BulkCalendarRequest): Promise<ApiResponse<BulkCalendarResponse>> => {
    const response = await apiClient.post<ApiResponse<BulkCalendarResponse>>('/calendar/bulk', data);
    return response.data;
  },

  /**
   * Helper: Set all Saturdays as holidays for a year
   */
  setAllSaturdays: async (year: number, dealershipId?: number): Promise<ApiResponse<BulkCalendarResponse>> => {
    return calendarApi.bulkUpdate({
      operation: 'set_weekdays',
      year,
      dealership_id: dealershipId,
      weekdays: [6], // Saturday
      type: 'holiday',
    });
  },

  /**
   * Helper: Set all Sundays as holidays for a year
   */
  setAllSundays: async (year: number, dealershipId?: number): Promise<ApiResponse<BulkCalendarResponse>> => {
    return calendarApi.bulkUpdate({
      operation: 'set_weekdays',
      year,
      dealership_id: dealershipId,
      weekdays: [7], // Sunday
      type: 'holiday',
    });
  },

  /**
   * Helper: Set all weekends (Sat + Sun) as holidays for a year
   */
  setAllWeekends: async (year: number, dealershipId?: number): Promise<ApiResponse<BulkCalendarResponse>> => {
    return calendarApi.bulkUpdate({
      operation: 'set_weekdays',
      year,
      dealership_id: dealershipId,
      weekdays: [6, 7], // Saturday and Sunday
      type: 'holiday',
    });
  },

  /**
   * Helper: Clear all calendar settings for a year
   */
  clearYear: async (year: number, dealershipId?: number): Promise<ApiResponse<BulkCalendarResponse>> => {
    return calendarApi.bulkUpdate({
      operation: 'clear_year',
      year,
      dealership_id: dealershipId,
    });
  },

  /**
   * Reset dealership calendar to global
   * Deletes all dealership-specific records for the year,
   * returning the dealership to using the global calendar.
   */
  resetToGlobal: async (year: number, dealershipId: number): Promise<ApiResponse<ResetCalendarResponse>> => {
    const response = await apiClient.delete<ApiResponse<ResetCalendarResponse>>(
      `/calendar/${year}/reset`,
      { params: { dealership_id: dealershipId } }
    );
    return response.data;
  },
};
