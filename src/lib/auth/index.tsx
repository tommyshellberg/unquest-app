import { create } from 'zustand';

import { useUserStore } from '@/store/user-store';

import { createSelectors } from '../utils';
import type { TokenType, UserLoginResponse } from './utils';
import { getToken, removeToken, setToken } from './utils';

interface AuthState {
  token: TokenType | null;
  status: 'idle' | 'signOut' | 'signIn';
  signIn: (data: UserLoginResponse) => void;
  signOut: () => void;
  hydrate: () => void;
}

const _useAuth = create<AuthState>((set, get) => ({
  status: 'idle',
  token: null,
  signIn: (response) => {
    const { token, user } = response;
    setToken(token);

    // Set user data in user store
    if (user) {
      useUserStore.getState().setUser(user);
    }

    set({ status: 'signIn', token });
  },
  signOut: () => {
    removeToken();

    // Clear user data
    useUserStore.getState().clearUser();

    set({ status: 'signOut', token: null });
  },
  hydrate: () => {
    try {
      const userToken = getToken();
      if (userToken !== null) {
        get().signIn({ token: userToken });
      } else {
        get().signOut();
      }
    } catch (e) {
      // catch error here
      // Maybe sign_out user!
    }
  },
}));

export const useAuth = createSelectors(_useAuth);

export const signOut = () => _useAuth.getState().signOut();
export const signIn = (response: UserLoginResponse) =>
  _useAuth.getState().signIn(response);
export const hydrateAuth = () => _useAuth.getState().hydrate();
