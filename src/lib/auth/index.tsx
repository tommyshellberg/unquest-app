import { create } from 'zustand';

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
  signIn: (response) => {
    const { token, user } = response;
    console.log('setting tokens:', token);
    setToken(token);

    if (user) {
      useUserStore.getState().setUser(user);
      console.log('user set in user store', user);
    } else {
      console.log('no user provided in response, but proceeding with signIn');
    }

    set({ status: 'signIn', token });
  },
  signOut: () => {
    removeToken();
    useUserStore.getState().clearUser();
    set({ status: 'signOut', token: null });
  },
  hydrate: async () => {
    set({ status: 'hydrating' });
    try {
      console.log('Hydrating auth state...');
      const userToken = getToken();
      if (userToken !== null) {
        console.log('Token found, attempting to fetch user details...');
        console.log('userToken:', userToken);
        set({ token: userToken });

        try {
          const user = await getUserDetails();
          console.log('User details fetched successfully:', user.name);
          useUserStore.getState().setUser(user);
          set({ status: 'signIn', token: userToken });
          console.log('Hydration successful: Signed In.');
        } catch (fetchError) {
          console.error(
            'Failed to fetch user details during hydration:',
            fetchError
          );
          get().signOut();
          console.log('Hydration failed: Signed Out due to fetch error.');
        }
      } else {
        console.log('No token found.');
        get().signOut();
        console.log('Hydration complete: Signed Out.');
      }
    } catch (e) {
      console.error('Error during hydration process:', e);
      get().signOut();
      console.log('Hydration failed: Signed Out due to error.');
    }
  },
}));

export const useAuth = createSelectors(_useAuth);

export const signOut = () => _useAuth.getState().signOut();
export const signIn = (response: UserLoginResponse) =>
  _useAuth.getState().signIn(response);
export const hydrateAuth = async () => _useAuth.getState().hydrate();
