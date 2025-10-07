import type { 
  CircuitBreakerConfig, 
  CircuitBreakerState, 
  CircuitBreakerStats, 
  ApiError 
} from '../types/index.js';

/**
 * Circuit Breaker implementation with three states: CLOSED, OPEN, HALF_OPEN
 */
export class CircuitBreaker {
  private state: CircuitBreakerState = CircuitBreakerState.CLOSED;
  private failureCount = 0;
  private successCount = 0;
  private lastFailureTime?: number;
  private nextAttemptTime?: number;
  private halfOpenCalls = 0;

  constructor(private config: CircuitBreakerConfig) {}

  /**
   * Execute a function with circuit breaker protection
   */
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

  /**
   * Get current circuit breaker statistics
   */
  getStats(): CircuitBreakerStats {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime,
      nextAttemptTime: this.nextAttemptTime
    };
  }

  /**
   * Reset the circuit breaker to CLOSED state
   */
  reset(): void {
    this.state = CircuitBreakerState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = undefined;
    this.nextAttemptTime = undefined;
    this.halfOpenCalls = 0;
  }

  /**
   * Check if circuit breaker should attempt reset
   */
  private shouldAttemptReset(): boolean {
    if (!this.lastFailureTime) return false;
    
    const now = Date.now();
    return now >= (this.nextAttemptTime || 0);
  }

  /**
   * Handle successful execution
   */
  private onSuccess(): void {
    this.successCount++;
    
    if (this.state === CircuitBreakerState.HALF_OPEN) {
      // If we're in half-open and getting successes, close the circuit
      if (this.successCount >= this.config.failureThreshold) {
        this.state = CircuitBreakerState.CLOSED;
        this.failureCount = 0;
        this.successCount = 0;
        this.lastFailureTime = undefined;
        this.nextAttemptTime = undefined;
      }
    } else {
      // Reset failure count on success in CLOSED state
      this.failureCount = 0;
    }
  }

  /**
   * Handle failed execution
   */
  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    if (this.state === CircuitBreakerState.HALF_OPEN) {
      // If we fail in half-open, go back to open
      this.state = CircuitBreakerState.OPEN;
      this.nextAttemptTime = this.lastFailureTime + this.config.recoveryTimeout;
    } else if (this.failureCount >= this.config.failureThreshold) {
      // If we reach failure threshold, open the circuit
      this.state = CircuitBreakerState.OPEN;
      this.nextAttemptTime = this.lastFailureTime + this.config.recoveryTimeout;
    }
  }

  /**
   * Create a circuit breaker error
   */
  private createCircuitBreakerError(): ApiError {
    const error = new Error('Circuit breaker is OPEN') as ApiError;
    error.status = 503;
    error.statusText = 'Service Unavailable';
    error.isNetworkError = false;
    return error;
  }
}

/**
 * Create a circuit breaker configuration with sensible defaults
 */
export const createCircuitBreakerConfig = (
  overrides: Partial<CircuitBreakerConfig> = {}
): CircuitBreakerConfig => {
  return {
    failureThreshold: 5,
    recoveryTimeout: 60000, // 1 minute
    monitoringPeriod: 60000, // 1 minute
    halfOpenMaxCalls: 3,
    ...overrides
  };
};
