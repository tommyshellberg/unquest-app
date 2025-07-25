import Constants from 'expo-constants';
import { OneSignal } from 'react-native-onesignal';

import { storeTokens } from '@/api/token';
import { getUserDetails } from '@/lib/services/user';
import { useUserStore } from '@/store/user-store';
import { useCharacterStore } from '@/store/character-store';

import { useAuth } from './index';
import { getToken, removeToken, setToken } from './utils';

// Mock all dependencies
jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    expoConfig: {
      extra: {},
    },
  },
}));

jest.mock('react-native-onesignal', () => ({
  OneSignal: {
    logout: jest.fn(),
    login: jest.fn(),
    User: {
      getExternalId: jest.fn(),
    },
  },
}));

jest.mock('@/api/token', () => ({
  storeTokens: jest.fn(),
}));

jest.mock('@/lib/services/user', () => ({
  getUserDetails: jest.fn(),
}));

jest.mock('@/store/user-store', () => ({
  useUserStore: {
    getState: jest.fn(() => ({
      setUser: jest.fn(),
      clearUser: jest.fn(),
    })),
  },
}));

// Mock the character store module
jest.mock('@/store/character-store', () => {
  const mockCreateCharacter = jest.fn();
  const mockUpdateCharacter = jest.fn();
  const mockSetStreak = jest.fn();
  const mockGetState = jest.fn(() => ({
    character: null,
    createCharacter: mockCreateCharacter,
    updateCharacter: mockUpdateCharacter,
    setStreak: mockSetStreak,
  }));

  return {
    useCharacterStore: {
      getState: mockGetState,
    },
    __mocks: {
      mockCreateCharacter,
      mockUpdateCharacter,
      mockSetStreak,
      mockGetState,
    },
  };
});

jest.mock('./utils', () => ({
  getToken: jest.fn(),
  removeToken: jest.fn(),
  setToken: jest.fn(),
}));

// Get references to the mocks
const characterStoreMocks = require('@/store/character-store').__mocks;

// Mock timers
beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks();

  // Reset mock functions
  characterStoreMocks.mockCreateCharacter.mockClear();
  characterStoreMocks.mockUpdateCharacter.mockClear();
  characterStoreMocks.mockSetStreak.mockClear();

  // Reset character store to default state
  characterStoreMocks.mockGetState.mockReturnValue({
    character: null,
    createCharacter: characterStoreMocks.mockCreateCharacter,
    updateCharacter: characterStoreMocks.mockUpdateCharacter,
    setStreak: characterStoreMocks.mockSetStreak,
  });
});

afterEach(() => {
  jest.useRealTimers();
  jest.clearAllMocks();
  // Reset the store
  useAuth.setState({
    status: 'idle',
    token: null,
  });
  // Reset global state
  (global as any).isOneSignalInitialized = false;
});

describe('Auth Store', () => {
  describe('signIn', () => {
    it('should sign in user and set token', () => {
      const loginResponse = {
        token: {
          access: 'access-token',
          refresh: 'refresh-token',
        },
      };

      useAuth.getState().signIn(loginResponse);

      expect(setToken).toHaveBeenCalledWith({
        access: 'access-token',
        refresh: 'refresh-token',
      });

      const state = useAuth.getState();
      expect(state.status).toBe('signIn');
      expect(state.token).toEqual({
        access: 'access-token',
        refresh: 'refresh-token',
      });
    });
  });

  describe('signOut', () => {
    it('should sign out user and clear token', () => {
      const mockClearUser = jest.fn();
      (useUserStore.getState as jest.Mock).mockReturnValue({
        clearUser: mockClearUser,
      });

      useAuth.getState().signOut();

      expect(removeToken).toHaveBeenCalled();
      expect(mockClearUser).toHaveBeenCalled();

      const state = useAuth.getState();
      expect(state.status).toBe('signOut');
      expect(state.token).toBeNull();
    });

    it('should logout from OneSignal when initialized', async () => {
      (global as any).isOneSignalInitialized = true;
      const mockClearUser = jest.fn();
      (useUserStore.getState as jest.Mock).mockReturnValue({
        clearUser: mockClearUser,
      });

      useAuth.getState().signOut();

      expect(OneSignal.logout).toHaveBeenCalled();

      // Fast-forward timers to trigger the setTimeout callback
      jest.advanceTimersByTime(1000);
      await Promise.resolve(); // Let promises resolve

      expect(OneSignal.User.getExternalId).toHaveBeenCalled();
    });

    it('should handle OneSignal logout errors gracefully', () => {
      (global as any).isOneSignalInitialized = true;
      (OneSignal.logout as jest.Mock).mockImplementation(() => {
        throw new Error('OneSignal error');
      });

      const mockClearUser = jest.fn();
      (useUserStore.getState as jest.Mock).mockReturnValue({
        clearUser: mockClearUser,
      });

      // Should not throw
      expect(() => useAuth.getState().signOut()).not.toThrow();
      expect(removeToken).toHaveBeenCalled();
    });
  });

  describe('hydrate', () => {
    it('should hydrate when token exists and user details fetch succeeds', async () => {
      const mockToken = { access: 'stored-token', refresh: 'stored-refresh' };
      const mockUser = {
        id: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
        dailyQuestStreak: 5,
      };

      (getToken as jest.Mock).mockReturnValue(mockToken);
      (getUserDetails as jest.Mock).mockResolvedValue(mockUser);

      const mockSetUser = jest.fn();
      (useUserStore.getState as jest.Mock).mockReturnValue({
        setUser: mockSetUser,
        clearUser: jest.fn(),
      });

      await useAuth.getState().hydrate();

      expect(getToken).toHaveBeenCalled();
      expect(getUserDetails).toHaveBeenCalled();
      expect(mockSetUser).toHaveBeenCalledWith(mockUser);

      const state = useAuth.getState();
      expect(state.status).toBe('signIn');
      expect(state.token).toEqual(mockToken);
    });

    it('should link OneSignal when user has ID and OneSignal is initialized', async () => {
      (global as any).isOneSignalInitialized = true;
      const mockUser = { id: 'user-456' };

      (getToken as jest.Mock).mockReturnValue({ access: 'token' });
      (getUserDetails as jest.Mock).mockResolvedValue(mockUser);
      (OneSignal.User.getExternalId as jest.Mock).mockResolvedValue('user-456');

      await useAuth.getState().hydrate();

      expect(OneSignal.login).toHaveBeenCalledWith('user-456');

      // Fast-forward timers to trigger the setTimeout callback
      jest.advanceTimersByTime(1000);
      await Promise.resolve(); // Let promises resolve

      expect(OneSignal.User.getExternalId).toHaveBeenCalled();
    });

    it('should sync character data when available', async () => {
      const mockUser = {
        id: 'user-123',
        character: {
          type: 'warrior',
          name: 'TestChar',
          level: 5,
          currentXP: 250,
        },
        dailyQuestStreak: 10,
      };

      (getToken as jest.Mock).mockReturnValue({ access: 'token' });
      (getUserDetails as jest.Mock).mockResolvedValue(mockUser);

      // Reset the character store state for this test
      characterStoreMocks.mockGetState.mockReturnValue({
        character: null,
        createCharacter: characterStoreMocks.mockCreateCharacter,
        updateCharacter: characterStoreMocks.mockUpdateCharacter,
        setStreak: characterStoreMocks.mockSetStreak,
      });

      await useAuth.getState().hydrate();

      expect(characterStoreMocks.mockCreateCharacter).toHaveBeenCalledWith(
        'warrior',
        'TestChar'
      );
      expect(characterStoreMocks.mockUpdateCharacter).toHaveBeenCalledWith({
        type: 'warrior',
        name: 'TestChar',
        level: 5,
        currentXP: 250,
      });
      expect(characterStoreMocks.mockSetStreak).toHaveBeenCalledWith(10);
    });

    it('should handle character data in legacy format', async () => {
      const mockUser = {
        id: 'user-123',
        type: 'druid',
        name: 'LegacyChar',
        level: 3,
        xp: 150,
      };

      (getToken as jest.Mock).mockReturnValue({ access: 'token' });
      (getUserDetails as jest.Mock).mockResolvedValue(mockUser);

      // Reset the character store state for this test
      characterStoreMocks.mockGetState.mockReturnValue({
        character: null,
        createCharacter: characterStoreMocks.mockCreateCharacter,
        updateCharacter: characterStoreMocks.mockUpdateCharacter,
        setStreak: characterStoreMocks.mockSetStreak,
      });

      await useAuth.getState().hydrate();

      expect(characterStoreMocks.mockCreateCharacter).toHaveBeenCalledWith(
        'druid',
        'LegacyChar'
      );
      expect(characterStoreMocks.mockUpdateCharacter).toHaveBeenCalledWith({
        type: 'druid',
        name: 'LegacyChar',
        level: 3,
        currentXP: 150,
      });
    });

    it('should sign out when no token exists', async () => {
      (getToken as jest.Mock).mockReturnValue(null);

      const signOutSpy = jest.spyOn(useAuth.getState(), 'signOut');

      await useAuth.getState().hydrate();

      expect(signOutSpy).toHaveBeenCalled();
      expect(getUserDetails).not.toHaveBeenCalled();
    });

    it('should sign out when user details fetch fails', async () => {
      (getToken as jest.Mock).mockReturnValue({ access: 'token' });
      (getUserDetails as jest.Mock).mockRejectedValue(
        new Error('Network error')
      );

      const signOutSpy = jest.spyOn(useAuth.getState(), 'signOut');

      await useAuth.getState().hydrate();

      expect(getUserDetails).toHaveBeenCalled();
      expect(signOutSpy).toHaveBeenCalled();
    });

    it('should handle hydration errors gracefully', async () => {
      (getToken as jest.Mock).mockImplementation(() => {
        throw new Error('Storage error');
      });

      const signOutSpy = jest.spyOn(useAuth.getState(), 'signOut');

      await useAuth.getState().hydrate();

      expect(signOutSpy).toHaveBeenCalled();
    });

    it('should use maestro tokens in development when available', async () => {
      const maestroToken = 'maestro-access-token';
      const maestroRefresh = 'maestro-refresh-token';

      // Set up the environment
      (global as any).__DEV__ = true;
      Constants.expoConfig!.extra = {
        maestroAccessToken: maestroToken,
        maestroRefreshToken: maestroRefresh,
      };

      (getToken as jest.Mock).mockReturnValue({ access: maestroToken });
      (getUserDetails as jest.Mock).mockResolvedValue({ id: 'test-user' });

      await useAuth.getState().hydrate();

      expect(storeTokens).toHaveBeenCalledWith({
        access: {
          token: maestroToken,
          expires: expect.any(String),
        },
        refresh: {
          token: maestroRefresh,
          expires: expect.any(String),
        },
      });
    });

    it('should not create character if it already exists locally', async () => {
      const mockUser = {
        id: 'user-123',
        character: {
          type: 'warrior',
          name: 'TestChar',
          level: 5,
          currentXP: 250,
        },
      };

      (getToken as jest.Mock).mockReturnValue({ access: 'token' });
      (getUserDetails as jest.Mock).mockResolvedValue(mockUser);

      // Set character already exists
      characterStoreMocks.mockGetState.mockReturnValue({
        character: { type: 'warrior', name: 'ExistingChar' }, // Character already exists
        createCharacter: characterStoreMocks.mockCreateCharacter,
        updateCharacter: characterStoreMocks.mockUpdateCharacter,
        setStreak: characterStoreMocks.mockSetStreak,
      });

      await useAuth.getState().hydrate();

      expect(characterStoreMocks.mockCreateCharacter).not.toHaveBeenCalled();
      expect(characterStoreMocks.mockUpdateCharacter).toHaveBeenCalled();
    });
  });
});
