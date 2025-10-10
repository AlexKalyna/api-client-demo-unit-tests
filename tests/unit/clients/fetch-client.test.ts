import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FetchClient } from '@/clients/fetch-client';
import { CircuitBreakerState } from '@/types/index';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock AbortController
const mockAbortController = {
  abort: vi.fn(),
  signal: { aborted: false },
};
global.AbortController = vi.fn(() => mockAbortController) as any;

describe('FetchClient', () => {
  let client: FetchClient;

  beforeEach(() => {
    vi.clearAllMocks();
    mockAbortController.signal.aborted = false;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Basic HTTP Methods', () => {
    beforeEach(() => {
      client = new FetchClient();
    });

    it('Should make GET request successfully', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Map([['content-type', 'application/json']]),
        json: vi.fn().mockResolvedValue({ message: 'success' }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      const result = await client.get('/api/test');

      expect(mockFetch).toHaveBeenCalledWith('/api/test', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: undefined,
      });
      expect(result.data).toEqual({ message: 'success' });
    });

    it('Should make POST request with data', async () => {
      const mockResponse = {
        ok: true,
        status: 201,
        statusText: 'Created',
        headers: new Map([['content-type', 'application/json']]),
        json: vi.fn().mockResolvedValue({ id: 1, name: 'test' }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      const postData = { name: 'test', email: 'test@example.com' };
      const result = await client.post('/api/users', postData);

      expect(mockFetch).toHaveBeenCalledWith('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postData),
        signal: undefined,
      });
      expect(result.data).toEqual({ id: 1, name: 'test' });
    });
  });

  describe('Client Configuration', () => {
    it('Should use baseURL when provided', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Map([['content-type', 'application/json']]),
        json: vi.fn().mockResolvedValue({ message: 'success' }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      client = new FetchClient({ baseURL: 'https://api.example.com' });
      await client.get('/users');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/users',
        expect.any(Object)
      );
    });

    it('Should merge default and custom headers', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Map([['content-type', 'application/json']]),
        json: vi.fn().mockResolvedValue({ message: 'success' }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      client = new FetchClient({
        headers: { 'X-API-Key': 'secret' },
      });
      await client.get('/test');

      expect(mockFetch).toHaveBeenCalledWith('/test', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': 'secret',
        },
        signal: undefined,
      });
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      client = new FetchClient();
    });

    it('Should handle HTTP error responses', async () => {
      const mockResponse = {
        ok: false,
        status: 404,
        statusText: 'Not Found',
        headers: new Map([['content-type', 'application/json']]),
        json: vi.fn().mockResolvedValue({ error: 'Resource not found' }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      await expect(client.get('/api/nonexistent')).rejects.toMatchObject({
        message: 'HTTP 404: Not Found',
        status: 404,
      });
    });

    it('Should handle network errors', async () => {
      const networkError = new Error('Network request failed');
      mockFetch.mockRejectedValue(networkError);

      await expect(client.get('/api/test')).rejects.toMatchObject({
        message: 'Network request failed',
        isNetworkError: true,
      });
    });
  });

  describe('Circuit Breaker Interface', () => {
    it('Should provide circuit breaker stats when configured', () => {
      client = new FetchClient({
        circuitBreakerConfig: {
          failureThreshold: 2,
          recoveryTimeout: 1000,
          monitoringPeriod: 5000,
          halfOpenMaxCalls: 3,
        },
      });

      const stats = client.getCircuitBreakerStats();
      expect(stats).toBeDefined();
      expect(stats?.state).toBe(CircuitBreakerState.CLOSED);
    });

    it('Should return undefined when circuit breaker not configured', () => {
      client = new FetchClient();
      expect(client.getCircuitBreakerStats()).toBeUndefined();
    });
  });
});
