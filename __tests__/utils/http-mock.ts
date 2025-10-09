export interface MockHttpResponse {
  data: unknown;
  status: number;
  statusText: string;
  headers: Record<string, string>;
}

export interface MockHttpError {
  message: string;
  status?: number;
  statusText?: string;
  response?: MockHttpResponse;
  isNetworkError?: boolean;
  isTimeoutError?: boolean;
}

export class HttpMock {
  private responses: Map<string, MockHttpResponse> = new Map();
  private errors: Map<string, MockHttpError> = new Map();
  private callCount: Map<string, number> = new Map();

  mockResponse(url: string, response: MockHttpResponse): void {
    this.responses.set(url, response);
  }

  mockError(url: string, error: MockHttpError): void {
    this.errors.set(url, error);
  }

  mockNetworkError(url: string): void {
    this.mockError(url, {
      message: 'Network Error',
      isNetworkError: true,
    });
  }

  mockTimeoutError(url: string): void {
    this.mockError(url, {
      message: 'Request Timeout',
      isTimeoutError: true,
    });
  }

  mockServerError(url: string, status = 500): void {
    this.mockError(url, {
      message: 'Internal Server Error',
      status,
      statusText: 'Internal Server Error',
      response: {
        data: { error: 'Internal Server Error' },
        status,
        statusText: 'Internal Server Error',
        headers: {},
      },
    });
  }

  getCallCount(url: string): number {
    return this.callCount.get(url) || 0;
  }

  incrementCallCount(url: string): void {
    const count = this.callCount.get(url) || 0;
    this.callCount.set(url, count + 1);
  }

  reset(): void {
    this.responses.clear();
    this.errors.clear();
    this.callCount.clear();
  }

  getResponse(url: string): MockHttpResponse | undefined {
    this.incrementCallCount(url);
    return this.responses.get(url);
  }

  getError(url: string): MockHttpError | undefined {
    this.incrementCallCount(url);
    return this.errors.get(url);
  }
}

export const httpMock = new HttpMock();
