import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import axios from 'axios';

import { verifyMagicLinkAndSignIn } from '@/api/auth';
import { signOut } from '@/lib/auth';
import { render, screen, waitFor } from '@/lib/test-utils';

import MagicLinkVerifyScreen from './verify';

// Mock the expo-router hooks
jest.mock('expo-router', () => ({
  useLocalSearchParams: jest.fn(),
  useRouter: jest.fn(() => ({
    replace: jest.fn(),
  })),
}));

// Mock the auth service
jest.mock('@/api/auth', () => ({
  verifyMagicLinkAndSignIn: jest.fn(),
}));

// Mock the auth functions
jest.mock('@/lib/auth', () => ({
  signOut: jest.fn(),
}));

// Mock axios
jest.mock('axios');

describe('MagicLinkVerifyScreen', () => {
  let mockReplace: jest.Mock;

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();

    // Setup router mock
    mockReplace = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({
      replace: mockReplace,
    });
  });

  it('should show loading state initially', () => {
    // Mock params with a valid token
    (useLocalSearchParams as jest.Mock).mockReturnValue({
      token: 'valid-token',
    });

    // Mock verification that doesn't resolve immediately
    (verifyMagicLinkAndSignIn as jest.Mock).mockReturnValue(
      new Promise(() => {})
    );

    render(<MagicLinkVerifyScreen />);

    // Check that loading indicator is shown
    expect(screen.getByText('Verifying your login...')).toBeTruthy();
  });

  it('should redirect to login with error when token is missing', async () => {
    // Mock params with no token
    (useLocalSearchParams as jest.Mock).mockReturnValue({});

    render(<MagicLinkVerifyScreen />);

    // Check that it redirects to login with error
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith({
        pathname: '/login',
        params: { error: 'No token found. Please try again.' },
      });
    });
  });

  it('should redirect to app when verification returns app target', async () => {
    // Mock params with a valid token
    (useLocalSearchParams as jest.Mock).mockReturnValue({
      token: 'valid-token',
    });

    // Mock successful verification that returns 'app'
    (verifyMagicLinkAndSignIn as jest.Mock).mockResolvedValue('app');

    render(<MagicLinkVerifyScreen />);

    // Check that it redirects to app
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/(app)/');
    });

    // Verify that verifyMagicLinkAndSignIn was called with the correct token
    expect(verifyMagicLinkAndSignIn).toHaveBeenCalledWith('valid-token');
  });

  it('should redirect to onboarding when verification returns onboarding target', async () => {
    // Mock params with a valid token
    (useLocalSearchParams as jest.Mock).mockReturnValue({
      token: 'valid-token',
    });

    // Mock successful verification that returns 'onboarding'
    (verifyMagicLinkAndSignIn as jest.Mock).mockResolvedValue('onboarding');

    render(<MagicLinkVerifyScreen />);

    // Check that it redirects to onboarding
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/onboarding');
    });

    // Verify that verifyMagicLinkAndSignIn was called with the correct token
    expect(verifyMagicLinkAndSignIn).toHaveBeenCalledWith('valid-token');
  });

  it('should handle verification failure and redirect to login', async () => {
    // Mock params with a token
    (useLocalSearchParams as jest.Mock).mockReturnValue({
      token: 'invalid-token',
    });

    // Mock failed verification
    (verifyMagicLinkAndSignIn as jest.Mock).mockRejectedValue(
      new Error('Verification failed')
    );

    render(<MagicLinkVerifyScreen />);

    // Check that it signs out
    await waitFor(() => {
      expect(signOut).toHaveBeenCalled();
    });

    // Check that it redirects to login with error
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith({
        pathname: '/login',
        params: {
          error:
            'Magic link verification failed. The link may have expired. Please try again.',
        },
      });
    });
  });

  it('should show error message when verification fails', async () => {
    // Mock params with a token
    (useLocalSearchParams as jest.Mock).mockReturnValue({
      token: 'invalid-token',
    });

    // Mock failed verification
    (verifyMagicLinkAndSignIn as jest.Mock).mockRejectedValue(
      new Error('Verification failed')
    );

    render(<MagicLinkVerifyScreen />);

    // Wait for error message to be shown
    await waitFor(() => {
      expect(screen.getByText(/Magic link verification failed/)).toBeTruthy();
    });

    // Wait for redirect message to be shown
    await waitFor(() => {
      expect(screen.getByText('Redirecting to login...')).toBeTruthy();
    });
  });

  it('should show specific error message for 409 email already in use', async () => {
    // Mock params with a token
    (useLocalSearchParams as jest.Mock).mockReturnValue({
      token: 'provisional-token',
    });

    // Mock 409 error (email already in use)
    const axiosError = {
      response: {
        status: 409,
        data: { message: 'mail address is already in use by another account' },
      },
      isAxiosError: true,
    };
    
    // Mock axios.isAxiosError to return true for our mock error
    (axios.isAxiosError as jest.Mock).mockReturnValue(true);
    
    (verifyMagicLinkAndSignIn as jest.Mock).mockRejectedValue(axiosError);

    render(<MagicLinkVerifyScreen />);

    // Check that it signs out
    await waitFor(() => {
      expect(signOut).toHaveBeenCalled();
    });

    // Check that it redirects to login with specific 409 error message
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith({
        pathname: '/login',
        params: {
          error: 'This email address is already associated with an account. Please use a different email address.',
        },
      });
    });

    // Wait for specific error message to be shown
    await waitFor(() => {
      expect(screen.getByText(/This email address is already associated with an account/)).toBeTruthy();
    });
  });
});
