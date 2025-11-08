import { useLocalSearchParams } from 'expo-router';
import React from 'react';

import { cleanup, screen, setup } from '@/lib/test-utils';

import Login from './login';

// Mock expo-router
jest.mock('expo-router', () => ({
  useLocalSearchParams: jest.fn(),
  Redirect: ({ href }: { href: string }) => {
    const { View } = require('react-native');
    return <View testID="redirect" accessibilityHint={href} />;
  },
}));

// Mock the LoginForm component
jest.mock('@/components/login-form', () => ({
  LoginForm: ({ initialError }: { initialError?: string | null }) => {
    const { View, Text } = require('react-native');
    return (
      <View testID="login-form">
        {initialError && <Text testID="initial-error">{initialError}</Text>}
      </View>
    );
  },
}));

// Mock FocusAwareStatusBar
jest.mock('@/components/ui', () => ({
  FocusAwareStatusBar: () => {
    const { View } = require('react-native');
    return <View testID="status-bar" />;
  },
}));

// Mock useAuth
const mockUseAuth = jest.fn();
jest.mock('@/lib', () => ({
  useAuth: () => mockUseAuth(),
}));

afterEach(() => {
  cleanup();
  jest.clearAllMocks();
});

describe('Login Screen', () => {
  beforeEach(() => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({});
    mockUseAuth.mockReturnValue({ status: 'signOut' });
  });

  it('renders LoginForm when user is not authenticated', () => {
    mockUseAuth.mockReturnValue({ status: 'signOut' });

    setup(<Login />);

    expect(screen.getByTestId('login-form')).toBeOnTheScreen();
    expect(screen.getByTestId('status-bar')).toBeOnTheScreen();
  });

  it('redirects to home when user is already authenticated', () => {
    mockUseAuth.mockReturnValue({ status: 'signIn' });

    setup(<Login />);

    const redirect = screen.getByTestId('redirect');
    expect(redirect).toBeOnTheScreen();
    expect(redirect.props.accessibilityHint).toBe('/');
  });

  it('passes error from URL params to LoginForm', () => {
    const errorMessage = 'Magic link expired';
    (useLocalSearchParams as jest.Mock).mockReturnValue({
      error: encodeURIComponent(errorMessage),
    });

    setup(<Login />);

    expect(screen.getByTestId('login-form')).toBeOnTheScreen();
    expect(screen.getByText(errorMessage)).toBeOnTheScreen();
  });

  it('handles missing error param gracefully', () => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({});

    setup(<Login />);

    expect(screen.getByTestId('login-form')).toBeOnTheScreen();
    expect(screen.queryByTestId('initial-error')).not.toBeOnTheScreen();
  });

  it('decodes URL-encoded error message', () => {
    const errorMessage = 'Invalid magic link token';
    (useLocalSearchParams as jest.Mock).mockReturnValue({
      error: encodeURIComponent(errorMessage),
    });

    setup(<Login />);

    expect(screen.getByTestId('login-form')).toBeOnTheScreen();
    expect(screen.getByText(errorMessage)).toBeOnTheScreen();
  });
});
