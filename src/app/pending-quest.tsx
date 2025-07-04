import { BlurView } from 'expo-blur';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { Button, Text, View } from '@/components/ui';
import { Card } from '@/components/ui/card';
import { useQuestStore } from '@/store/quest-store';
import {
  useParticipantReady,
  useCooperativeQuest,
} from '@/lib/hooks/use-cooperative-quest';
import { useWebSocket } from '@/components/providers/websocket-provider';
import { useUserStore } from '@/store/user-store';

export default function PendingQuestScreen() {
  const pendingQuest = useQuestStore((state) => state.pendingQuest);
  const cooperativeQuestRun = useQuestStore(
    (state) => state.cooperativeQuestRun
  );
  const insets = useSafeAreaInsets();
  const cancelQuest = useQuestStore((state) => state.cancelQuest);
  const user = useUserStore((state) => state.user);
  const { addListener, removeListener, joinQuestRoom, leaveQuestRoom } =
    useWebSocket();

  // Check if this is a cooperative quest
  const isCooperativeQuest = !!cooperativeQuestRun;

  // Use the cooperative quest hook to ensure quest run status is being polled
  const { questRunStatus } = useCooperativeQuest();

  const { setReady, isUserReady, allParticipantsReady, participants } =
    useParticipantReady(cooperativeQuestRun?.id);

  const [isSettingReady, setIsSettingReady] = useState(false);

  // Get the quest to display (either pending or active)
  const displayQuest = pendingQuest;

  // Debug logging for cooperative quest state
  useEffect(() => {
    if (isCooperativeQuest) {
      console.log('[PendingQuest] Cooperative quest state:', {
        questRunId: cooperativeQuestRun?.id,
        participants: cooperativeQuestRun?.participants,
        isUserReady,
        allParticipantsReady,
        userId: user?.id,
      });
    }
  }, [
    isCooperativeQuest,
    cooperativeQuestRun,
    isUserReady,
    allParticipantsReady,
    user?.id,
  ]);

  // Header animation using react-native-reanimated
  const headerOpacity = useSharedValue(0);
  const headerScale = useSharedValue(0.9);
  const cardOpacity = useSharedValue(0);
  const cardScale = useSharedValue(0.9);
  const buttonOpacity = useSharedValue(0);
  const buttonScale = useSharedValue(0.9);

  // Animations must be defined before conditionals (for React Hook Rules)
  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ scale: headerScale.value }],
  }));

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ scale: cardScale.value }],
  }));

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
    transform: [{ scale: buttonScale.value }],
  }));

  // Join the quest room for real-time updates (cooperative quests)
  useEffect(() => {
    if (cooperativeQuestRun?.id) {
      console.log('[PendingQuest] Joining quest room:', cooperativeQuestRun.id);
      joinQuestRoom(cooperativeQuestRun.id);

      return () => {
        console.log(
          '[PendingQuest] Leaving quest room:',
          cooperativeQuestRun.id
        );
        leaveQuestRoom(cooperativeQuestRun.id);
      };
    }
  }, [cooperativeQuestRun?.id, joinQuestRoom, leaveQuestRoom]);

  // Listen for quest start event (cooperative quests)
  useEffect(() => {
    if (!isCooperativeQuest) return;

    const handleQuestStarted = (data: any) => {
      console.log('[PendingQuest] Quest started:', data);
      if (data.questRunId === cooperativeQuestRun?.id) {
        // Quest has started, the quest timer should handle it
        router.replace('/(app)');
      }
    };

    const handleParticipantReady = (data: any) => {
      console.log('[PendingQuest] Participant ready update:', data);
      // The websocket provider already handles updating the store
    };

    addListener('questStarted', handleQuestStarted);
    addListener('participantReady', handleParticipantReady);

    return () => {
      removeListener('questStarted', handleQuestStarted);
      removeListener('participantReady', handleParticipantReady);
    };
  }, [
    addListener,
    removeListener,
    cooperativeQuestRun?.id,
    isCooperativeQuest,
  ]);

  // Poll for quest activation when all participants are ready (cooperative quests)
  useEffect(() => {
    if (!isCooperativeQuest || !allParticipantsReady || !cooperativeQuestRun?.id) return;

    console.log('[PendingQuest] Starting quest activation polling...');
    
    // Check quest status immediately
    const checkQuestStatus = () => {
      const questStore = useQuestStore.getState();
      const currentRun = questStore.cooperativeQuestRun;
      
      if (currentRun?.status === 'active' && currentRun.actualStartTime) {
        console.log('[PendingQuest] Quest activated by server, navigating to home...');
        router.replace('/(app)');
        return true;
      }
      return false;
    };

    // Check immediately
    if (checkQuestStatus()) return;

    // Then poll every 2 seconds
    const pollInterval = setInterval(() => {
      if (checkQuestStatus()) {
        clearInterval(pollInterval);
      }
    }, 2000);

    return () => {
      clearInterval(pollInterval);
    };
  }, [isCooperativeQuest, allParticipantsReady, cooperativeQuestRun?.id]);

  // Run animations when component mounts
  useEffect(() => {
    if (pendingQuest) {
      // Simple animation sequence
      headerOpacity.value = withTiming(1, { duration: 500 });
      headerScale.value = withTiming(1, { duration: 500 });
      cardOpacity.value = withDelay(500, withTiming(1, { duration: 500 }));
      cardScale.value = withDelay(500, withTiming(1, { duration: 500 }));
      buttonOpacity.value = withDelay(1000, withTiming(1, { duration: 500 }));
      buttonScale.value = withDelay(1000, withTiming(1, { duration: 500 }));
    }
  }, [
    pendingQuest,
    buttonOpacity,
    buttonScale,
    cardOpacity,
    cardScale,
    headerOpacity,
    headerScale,
  ]);

  const handleCancelQuest = () => {
    cancelQuest();
    router.back();
  };

  const handleReady = async () => {
    setIsSettingReady(true);
    try {
      const questStarted = await setReady(true);
      if (questStarted) {
        console.log('[PendingQuest] All participants ready, quest starting...');
      }
    } catch (error) {
      console.error('Failed to set ready status:', error);
    } finally {
      setIsSettingReady(false);
    }
  };

  const handleNotReady = async () => {
    setIsSettingReady(true);
    try {
      await setReady(false);
    } catch (error) {
      console.error('Failed to set not ready status:', error);
    } finally {
      setIsSettingReady(false);
    }
  };

  if (!pendingQuest || (isCooperativeQuest && !cooperativeQuestRun)) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View className="flex-1">
      {/* Full-screen Background Image */}
      <Image
        source={require('@/../assets/images/background/active-quest.jpg')}
        className="absolute inset-0 size-full"
        resizeMode="cover"
      />
      {/* BlurView for a subtle overlay effect */}
      <BlurView intensity={30} tint="regular" className="absolute inset-0" />
      <View
        className="flex-1 px-6"
        style={{
          paddingTop: insets.top + 16, // Spacing with safe area
        }}
      >
        <Animated.View
          className="mb-8 items-center"
          style={headerAnimatedStyle}
        >
          <Text className="text-2xl font-bold">
            {isCooperativeQuest ? 'Cooperative Quest' : 'Quest Ready'}
          </Text>
        </Animated.View>

        <Animated.View className="flex-0" style={cardAnimatedStyle}>
          <Card className="rounded-xl bg-white p-6">
            <Text className="mb-4 text-center text-xl font-semibold">
              {displayQuest?.title}
            </Text>
            <Text className="text-center text-base">
              {`Duration: ${displayQuest?.durationMinutes} minutes`}
            </Text>

            <View className="my-4 border-b border-[#3B7A57]" />

            {isCooperativeQuest ? (
              <>
                <Text className="mb-4 text-center text-lg font-medium">
                  Participants
                </Text>

                {participants.map((participant) => (
                  <View
                    key={participant.userId}
                    className="mb-2 flex-row items-center justify-between"
                  >
                    <Text className="text-base">
                      {participant.userId === user?.id
                        ? 'You'
                        : participant.userName || 'Friend'}
                    </Text>
                    <Text
                      className={`text-sm ${participant.ready ? 'text-green-600' : 'text-gray-500'}`}
                    >
                      {participant.ready ? 'Ready' : 'Not Ready'}
                    </Text>
                  </View>
                ))}

                <View className="my-4 border-b border-[#3B7A57]" />

                {!allParticipantsReady ? (
                  <>
                    <Text className="mb-4 text-center text-base">
                      {isUserReady
                        ? 'Waiting for all participants to be ready...'
                        : 'Mark yourself as ready when you are prepared to start'}
                    </Text>

                    {!isUserReady ? (
                      <Button
                        onPress={handleReady}
                        disabled={isSettingReady}
                        className="mb-4 items-center rounded-full bg-green-600"
                      >
                        {isSettingReady ? (
                          <ActivityIndicator color="white" />
                        ) : (
                          <Text className="text-base font-semibold text-white">
                            I'm Ready!
                          </Text>
                        )}
                      </Button>
                    ) : (
                      <Button
                        onPress={handleNotReady}
                        disabled={isSettingReady}
                        variant="secondary"
                        className="mb-4 items-center rounded-full"
                      >
                        {isSettingReady ? (
                          <ActivityIndicator />
                        ) : (
                          <Text className="text-base font-semibold">
                            Not Ready
                          </Text>
                        )}
                      </Button>
                    )}
                  </>
                ) : (
                  <>
                    <Text className="mb-6 text-center text-lg font-medium text-[#3B7A57]">
                      All participants are ready!
                    </Text>
                    <Text className="mb-6 text-center text-base leading-6">
                      Lock your phone to begin the quest. The quest will start
                      when all participants have locked their phones.
                    </Text>
                  </>
                )}
              </>
            ) : (
              <>
                <Text className="mb-6 text-center text-lg font-medium text-[#3B7A57]">
                  Lock your phone to begin your quest
                </Text>

                <Text className="mb-6 text-center text-base leading-6">
                  Your character is ready to embark on their journey, but they
                  need you to put your phone away first.
                </Text>
                <Text className="mb-6 text-center text-base leading-6">
                  The quest will begin when your phone is locked.
                </Text>

                <View className="my-4 border-b border-[#3B7A57]" />

                <Text className="text-center text-base italic">
                  Remember, unlocking your phone before the quest is complete
                  will result in failure.
                </Text>
              </>
            )}
          </Card>
        </Animated.View>

        <View className="flex-1" />

        <Animated.View
          style={buttonAnimatedStyle}
          className="mb-10" // Add bottom margin to keep away from navigation
        >
          <Button
            onPress={handleCancelQuest}
            variant="destructive"
            className="items-center rounded-full"
          >
            <Text className="text-base font-semibold">Cancel Quest</Text>
          </Button>
        </Animated.View>
      </View>
    </View>
  );
}
