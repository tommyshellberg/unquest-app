import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { INITIAL_POIS } from '@/app/data/pois';
import { getItem, removeItem, setItem } from '@/lib/storage';

import { type POI } from './types';

interface POIState {
  pois: POI[];
  lastRevealedPOISlug: string | null;
  revealLocation: (slug: string) => void;
  resetLastRevealedPOI: () => void;
  reset: () => void;
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

export const usePOIStore = create<POIState>()(
  persist(
    (set) => ({
      pois: INITIAL_POIS,
      lastRevealedPOISlug: null,

      revealLocation: (slug) => {
        set((state) => ({
          pois: state.pois.map((poi) =>
            poi.slug === slug ? { ...poi, isRevealed: true } : poi
          ),
          lastRevealedPOISlug: slug,
        }));
      },

      resetLastRevealedPOI: () => {
        set({ lastRevealedPOISlug: null });
      },

      reset: () => {
        set({
          pois: INITIAL_POIS,
          lastRevealedPOISlug: null,
        });
      },
    }),
    {
      name: 'poi-storage',
      storage: createJSONStorage(() => ({
        getItem: getItemForStorage,
        setItem: setItemForStorage,
        removeItem: removeItemForStorage,
      })),
    }
  )
);
