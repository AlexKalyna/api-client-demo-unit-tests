import type {
  ApiResponse,
  ApiError,
  HttpClientConfig,
  RequestConfig,
  CircuitBreakerStats,
} from '@/types/index';
import {
  withRetry,
  createRetryConfig,
  CircuitBreaker,
  createCircuitBreakerConfig,
} from '@/utils/index';

export class FetchClient {
  private circuitBreaker?: CircuitBreaker;
  private retryConfig: ReturnType<typeof createRetryConfig>;

  constructor(private config: HttpClientConfig = {}) {
    this.retryConfig = createRetryConfig(config.retryConfig);

    if (config.circuitBreakerConfig) {
      this.circuitBreaker = new CircuitBreaker(
        createCircuitBreakerConfig(config.circuitBreakerConfig)
      );
    }
  }

  async request<T = unknown>(
    requestConfig: RequestConfig
  ): Promise<ApiResponse<T>> {
    const url = this.buildUrl(requestConfig.url);
    const options = this.buildRequestOptions(requestConfig);

    const executeRequest = async (): Promise<ApiResponse<T>> => {
      try {
        const response = await fetch(url, options);
        return await this.handleResponse<T>(response);
      } catch (error) {
        throw this.handleError(error);
      }
    };

    if (this.circuitBreaker) {
      return this.circuitBreaker.execute(executeRequest);
    }

    return withRetry(executeRequest, this.retryConfig);
  }

  async get<T = unknown>(
    url: string,
    params?: Record<string, string | number | boolean>
  ): Promise<ApiResponse<T>> {
    return this.request<T>({
      method: 'GET',
      url,
      ...(params && { params }),
    });
  }

  async post<T = unknown>(
    url: string,
    data?: unknown
  ): Promise<ApiResponse<T>> {
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

  async patch<T = unknown>(
    url: string,
    data?: unknown
  ): Promise<ApiResponse<T>> {
    return this.request<T>({
      method: 'PATCH',
      url,
      data,
    });
  }

  getCircuitBreakerStats(): CircuitBreakerStats | undefined {
    return this.circuitBreaker?.getStats();
  }

  resetCircuitBreaker(): void {
    this.circuitBreaker?.reset();
  }

  private buildUrl(
    url: string,
    params?: Record<string, string | number | boolean>
  ): string {
    let fullUrl = url;

    if (this.config.baseURL) {
      fullUrl = `${this.config.baseURL.replace(/\/$/, '')}/${url.replace(/^\//, '')}`;
    }

    if (params) {
      const urlObj = new URL(fullUrl);
      Object.entries(params).forEach(([key, value]) => {
        urlObj.searchParams.append(key, String(value));
      });
      fullUrl = urlObj.toString();
    }

    return fullUrl;
  }

  private buildRequestOptions(requestConfig: RequestConfig): RequestInit {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...this.config.headers,
      ...requestConfig.headers,
    };

    const options: RequestInit = {
      method: requestConfig.method,
      headers,
    };

    const signal = this.createAbortSignal(
      requestConfig.timeout || this.config.timeout
    );
    if (signal) {
      options.signal = signal;
    }

    if (requestConfig.data && requestConfig.method !== 'GET') {
      options.body = JSON.stringify(requestConfig.data);
    }

    return options;
  }

  private createAbortSignal(timeout?: number): AbortSignal | undefined {
    if (!timeout) return undefined;

    const controller = new AbortController();
    setTimeout(() => controller.abort(), timeout);
    return controller.signal;
  }

  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    const headers: Record<string, string> = {};
    response.headers.forEach((value: string, key: string) => {
      headers[key] = value;
    });

    let data: T;
    const contentType = response.headers.get('content-type');

    if (contentType?.includes('application/json')) {
      data = await response.json();
    } else {
      data = (await response.text()) as unknown as T;
    }

    if (!response.ok) {
      const error = new Error(
        `HTTP ${response.status}: ${response.statusText}`
      ) as ApiError;
      error.status = response.status;
      error.statusText = response.statusText;
      error.response = {
        data,
        status: response.status,
        statusText: response.statusText,
        headers,
      };
      throw error;
    }

    return {
      data,
      status: response.status,
      statusText: response.statusText,
      headers,
    };
  }

  private handleError(error: unknown): ApiError {
    if (error instanceof Error) {
      const apiError = error as ApiError;

      if (error.name === 'AbortError') {
        apiError.isTimeoutError = true;
        apiError.isNetworkError = false;
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
