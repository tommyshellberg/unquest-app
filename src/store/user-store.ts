// src/store/user-store.ts
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { getItem, removeItem, setItem } from '@/lib/storage';

export interface User {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  createdAt?: string;
  totalQuestsCompleted?: number;
  totalMinutesOffPhone?: number;
}

interface UserState {
  user: User | null;
  setUser: (user: User) => void;
  updateUser: (userData: Partial<User>) => void;
  clearUser: () => void;
}

// Create type-safe functions for Zustand's storage
const getItemForStorage = (name: string) => {
  const value = getItem<string>(name);
  return value ?? null;
};

const setItemForStorage = async (name: string, value: string) => {
  await setItem(name, value);
};

const removeItemForStorage = async (name: string) => {
  await removeItem(name);
};

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
      updateUser: (userData) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...userData } : null,
        })),
      clearUser: () => set({ user: null }),
    }),
    {
      name: 'user-storage',
      storage: createJSONStorage(() => ({
        getItem: getItemForStorage,
        setItem: setItemForStorage,
        removeItem: removeItemForStorage,
      })),
    }
  )
);
