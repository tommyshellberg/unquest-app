import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { ActivityIndicator } from 'react-native';

import { Button, FocusAwareStatusBar, Text, View } from '@/components/ui';
import { useQuestStore } from '@/store/quest-store';
import {
  useInvitationStatus,
  useQuestRunStatus,
} from '@/lib/hooks/use-cooperative-quest';
import { useLazyWebSocket } from '@/components/providers/lazy-websocket-provider';

export default function InvitationWaitingScreen() {
  const router = useRouter();
  const pendingQuest = useQuestStore((state) => state.pendingQuest);
  const cooperativeQuestRun = useQuestStore(
    (state) => state.cooperativeQuestRun
  );
  const setCooperativeQuestRun = useQuestStore(
    (state) => state.setCooperativeQuestRun
  );
  const { on: addListener, off: removeListener, connect: connectWebSocket } = useLazyWebSocket();
  
  // Connect WebSocket when entering this screen
  useEffect(() => {
    // Only connect if we have a proper auth context
    connectWebSocket();
  }, [connectWebSocket]);

  // Debug logging
  console.log('[InvitationWaiting] cooperativeQuestRun:', cooperativeQuestRun);
  console.log(
    '[InvitationWaiting] invitationId:',
    cooperativeQuestRun?.invitationId
  );

  // Poll invitation status
  const { data: invitationStatus } = useInvitationStatus(
    cooperativeQuestRun?.invitationId,
    !!cooperativeQuestRun?.invitationId
  );

  // Also poll quest run status to get updated participant list
  const { data: questRunStatus } = useQuestRunStatus(
    cooperativeQuestRun?.id,
    !!cooperativeQuestRun?.id
  );

  // Listen for WebSocket events
  useEffect(() => {
    const handleInvitationAccepted = (data: any) => {
      console.log('Invitation accepted via WebSocket:', data);
      // The query will refetch automatically due to invalidation in the provider
    };

    const handleInvitationDeclined = (data: any) => {
      console.log('Invitation declined via WebSocket:', data);
    };

    addListener('invitationAccepted', handleInvitationAccepted);
    addListener('invitationDeclined', handleInvitationDeclined);

    return () => {
      removeListener('invitationAccepted', handleInvitationAccepted);
      removeListener('invitationDeclined', handleInvitationDeclined);
    };
  }, [addListener, removeListener]);

  // Update local state when quest run status changes
  useEffect(() => {
    if (questRunStatus && cooperativeQuestRun && setCooperativeQuestRun) {
      console.log(
        '[InvitationWaiting] Updating quest run with new data:',
        questRunStatus
      );
      setCooperativeQuestRun({
        ...cooperativeQuestRun,
        participants: Array.isArray(questRunStatus.participants)
          ? questRunStatus.participants.map((p: any) =>
              typeof p === 'string'
                ? { userId: p, ready: false, status: 'pending' }
                : p
            )
          : cooperativeQuestRun.participants,
        status: questRunStatus.status as any,
        actualStartTime: questRunStatus.actualStartTime,
        scheduledEndTime: questRunStatus.scheduledEndTime,
        updatedAt: Date.now(),
      });
    }
  }, [questRunStatus, cooperativeQuestRun?.id, setCooperativeQuestRun]);

  useEffect(() => {
    // If all invitees have responded or invitation expired, navigate accordingly
    if (invitationStatus) {
      console.log('[InvitationWaiting] Invitation status:', invitationStatus);

      const pendingCount =
        invitationStatus.totalInvitees - invitationStatus.acceptedCount;
      const allResponded =
        pendingCount === 0 || invitationStatus.status !== 'pending';

      if (allResponded || invitationStatus.isExpired) {
        console.log(
          '[InvitationWaiting] All responded or expired, navigating...'
        );
        if (invitationStatus.acceptedCount > 0) {
          // At least one person accepted, navigate to cooperative pending quest
          console.log(
            '[InvitationWaiting] Navigating to cooperative pending quest...'
          );
          // Use replace so they can't go back to the waiting screen
          router.replace('/cooperative-pending-quest');
        } else {
          // All declined or expired, go back home
          router.replace('/(app)');
        }
      }
    }
  }, [invitationStatus, router]);

  const handleCancel = () => {
    useQuestStore.getState().cancelQuest();
    router.back();
  };

  return (
    <View className="flex-1 bg-background">
      <FocusAwareStatusBar />

      {/* Header */}
      <View className="flex-row items-center justify-between border-b border-[#EEEEEE] px-5 py-4">
        <View className="w-14" />
        <Text className="text-lg font-semibold">Waiting for Friends</Text>
        <View className="w-14" />
      </View>

      {/* Content */}
      <View className="flex-1 items-center justify-center p-5">
        <ActivityIndicator size="large" className="mb-6" />

        <Text className="mb-2 text-xl font-semibold">
          {pendingQuest?.title || 'Quest'}
        </Text>

        <Text className="mb-8 text-center text-gray-600">
          Waiting for your friends to accept the quest invitation...
        </Text>

        {invitationStatus && (
          <View className="mb-8">
            <Text className="mb-2 text-sm text-gray-500">
              Accepted: {invitationStatus.acceptedCount}
            </Text>
            <Text className="text-sm text-gray-500">
              Pending:{' '}
              {invitationStatus.totalInvitees - invitationStatus.acceptedCount}
            </Text>
            <Text className="mt-2 text-xs text-gray-400">
              Total invited: {invitationStatus.totalInvitees}
            </Text>
          </View>
        )}

        <Button
          label="Cancel"
          onPress={handleCancel}
          variant="secondary"
          className="w-full"
        />
      </View>
    </View>
  );
}
