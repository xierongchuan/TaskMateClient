import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { shiftSchedulesApi, type CreateShiftScheduleRequest, type UpdateShiftScheduleRequest } from '../api/shiftSchedules';

export const useShiftSchedules = (dealershipId?: number, activeOnly?: boolean) => {
  return useQuery({
    queryKey: ['shift-schedules', dealershipId, activeOnly, false],
    queryFn: () => shiftSchedulesApi.getAll(dealershipId, activeOnly, false),
    enabled: !!dealershipId,
    staleTime: 5 * 60 * 1000, // 5 минут
  });
};

export const useArchivedShiftSchedules = (dealershipId?: number) => {
  return useQuery({
    queryKey: ['shift-schedules', dealershipId, false, true],
    queryFn: () => shiftSchedulesApi.getAll(dealershipId, false, true),
    enabled: !!dealershipId,
    staleTime: 5 * 60 * 1000, // 5 минут
  });
};

export const useShiftSchedule = (id: number) => {
  return useQuery({
    queryKey: ['shift-schedule', id],
    queryFn: () => shiftSchedulesApi.get(id),
    enabled: !!id,
  });
};

export const useCreateShiftSchedule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateShiftScheduleRequest) => shiftSchedulesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shift-schedules'] });
    },
  });
};

export const useUpdateShiftSchedule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateShiftScheduleRequest }) =>
      shiftSchedulesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shift-schedules'] });
    },
  });
};

export const useDeleteShiftSchedule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => shiftSchedulesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shift-schedules'] });
    },
  });
};

export const useRestoreShiftSchedule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => shiftSchedulesApi.restore(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shift-schedules'] });
    },
  });
};
