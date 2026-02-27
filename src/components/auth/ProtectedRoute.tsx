import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { debugAuth } from '../../utils/debug';
import { getRoleLabel, translateRoles } from '../../utils/roleTranslations';
import type { Role } from '../../types/user';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: Role[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRoles,
}) => {
  const { isAuthenticated, user, refreshUser, token, hasHydrated } = useAuthStore();
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    // Only attempt refresh if we have a token but no user data, and hydration is complete
    if (hasHydrated && token && isAuthenticated && !user && !isRefreshing) {
      debugAuth.log('ProtectedRoute: user data missing, refreshing');
      setIsRefreshing(true);
      refreshUser().finally(() => {
        setIsRefreshing(false);
      });
    }
  }, [hasHydrated, token, isAuthenticated, user, refreshUser, isRefreshing]);

  // Show loading while hydrating or refreshing user data
  if (!hasHydrated || isRefreshing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Загрузка...</p>
        </div>
      </div>
    );
  }

  // Check authentication only after hydration is complete
  if (!isAuthenticated) {
    debugAuth.log('ProtectedRoute: not authenticated, redirecting to /login');
    return <Navigate to="/login" replace />;
  }

  if (requiredRoles && user && !requiredRoles.includes(user.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">Доступ запрещен</h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              У вас недостаточно прав для просмотра этой страницы.
            </p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-500">
              Требуемые роли: {translateRoles(requiredRoles)}
            </p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-500">Ваша роль: {getRoleLabel(user.role)}</p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
