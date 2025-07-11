import { BlurView } from 'expo-blur';
import { router } from 'expo-router';
import LottieView from 'lottie-react-native';
import React, { useEffect } from 'react';
import { ActivityIndicator, Image } from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useWebSocket } from '@/components/providers/websocket-provider';
import { Button, Text, View } from '@/components/ui';
import { Card } from '@/components/ui/card';
import colors from '@/components/ui/colors';
import { useCooperativeQuest } from '@/lib/hooks/use-cooperative-quest';
import { useQuestStore } from '@/store/quest-store';
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
  // Check both cooperativeQuestRun and the quest category
  const isCooperativeQuest =
    !!cooperativeQuestRun || pendingQuest?.category === 'cooperative';

  // Countdown state for cooperative quests ONLY
  const [showCountdown, setShowCountdown] = React.useState(false);
  const [countdownSeconds, setCountdownSeconds] = React.useState(5);

  // Initialize countdown only for cooperative quests after component mounts
  useEffect(() => {
    if (isCooperativeQuest) {
      setShowCountdown(true);
    }
  }, [isCooperativeQuest]);

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
        questCategory: pendingQuest?.category,
        hasCooperativeQuestRun: !!cooperativeQuestRun,
      });
    }
  }, [
    isCooperativeQuest,
    cooperativeQuestRun,
    user?.id,
    pendingQuest?.category,
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

  // Log cooperative quest state for debugging
  useEffect(() => {
    if (pendingQuest && isCooperativeQuest && !cooperativeQuestRun) {
      console.warn(
        '[PendingQuest] Cooperative quest without quest run data yet, waiting...'
      );
    }
  }, [pendingQuest, isCooperativeQuest, cooperativeQuestRun]);

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
      <View
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: colors.primary[400] }}
      >
        <Animated.Text
          entering={FadeIn.duration(500)}
          className="mb-4 text-3xl font-bold text-white"
          style={{ fontWeight: '700' }}
        >
          Get Ready!
        </Animated.Text>
        <Animated.Text
          entering={FadeIn.delay(200).duration(500)}
          className="mb-8 text-xl text-white"
        >
          Lock your phone in...
        </Animated.Text>
        <Animated.View
          entering={FadeIn.delay(400).duration(500)}
          className="mb-8 size-32 items-center justify-center rounded-full"
          style={{ backgroundColor: colors.white }}
        >
          <Text
            className="text-6xl font-bold"
            style={{ color: colors.primary[400], fontWeight: '700' }}
          >
            {countdownSeconds}
          </Text>
        </Animated.View>
        <Animated.Text
          entering={FadeIn.delay(600).duration(500)}
          className="px-8 text-center text-lg text-white"
        >
          All companions must lock together
        </Animated.Text>
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
          <Text className="text-2xl font-bold" style={{ fontWeight: '700' }}>
            {isCooperativeQuest
              ? 'Cooperative Quest'
              : displayQuest?.mode === 'custom'
                ? 'Custom Quest'
                : 'Quest Ready'}
          </Text>
        </Animated.View>

        <Animated.View className="flex-0" style={cardAnimatedStyle}>
          <Card
            className="rounded-xl p-6"
            style={{ backgroundColor: colors.cardBackground }}
          >
            <Animated.Text
              entering={FadeInDown.delay(300).duration(800)}
              className="mb-2 text-center text-xl font-semibold"
              style={{ fontWeight: '700' }}
            >
              {displayQuest?.title}
            </Animated.Text>
            <Animated.Text
              entering={FadeInDown.delay(400).duration(800)}
              className="mb-4 text-center text-base"
              style={{ color: colors.neutral[500] }}
            >
              {`${displayQuest?.durationMinutes} minutes`}
            </Animated.Text>

            {isCooperativeQuest ? (
              <>
                {/* Compass Animation */}
                <Animated.View
                  entering={FadeIn.delay(300).duration(800)}
                  className="items-center"
                >
                  <LottieView
                    source={require('@/../assets/animations/compass.json')}
                    autoPlay
                    loop
                    style={{ width: 120, height: 120 }}
                  />
                </Animated.View>

                {/* Motivational Header */}
                <Animated.Text
                  entering={FadeInDown.delay(600).duration(800)}
                  className="mb-2 text-center text-lg font-bold"
                  style={{ color: colors.primary[500], fontWeight: '700' }}
                >
                  Stronger Together
                </Animated.Text>

                {/* Concise Quest Info */}
                <Animated.Text
                  entering={FadeInDown.delay(900).duration(800)}
                  className="mb-6 text-center text-base"
                  style={{ color: colors.neutral[500] }}
                >
                  {cooperativeQuestRun?.participants?.length || 2} companions
                  embarking on this journey
                </Animated.Text>

                {/* Companions List */}
                <Animated.View
                  entering={FadeInDown.delay(1200).duration(800)}
                  className="mb-6"
                >
                  {cooperativeQuestRun?.participants?.map(
                    (participant: any, index: number) => (
                      <Animated.View
                        key={participant.userId}
                        entering={FadeInDown.delay(1200 + index * 100).duration(
                          600
                        )}
                        className="mb-2 flex-row items-center justify-center"
                      >
                        <Text
                          className="text-base"
                          style={{ fontWeight: '600' }}
                        >
                          {participant.userId === user?.id
                            ? '✨ You'
                            : `⚔️ ${participant.userName || participant.characterName || 'Quest Companion'}`}
                        </Text>
                      </Animated.View>
                    )
                  ) || (
                    <Text className="text-center text-base">
                      You and your quest companion
                    </Text>
                  )}
                </Animated.View>

                {/* Lock Instructions */}
                <Animated.View
                  entering={FadeInDown.delay(1500).duration(800)}
                  className="rounded-lg p-4"
                  style={{ backgroundColor: colors.primary[100] }}
                >
                  <Text
                    className="text-center text-base font-semibold"
                    style={{ color: colors.primary[500], fontWeight: '700' }}
                  >
                    🔒 Lock phones to begin
                  </Text>
                  <Text
                    className="mt-2 text-center text-sm"
                    style={{ color: colors.primary[400] }}
                  >
                    All companions must lock together
                  </Text>
                </Animated.View>
              </>
            ) : (
              <>
                {/* Single Quest Compass Animation */}
                <Animated.View
                  entering={FadeIn.delay(300).duration(800)}
                  className="mb-4 items-center"
                >
                  <LottieView
                    source={require('@/../assets/animations/compass.json')}
                    autoPlay
                    loop
                    style={{ width: 100, height: 100 }}
                  />
                </Animated.View>

                {/* Single Quest Hero Message */}
                <Animated.Text
                  entering={FadeInDown.delay(600).duration(800)}
                  className="mb-2 text-center text-lg font-bold"
                  style={{ color: colors.primary[500], fontWeight: '700' }}
                >
                  Your Journey Begins
                </Animated.Text>

                <Animated.Text
                  entering={FadeInDown.delay(800).duration(800)}
                  className="mb-6 text-center text-base"
                  style={{ color: colors.neutral[500] }}
                >
                  {displayQuest?.mode === 'custom'
                    ? 'Time to focus on what matters most'
                    : 'Your character is ready for their quest'}
                </Animated.Text>

                {/* Lock Instructions */}
                <Animated.View
                  entering={FadeInDown.delay(1000).duration(800)}
                  className="rounded-lg p-4"
                  style={{ backgroundColor: colors.primary[100] }}
                >
                  <Text
                    className="text-center text-base font-semibold"
                    style={{ color: colors.primary[500], fontWeight: '700' }}
                  >
                    🔒 Lock your phone to begin
                  </Text>
                  <Text
                    className="mt-2 text-center text-sm"
                    style={{ color: colors.primary[400] }}
                  >
                    Stay focused • Complete your quest • Earn rewards
                  </Text>
                </Animated.View>

                {/* Motivational Quote for Single Player */}
                <Animated.Text
                  entering={FadeInDown.delay(1200).duration(800)}
                  className="mt-4 text-center text-sm italic"
                  style={{ color: colors.neutral[400] }}
                >
                  "The journey of a thousand miles begins with a single step"
                </Animated.Text>
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
            <Text
              className="text-base font-semibold"
              style={{ fontWeight: '700' }}
            >
              Cancel Quest
            </Text>
          </Button>
        </Animated.View>
      </View>
    </View>
  );
}
