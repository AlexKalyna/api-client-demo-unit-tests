import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AxiosClient } from '@/clients/axios-client';
import { CircuitBreakerState } from '@/types/index';

// Mock axios instance
const mockAxiosInstance = {
  request: vi.fn(),
  interceptors: {
    request: { use: vi.fn() },
    response: { use: vi.fn() },
  },
};

// Mock axios
vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => mockAxiosInstance),
    isAxiosError: vi.fn(),
  },
  create: vi.fn(() => mockAxiosInstance),
  isAxiosError: vi.fn(),
}));

import axios from 'axios';
const mockedAxios = vi.mocked(axios);

describe('AxiosClient', () => {
  let client: AxiosClient;

  beforeEach(() => {
    vi.clearAllMocks();
    mockAxiosInstance.request.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Basic HTTP Methods', () => {
    beforeEach(() => {
      client = new AxiosClient();
    });

    it('Should make GET request successfully', async () => {
      const mockResponse = {
        data: { message: 'success' },
        status: 200,
        statusText: 'OK',
        headers: { 'content-type': 'application/json' },
      };
      mockAxiosInstance.request.mockResolvedValue(mockResponse);

      const result = await client.get('/api/test');

      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'get',
        url: '/api/test',
      });
      expect(result.data).toEqual({ message: 'success' });
      expect(result.status).toBe(200);
    });

    it('Should make POST request with data', async () => {
      const mockResponse = {
        data: { id: 1, name: 'test' },
        status: 201,
        statusText: 'Created',
        headers: { 'content-type': 'application/json' },
      };
      mockAxiosInstance.request.mockResolvedValue(mockResponse);

      const postData = { name: 'test', email: 'test@example.com' };
      const result = await client.post('/api/users', postData);

      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'post',
        url: '/api/users',
        data: postData,
      });
      expect(result.data).toEqual({ id: 1, name: 'test' });
    });
  });

  describe('Client Configuration', () => {
    it('Should use baseURL when provided', async () => {
      const mockResponse = {
        data: { message: 'success' },
        status: 200,
        statusText: 'OK',
        headers: { 'content-type': 'application/json' },
      };
      mockAxiosInstance.request.mockResolvedValue(mockResponse);

      client = new AxiosClient({ baseURL: 'https://api.example.com' });
      await client.get('/users');

      expect(mockedAxios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          baseURL: 'https://api.example.com',
        })
      );
    });

    it('Should merge default and custom headers', async () => {
      const mockResponse = {
        data: { message: 'success' },
        status: 200,
        statusText: 'OK',
        headers: { 'content-type': 'application/json' },
      };
      mockAxiosInstance.request.mockResolvedValue(mockResponse);

      client = new AxiosClient({
        headers: { 'X-API-Key': 'secret' },
      });
      await client.get('/test');

      expect(mockedAxios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': 'secret',
          },
        })
      );
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      client = new AxiosClient();
    });

    it('Should handle HTTP error responses', async () => {
      const axiosError = {
        isAxiosError: true,
        message: 'Request failed with status code 404',
        response: {
          data: { error: 'Resource not found' },
          status: 404,
          statusText: 'Not Found',
          headers: { 'content-type': 'application/json' },
        },
      };
      mockAxiosInstance.request.mockRejectedValue(axiosError);
      (mockedAxios.isAxiosError as any).mockReturnValue(true);

      await expect(client.get('/api/nonexistent')).rejects.toMatchObject({
        message: 'Request failed with status code 404',
        status: 404,
        statusText: 'Not Found',
        isNetworkError: false,
      });
    });

    it('Should handle network errors', async () => {
      const axiosError = {
        isAxiosError: true,
        message: 'Network Error',
        request: {},
      };
      mockAxiosInstance.request.mockRejectedValue(axiosError);
      (mockedAxios.isAxiosError as any).mockReturnValue(true);

      await expect(client.get('/api/test')).rejects.toMatchObject({
        message: 'Network Error',
        isNetworkError: true,
        isTimeoutError: false,
      });
    });
  });

  describe('Circuit Breaker Interface', () => {
    it('Should provide circuit breaker stats when configured', () => {
      client = new AxiosClient({
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
      client = new AxiosClient();
      expect(client.getCircuitBreakerStats()).toBeUndefined();
    });
  });
});
