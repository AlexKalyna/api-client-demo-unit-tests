export interface ApiResponse<T = unknown> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
}

export interface ApiError extends Error {
  status?: number;
  statusText?: string;
  response?: ApiResponse;
  isNetworkError?: boolean;
  isTimeoutError?: boolean;
}

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryCondition?: (error: ApiError) => boolean; // eslint-disable-line no-unused-vars
}

export interface CircuitBreakerConfig {
  failureThreshold: number;
  recoveryTimeout: number;
  monitoringPeriod: number;
  halfOpenMaxCalls: number;
}

export enum CircuitBreakerState {
  // eslint-disable-next-line no-unused-vars
  CLOSED = 'CLOSED',
  // eslint-disable-next-line no-unused-vars
  OPEN = 'OPEN',
  // eslint-disable-next-line no-unused-vars
  HALF_OPEN = 'HALF_OPEN',
}

export interface CircuitBreakerStats {
  state: CircuitBreakerState;
  failureCount: number;
  successCount: number;
  lastFailureTime?: number;
  nextAttemptTime?: number;
}

export interface HttpClientConfig {
  baseURL?: string;
  timeout?: number;
  headers?: Record<string, string>;
  retryConfig?: RetryConfig;
  circuitBreakerConfig?: CircuitBreakerConfig;
}

export interface RequestConfig {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  url: string;
  data?: unknown;
  headers?: Record<string, string>;
  timeout?: number;
  params?: Record<string, string | number | boolean>;
}
