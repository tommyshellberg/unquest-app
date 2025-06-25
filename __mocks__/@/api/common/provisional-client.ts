const { jest } = require('@jest/globals');

export const provisionalApiClient = {
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  patch: jest.fn(),
  delete: jest.fn(),
  request: jest.fn(),
  head: jest.fn(),
  options: jest.fn(),
  getUri: jest.fn(),
  defaults: {} as any,
  interceptors: {
    request: { use: jest.fn(), eject: jest.fn(), clear: jest.fn() } as any,
    response: { use: jest.fn(), eject: jest.fn(), clear: jest.fn() } as any,
  },
};

export default provisionalApiClient;