import { useWorkspaceStore } from '../stores/workspaceStore';
import { useAuth } from './useAuth';
import { useDealerships } from './useDealerships';
import { useEffect, useMemo } from 'react';

export const useWorkspace = () => {
  const { user } = useAuth();
  const { data: dealershipsData } = useDealerships();
  const {
    selectedDealershipId,
    hasInitialized,
    setDealership,
    initializeWorkspace,
    validateAndUpdateWorkspace
  } = useWorkspaceStore();

  // Определяем доступные автосалоны
  const availableDealerships = useMemo(() => {
    if (!user) return [];

    // Для owner - все автосалоны из API
    if (user.role === 'owner') {
      return dealershipsData?.data || [];
    }

    // Для остальных - только назначенные
    return user.dealerships || [];
  }, [user, dealershipsData?.data]);

  // Инициализация workspace при первой загрузке
  useEffect(() => {
    if (user && availableDealerships.length > 0) {
      if (!hasInitialized) {
        initializeWorkspace(user, availableDealerships);
      } else {
        // Валидация что текущий выбор все еще доступен
        validateAndUpdateWorkspace(user, availableDealerships);
      }
    }
  }, [user, availableDealerships, hasInitialized, initializeWorkspace, validateAndUpdateWorkspace]);

  // Текущий автосалон
  const currentDealership = useMemo(() => {
    if (selectedDealershipId === null) return null;
    return availableDealerships.find(d => d.id === selectedDealershipId) || null;
  }, [selectedDealershipId, availableDealerships]);

  // Может ли пользователь переключать автосалоны
  const canSwitchWorkspace = useMemo(() => {
    if (!user) return false;
    if (user.role === 'employee') return false;
    return availableDealerships.length > 1 || user.role === 'owner';
  }, [user, availableDealerships]);

  // Может ли выбрать "Все автосалоны"
  const canSelectAll = user?.role === 'owner';

  return {
    dealershipId: selectedDealershipId,
    setDealershipId: setDealership,
    availableDealerships,
    currentDealership,
    canSwitchWorkspace,
    canSelectAll,
    isAllDealerships: selectedDealershipId === null,
    isLoading: !hasInitialized && !!user,
  };
};

// Хук для получения фильтра dealership_id для API запросов
export const useWorkspaceFilter = () => {
  const { dealershipId } = useWorkspace();

  return useMemo(() => ({
    dealership_id: dealershipId || undefined
  }), [dealershipId]);
};
