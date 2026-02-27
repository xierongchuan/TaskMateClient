/**
 * Debug logging utility
 * Set DEBUG_AUTH=true in localStorage to enable authentication debugging
 */

const isDebugEnabled = () => {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('DEBUG_AUTH') === 'true';
};

export const debugAuth = {
  log: (...args: unknown[]) => {
    if (isDebugEnabled()) {
      console.log('[AUTH DEBUG]', ...args);
    }
  },
  warn: (...args: unknown[]) => {
    if (isDebugEnabled()) {
      console.warn('[AUTH DEBUG]', ...args);
    }
  },
  error: (...args: unknown[]) => {
    if (isDebugEnabled()) {
      console.error('[AUTH DEBUG]', ...args);
    }
  },
};
