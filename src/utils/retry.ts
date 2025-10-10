import type { RetryConfig, ApiError } from '@/types/index';
import { RETRY_CONFIG } from '@/constants/timeouts';

const defaultRetryCondition = (error: ApiError): boolean => {
  if (error.isNetworkError || error.isTimeoutError) {
    return true;
  }

  if (error.status && error.status >= 500) {
    return true;
  }

  return false;
};

const calculateDelay = (attempt: number, config: RetryConfig): number => {
  const exponentialDelay =
    config.baseDelay * Math.pow(config.backoffMultiplier, attempt - 1);
  const jitter = Math.random() * 0.1 * exponentialDelay;
  const delay = Math.min(exponentialDelay + jitter, config.maxDelay);

  return Math.floor(delay);
};

const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

export const withRetry = async <T>(
  fn: () => Promise<T>,
  config: RetryConfig
): Promise<T> => {
  const retryCondition = config.retryCondition || defaultRetryCondition;
  let lastError: ApiError | undefined;

  for (let attempt = 1; attempt <= config.maxRetries + 1; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as ApiError;

      if (attempt > config.maxRetries) {
        break;
      }

      if (!retryCondition(lastError)) {
        break;
      }

      const delay = calculateDelay(attempt, config);
      await sleep(delay);
    }
  }

  if (lastError) {
    throw lastError;
  }
  throw new Error('Retry failed but no error was captured');
};

export const createRetryConfig = (
  overrides: Partial<RetryConfig> = {}
): RetryConfig => {
  return {
    maxRetries: 3,
    baseDelay: RETRY_CONFIG.BASE_DELAY,
    maxDelay: RETRY_CONFIG.MAX_DELAY,
    backoffMultiplier: 2,
    ...overrides,
  };
};
