// react-hook form setup for testing
// @ts-ignore
global.window = {};
// @ts-ignore
global.window = global;

jest.mock('@dev-plugins/react-query', () => ({
  useReactQueryDevTools: jest.fn(),
}));
