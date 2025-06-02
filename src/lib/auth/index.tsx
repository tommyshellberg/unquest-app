import Constants from 'expo-constants';
import { create } from 'zustand';

import { storeTokens } from '@/api/token';
import { getUserDetails } from '@/lib/services/user';
import { useUserStore } from '@/store/user-store';

import { createSelectors } from '../utils';
import type { TokenType, UserLoginResponse } from './utils';
import { getToken, removeToken, setToken } from './utils';

interface AuthState {
  token: TokenType | null;
  status: 'idle' | 'signOut' | 'signIn' | 'hydrating';
  signIn: (data: UserLoginResponse) => void;
  signOut: () => void;
  hydrate: () => Promise<void>;
}

const _useAuth = create<AuthState>((set, get) => ({
  status: 'idle',
  token: null,
  signIn: async (response) => {
    const { token, user } = response;
    // @todo: why are we calling setToken instead of storeTokens?
    console.log('signing in with token', token);
    setToken(token);

    // Always fetch fresh user details after sign in
    try {
      // Use existing user data if available, but then fetch fresh data
      if (user) {
        useUserStore.getState().setUser(user);
      }

      // Fetch fresh user details regardless
      const freshUserDetails = await getUserDetails();
      useUserStore.getState().setUser(freshUserDetails);
    } catch (error) {
      console.error('Failed to fetch user details after login:', error);
    }

    set({ status: 'signIn', token });
  },
  signOut: () => {
    removeToken();
    useUserStore.getState().clearUser();
    set({ status: 'signOut', token: null });
    console.log('signing out');
  },
  hydrate: async () => {
    console.log('hydrating auth');
    set({ status: 'hydrating' });
    // 1) test‑only override
    if (__DEV__ && Constants.expoConfig?.extra?.maestroAccessToken) {
      storeTokens({
        access: {
          token: Constants.expoConfig.extra.maestroAccessToken,
          expires: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
        },
        refresh: {
          token: Constants.expoConfig.extra.maestroRefreshToken,
          expires: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
        },
      });
    }
    try {
      const userToken = getToken();
      console.log('userToken', userToken);
      if (userToken !== null) {
        set({ token: userToken });

        try {
          const user = await getUserDetails();
          useUserStore.getState().setUser(user);
          set({ status: 'signIn', token: userToken });
        } catch (fetchError) {
          console.error(
            'Failed to fetch user details during hydration:',
            fetchError
          );
          get().signOut();
        }
      } else {
        get().signOut();
      }
    } catch (e) {
      console.error('Error during hydration process:', e);
      get().signOut();
    }
  },
}));

export const useAuth = createSelectors(_useAuth);

export const signOut = () => _useAuth.getState().signOut();
export const signIn = (response: UserLoginResponse) =>
  _useAuth.getState().signIn(response);
export const hydrateAuth = async () => _useAuth.getState().hydrate();
