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
  signIn: (loginResponse) => {
    setToken({
      access: loginResponse.token.access,
      refresh: loginResponse.token.refresh,
    });

    set({
      status: 'signIn',
      token: {
        access: loginResponse.token.access,
        refresh: loginResponse.token.refresh,
      },
    });
  },

  signOut: () => {
    removeToken();
    set({
      status: 'signOut',
      token: null,
    });

    // Clear user store
    useUserStore.getState().clearUser();
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
          console.log(
            '[Auth] User response during hydration:',
            JSON.stringify(user, null, 2)
          );
          useUserStore.getState().setUser(user);

          // Sync character data if available
          // Check both nested character object and top-level properties
          if (user.character || ((user as any).type && (user as any).name)) {
            const { useCharacterStore } = await import(
              '@/store/character-store'
            );
            const characterStore = useCharacterStore.getState();

            // Handle both formats: nested character object or top-level properties
            const characterData = user.character || {
              type: (user as any).type,
              name: (user as any).name,
              level: (user as any).level || 1,
              currentXP: (user as any).xp || 0,
              xpToNextLevel: 100, // Default XP to next level
            };

            // First create the character if it doesn't exist locally
            if (!characterStore.character) {
              characterStore.createCharacter(
                characterData.type as any,
                characterData.name
              );
            }

            // Then update with the server data
            characterStore.updateCharacter({
              level: characterData.level || (user as any).level || 1,
              currentXP: characterData.currentXP || (user as any).xp || 0,
              xpToNextLevel: characterData.xpToNextLevel || 100,
            });

            // Also update streak if provided
            if (user.dailyQuestStreak !== undefined) {
              // @TODO: Add this back when we properly sync streak
              characterStore.setStreak(user.dailyQuestStreak);
            }

            console.log('[Auth] Character data synchronized during hydration');
          } else {
            console.log('[Auth] No character data found during hydration');
          }

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

export const signIn = (response: UserLoginResponse) =>
  _useAuth.getState().signIn(response);
export const signOut = () => _useAuth.getState().signOut();
export const hydrateAuth = async () => _useAuth.getState().hydrate();
