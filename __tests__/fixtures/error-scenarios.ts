export const networkError = {
  message: 'Network Error',
  isNetworkError: true,
};

export const timeoutError = {
  message: 'Request Timeout',
  isTimeoutError: true,
};

export const serverError500 = {
  message: 'Internal Server Error',
  status: 500,
  statusText: 'Internal Server Error',
  response: {
    data: { error: 'Internal Server Error' },
    status: 500,
    statusText: 'Internal Server Error',
    headers: {},
  },
};

export const serverError502 = {
  message: 'Bad Gateway',
  status: 502,
  statusText: 'Bad Gateway',
  response: {
    data: { error: 'Bad Gateway' },
    status: 502,
    statusText: 'Bad Gateway',
    headers: {},
  },
};

export const clientError404 = {
  message: 'Not Found',
  status: 404,
  statusText: 'Not Found',
  response: {
    data: { error: 'Resource not found' },
    status: 404,
    statusText: 'Not Found',
    headers: {},
  },
};

export const clientError401 = {
  message: 'Unauthorized',
  status: 401,
  statusText: 'Unauthorized',
  response: {
    data: { error: 'Authentication required' },
    status: 401,
    statusText: 'Unauthorized',
    headers: {},
  },
};

export const clientError403 = {
  message: 'Forbidden',
  status: 403,
  statusText: 'Forbidden',
  response: {
    data: { error: 'Access denied' },
    status: 403,
    statusText: 'Forbidden',
    headers: {},
  },
};
