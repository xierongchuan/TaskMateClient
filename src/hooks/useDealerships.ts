import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dealershipsApi, type DealershipsFilters, type CreateDealershipRequest } from '../api/dealerships';

export const useDealerships = (filters?: DealershipsFilters) => {
  return useQuery({
    queryKey: ['dealerships', filters],
    queryFn: () => dealershipsApi.getDealerships(filters),
  });
};

export const useDealership = (id: number) => {
  return useQuery({
    queryKey: ['dealership', id],
    queryFn: () => dealershipsApi.getDealership(id),
    enabled: !!id,
  });
};

export const useCreateDealership = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateDealershipRequest) => dealershipsApi.createDealership(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dealerships'] });
    },
  });
};

export const useUpdateDealership = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreateDealershipRequest> }) =>
      dealershipsApi.updateDealership(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['dealerships'] });
      queryClient.invalidateQueries({ queryKey: ['dealership', variables.id] });
    },
  });
};

export const useDeleteDealership = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => dealershipsApi.deleteDealership(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dealerships'] });
    },
  });
};