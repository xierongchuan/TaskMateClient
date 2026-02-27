import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { calendarApi } from '../api/calendar';
import type { UpdateCalendarDayRequest, BulkCalendarRequest } from '../types/calendar';

/**
 * Hook to fetch year calendar
 */
export const useYearCalendar = (year: number, dealershipId?: number) => {
  return useQuery({
    queryKey: ['calendar', year, dealershipId],
    queryFn: () => calendarApi.getYearCalendar(year, dealershipId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook to fetch holidays list for a year
 */
export const useHolidays = (year: number, dealershipId?: number) => {
  return useQuery({
    queryKey: ['calendar-holidays', year, dealershipId],
    queryFn: () => calendarApi.getHolidays(year, dealershipId),
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Hook to check if a date is a holiday
 */
export const useCheckDate = (date: string, dealershipId?: number) => {
  return useQuery({
    queryKey: ['calendar-check', date, dealershipId],
    queryFn: () => calendarApi.checkDate(date, dealershipId),
    enabled: !!date,
  });
};

/**
 * Hook to update a calendar day
 */
export const useUpdateCalendarDay = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ date, data }: { date: string; data: UpdateCalendarDayRequest }) =>
      calendarApi.updateDay(date, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
      queryClient.invalidateQueries({ queryKey: ['calendar-holidays'] });
    },
  });
};

/**
 * Hook to delete a calendar day
 */
export const useDeleteCalendarDay = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ date, dealershipId }: { date: string; dealershipId?: number }) =>
      calendarApi.deleteDay(date, dealershipId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
      queryClient.invalidateQueries({ queryKey: ['calendar-holidays'] });
    },
  });
};

/**
 * Hook for bulk calendar operations
 */
export const useBulkCalendarUpdate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: BulkCalendarRequest) => calendarApi.bulkUpdate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
      queryClient.invalidateQueries({ queryKey: ['calendar-holidays'] });
    },
  });
};

/**
 * Hook to set all weekends as holidays
 */
export const useSetWeekends = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ year, dealershipId }: { year: number; dealershipId?: number }) =>
      calendarApi.setAllWeekends(year, dealershipId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
      queryClient.invalidateQueries({ queryKey: ['calendar-holidays'] });
    },
  });
};

/**
 * Hook to clear all calendar settings for a year
 */
export const useClearCalendarYear = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ year, dealershipId }: { year: number; dealershipId?: number }) =>
      calendarApi.clearYear(year, dealershipId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
      queryClient.invalidateQueries({ queryKey: ['calendar-holidays'] });
    },
  });
};

/**
 * Hook to reset dealership calendar to global
 * Removes all dealership-specific records, returning to global calendar usage
 */
export const useResetCalendarToGlobal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ year, dealershipId }: { year: number; dealershipId: number }) =>
      calendarApi.resetToGlobal(year, dealershipId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
      queryClient.invalidateQueries({ queryKey: ['calendar-holidays'] });
    },
  });
};
