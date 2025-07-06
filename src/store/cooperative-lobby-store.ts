import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { getItem, removeItem, setItem } from '@/lib/storage';

export interface LobbyParticipant {
  id: string;
  username: string;
  invitationStatus: 'pending' | 'accepted' | 'declined';
  isReady: boolean;
  isCreator: boolean;
  joinedAt?: Date;
  readyAt?: Date;
}

export interface CooperativeLobby {
  lobbyId: string;
  questTitle: string;
  questDuration: number;
  creatorId: string;
  participants: LobbyParticipant[];
  status: 'waiting' | 'ready' | 'starting' | 'expired';
  createdAt: Date;
  expiresAt: Date;
  questData?: any; // Store the quest configuration
}

interface CooperativeLobbyState {
  currentLobby: CooperativeLobby | null;
  isInLobby: boolean;
  countdownSeconds: number | null;

  // Actions
  createLobby: (lobby: CooperativeLobby) => void;
  joinLobby: (lobby: CooperativeLobby) => void;
  leaveLobby: () => void;
  updateParticipant: (
    userId: string,
    updates: Partial<LobbyParticipant>
  ) => void;
  updateLobbyStatus: (status: CooperativeLobby['status']) => void;
  setCountdown: (seconds: number | null) => void;
  markUserReady: (userId: string, isReady: boolean) => void;
  updateInvitationResponse: (
    userId: string,
    status: 'accepted' | 'declined'
  ) => void;
  reset: () => void;
}

export const useCooperativeLobbyStore = create<CooperativeLobbyState>()(
  persist(
    (set, get) => ({
      currentLobby: null,
      isInLobby: false,
      countdownSeconds: null,

      createLobby: (lobby) => {
        set({
          currentLobby: lobby,
          isInLobby: true,
          countdownSeconds: null,
        });
      },

      joinLobby: (lobby) => {
        set({
          currentLobby: lobby,
          isInLobby: true,
          countdownSeconds: null,
        });
      },

      leaveLobby: () => {
        set({
          currentLobby: null,
          isInLobby: false,
          countdownSeconds: null,
        });
      },

      updateParticipant: (userId, updates) => {
        const { currentLobby } = get();
        if (!currentLobby) return;

        const updatedParticipants = currentLobby.participants.map((p) =>
          p.id === userId ? { ...p, ...updates } : p
        );

        set({
          currentLobby: {
            ...currentLobby,
            participants: updatedParticipants,
          },
        });
      },

      updateLobbyStatus: (status) => {
        const { currentLobby } = get();
        if (!currentLobby) return;

        set({
          currentLobby: {
            ...currentLobby,
            status,
          },
        });
      },

      setCountdown: (seconds) => {
        set({ countdownSeconds: seconds });
      },

      markUserReady: (userId, isReady) => {
        const { currentLobby } = get();
        if (!currentLobby) return;

        const updatedParticipants = currentLobby.participants.map((p) =>
          p.id === userId
            ? { ...p, isReady, readyAt: isReady ? new Date() : undefined }
            : p
        );

        // Check if all accepted participants are ready
        const acceptedParticipants = updatedParticipants.filter(
          (p) => p.invitationStatus === 'accepted'
        );
        const allReady =
          acceptedParticipants.length > 0 &&
          acceptedParticipants.every((p) => p.isReady);

        set({
          currentLobby: {
            ...currentLobby,
            participants: updatedParticipants,
            status: allReady ? 'ready' : currentLobby.status,
          },
        });
      },

      updateInvitationResponse: (userId, status) => {
        const { currentLobby } = get();
        if (!currentLobby) return;

        const updatedParticipants = currentLobby.participants.map((p) =>
          p.id === userId
            ? {
                ...p,
                invitationStatus: status,
                joinedAt: status === 'accepted' ? new Date() : undefined,
              }
            : p
        );

        // Check if all invitations have been responded to
        const allResponded = updatedParticipants.every(
          (p) => p.invitationStatus !== 'pending'
        );

        set({
          currentLobby: {
            ...currentLobby,
            participants: updatedParticipants,
            status: allResponded ? 'waiting' : currentLobby.status,
          },
        });
      },

      reset: () => {
        set({
          currentLobby: null,
          isInLobby: false,
          countdownSeconds: null,
        });
      },
    }),
    {
      name: 'cooperative-lobby-storage',
      storage: createJSONStorage(() => ({
        getItem: (name: string) => {
          const value = getItem(name);
          return typeof value === 'string' ? value : null;
        },
        setItem,
        removeItem,
      })),
      partialize: (state) => ({
        currentLobby: state.currentLobby,
        isInLobby: state.isInLobby,
      }),
    }
  )
);

// Zustand already provides getState method, no need to override
