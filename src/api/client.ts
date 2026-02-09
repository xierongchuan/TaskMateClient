import axios, { type AxiosInstance, type AxiosError } from 'axios';
import { Capacitor } from '@capacitor/core';
import { debugAuth } from '../utils/debug';
import { rateLimitManager, parseRetryAfter } from '../utils/rateLimitManager';

const getBaseUrl = (): string => {
  if (Capacitor.isNativePlatform()) {
    const url = import.meta.env.VITE_API_BASE_URL;
    if (!url || url.startsWith('/')) {
      console.error('VITE_API_BASE_URL must be an absolute URL for Capacitor builds (e.g. http://192.168.1.10:8007/api/v1)');
    }
    return url || '/api/v1';
  }
  return import.meta.env.VITE_API_BASE_URL || '/api/v1';
};

const BASE_URL = getBaseUrl();

const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 30000,
});

// Import useAuthStore dynamically to avoid circular dependencies
let getAuthToken: (() => string | null) | null = null;
let clearAuth: (() => void) | null = null;

export const setAuthHelpers = (
  tokenGetter: () => string | null,
  authClearer: () => void
) => {
  getAuthToken = tokenGetter;
  clearAuth = authClearer;
};

apiClient.interceptors.request.use(
  (config) => {
    // Get token from Zustand store via helper function
    const token = getAuthToken?.();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error: AxiosError) => {
    // Handle maintenance mode (503)
    if (error.response?.status === 503) {
      const errorData = error.response.data as { error_type?: string };
      if (errorData?.error_type === 'maintenance_mode') {
        console.warn('System is in maintenance mode');
        // Redirect to maintenance page if not already there
        if (!window.location.pathname.includes('/maintenance')) {
          window.location.href = '/maintenance';
        }
      }
    }

    // Only clear auth state on 401 errors
    // Don't clear on network errors or other server errors
    if (error.response?.status === 401) {
      const requestUrl = error.config?.url;
      const requestMethod = error.config?.method?.toUpperCase();

      // Check if the request is NOT a login attempt (POST /session)
      // We should handle 401 on login manually in the component to show "Wrong password"
      const isLoginAttempt = requestUrl?.endsWith('/session') && requestMethod === 'POST';

      if (!isLoginAttempt) {
        debugAuth.log('401 error on protected resource, clearing auth state. URL:', requestUrl);
        // Log to console for user visibility
        console.error('Session expired or invalid. Server returned 401 for:', requestUrl);

        // Execute clearAuth callback (clears Zustand store)
        clearAuth?.();

        // Only redirect if not already on login page
        if (!window.location.pathname.includes('/login')) {
          // Verify we aren't in a loop or redirecting unnecessarily
          window.location.href = '/login';
        }
      } else {
        debugAuth.log('401 error on login attempt, not redirecting');
      }
    }

    if (error.response?.status === 403) {
      console.error('Недостаточно прав:', error.response.data);
    }

    // Handle rate limiting (429)
    if (error.response?.status === 429) {
      const headers = error.response.headers as Record<string, string> | undefined;
      const retryAfter = parseRetryAfter(headers);
      const shouldShowToast = rateLimitManager.setRateLimited(retryAfter);

      if (shouldShowToast) {
        window.dispatchEvent(
          new CustomEvent('rate-limit-error', {
            detail: { retryAfter },
          })
        );
      }

      console.warn('Rate limited (429). Retry after:', retryAfter || 'not specified');
    }

    return Promise.reject(error);
  }
);

export default apiClient;
