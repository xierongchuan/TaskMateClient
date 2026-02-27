import { useState, useEffect } from 'react';
import { rateLimitManager } from '../utils/rateLimitManager';

interface RateLimitState {
  isLimited: boolean;
  retryAfter: number | null;
  countdown: number | null;
}

/**
 * React hook для подписки на состояние rate limit.
 * Возвращает текущее состояние и обновляется при изменениях.
 */
export function useRateLimit(): RateLimitState {
  const [state, setState] = useState<RateLimitState>(() => {
    const current = rateLimitManager.getState();
    return {
      isLimited: current.isLimited,
      retryAfter: current.retryAfter,
      countdown: current.countdown,
    };
  });

  useEffect(() => {
    return rateLimitManager.subscribe((newState) => {
      setState({
        isLimited: newState.isLimited,
        retryAfter: newState.retryAfter,
        countdown: newState.countdown,
      });
    });
  }, []);

  return state;
}
