import { describe, it, vi, expect, beforeEach, afterEach } from 'vitest';
import {
  CircuitBreaker,
  createCircuitBreakerConfig,
} from '@/utils/circuit-breaker';
import { CircuitBreakerState } from '@/types/index';
import { RETRY_CONFIG } from '@/constants/timeouts';

describe('CircuitBreaker', () => {
  let circuitBreaker: CircuitBreaker;
  let config: ReturnType<typeof createCircuitBreakerConfig>;

  beforeEach(() => {
    vi.useFakeTimers();
    config = createCircuitBreakerConfig({
      failureThreshold: 3,
      recoveryTimeout: RETRY_CONFIG.BASE_DELAY,
      monitoringPeriod: RETRY_CONFIG.MAX_DELAY,
      halfOpenMaxCalls: 5, // Allow more calls than failure threshold
    });
    circuitBreaker = new CircuitBreaker(config);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('Should start in CLOSED state', () => {
    const stats = circuitBreaker.getStats();
    expect(stats.state).toBe(CircuitBreakerState.CLOSED);
  });

  it('Should execute function successfully in CLOSED state', async () => {
    const mockFunction = vi.fn().mockResolvedValue('success');
    const result = await circuitBreaker.execute(mockFunction);
    expect(result).toBe('success');
    expect(mockFunction).toHaveBeenCalledTimes(1);
    const stats = circuitBreaker.getStats();
    expect(stats.state).toBe(CircuitBreakerState.CLOSED);
    expect(stats.successCount).toBe(1);
    expect(stats.failureCount).toBe(0);
  });

  it('Should transition to OPEN state after failure threshold', async () => {
    const mockFunction = vi.fn().mockRejectedValue({ message: 'Server error' });
    // Execute function multiple times to exceed failure threshold
    for (let i = 0; i < config.failureThreshold; i++) {
      await expect(circuitBreaker.execute(mockFunction)).rejects.toMatchObject({
        message: 'Server error',
      });
    }
    // Circuit should now be OPEN
    const stats = circuitBreaker.getStats();
    expect(stats.state).toBe(CircuitBreakerState.OPEN);
    expect(stats.failureCount).toBe(config.failureThreshold);
    expect(mockFunction).toHaveBeenCalledTimes(config.failureThreshold);
  });
  it('Should reject calls immediately when OPEN', async () => {
    const mockFunction = vi.fn().mockRejectedValue({ message: 'Server error' });
    // Trigger circuit to open
    for (let i = 0; i < config.failureThreshold; i++) {
      await expect(circuitBreaker.execute(mockFunction)).rejects.toMatchObject({
        message: 'Server error',
      });
    }
    // Now circuit is OPEN, next call should be rejected immediately
    const newMockFunction = vi.fn().mockResolvedValue('success');
    await expect(circuitBreaker.execute(newMockFunction)).rejects.toMatchObject(
      { message: 'Circuit breaker is OPEN' }
    );
    // Function should not be called because circuit is open
    expect(newMockFunction).not.toHaveBeenCalled();
  });
  it('Should transition to HALF_OPEN after recovery timeout', async () => {
    const mockFunction = vi.fn().mockRejectedValue({ message: 'Server error' });
    // Trigger circuit to open
    for (let i = 0; i < config.failureThreshold; i++) {
      await expect(circuitBreaker.execute(mockFunction)).rejects.toMatchObject({
        message: 'Server error',
      });
    }
    // Verify circuit is OPEN
    expect(circuitBreaker.getStats().state).toBe(CircuitBreakerState.OPEN);

    // Fast-forward time past recovery timeout
    vi.advanceTimersByTime(config.recoveryTimeout + 100);

    // Call execute to trigger state transition check
    const testFunction = vi.fn().mockResolvedValue('success');
    const result = await circuitBreaker.execute(testFunction);

    // Now circuit should be HALF_OPEN and function should succeed
    expect(result).toBe('success');
    expect(circuitBreaker.getStats().state).toBe(CircuitBreakerState.HALF_OPEN);
  });
  it('should limit calls in HALF_OPEN state', async () => {
    // Create a specific config for this test where success threshold > call limit
    const testConfig = createCircuitBreakerConfig({
      failureThreshold: 5, // Need 5 successes to close
      recoveryTimeout: RETRY_CONFIG.BASE_DELAY,
      monitoringPeriod: RETRY_CONFIG.MAX_DELAY,
      halfOpenMaxCalls: 3, // But only allow 3 calls
    });
    const testCircuitBreaker = new CircuitBreaker(testConfig);

    const mockFunction = vi.fn().mockRejectedValue({ message: 'Server error' });
    // Open the circuit
    for (let i = 0; i < testConfig.failureThreshold; i++) {
      await expect(
        testCircuitBreaker.execute(mockFunction)
      ).rejects.toMatchObject({
        message: 'Server error',
      });
    }
    // Fast-forward to HALF_OPEN
    vi.advanceTimersByTime(testConfig.recoveryTimeout + 100);

    // Make calls up to the limit (but not enough to close the circuit)
    const successFunction = vi.fn().mockResolvedValue('success');
    for (let i = 0; i < testConfig.halfOpenMaxCalls; i++) {
      const result = await testCircuitBreaker.execute(successFunction);
      expect(result).toBe('success');
      // Verify we're still in HALF_OPEN state
      expect(testCircuitBreaker.getStats().state).toBe(
        CircuitBreakerState.HALF_OPEN
      );
    }

    // Next call should be rejected (exceeded limit)
    await expect(
      testCircuitBreaker.execute(successFunction)
    ).rejects.toMatchObject({
      message: 'Circuit breaker is OPEN',
    });
    // Verify the function was called the expected number of times
    expect(successFunction).toHaveBeenCalledTimes(testConfig.halfOpenMaxCalls);
  });
  it('should transition from HALF_OPEN to CLOSED on success', async () => {
    const mockFunction = vi.fn().mockRejectedValue({ message: 'Server error' });

    // Open the circuit
    for (let i = 0; i < config.failureThreshold; i++) {
      await expect(circuitBreaker.execute(mockFunction)).rejects.toMatchObject({
        message: 'Server error',
      });
    }

    // Fast-forward to HALF_OPEN
    vi.advanceTimersByTime(config.recoveryTimeout + 100);

    // Need multiple successes to close the circuit (same as failure threshold)
    const successFunction = vi.fn().mockResolvedValue('success');
    for (let i = 0; i < config.failureThreshold; i++) {
      const result = await circuitBreaker.execute(successFunction);
      expect(result).toBe('success');
    }

    // Circuit should now be CLOSED
    expect(circuitBreaker.getStats().state).toBe(CircuitBreakerState.CLOSED);
  });

  it('should reset circuit breaker state', () => {
    // Manually set some state
    circuitBreaker.getStats(); // This will initialize some internal state

    // Reset the circuit breaker
    circuitBreaker.reset();

    const stats = circuitBreaker.getStats();
    expect(stats.state).toBe(CircuitBreakerState.CLOSED);
    expect(stats.successCount).toBe(0);
    expect(stats.failureCount).toBe(0);
  });

  it('should track statistics correctly', async () => {
    const successFunction = vi.fn().mockResolvedValue('success');
    const failFunction = vi.fn().mockRejectedValue({ message: 'Error' });

    // Mix of successes and failures
    await circuitBreaker.execute(successFunction);
    await circuitBreaker.execute(successFunction);
    await expect(circuitBreaker.execute(failFunction)).rejects.toMatchObject({
      message: 'Error',
    });

    const stats = circuitBreaker.getStats();
    expect(stats.successCount).toBe(2);
    expect(stats.failureCount).toBe(1);
    expect(stats.state).toBe(CircuitBreakerState.CLOSED);
  });
});
