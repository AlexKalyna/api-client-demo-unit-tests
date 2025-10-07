import type { RetryConfig, ApiError } from '../types/index.js';

/**
 * Default retry condition - retry on network errors and 5xx status codes
 */
const defaultRetryCondition = (error: ApiError): boolean => {
  if (error.isNetworkError || error.isTimeoutError) {
    return true;
  }
  
  if (error.status && error.status >= 500) {
    return true;
  }
  
  return false;
};

/**
 * Calculate delay with exponential backoff and jitter
 */
const calculateDelay = (attempt: number, config: RetryConfig): number => {
  const exponentialDelay = config.baseDelay * Math.pow(config.backoffMultiplier, attempt - 1);
  const jitter = Math.random() * 0.1 * exponentialDelay; // 10% jitter
  const delay = Math.min(exponentialDelay + jitter, config.maxDelay);
  
  return Math.floor(delay);
};

/**
 * Sleep for specified milliseconds
 */
const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Execute a function with retry logic
 */
export const withRetry = async <T>(
  fn: () => Promise<T>,
  config: RetryConfig
): Promise<T> => {
  const retryCondition = config.retryCondition || defaultRetryCondition;
  let lastError: ApiError;
  
  for (let attempt = 1; attempt <= config.maxRetries + 1; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as ApiError;
      
      // Don't retry if we've reached max attempts
      if (attempt > config.maxRetries) {
        break;
      }
      
      // Don't retry if condition is not met
      if (!retryCondition(lastError)) {
        break;
      }
      
      // Calculate delay and wait
      const delay = calculateDelay(attempt, config);
      await sleep(delay);
    }
  }
  
  throw lastError!;
};

/**
 * Create a retry configuration with sensible defaults
 */
export const createRetryConfig = (overrides: Partial<RetryConfig> = {}): RetryConfig => {
  return {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2,
    ...overrides
  };
};
