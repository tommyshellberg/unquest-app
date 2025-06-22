export const apiClient = {
  post: jest.fn(),
  get: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  patch: jest.fn(),
  interceptors: {
    request: { use: jest.fn() },
    response: { use: jest.fn() },
  },
  defaults: {
    baseURL: 'https://api.test.com',
    headers: { 'Content-Type': 'application/json' },
  },
};
