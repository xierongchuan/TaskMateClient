/**
 * Менеджер состояния rate limit для предотвращения дублирования toast'ов
 * и хранения Retry-After информации.
 */

interface RateLimitState {
  isLimited: boolean;
  retryAfter: number | null;
  lastToastTime: number | null;
  countdown: number | null;
}

type RateLimitListener = (state: RateLimitState) => void;

class RateLimitManager {
  private state: RateLimitState = {
    isLimited: false,
    retryAfter: null,
    lastToastTime: null,
    countdown: null,
  };

  private listeners: Set<RateLimitListener> = new Set();
  private countdownInterval: ReturnType<typeof setInterval> | null = null;

  // Toast debounce — не показывать toast чаще чем раз в 5 секунд
  private readonly TOAST_DEBOUNCE_MS = 5000;

  /**
   * Устанавливает состояние rate limit.
   * Возвращает true если нужно показать toast.
   */
  setRateLimited(retryAfterSeconds: number | null): boolean {
    const now = Date.now();
    const shouldShowToast =
      !this.state.lastToastTime ||
      now - this.state.lastToastTime > this.TOAST_DEBOUNCE_MS;

    this.state = {
      isLimited: true,
      retryAfter: retryAfterSeconds,
      lastToastTime: shouldShowToast ? now : this.state.lastToastTime,
      countdown: retryAfterSeconds,
    };

    this.startCountdown(retryAfterSeconds);
    this.notifyListeners();

    return shouldShowToast;
  }

  /**
   * Сбрасывает состояние rate limit.
   */
  clearRateLimit(): void {
    this.stopCountdown();
    this.state = {
      isLimited: false,
      retryAfter: null,
      lastToastTime: this.state.lastToastTime,
      countdown: null,
    };
    this.notifyListeners();
  }

  /**
   * Возвращает задержку для retry в миллисекундах.
   * Если сервер указал Retry-After, использует его.
   */
  getRetryDelay(): number {
    if (this.state.retryAfter) {
      return this.state.retryAfter * 1000;
    }
    return 0;
  }

  /**
   * Подписка на изменения состояния.
   */
  subscribe(listener: RateLimitListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Возвращает текущее состояние.
   */
  getState(): RateLimitState {
    return { ...this.state };
  }

  private startCountdown(seconds: number | null): void {
    this.stopCountdown();
    if (!seconds || seconds <= 0) return;

    this.countdownInterval = setInterval(() => {
      if (this.state.countdown && this.state.countdown > 0) {
        this.state = {
          ...this.state,
          countdown: this.state.countdown - 1,
        };
        this.notifyListeners();

        if (this.state.countdown === 0) {
          this.clearRateLimit();
        }
      }
    }, 1000);
  }

  private stopCountdown(): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }
  }

  private notifyListeners(): void {
    const stateCopy = this.getState();
    this.listeners.forEach((listener) => listener(stateCopy));
  }
}

export const rateLimitManager = new RateLimitManager();

/**
 * Парсит Retry-After header из ответа сервера.
 * Может быть числом секунд или HTTP-date.
 */
export function parseRetryAfter(headers: Record<string, string> | undefined): number | null {
  if (!headers) return null;

  // Headers могут быть в разном регистре
  const retryAfter = headers['retry-after'] || headers['Retry-After'];
  if (!retryAfter) return null;

  // Retry-After может быть числом секунд
  const seconds = parseInt(retryAfter, 10);
  if (!isNaN(seconds) && seconds > 0) {
    return seconds;
  }

  // Или HTTP-date
  const date = new Date(retryAfter);
  if (!isNaN(date.getTime())) {
    const delayMs = date.getTime() - Date.now();
    return Math.max(1, Math.ceil(delayMs / 1000));
  }

  return null;
}
