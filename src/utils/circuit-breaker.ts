import {
  CircuitBreakerState,
  type CircuitBreakerConfig,
  type CircuitBreakerStats,
  type ApiError,
} from '@/types/index';
import { TIMEOUTS } from '@/constants/timeouts';

export class CircuitBreaker {
  private state: CircuitBreakerState = CircuitBreakerState.CLOSED;
  private failureCount = 0;
  private successCount = 0;
  private lastFailureTime?: number;
  private nextAttemptTime?: number;
  private halfOpenCalls = 0;

  // eslint-disable-next-line no-unused-vars
  constructor(private config: CircuitBreakerConfig) {
    // Config is used in methods like shouldAttemptReset, onSuccess, onFailure
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === CircuitBreakerState.OPEN) {
      if (this.shouldAttemptReset()) {
        this.state = CircuitBreakerState.HALF_OPEN;
        this.halfOpenCalls = 0;
      } else {
        throw this.createCircuitBreakerError();
      }
    }

    if (this.state === CircuitBreakerState.HALF_OPEN) {
      if (this.halfOpenCalls >= this.config.halfOpenMaxCalls) {
        throw this.createCircuitBreakerError();
      }
      this.halfOpenCalls++;
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  getStats(): CircuitBreakerStats {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      ...(this.lastFailureTime && { lastFailureTime: this.lastFailureTime }),
      ...(this.nextAttemptTime && { nextAttemptTime: this.nextAttemptTime }),
    };
  }

  reset(): void {
    this.state = CircuitBreakerState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    delete this.lastFailureTime;
    delete this.nextAttemptTime;
    this.halfOpenCalls = 0;
  }

  private shouldAttemptReset(): boolean {
    if (!this.lastFailureTime) return false;

    const now = Date.now();
    return now >= (this.nextAttemptTime || 0);
  }

  private onSuccess(): void {
    this.successCount++;

    if (this.state === CircuitBreakerState.HALF_OPEN) {
      if (this.successCount >= this.config.failureThreshold) {
        this.state = CircuitBreakerState.CLOSED;
        this.failureCount = 0;
        this.successCount = 0;
        delete this.lastFailureTime;
        delete this.nextAttemptTime;
      }
    } else {
      this.failureCount = 0;
    }
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.state === CircuitBreakerState.HALF_OPEN) {
      this.state = CircuitBreakerState.OPEN;
      this.nextAttemptTime = this.lastFailureTime + this.config.recoveryTimeout;
    } else if (this.failureCount >= this.config.failureThreshold) {
      this.state = CircuitBreakerState.OPEN;
      this.nextAttemptTime = this.lastFailureTime + this.config.recoveryTimeout;
    }
  }

  private createCircuitBreakerError(): ApiError {
    const error = new Error('Circuit breaker is OPEN') as ApiError;
    error.status = 503;
    error.statusText = 'Service Unavailable';
    error.isNetworkError = false;
    return error;
  }
}

export const createCircuitBreakerConfig = (
  overrides: Partial<CircuitBreakerConfig> = {}
): CircuitBreakerConfig => {
  return {
    failureThreshold: 5,
    recoveryTimeout: TIMEOUTS.SIXTY_SECONDS,
    monitoringPeriod: TIMEOUTS.SIXTY_SECONDS,
    halfOpenMaxCalls: 3,
    ...overrides,
  };
};
