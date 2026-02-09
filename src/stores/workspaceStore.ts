import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types/user';
import { createZustandStorage } from '../platform/storage/zustand';

interface WorkspaceState {
  selectedDealershipId: number | null;
  hasInitialized: boolean;
  setDealership: (id: number | null) => void;
  initializeWorkspace: (user: User, availableDealerships: { id: number; name: string }[]) => void;
  validateAndUpdateWorkspace: (user: User, availableDealerships: { id: number; name: string }[]) => void;
  resetWorkspace: () => void;
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set, get) => ({
      selectedDealershipId: null,
      hasInitialized: false,

      setDealership: (id: number | null) => {
        set({ selectedDealershipId: id });
      },

      initializeWorkspace: (user: User, availableDealerships: { id: number; name: string }[]) => {
        const state = get();

        // Если уже инициализировано - только валидируем
        if (state.hasInitialized) {
          // Для owner null (Все автосалоны) - валидное состояние
          if (user.role === 'owner' && state.selectedDealershipId === null) {
            return;
          }
          if (state.selectedDealershipId !== null) {
            const isValid = availableDealerships.some(d => d.id === state.selectedDealershipId);
            if (isValid) {
              return; // Все ок, оставляем как есть
            }
          }
          // Иначе сбрасываем на дефолт
        }

        let dealershipId: number | null = null;

        // Employee - всегда основной автосалон
        if (user.role === 'employee') {
          dealershipId = user.dealership_id;
        }
        // Owner - по умолчанию "Все автосалоны"
        else if (user.role === 'owner') {
          if (state.selectedDealershipId !== null) {
            const isValid = availableDealerships.some(d => d.id === state.selectedDealershipId);
            dealershipId = isValid ? state.selectedDealershipId : null;
          } else {
            dealershipId = null;
          }
        }
        // Для manager/observer - первый из доступных или сохраненный
        else if (availableDealerships.length > 0) {
          if (state.selectedDealershipId !== null) {
            const isValid = availableDealerships.some(d => d.id === state.selectedDealershipId);
            if (isValid) {
              dealershipId = state.selectedDealershipId;
            } else {
              dealershipId = availableDealerships[0].id;
            }
          } else {
            dealershipId = availableDealerships[0].id;
          }
        }

        set({
          selectedDealershipId: dealershipId,
          hasInitialized: true
        });
      },

      validateAndUpdateWorkspace: (user: User, availableDealerships: { id: number; name: string }[]) => {
        const state = get();

        // Для employee всегда основной автосалон
        if (user.role === 'employee') {
          if (state.selectedDealershipId !== user.dealership_id) {
            set({ selectedDealershipId: user.dealership_id });
          }
          return;
        }

        // Для owner с "Все автосалоны" (null) - оставляем
        if (user.role === 'owner' && state.selectedDealershipId === null) {
          return;
        }

        // Проверяем что текущий выбор доступен
        if (state.selectedDealershipId !== null) {
          const isValid = availableDealerships.some(d => d.id === state.selectedDealershipId);
          if (!isValid && availableDealerships.length > 0) {
            // Fallback на первый доступный
            set({ selectedDealershipId: availableDealerships[0].id });
          }
        }
      },

      resetWorkspace: () => {
        set({
          selectedDealershipId: null,
          hasInitialized: false
        });
      },
    }),
    {
      name: 'workspace-storage',
      storage: createZustandStorage(),
      partialize: (state) => ({
        selectedDealershipId: state.selectedDealershipId,
        hasInitialized: state.hasInitialized,
      }),
    }
  )
);
