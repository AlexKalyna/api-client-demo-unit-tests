import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios';
import type {
  ApiResponse,
  ApiError,
  HttpClientConfig,
  RequestConfig,
} from '../types/index.js';
import { withRetry, createRetryConfig, CircuitBreaker, createCircuitBreakerConfig } from '../utils/index.js';

export class AxiosClient {
  private axiosInstance: AxiosInstance;
  private circuitBreaker?: CircuitBreaker;
  private retryConfig: ReturnType<typeof createRetryConfig>;

  constructor(config: HttpClientConfig = {}) {
    this.retryConfig = createRetryConfig(config.retryConfig);

    if (config.circuitBreakerConfig) {
      this.circuitBreaker = new CircuitBreaker(
        createCircuitBreakerConfig(config.circuitBreakerConfig),
      );
    }

    const axiosConfig: any = {
      timeout: config.timeout || 10000,
      headers: {
        'Content-Type': 'application/json',
        ...config.headers,
      },
    };

    if (config.baseURL) {
      axiosConfig.baseURL = config.baseURL;
    }

    this.axiosInstance = axios.create(axiosConfig);

    this.axiosInstance.interceptors.request.use(
      (config) => config,
      (error) => Promise.reject(this.convertAxiosError(error)),
    );

    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error) => Promise.reject(this.convertAxiosError(error)),
    );
  }

  async request<T = unknown>(requestConfig: RequestConfig): Promise<ApiResponse<T>> {
    const axiosConfig = this.buildAxiosConfig(requestConfig);

    const executeRequest = async (): Promise<ApiResponse<T>> => {
      try {
        const response: AxiosResponse<T> = await this.axiosInstance.request(axiosConfig);
        return this.convertAxiosResponse(response);
      } catch (error) {
        throw this.convertAxiosError(error);
      }
    };

    if (this.circuitBreaker) {
      return this.circuitBreaker.execute(executeRequest);
    }

    return withRetry(executeRequest, this.retryConfig);
  }

  async get<T = unknown>(
    url: string,
    params?: Record<string, string | number | boolean>,
  ): Promise<ApiResponse<T>> {
    return this.request<T>({
      method: 'GET',
      url,
      ...(params && { params }),
    });
  }

  async post<T = unknown>(url: string, data?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>({
      method: 'POST',
      url,
      data,
    });
  }

  async put<T = unknown>(url: string, data?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>({
      method: 'PUT',
      url,
      data,
    });
  }

  async delete<T = unknown>(url: string): Promise<ApiResponse<T>> {
    return this.request<T>({
      method: 'DELETE',
      url,
    });
  }

  async patch<T = unknown>(url: string, data?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>({
      method: 'PATCH',
      url,
      data,
    });
  }

  getCircuitBreakerStats() {
    return this.circuitBreaker?.getStats();
  }

  resetCircuitBreaker(): void {
    this.circuitBreaker?.reset();
  }

  getAxiosInstance(): AxiosInstance {
    return this.axiosInstance;
  }

  private buildAxiosConfig(requestConfig: RequestConfig): AxiosRequestConfig {
    const config: any = {
      method: requestConfig.method.toLowerCase(),
      url: requestConfig.url,
    };

    if (requestConfig.headers) {
      config.headers = requestConfig.headers;
    }

    if (requestConfig.timeout) {
      config.timeout = requestConfig.timeout;
    }

    if (requestConfig.params) {
      config.params = requestConfig.params;
    }

    if (requestConfig.data) {
      config.data = requestConfig.data;
    }

    return config;
  }

  private convertAxiosResponse<T>(response: AxiosResponse<T>): ApiResponse<T> {
    return {
      data: response.data,
      status: response.status,
      statusText: response.statusText,
      headers: response.headers as Record<string, string>,
    };
  }

  private convertAxiosError(error: unknown): ApiError {
    if (axios.isAxiosError(error)) {
      const apiError = new Error(error.message) as ApiError;

      if (error.response) {
        apiError.status = error.response.status;
        apiError.statusText = error.response.statusText;
        apiError.response = {
          data: error.response.data,
          status: error.response.status,
          statusText: error.response.statusText,
          headers: error.response.headers as Record<string, string>,
        };
        apiError.isNetworkError = false;
        apiError.isTimeoutError = false;
      } else if (error.request) {
        apiError.isNetworkError = true;
        apiError.isTimeoutError = error.code === 'ECONNABORTED';
      } else {
        apiError.isNetworkError = true;
        apiError.isTimeoutError = false;
      }

      return apiError;
    }

    const apiError = new Error('Unknown error occurred') as ApiError;
    apiError.isNetworkError = true;
    return apiError;
  }
}