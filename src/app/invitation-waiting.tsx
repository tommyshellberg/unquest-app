import { router } from 'expo-router';
import React, { useEffect, useState, useCallback } from 'react';
import { ActivityIndicator, Image } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withRepeat,
  withSequence,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { Button, Text, View, Pressable } from '@/components/ui';
import { Card } from '@/components/ui/card';
import { useQuestStore } from '@/store/quest-store';
import { useUserStore } from '@/store/user-store';
import {
  createInvitation,
  getInvitationStatus,
  isInvitationExpired,
  getInvitationTimeRemaining,
} from '@/lib/services/invitation-service';
import { createQuestRun } from '@/lib/services/quest-run-service';
import { type QuestInvitation } from '@/store/types';

interface FriendStatus {
  userId: string;
  name: string;
  status: 'pending' | 'accepted' | 'declined';
}

export default function InvitationWaitingScreen() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const pendingQuest = useQuestStore((state) => state.pendingQuest);
  const setCurrentInvitation = useQuestStore(
    (state) => state.setCurrentInvitation
  );
  const setCooperativeQuestRun = useQuestStore(
    (state) => state.setCooperativeQuestRun
  );
  const cancelQuest = useQuestStore((state) => state.cancelQuest);
  const user = useUserStore((state) => state.user);

  const [invitation, setInvitation] = useState<QuestInvitation | null>(null);
  const [questRunId, setQuestRunId] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(300); // 5 minutes
  const [isCreatingInvitation, setIsCreatingInvitation] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Animation values
  const pulseScale = useSharedValue(1);

  // Pulse animation for timer
  useEffect(() => {
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 1000 }),
        withTiming(1, { duration: 1000 })
      ),
      -1
    );
  }, [pulseScale]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  // Create quest run and invitation on mount
  useEffect(() => {
    const initializeCooperativeQuest = async () => {
      if (
        !pendingQuest ||
        !('inviteeIds' in pendingQuest) ||
        !pendingQuest.inviteeIds
      ) {
        setError('No cooperative quest found');
        return;
      }

      try {
        // First create the quest run
        const questRun = await createQuestRun(pendingQuest);
        setQuestRunId(questRun.id);

        // Then create the invitation
        const newInvitation = await createInvitation({
          questRunId: questRun.id,
          inviteeIds: pendingQuest.inviteeIds,
        });

        setInvitation(newInvitation);
        setCurrentInvitation(newInvitation);
        setIsCreatingInvitation(false);
      } catch (err) {
        console.error('Failed to create cooperative quest:', err);
        setError('Failed to create quest invitation');
        setIsCreatingInvitation(false);
      }
    };

    initializeCooperativeQuest();
  }, [pendingQuest, setCurrentInvitation]);

  // Poll for invitation status
  const { data: invitationStatus, isLoading: isPolling } = useQuery({
    queryKey: ['invitation', invitation?.id],
    queryFn: () => (invitation ? getInvitationStatus(invitation.id) : null),
    enabled: !!invitation && !isInvitationExpired(invitation),
    refetchInterval: 5000, // Poll every 5 seconds
    refetchIntervalInBackground: true,
  });

  // Update timer
  useEffect(() => {
    if (!invitation) return;

    const timer = setInterval(() => {
      const remaining = getInvitationTimeRemaining(invitation);
      setTimeRemaining(remaining);

      if (remaining <= 0) {
        clearInterval(timer);
        handleInvitationExpired();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [invitation]);

  // Check if we can start the quest
  useEffect(() => {
    if (!invitationStatus) return;

    const acceptedCount = invitationStatus.acceptedUsers.length;
    const totalInvited = invitation?.invitees.length || 0;

    // If all invited users have responded (either accepted or declined)
    const allResponded =
      invitationStatus.acceptedUsers.length +
        invitationStatus.declinedUsers.length ===
      totalInvited;

    // If we have at least one acceptance and all have responded, or timer is about to expire
    if (acceptedCount > 0 && (allResponded || timeRemaining < 10)) {
      handleStartQuest();
    }
  }, [invitationStatus, timeRemaining]);

  const handleInvitationExpired = () => {
    // If no one accepted, cancel the quest
    if (!invitationStatus || invitationStatus.acceptedUsers.length === 0) {
      cancelQuest();
      router.replace('/(app)');
    } else {
      // Otherwise start with whoever accepted
      handleStartQuest();
    }
  };

  const handleStartQuest = () => {
    // Navigate to pending quest screen where participants will sync their ready state
    router.replace('/pending-quest');
  };

  const handleCancel = () => {
    cancelQuest();
    router.back();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getFriendStatuses = (): FriendStatus[] => {
    if (!invitation || !invitationStatus) return [];

    // TODO: This would need to be enhanced with actual friend data
    // For now, using user IDs as names
    return invitation.invitees.map((userId) => ({
      userId,
      name: userId, // Would be replaced with actual user names
      status: invitationStatus.acceptedUsers.includes(userId)
        ? 'accepted'
        : invitationStatus.declinedUsers.includes(userId)
          ? 'declined'
          : 'pending',
    }));
  };

  if (error) {
    return (
      <View className="flex-1 items-center justify-center p-6">
        <Text className="text-lg text-red-500 mb-4">{error}</Text>
        <Button onPress={() => router.back()} label="Go Back" />
      </View>
    );
  }

  if (isCreatingInvitation) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" />
        <Text className="mt-4">Creating invitation...</Text>
      </View>
    );
  }

  const friendStatuses = getFriendStatuses();
  const acceptedCount = friendStatuses.filter(
    (f) => f.status === 'accepted'
  ).length;

  return (
    <View className="flex-1">
      <Image
        source={require('@/../assets/images/background/active-quest.jpg')}
        className="absolute inset-0 size-full"
        resizeMode="cover"
      />

      <View className="flex-1 px-6" style={{ paddingTop: insets.top + 16 }}>
        <View className="mb-6 items-center">
          <Text className="text-2xl font-bold text-white">
            Waiting for Friends
          </Text>
          <Animated.View style={pulseStyle} className="mt-2">
            <Text className="text-3xl font-bold text-white">
              {formatTime(timeRemaining)}
            </Text>
          </Animated.View>
        </View>

        <Card className="rounded-xl bg-white p-6">
          <Text className="mb-4 text-center text-xl font-semibold">
            {pendingQuest?.title}
          </Text>

          <View className="mb-4">
            <Text className="text-center text-base mb-2">
              Invitation Status
            </Text>
            <Text className="text-center text-sm text-gray-500">
              {acceptedCount} of {friendStatuses.length} accepted
            </Text>
          </View>

          <View className="border-t border-gray-200 pt-4">
            {friendStatuses.map((friend) => (
              <View
                key={friend.userId}
                className="flex-row items-center justify-between py-2"
              >
                <Text className="text-base">{friend.name}</Text>
                <View className="flex-row items-center">
                  {friend.status === 'pending' && (
                    <>
                      <ActivityIndicator size="small" />
                      <Text className="ml-2 text-sm text-gray-500">
                        Waiting...
                      </Text>
                    </>
                  )}
                  {friend.status === 'accepted' && (
                    <Text className="text-sm text-green-600">✓ Accepted</Text>
                  )}
                  {friend.status === 'declined' && (
                    <Text className="text-sm text-red-600">✗ Declined</Text>
                  )}
                </View>
              </View>
            ))}
          </View>

          {acceptedCount > 0 && (
            <View className="mt-4 p-3 bg-green-50 rounded-lg">
              <Text className="text-center text-sm text-green-700">
                Quest will start when all friends respond or timer expires
              </Text>
            </View>
          )}
        </Card>

        <View className="flex-1" />

        <View className="mb-10 space-y-3">
          {acceptedCount > 0 && (
            <Button
              onPress={handleStartQuest}
              variant="default"
              className="rounded-full"
            >
              <Text className="text-base font-semibold">
                Start with {acceptedCount} friend{acceptedCount > 1 ? 's' : ''}
              </Text>
            </Button>
          )}

          <Button
            onPress={handleCancel}
            variant="destructive"
            className="rounded-full"
          >
            <Text className="text-base font-semibold">Cancel Quest</Text>
          </Button>
        </View>
      </View>
    </View>
  );
}
