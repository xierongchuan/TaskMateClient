import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './stores/authStore';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { Layout } from './components/layout/Layout';
import { LoginPage } from './pages/LoginPage';
import { MaintenancePage } from './pages/MaintenancePage';
import { DashboardPage } from './pages/DashboardPage';
import { TasksPage } from './pages/TasksPage';
import { TaskGeneratorsPage } from './pages/TaskGeneratorsPage';
import { ArchivedTasksPage } from './pages/ArchivedTasksPage';
import { PendingReviewPage } from './pages/PendingReviewPage';
import { MyHistoryPage } from './pages/MyHistoryPage';
import { AuditLogPage } from './pages/AuditLogPage';
import { UsersPage } from './pages/UsersPage';
import { ShiftsPage } from './pages/ShiftsPage';
import { LinksPage } from './pages/LinksPage';
import { SettingsPage } from './pages/SettingsPage';
import { ReportsPage } from './pages/ReportsPage';
import { DealershipsPage } from './pages/DealershipsPage';
import { NotificationSettingsPage } from './pages/NotificationSettingsPage';
import { ProfilePage } from './pages/ProfilePage';
import { debugAuth } from './utils/debug';


import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './components/ui/Toast';
import { RateLimitIndicator } from './components/ui/RateLimitIndicator';
import { rateLimitManager } from './utils/rateLimitManager';
import axios from 'axios';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        if (axios.isAxiosError(error)) {
          const status = error.response?.status;

          // Для 429 — повторять до 3 раз
          if (status === 429) {
            return failureCount < 3;
          }

          // Для других 4xx — не повторять
          if (status && status >= 400 && status < 500) {
            return false;
          }
        }

        // Для остальных ошибок — 1 повтор
        return failureCount < 1;
      },
      retryDelay: (attemptIndex) => {
        // Если есть Retry-After от rate limit manager — использовать его
        const rateLimitDelay = rateLimitManager.getRetryDelay();
        if (rateLimitDelay > 0) {
          return rateLimitDelay;
        }

        // Иначе exponential backoff: 1s, 2s, 4s... max 30s
        return Math.min(1000 * Math.pow(2, attemptIndex), 30000);
      },
    },
  },
});

function App() {
  const { isAuthenticated, token, hasHydrated, user } = useAuthStore();

  useEffect(() => {
    // After Zustand persist hydrates, check if we have a token but no user data
    // Only refresh if we have token but missing user data to avoid unnecessary API calls
    debugAuth.log('App useEffect triggered', {
      hasHydrated,
      hasToken: !!token,
      isAuthenticated,
      hasUser: !!user,
    });

    if (hasHydrated && token && isAuthenticated && !user) {
      debugAuth.log('Has token but no user data, calling refreshUser');
      // Get refreshUser directly from store to avoid dependency issues
      useAuthStore.getState().refreshUser();
    }
  }, [hasHydrated, token, isAuthenticated, user]);

  // Show loading screen while Zustand persist is hydrating state from localStorage
  if (!hasHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600">Загрузка...</p>
        </div>
      </div>
    );
  }

  return (
    <ThemeProvider>
      <ToastProvider>
        <RateLimitIndicator />
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <Routes>
              <Route path="/maintenance" element={<MaintenancePage />} />

              <Route
                path="/login"
                element={
                  isAuthenticated ? (
                    <Navigate to="/dashboard" replace />
                  ) : (
                    <LoginPage />
                  )
                }
              />

              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<DashboardPage />} />
                <Route path="profile" element={<ProfilePage />} />
                <Route path="tasks" element={<TasksPage />} />
                <Route path="my-history" element={<MyHistoryPage />} />
                <Route
                  path="task-generators"
                  element={
                    <ProtectedRoute requiredRoles={['manager', 'owner']}>
                      <TaskGeneratorsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="archived-tasks"
                  element={
                    <ProtectedRoute requiredRoles={['manager', 'owner']}>
                      <ArchivedTasksPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="pending-review"
                  element={
                    <ProtectedRoute requiredRoles={['manager', 'owner']}>
                      <PendingReviewPage />
                    </ProtectedRoute>
                  }
                />
                <Route path="users" element={<Navigate to="/employees" replace />} />
                <Route
                  path="employees"
                  element={
                    <ProtectedRoute requiredRoles={['manager', 'owner', 'observer']}>
                      <UsersPage />
                    </ProtectedRoute>
                  }
                />
                <Route path="shifts" element={<ShiftsPage />} />
                <Route path="links" element={<LinksPage />} />
                <Route
                  path="dealerships"
                  element={
                    <ProtectedRoute requiredRoles={['manager', 'owner']}>
                      <DealershipsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="settings"
                  element={
                    <ProtectedRoute requiredRoles={['manager', 'owner']}>
                      <SettingsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="reports"
                  element={
                    <ProtectedRoute requiredRoles={['manager', 'owner']}>
                      <ReportsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="notification-settings"
                  element={
                    <ProtectedRoute requiredRoles={['manager', 'owner']}>
                      <NotificationSettingsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="audit-logs"
                  element={
                    <ProtectedRoute requiredRoles={['owner']}>
                      <AuditLogPage />
                    </ProtectedRoute>
                  }
                />
              </Route>

              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </BrowserRouter>
        </QueryClientProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;

