import { describe, it, expect, vi } from 'vitest';
import { withRetry, createRetryConfig } from '@/utils/retry';

describe('withRetry function', () => {
  it('Should succeed on first try', async () => {
    const mockFunction = vi.fn().mockResolvedValue('success');
    const config = createRetryConfig();
    const result = await withRetry(mockFunction, config);
    expect(result).toBe('success');
    expect(mockFunction).toHaveBeenCalledTimes(1);
  });

  it('Should succeed after retries', async () => {
    const mockFunction = vi
      .fn()
      .mockRejectedValueOnce({ message: 'Network error', isNetworkError: true })
      .mockResolvedValueOnce('success');
    const config = createRetryConfig();
    const result = await withRetry(mockFunction, config);
    expect(result).toBe('success');
    expect(mockFunction).toHaveBeenCalledTimes(2);
  });

  it('Should fail after max retries', async () => {
    const mockFunction = vi
      .fn()
      .mockRejectedValue({ message: 'Network error', isNetworkError: true });
    const config = createRetryConfig({ maxRetries: 2 });
    await expect(withRetry(mockFunction, config)).rejects.toMatchObject({
      message: 'Network error',
      isNetworkError: true,
    });
    expect(mockFunction).toHaveBeenCalledTimes(3);
  });

  it('Should not retry on non-retryable errors', async () => {
    const mockFunction = vi
      .fn()
      .mockRejectedValue({ message: 'Not Found', status: 404 });
    const config = createRetryConfig();
    await expect(withRetry(mockFunction, config)).rejects.toMatchObject({
      message: 'Not Found',
      status: 404,
    });
    expect(mockFunction).toHaveBeenCalledTimes(1);
  });

  it('Should retry on server errors (5xx)', async () => {
    const mockFunction = vi
      .fn()
      .mockRejectedValueOnce({ message: 'Internal Server Error', status: 500 })
      .mockResolvedValue('success');
    const config = createRetryConfig();
    const result = await withRetry(mockFunction, config);
    expect(result).toBe('success');
    expect(mockFunction).toHaveBeenCalledTimes(2);
  });
});
