export const RETRY_CONFIG = {
  BASE_DELAY: 1 * 1000,
  MAX_DELAY: 10 * 1000,
} as const;

export const CIRCUIT_BREAKER_CONFIG = {
  RECOVERY_TIMEOUT: 60 * 1000,
  MONITORING_PERIOD: 60 * 1000,
} as const;

export const HTTP_CONFIG = {
  DEFAULT_TIMEOUT: 10 * 1000,
} as const;
