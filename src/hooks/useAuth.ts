import { useAuthStore } from '../stores/authStore';

export const useAuth = () => {
  const { user, isAuthenticated, isLoading, error, login, logout, clearError, refreshUser } = useAuthStore();

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    clearError,
    refreshUser,
  };
};
