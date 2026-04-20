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

    // Для менеджера/наблюдателя/сотрудника — составляем список доступных автосалонов
    // Берём приоритетно полный список из API (если загружен), отфильтрованный по ID из user
    const ids = new Set<number>();
    if (user.dealership_id) ids.add(user.dealership_id);
    if (user.dealerships && user.dealerships.length > 0) {
      user.dealerships.forEach((d) => ids.add(d.id));
    }

    if (dealershipsData?.data && dealershipsData.data.length > 0) {
      const filtered = dealershipsData.data.filter((d) => ids.has(d.id));
      if (filtered.length > 0) return filtered;
    }

    // Фоллбек: если у пользователя есть вложенный объект dealership (id+name)
    if (user.dealership) return [user.dealership];

    // Если есть только id — возвращаем минимум данных, чтобы компонент мог отобразиться
    if (user.dealership_id) return [{ id: user.dealership_id, name: `Автосалон ${user.dealership_id}` }];

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

  // Может ли выбрать "Все автосалоны" (owner всегда, manager — если у него несколько автосалонов)
  const canSelectAll = user?.role === 'owner' || (user?.role === 'manager' && availableDealerships.length > 1);

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
