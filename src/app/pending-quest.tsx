import { BlurView } from 'expo-blur';
import React, { useEffect, useState } from 'react';
import { Image, ActivityIndicator } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, Text, View } from '@/components/ui';
import { Card } from '@/components/ui/card';
import { useQuestStore } from '@/store/quest-store';
import {
  useCooperativeQuest,
  useParticipantReady,
} from '@/lib/hooks/use-cooperative-quest';
import QuestTimer from '@/lib/services/quest-timer';

export default function PendingQuestScreen() {
  const pendingQuest = useQuestStore((state) => state.pendingQuest);
  const insets = useSafeAreaInsets();
  const cancelQuest = useQuestStore((state) => state.cancelQuest);

  // Cooperative quest hooks
  const { isCooperativeQuest, cooperativeQuestRun } = useCooperativeQuest();
  const { setReady, isUserReady, allParticipantsReady, participants } =
    useParticipantReady(cooperativeQuestRun?.id);

  const [isSettingReady, setIsSettingReady] = useState(false);

  // Get the quest to display (either pending or active)
  const displayQuest = pendingQuest;

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
    // go back to previous screen
  };

  const handleReadyClick = async () => {
    if (isCooperativeQuest && !isUserReady && !isSettingReady) {
      setIsSettingReady(true);
      try {
        // Update ready state in quest timer
        await QuestTimer.updateReadyState(true);

        // Then update via API
        const questStarted = await setReady(true);
        if (questStarted) {
          // Quest has started with all participants
          // The quest will auto-start via the background timer
        }
      } catch (error) {
        console.error('Failed to set ready state:', error);
      } finally {
        setIsSettingReady(false);
      }
    }
  };

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
          <Text className="text-2xl font-bold">Quest Ready</Text>
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

            {isCooperativeQuest && participants.length > 0 ? (
              <>
                <Text className="mb-4 text-center text-lg font-medium text-[#3B7A57]">
                  Cooperative Quest
                </Text>

                <View className="mb-4">
                  <Text className="text-center text-sm mb-2">
                    Participants Status:
                  </Text>
                  {participants.map((participant) => (
                    <View
                      key={participant.userId}
                      className="flex-row items-center justify-between py-1"
                    >
                      <Text className="text-sm">
                        {participant.userName || participant.userId}
                      </Text>
                      <View className="flex-row items-center">
                        {participant.ready ? (
                          <Text className="text-sm text-green-600">
                            ✓ Ready
                          </Text>
                        ) : (
                          <>
                            <ActivityIndicator size="small" />
                            <Text className="ml-2 text-sm text-gray-500">
                              Waiting...
                            </Text>
                          </>
                        )}
                      </View>
                    </View>
                  ))}
                </View>

                {!isUserReady && (
                  <Text className="mb-4 text-center text-base leading-6">
                    Lock your phone to mark yourself as ready
                  </Text>
                )}

                {isUserReady && !allParticipantsReady && (
                  <View className="p-3 bg-blue-50 rounded-lg mb-4">
                    <Text className="text-center text-sm text-blue-700">
                      Waiting for all participants to be ready...
                    </Text>
                  </View>
                )}

                {allParticipantsReady && (
                  <View className="p-3 bg-green-50 rounded-lg mb-4">
                    <Text className="text-center text-sm text-green-700">
                      All participants ready! Quest starting...
                    </Text>
                  </View>
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
              </>
            )}

            <View className="my-4 border-b border-[#3B7A57]" />

            <Text className="text-center text-base italic">
              Remember, unlocking your phone before the quest is complete will
              result in failure.
            </Text>
          </Card>
        </Animated.View>

        <View className="flex-1" />

        <Animated.View
          style={buttonAnimatedStyle}
          className="mb-10 space-y-3" // Add bottom margin to keep away from navigation
        >
          {isCooperativeQuest && !isUserReady && (
            <Button
              onPress={handleReadyClick}
              variant="default"
              disabled={isSettingReady}
              className="items-center rounded-full"
            >
              {isSettingReady ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-base font-semibold text-white">
                  I'm Ready
                </Text>
              )}
            </Button>
          )}

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
