import { BlurView } from 'expo-blur';
import React, { useEffect } from 'react';
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
import { useCooperativeQuest } from '@/lib/hooks/use-cooperative-quest';
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
  
  // Countdown state for cooperative quests
  const [showCountdown, setShowCountdown] = React.useState(isCooperativeQuest);
  const [countdownSeconds, setCountdownSeconds] = React.useState(5);

  // Use the cooperative quest hook to ensure quest run status is being polled
  const { questRunStatus } = useCooperativeQuest();

  // Get the quest to display (either pending or active)
  const displayQuest = pendingQuest;

  // Debug logging for cooperative quest state
  useEffect(() => {
    if (isCooperativeQuest) {
      console.log('[PendingQuest] Cooperative quest state:', {
        questRunId: cooperativeQuestRun?.id,
        participants: cooperativeQuestRun?.participants,
        userId: user?.id,
      });
    }
  }, [
    isCooperativeQuest,
    cooperativeQuestRun,
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
      // DO NOT navigate here - the phone is unlocked if we're viewing this screen
      // The navigation state resolver will handle routing when appropriate
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

  // DO NOT poll for quest activation here
  // The pending-quest screen is only visible when the phone is unlocked
  // Quests should only start when the phone is locked
  // The quest timer will handle activation while the phone is locked

  // Run animations when component mounts
  useEffect(() => {
    if (pendingQuest && !showCountdown) {
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
    showCountdown,
    buttonOpacity,
    buttonScale,
    cardOpacity,
    cardScale,
    headerOpacity,
    headerScale,
  ]);
  
  // Handle countdown for cooperative quests
  useEffect(() => {
    if (showCountdown && isCooperativeQuest) {
      const countdownInterval = setInterval(() => {
        setCountdownSeconds((prev) => {
          const newCount = prev - 1;
          if (newCount === 0) {
            clearInterval(countdownInterval);
            setTimeout(() => {
              setShowCountdown(false);
            }, 500); // Show 0 for half a second before transitioning
          }
          return newCount;
        });
      }, 1000);
      
      return () => clearInterval(countdownInterval);
    }
  }, [showCountdown, isCooperativeQuest]);

  const handleCancelQuest = () => {
    cancelQuest();
    router.back();
  };


  if (!pendingQuest || (isCooperativeQuest && !cooperativeQuestRun)) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator />
      </View>
    );
  }
  
  // Show countdown screen for cooperative quests
  if (showCountdown && isCooperativeQuest) {
    return (
      <View className="flex-1 items-center justify-center bg-primary-400">
        <Text className="mb-4 text-3xl font-bold text-white">Get Ready!</Text>
        <Text className="mb-8 text-xl text-white">Lock your phone in...</Text>
        <View className="mb-8 size-32 items-center justify-center rounded-full bg-white">
          <Text className="text-6xl font-bold text-primary-400">
            {countdownSeconds}
          </Text>
        </View>
        <Text className="text-lg text-white">
          All players must lock their phones to start
        </Text>
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
                <Text className="mb-4 text-center text-lg font-medium text-[#3B7A57]">
                  You're not alone on this journey!
                </Text>
                
                <Text className="mb-4 text-center text-base leading-6">
                  Together with your quest companion{cooperativeQuestRun?.participants?.length > 2 ? 's' : ''}, 
                  you'll embark on an adventure where your combined willpower 
                  creates something greater than the sum of its parts.
                </Text>

                <View className="my-4 border-b border-[#3B7A57]" />

                <Text className="mb-4 text-center text-lg font-medium">
                  Quest Companions
                </Text>

                {cooperativeQuestRun?.participants?.map((participant: any) => (
                  <View
                    key={participant.userId}
                    className="mb-2 flex-row items-center justify-center"
                  >
                    <Text className="text-base font-medium">
                      {participant.userId === user?.id
                        ? '✨ You'
                        : `🗡️ ${participant.userName || participant.characterName || 'Quest Companion'}`}
                    </Text>
                  </View>
                )) || (
                  <Text className="text-center text-base">
                    You and your quest companion
                  </Text>
                )}

                <View className="my-4 border-b border-[#3B7A57]" />

                <Text className="mb-4 text-center text-base font-medium">
                  🔒 Lock your phones together to begin
                </Text>
                
                <Text className="mb-6 text-center text-base leading-6">
                  When all companions lock their phones, your shared quest begins. 
                  Stay strong together - if one falls, all fall. But when you 
                  succeed, you'll share in the glory!
                </Text>

                <Text className="text-center text-sm italic text-neutral-600">
                  "In unity there is strength"
                </Text>
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
