export const sampleUsers = [
  { id: 1, name: 'John Doe', email: 'john@example.com' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com' },
  { id: 3, name: 'Bob Johnson', email: 'bob@example.com' },
];

export const sampleUser = {
  id: 1,
  name: 'John Doe',
  email: 'john@example.com',
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2023-01-01T00:00:00Z',
};

export const samplePosts = [
  {
    id: 1,
    title: 'First Post',
    content: 'This is the first post',
    userId: 1,
  },
  {
    id: 2,
    title: 'Second Post',
    content: 'This is the second post',
    userId: 2,
  },
];

export const sampleError = {
  message: 'Resource not found',
  code: 'NOT_FOUND',
  details: 'The requested resource does not exist',
};

export const sampleApiResponse = {
  data: sampleUsers,
  status: 200,
  statusText: 'OK',
  headers: {
    'content-type': 'application/json',
    'x-total-count': '3',
  },
};

export const sampleApiError = {
  message: 'Internal Server Error',
  status: 500,
  statusText: 'Internal Server Error',
  response: {
    data: { error: 'Something went wrong' },
    status: 500,
    statusText: 'Internal Server Error',
    headers: {},
  },
};
