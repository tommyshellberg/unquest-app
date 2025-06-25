import { useCallback, useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';

import { useQuestStore } from '@/store/quest-store';
import { useUserStore } from '@/store/user-store';
import {
  getInvitationStatus,
  acceptInvitation,
  declineInvitation,
  type InvitationStatusResponse,
} from '@/lib/services/invitation-service';
import {
  getQuestRunStatus,
  updateQuestRunStatus,
  type QuestRunResponse,
} from '@/lib/services/quest-run-service';
import { type QuestInvitation, type CooperativeQuestRun } from '@/store/types';

/**
 * Hook for managing invitation status polling
 */
export function useInvitationStatus(
  invitationId: string | undefined,
  enabled = true
) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ['invitation', invitationId, 'status'],
    queryFn: () => (invitationId ? getInvitationStatus(invitationId) : null),
    enabled: !!invitationId && enabled,
    refetchInterval: 5000, // Poll every 5 seconds
    refetchIntervalInBackground: true,
  });
}

/**
 * Hook for managing quest run status polling
 */
export function useQuestRunStatus(
  questRunId: string | undefined,
  enabled = true
) {
  return useQuery({
    queryKey: ['questRun', questRunId],
    queryFn: () => (questRunId ? getQuestRunStatus(questRunId) : null),
    enabled: !!questRunId && enabled,
    refetchInterval: enabled ? 30000 : false, // Poll every 30 seconds during active quest
    refetchIntervalInBackground: true,
  });
}

/**
 * Hook for accepting/declining invitations
 */
export function useInvitationActions() {
  const queryClient = useQueryClient();
  const setCurrentInvitation = useQuestStore(
    (state) => state.setCurrentInvitation
  );

  const acceptMutation = useMutation({
    mutationFn: acceptInvitation,
    onSuccess: (invitation) => {
      setCurrentInvitation(invitation);
      queryClient.invalidateQueries({ queryKey: ['invitation'] });
      queryClient.invalidateQueries({ queryKey: ['invitations', 'pending'] });
      // Navigate to quest
      router.push('/pending-quest');
    },
  });

  const declineMutation = useMutation({
    mutationFn: declineInvitation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invitations', 'pending'] });
    },
  });

  return {
    acceptInvitation: acceptMutation.mutate,
    declineInvitation: declineMutation.mutate,
    isAccepting: acceptMutation.isPending,
    isDeclining: declineMutation.isPending,
  };
}

/**
 * Hook for managing participant ready states
 */
export function useParticipantReady(questRunId: string | undefined) {
  const user = useUserStore((state) => state.user);
  const updateParticipantReady = useQuestStore(
    (state) => state.updateParticipantReady
  );
  const cooperativeQuestRun = useQuestStore(
    (state) => state.cooperativeQuestRun
  );
  const queryClient = useQueryClient();

  const setReady = useCallback(
    async (ready: boolean) => {
      if (!questRunId || !user) return;

      try {
        // Update local state optimistically
        updateParticipantReady(user.id, ready);

        // Update server
        const response = await updateQuestRunStatus(
          questRunId,
          'active',
          null,
          ready
        );

        // Check if all participants are ready
        if (response.participants && Array.isArray(response.participants)) {
          const allReady = response.participants.every(
            (p: any) => typeof p === 'object' && p.ready === true
          );

          if (allReady && response.actualStartTime) {
            // Quest has started!
            return true;
          }
        }

        return false;
      } catch (error) {
        console.error('Failed to update ready state:', error);
        throw error;
      }
    },
    [questRunId, user, updateParticipantReady]
  );

  const isUserReady =
    cooperativeQuestRun?.participants.find((p) => p.userId === user?.id)
      ?.ready || false;

  const allParticipantsReady =
    cooperativeQuestRun?.participants.every((p) => p.ready) || false;

  return {
    setReady,
    isUserReady,
    allParticipantsReady,
    participants: cooperativeQuestRun?.participants || [],
  };
}

/**
 * Main hook for cooperative quest management
 */
export function useCooperativeQuest() {
  const currentInvitation = useQuestStore((state) => state.currentInvitation);
  const cooperativeQuestRun = useQuestStore(
    (state) => state.cooperativeQuestRun
  );
  const setCooperativeQuestRun = useQuestStore(
    (state) => state.setCooperativeQuestRun
  );
  const pendingQuest = useQuestStore((state) => state.pendingQuest);

  const isCooperativeQuest =
    pendingQuest &&
    'inviteeIds' in pendingQuest &&
    pendingQuest.inviteeIds &&
    pendingQuest.inviteeIds.length > 0;

  // Monitor quest status during active quest
  const questRunId = cooperativeQuestRun?.id;
  const { data: questRunStatus } = useQuestRunStatus(
    questRunId,
    !!questRunId && cooperativeQuestRun?.status === 'active'
  );

  // Update local state when quest run status changes
  useEffect(() => {
    if (questRunStatus && setCooperativeQuestRun) {
      setCooperativeQuestRun({
        id: questRunStatus.id,
        status: questRunStatus.status as any,
        participants: Array.isArray(questRunStatus.participants)
          ? questRunStatus.participants.map((p: any) =>
              typeof p === 'string'
                ? { userId: p, ready: false, status: 'pending' }
                : p
            )
          : [],
        invitationId: questRunStatus.invitationId,
        actualStartTime: questRunStatus.actualStartTime,
        scheduledEndTime: questRunStatus.scheduledEndTime,
      });

      // Check if quest failed by another participant
      if (
        questRunStatus.status === 'failed' &&
        cooperativeQuestRun?.status !== 'failed'
      ) {
        useQuestStore.getState().failQuest();
        router.replace('/quest-failed');
      }
    }
  }, [questRunStatus, setCooperativeQuestRun, cooperativeQuestRun?.status]);

  return {
    isCooperativeQuest,
    currentInvitation,
    cooperativeQuestRun,
    questRunStatus,
  };
}
