import type { ApiError } from '@/types/index';
import { TIMEOUTS, DELAYS } from '@/constants/timeouts';

export const retryConfig = {
  maxRetries: 3,
  baseDelay: DELAYS.ONE_SECOND,
  maxDelay: DELAYS.TEN_SECONDS,
  backoffFactor: 2,
  retryCondition: (error: ApiError): boolean => {
    if (error.isNetworkError || error.isTimeoutError) {
      return true;
    }
    return false;
  },
};

export const circuitBreakerConfig = {
  failureThreshold: 5,
  recoveryTimeout: TIMEOUTS.SIXTY_SECONDS,
  monitoringPeriod: TIMEOUTS.SIXTY_SECONDS,
  halfOpenMaxCalls: 3,
};

export const httpClientConfig = {
  baseURL: 'https://api.example.com',
  timeout: TIMEOUTS.THIRTY_SECONDS,
  headers: {
    'Content-Type': 'application/json',
    'User-Agent': 'TestClient/1.0',
  },
};

export const quickTimeoutConfig = {
  baseURL: 'https://api.example.com',
  timeout: TIMEOUTS.FIVE_SECONDS,
  headers: {
    'Content-Type': 'application/json',
  },
};

export const noTimeoutConfig = {
  baseURL: 'https://api.example.com',
  headers: {
    'Content-Type': 'application/json',
  },
};
