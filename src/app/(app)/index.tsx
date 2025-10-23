import { FlashList } from '@shopify/flash-list';
import { usePostHog } from 'posthog-react-native';
import React, { useEffect, useState } from 'react';
import { Image } from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { AVAILABLE_QUESTS } from '@/app/data/quests';
import { getMapNameForQuest } from '@/app/utils/map-utils';
import { useCarouselState } from '@/app/(app)/home/hooks/use-carousel-state';
import { useHomeData } from '@/app/(app)/home/hooks/use-home-data';
import { useStoryOptions } from '@/app/(app)/home/hooks/use-story-options';
import { useQuestSelection } from '@/app/(app)/home/hooks/use-quest-selection';
import { StoryOptionButtons } from '@/app/(app)/home/components/story-option-buttons';
import {
  CARD_WIDTH,
  CARD_HEIGHT,
  CARD_SPACING,
  SNAP_INTERVAL,
  QUEST_MODES,
  CAROUSEL_CONTENT_PADDING,
  CAROUSEL_VERTICAL_PADDING,
} from '@/app/(app)/home/constants';
import QuestCard from '@/components/home/quest-card';
import { BranchingStoryAnnouncementModal } from '@/components/modals/branching-story-announcement-modal';
import { PremiumPaywall } from '@/components/paywall';
import { StreakCounter } from '@/components/StreakCounter';
import {
  Button,
  FocusAwareStatusBar,
  ScreenContainer,
  ScreenHeader,
  View,
} from '@/components/ui';
import Colors from '@/components/ui/colors';
import { useAudioPreloader } from '@/hooks/use-audio-preloader';
import { useServerQuests } from '@/hooks/use-server-quests';
import { usePremiumAccess } from '@/lib/hooks/use-premium-access';
import QuestTimer from '@/lib/services/quest-timer';
import { refreshPremiumStatus as refreshServerPremium } from '@/lib/services/user';
import { useQuestStore } from '@/store/quest-store';
import { useSettingsStore } from '@/store/settings-store';
import { type StoryQuestTemplate } from '@/store/types';
import { useUserStore } from '@/store/user-store';

export default function Home() {
  const activeQuest = useQuestStore((state) => state.activeQuest);
  const pendingQuest = useQuestStore((state) => state.pendingQuest);
  const refreshAvailableQuests = useQuestStore(
    (state) => state.refreshAvailableQuests
  );
  const availableQuests = useQuestStore((state) => state.availableQuests);

  // Premium access state
  const [showPaywallModal, setShowPaywallModal] = useState(false);
  const { handlePaywallSuccess } = usePremiumAccess();

  // Carousel state with paywall reset
  const { activeIndex, setActiveIndex, progress, handleMomentumScrollEnd } =
    useCarouselState({
      onPaywallReset: () => {
        if (showPaywallModal) {
          setShowPaywallModal(false);
        }
      },
    });

  // Branching story announcement state
  const [showBranchingAnnouncement, setShowBranchingAnnouncement] =
    useState(false);
  const hasSeenBranchingAnnouncement = useSettingsStore(
    (state) => state.hasSeenBranchingAnnouncement
  );
  const hasCompletedFirstQuest = useSettingsStore(
    (state) => state.hasCompletedFirstQuest
  );


  // Use server-driven quests
  const {
    serverQuests,
    options: serverOptions,
    storylineProgress,
    isLoading: isLoadingQuests,
  } = useServerQuests();
  const completedQuests = useQuestStore((state) => state.completedQuests);
  const prepareQuest = useQuestStore((state) => state.prepareQuest);
  const user = useUserStore((state) => state.user);
  const posthog = usePostHog();

  // Preload audio files for upcoming quests
  useAudioPreloader({ storylineId: 'vaedros', enabled: true });

  // Use extracted hooks for data management
  const { carouselData, currentMapName, storyProgress, isStorylineComplete } =
    useHomeData({
      serverQuests,
      availableQuests,
      storyOptions: [],
      completedQuests,
      isLoadingQuests,
      storylineProgress,
      totalStoryQuests: AVAILABLE_QUESTS.filter(
        (quest) => quest.mode === 'story' && !/quest-\d+b$/.test(quest.id)
      ).length,
    });

  const { storyOptions } = useStoryOptions({
    completedQuests,
    activeQuest,
    pendingQuest,
    serverOptions,
    serverQuests,
  });

  const {
    handleQuestOptionSelect,
    handleStartCustomQuest,
    handleCooperativeQuest,
  } = useQuestSelection({
    serverQuests,
    serverOptions,
  });

  // Animation values
  const headerOpacity = useSharedValue(0);
  const contentOpacity = useSharedValue(0);
  const contentTranslateY = useSharedValue(50);
  const scrollContainerOpacity = useSharedValue(1);
  const animatedScrollStyle = useAnimatedStyle(() => ({
    opacity: scrollContainerOpacity.value,
  }));


  // Check for stuck cooperative quest and clean it up
  useEffect(() => {
    if (activeQuest && activeQuest.startTime) {
      // If there's an active quest with a start time but QuestTimer isn't tracking it
      const isQuestTimerRunning = QuestTimer.isRunning();

      if (!isQuestTimerRunning) {
        console.warn('Found stuck active quest, cleaning up...', activeQuest);
        // This quest was likely a cooperative quest that started prematurely
        useQuestStore.getState().failQuest();
      }
    }
  }, [activeQuest]);

  // Check if branching story announcement should be shown
  useEffect(() => {
    // Only show if user hasn't seen it and has completed at least quest-1
    if (!hasSeenBranchingAnnouncement && hasCompletedFirstQuest) {
      // Delay showing the modal slightly to let the screen load
      const timer = setTimeout(() => {
        setShowBranchingAnnouncement(true);
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [hasSeenBranchingAnnouncement, hasCompletedFirstQuest]);

  // Refresh available quests when there's no active quest
  // Only use local refresh if server quests aren't being used
  useEffect(() => {
    if (!activeQuest && !pendingQuest && serverQuests.length === 0) {
      refreshAvailableQuests();
    }
  }, [activeQuest, pendingQuest, refreshAvailableQuests, serverQuests.length]);

  // User data should already be loaded from auth hydration
  // The component will re-render when user data changes

  // Initialize animations
  useEffect(() => {
    headerOpacity.value = withDelay(450, withTiming(1, { duration: 1000 }));
    contentOpacity.value = withDelay(1000, withTiming(1, { duration: 1000 }));
    contentTranslateY.value = withDelay(1000, withSpring(0));
  }, [contentOpacity, contentTranslateY, headerOpacity]);

  // Check premium access for cooperative quests
  const {
    hasPremiumAccess: hasCoopAccess,
    checkPremiumAccess,
    refreshPremiumStatus,
  } = usePremiumAccess();

  // Also get hasPremiumAccess without renaming for use in other places
  const { hasPremiumAccess } = usePremiumAccess();


  // Check premium status on mount
  // RevenueCat SDK handles caching and offline scenarios automatically
  useEffect(() => {
    refreshPremiumStatus();

    // TEMPORARY: Force refresh server premium status on app load for testing
    // TODO: Remove this after testing
    refreshServerPremium().catch((error) => {
      console.error('[Home] Server premium refresh error:', error);
    });
  }, []);

  // Animated background style based on carousel progress
  const backgroundStyle = useAnimatedStyle(() => {
    const inputRange = [0, 1, 2]; // Always have 3 modes now
    const outputRange = [QUEST_MODES[0].color, QUEST_MODES[1].color, QUEST_MODES[2].color];

    const backgroundColor = interpolateColor(
      progress.value,
      inputRange,
      outputRange
    );

    return {
      backgroundColor,
    };
  });

  // Render item for the carousel
  const renderCarouselItem = ({ item }: { item: any }) => {
    return (
      <View style={{ width: CARD_WIDTH }}>
        <QuestCard
          mode={item.mode}
          title={item.title}
          subtitle={item.subtitle}
          duration={item.duration}
          xp={item.xp}
          key={item.id}
          description={item.recap || ''}
          progress={item.progress}
          showProgress={item.mode === 'story'}
          requiresPremium={item.isPremium && !hasPremiumAccess}
          isCompleted={item.mode === 'story' && isStorylineComplete}
        />
      </View>
    );
  };

  // Track premium CTA view
  const PremiumCTATracker = ({
    questId,
    type,
  }: {
    questId?: string;
    type: 'storyline' | 'cooperative';
  }) => {
    useEffect(() => {
      if (type === 'storyline') {
        posthog.capture('premium_upsell_cta_viewed', {
          upsell_type: 'storyline_quest',
          trigger_location: 'home_storyline',
          quest_type: 'story',
          quest_id: questId,
        });
      } else {
        posthog.capture('premium_upsell_cta_viewed', {
          upsell_type: 'cooperative_quest',
          trigger_location: 'home_carousel',
          quest_type: 'cooperative',
        });
      }
    }, [questId, type]);
    return null;
  };


  return (
    <View className="flex-1">
      <FocusAwareStatusBar />

      {/* Background */}
      <View className="absolute inset-0">
        <StreakCounter size="small" position="topRight" />
        <Image
          source={require('@/../assets/images/background/pending-quest-bg-alt.png')}
          className="size-full"
          resizeMode="cover"
        />
        <Animated.View
          style={[
            backgroundStyle,
            {
              position: 'absolute',
              width: '100%',
              height: '100%',
              opacity: 0.6,
            },
          ]}
        />
      </View>

      <ScreenContainer className="flex-col">
        {/* Header */}
        <ScreenHeader
          title="Choose Your Adventure"
          subtitle="Continue your epic story, create a quest of your own design, or play a cooperative quest with a friend."
        />

        {/* Main content area */}
        <View className="flex-1 justify-center">
          <Animated.View
            style={[animatedScrollStyle, { height: CARD_HEIGHT + 20 }]}
          >
            <FlashList
              data={carouselData}
              horizontal
              snapToInterval={SNAP_INTERVAL}
              decelerationRate="fast"
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.id}
              initialScrollIndex={0} // Start at the first item
              contentContainerStyle={{
                paddingHorizontal: CAROUSEL_CONTENT_PADDING,
                paddingVertical: CAROUSEL_VERTICAL_PADDING,
              }}
              ItemSeparatorComponent={() => (
                <View style={{ width: CARD_SPACING }} />
              )}
              onMomentumScrollEnd={handleMomentumScrollEnd}
              renderItem={renderCarouselItem}
              estimatedItemSize={CARD_WIDTH}
              removeClippedSubviews={true} // improves performance by clipping offscreen items
            />
          </Animated.View>
        </View>

        {/* Footer area with buttons */}
        {!activeQuest && !pendingQuest && (
          <View
            className="items-center justify-center"
            style={{ minHeight: 140 }}
          >
            {activeIndex === 0 ? (
              <StoryOptionButtons
                activeIndex={activeIndex}
                serverQuests={serverQuests}
                storyOptions={storyOptions}
                isStorylineComplete={isStorylineComplete}
                hasPremiumAccess={hasPremiumAccess}
                onQuestSelect={handleQuestOptionSelect}
                onShowPaywall={() => setShowPaywallModal(true)}
              />
            ) : activeIndex === 1 ? (
              // Show create custom quest button for custom mode
              <Animated.View
                entering={FadeIn.duration(600).delay(200)}
                className="w-full items-center px-4"
              >
                <Animated.View
                  entering={FadeInDown.duration(600).delay(400)}
                  style={{
                    width: CARD_WIDTH,
                    shadowColor: Colors.black,
                    shadowOffset: {
                      width: 0,
                      height: 3,
                    },
                    shadowOpacity: 0.12,
                    shadowRadius: 4,
                    elevation: 6,
                  }}
                >
                  <Button
                    label="Create Custom Quest"
                    onPress={handleStartCustomQuest}
                    className="h-16 justify-center rounded-xl bg-primary-300 p-3"
                    textClassName="text-sm text-white text-center leading-snug"
                    textStyle={{ fontWeight: '700' }}
                  />
                </Animated.View>
              </Animated.View>
            ) : activeIndex === 2 ? (
              // Show cooperative quest button for cooperative mode
              <Animated.View
                entering={FadeIn.duration(600).delay(200)}
                className="w-full items-center px-4"
              >
                {!hasCoopAccess && <PremiumCTATracker type="cooperative" />}
                <Animated.View
                  entering={FadeInDown.duration(600).delay(400)}
                  style={{
                    width: CARD_WIDTH,
                    shadowColor: Colors.black,
                    shadowOffset: {
                      width: 0,
                      height: 3,
                    },
                    shadowOpacity: 0.12,
                    shadowRadius: 4,
                    elevation: 6,
                  }}
                >
                  <Button
                    label={
                      hasCoopAccess
                        ? 'Cooperative Quests'
                        : 'Unlock Cooperative Mode'
                    }
                    onPress={() => {
                      if (hasCoopAccess) {
                        handleCooperativeQuest();
                      } else {
                        posthog.capture('premium_upsell_cta_clicked', {
                          upsell_type: 'cooperative_quest',
                          trigger_location: 'home_carousel',
                          quest_type: 'cooperative',
                        });
                        setShowPaywallModal(true);
                      }
                    }}
                    className={`h-16 justify-center rounded-xl p-3 ${
                      hasCoopAccess ? 'bg-primary-300' : 'bg-amber-400'
                    }`}
                    textClassName="text-sm text-white text-center leading-snug"
                    textStyle={{ fontWeight: '700' }}
                  />
                </Animated.View>
              </Animated.View>
            ) : null}
          </View>
        )}
      </ScreenContainer>

      {/* Premium Paywall Modal */}
      <PremiumPaywall
        isVisible={showPaywallModal}
        onClose={() => {
          setShowPaywallModal(false);
        }}
        onSuccess={async () => {
          setShowPaywallModal(false);

          // Force refresh premium status
          await refreshPremiumStatus();

          // Call the hook's success handler
          handlePaywallSuccess();

          // Refresh quests to update premium access
          refreshAvailableQuests();
        }}
        featureName={
          activeIndex === 2 ? 'Cooperative Quests' : 'Vaedros Storyline Quests'
        }
      />

      {/* Branching Story Announcement Modal */}
      <BranchingStoryAnnouncementModal
        visible={showBranchingAnnouncement}
        onClose={() => setShowBranchingAnnouncement(false)}
      />
    </View>
  );
}
