import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types/user';
import { authApi } from '../api/auth';
import { setAuthHelpers } from '../api/client';
import { debugAuth } from '../utils/debug';
import { useWorkspaceStore } from './workspaceStore';
import { createZustandStorage } from '../platform/storage/zustand';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  hasHydrated: boolean;
  login: (login: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      hasHydrated: false,

      login: async (login: string, password: string) => {
        set({ isLoading: true, error: null });
        debugAuth.log('Login attempt for user:', login);
        try {
          const response = await authApi.login({ login, password });
          debugAuth.log('Login successful, setting auth state', {
            user: response.user?.login,
            hasToken: !!response.token,
          });

          // Set all auth state at once - Zustand persist will handle storage
          set({
            user: response.user,
            token: response.token,
            isAuthenticated: true,
            isLoading: false,
          });
          debugAuth.log('Auth state updated, isAuthenticated:', true);
        } catch (error: unknown) {
          debugAuth.error('Login failed:', error);
          const errorMessage = error && typeof error === 'object' && 'response' in error
            ? (error as { response?: { data?: { message?: string } } }).response?.data?.message || 'Ошибка входа'
            : 'Ошибка входа';
          set({
            error: errorMessage,
            isLoading: false,
          });
          throw error;
        }
      },

      logout: async () => {
        debugAuth.log('Logout initiated');
        try {
          await authApi.logout();
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          // Clear auth state - Zustand persist will handle storage cleanup
          set({
            user: null,
            token: null,
            isAuthenticated: false,
          });
          // Reset workspace state
          useWorkspaceStore.getState().resetWorkspace();
          debugAuth.log('Auth state cleared, isAuthenticated:', false);
        }
      },

      refreshUser: async () => {
        // Get current state to check for token
        const currentState = useAuthStore.getState();
        const token = currentState.token;

        debugAuth.log('refreshUser called, hasToken:', !!token);

        if (!token) {
          debugAuth.log('No token found, clearing auth state');
          set({ isAuthenticated: false, user: null, token: null });
          return;
        }

        try {
          const user = await authApi.getCurrentUser();
          debugAuth.log('User data refreshed successfully:', user.login);
          set({ user, isAuthenticated: true, token });
        } catch (error) {
          console.error('Refresh user error:', error);
          debugAuth.error('Failed to refresh user');

          // Only clear auth state on 401 errors (unauthorized)
          // Don't clear on network errors or server errors
          if (error && typeof error === 'object' && 'response' in error) {
            const status = (error as { response?: { status?: number } }).response?.status;
            if (status === 401) {
              debugAuth.log('401 error, clearing auth state');
              set({ isAuthenticated: false, user: null, token: null });
            } else {
              debugAuth.log('Non-401 error, keeping auth state');
              // Keep auth state for other errors (network, 500, etc.)
            }
          } else {
            debugAuth.log('Network or other error, keeping auth state');
            // Keep auth state for network errors
          }
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      storage: createZustandStorage(),
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        // Direct mutation — works for synchronous hydration (web/localStorage)
        // On web: hydration is sync → mutation before React subscribes → first render sees true
        if (state) {
          state.hasHydrated = true;
          debugAuth.log('Hydration complete. Auth state:', {
            isAuthenticated: state.isAuthenticated,
            hasToken: !!state.token,
            hasUser: !!state.user,
            user: state.user?.login,
          });
        }
      },
    }
  )
);

// For async hydration (mobile/@capacitor/preferences):
// onFinishHydration is registered AFTER create() → useAuthStore is defined
useAuthStore.persist.onFinishHydration(() => {
  useAuthStore.setState({ hasHydrated: true });
});

// Fallback: if sync hydration already completed before onFinishHydration registration
if (useAuthStore.persist.hasHydrated()) {
  useAuthStore.setState({ hasHydrated: true });
}

// Register auth helpers with API client to avoid circular dependencies
setAuthHelpers(
  () => useAuthStore.getState().token,
  () => {
    useAuthStore.setState({
      user: null,
      token: null,
      isAuthenticated: false,
    });
  }
);
