import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import React from 'react';

import { verifyMagicLink } from '@/api/auth';
import { apiClient } from '@/api/common/client';
import { render, screen, waitFor } from '@/lib/test-utils';
import { useCharacterStore } from '@/store/character-store';
import { useUserStore } from '@/store/user-store';

import MagicLinkVerifyScreen from '../magiclink/verify';

// Mock the expo-router hooks
jest.mock('expo-router', () => ({
  useLocalSearchParams: jest.fn(),
  useRouter: jest.fn(() => ({
    replace: jest.fn(),
  })),
  useNavigation: jest.fn(() => ({
    setOptions: jest.fn(),
  })),
}));

// Mock the auth service
jest.mock('@/api/auth', () => ({
  verifyMagicLink: jest.fn(),
}));

// Mock the stores
jest.mock('@/store/character-store', () => ({
  useCharacterStore: jest.fn(),
}));

jest.mock('@/store/user-store', () => ({
  useUserStore: jest.fn(),
}));

// Mock the API client
jest.mock('@/api/common/client', () => ({
  apiClient: {
    get: jest.fn(),
  },
}));

describe('MagicLinkVerifyScreen', () => {
  // Setup common variables
  let mockReplace: jest.Mock;
  let mockCreateCharacter: jest.Mock;
  let mockSetUser: jest.Mock;

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();

    // Setup navigation mock
    const mockSetOptions = jest.fn();
    (useNavigation as jest.Mock).mockReturnValue({
      setOptions: mockSetOptions,
    });

    // Setup router mock
    mockReplace = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({
      replace: mockReplace,
    });

    // Setup character store mock
    mockCreateCharacter = jest.fn();
    (useCharacterStore as jest.Mock).mockImplementation((selector) => {
      // This simulates the selector function from zustand
      return selector({
        character: null,
        createCharacter: mockCreateCharacter,
        addXP: jest.fn(),
      });
    });

    // Setup user store mock with setUser function
    mockSetUser = jest.fn();
    (useUserStore as jest.Mock).mockImplementation((selector) =>
      selector({
        user: null,
        setUser: mockSetUser,
        updateUser: jest.fn(),
        clearUser: jest.fn(),
      })
    );
  });

  it('should show loading state initially', () => {
    // Mock params with a valid token
    (useLocalSearchParams as jest.Mock).mockReturnValue({
      token: 'valid-token',
    });

    // Mock successful verification (but don't resolve yet)
    (verifyMagicLink as jest.Mock).mockReturnValue(new Promise(() => {}));

    render(<MagicLinkVerifyScreen />);

    // Check that loading indicator is shown
    expect(screen.getByText('Verifying your login...')).toBeTruthy();
  });

  it('should redirect to onboarding with error when token is missing', async () => {
    // Mock params with no token
    (useLocalSearchParams as jest.Mock).mockReturnValue({});

    render(<MagicLinkVerifyScreen />);

    // Check that it redirects to onboarding with error
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith(
        expect.stringContaining('/onboarding?error=')
      );
      expect(mockReplace.mock.calls[0][0]).toContain('No%20token%20found');
    });
  });

  it('should redirect to onboarding with error when token verification fails', async () => {
    // Mock params with a token
    (useLocalSearchParams as jest.Mock).mockReturnValue({
      token: 'invalid-token',
    });

    // Mock failed verification
    (verifyMagicLink as jest.Mock).mockRejectedValue(
      new Error('Verification failed')
    );

    render(<MagicLinkVerifyScreen />);

    // Check that it redirects to onboarding with error
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith(
        expect.stringContaining('/onboarding?error=')
      );
      expect(mockReplace.mock.calls[0][0]).toContain(
        'Magic%20link%20verification%20failed'
      );
    });
  });

  it('should redirect to onboarding when user has no data', async () => {
    // Mock params with a valid token
    (useLocalSearchParams as jest.Mock).mockReturnValue({
      token: 'valid-token',
    });

    // Mock successful verification
    const mockTokens = {
      access: { token: 'access-token', expires: '2023-12-31' },
      refresh: { token: 'refresh-token', expires: '2024-01-31' },
    };
    (verifyMagicLink as jest.Mock).mockResolvedValue(mockTokens);

    // Mock API response with no character data
    (apiClient.get as jest.Mock).mockResolvedValue({
      data: { id: '123', email: 'test@example.com' },
    });

    render(<MagicLinkVerifyScreen />);

    // Check that it redirects to app-introduction
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/onboarding');
      // Verify that setUser was called
      expect(mockSetUser).toHaveBeenCalledWith(
        expect.objectContaining({
          id: '123',
          email: 'test@example.com',
        })
      );
    });

    // Verify that verifyMagicLink was called with the correct token
    expect(verifyMagicLink).toHaveBeenCalledWith('valid-token');
  });

  it('should redirect to home when user has complete character data on server', async () => {
    // Mock params with a valid token
    (useLocalSearchParams as jest.Mock).mockReturnValue({
      token: 'valid-token',
    });

    // Mock successful verification
    const mockTokens = {
      access: { token: 'access-token', expires: '2023-12-31' },
      refresh: { token: 'refresh-token', expires: '2024-01-31' },
    };
    (verifyMagicLink as jest.Mock).mockResolvedValue(mockTokens);

    // Mock API response with complete character data
    const mockCharacter = { name: 'TestChar', type: 'wizard' };
    (apiClient.get as jest.Mock).mockResolvedValue({
      data: {
        id: '123',
        email: 'test@example.com',
        character: mockCharacter,
      },
    });

    render(<MagicLinkVerifyScreen />);

    // Check that it redirects to home and creates character
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/(app)/');
      expect(mockCreateCharacter).toHaveBeenCalledWith(
        mockCharacter.type,
        mockCharacter.name
      );
      // Verify that setUser was called with the correct data
      expect(mockSetUser).toHaveBeenCalledWith(
        expect.objectContaining({
          id: '123',
          email: 'test@example.com',
        })
      );
    });
  });

  it('should redirect to onboarding when user has incomplete character data', async () => {
    // Mock params with a valid token
    (useLocalSearchParams as jest.Mock).mockReturnValue({
      token: 'valid-token',
    });

    // Mock successful verification
    const mockTokens = {
      access: { token: 'access-token', expires: '2023-12-31' },
      refresh: { token: 'refresh-token', expires: '2024-01-31' },
    };
    (verifyMagicLink as jest.Mock).mockResolvedValue(mockTokens);

    // Mock API response with incomplete character data (missing type)
    (apiClient.get as jest.Mock).mockResolvedValue({
      data: {
        id: '123',
        email: 'test@example.com',
        character: { name: 'TestChar' }, // Missing type
      },
    });

    render(<MagicLinkVerifyScreen />);

    // Check that it redirects to onboarding
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/onboarding');
      // Verify that setUser was called
      expect(mockSetUser).toHaveBeenCalledWith(
        expect.objectContaining({
          id: '123',
          email: 'test@example.com',
        })
      );
    });
  });

  it('should redirect to home when user has local character data', async () => {
    // Mock params with a valid token
    (useLocalSearchParams as jest.Mock).mockReturnValue({
      token: 'valid-token',
    });

    // Mock successful verification
    const mockTokens = {
      access: { token: 'access-token', expires: '2023-12-31' },
      refresh: { token: 'refresh-token', expires: '2024-01-31' },
    };
    (verifyMagicLink as jest.Mock).mockResolvedValue(mockTokens);

    // Mock character store with existing data
    (useCharacterStore as jest.Mock).mockImplementation((selector) => {
      return selector({
        character: {
          name: 'LocalChar',
          type: 'warrior',
          level: 1,
          currentXP: 0,
          xpToNextLevel: 100,
        },
        createCharacter: mockCreateCharacter,
        addXP: jest.fn(),
      });
    });

    render(<MagicLinkVerifyScreen />);

    // Check that it redirects to home without API call
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/(app)/');
      expect(apiClient.get).not.toHaveBeenCalled();
    });
  });

  it('should redirect to onboarding when API call fails', async () => {
    // Mock params with a valid token
    (useLocalSearchParams as jest.Mock).mockReturnValue({
      token: 'valid-token',
    });

    // Mock successful verification
    const mockTokens = {
      access: { token: 'access-token', expires: '2023-12-31' },
      refresh: { token: 'refresh-token', expires: '2024-01-31' },
    };
    (verifyMagicLink as jest.Mock).mockResolvedValue(mockTokens);

    // Mock API call failure
    (apiClient.get as jest.Mock).mockRejectedValue(new Error('API error'));

    render(<MagicLinkVerifyScreen />);

    // Check that it redirects to app-introduction
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/onboarding');
    });
  });
});
