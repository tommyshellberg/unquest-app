import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { usePostHog } from 'posthog-react-native';
import React, { useEffect, useState } from 'react';
import { Dimensions, Image } from 'react-native';
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

import { type QuestOption } from '@/api/quest/types';
import { AVAILABLE_QUESTS } from '@/app/data/quests';
import { getMapNameForQuest } from '@/app/utils/map-utils';
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
import { useQuestStore } from '@/store/quest-store';
import { useSettingsStore } from '@/store/settings-store';
import { type StoryQuestTemplate } from '@/store/types';
import { useUserStore } from '@/store/user-store';

// Define screen dimensions for the carousel
const screenWidth = Dimensions.get('window').width;
const cardWidth = screenWidth * 0.75; // each card takes 75% of screen width
const cardSpacing = 16; // spacing between cards
const snapInterval = cardWidth + cardSpacing; // adjust snap to include spacing
const cardHeight = cardWidth * (4 / 3); // Height based on 3:4 aspect ratio

// Define our modes
const MODES = [
  { id: 'story', name: 'Story Mode', color: 'rgba(194, 199, 171, 0.9)' },
  { id: 'custom', name: 'Free Play Mode', color: 'rgba(146, 185, 191, 0.9)' },
  {
    id: 'cooperative',
    name: 'Cooperative Quest',
    color: 'rgba(106, 177, 185, 0.9)',
  },
];

export default function Home() {
  const router = useRouter();
  const activeQuest = useQuestStore((state) => state.activeQuest);
  const pendingQuest = useQuestStore((state) => state.pendingQuest);
  const refreshAvailableQuests = useQuestStore(
    (state) => state.refreshAvailableQuests
  );
  const availableQuests = useQuestStore((state) => state.availableQuests);

  // Premium access state
  const [showPaywallModal, setShowPaywallModal] = useState(false);
  const { handlePaywallSuccess } = usePremiumAccess();

  // Branching story announcement state
  const [showBranchingAnnouncement, setShowBranchingAnnouncement] = useState(false);
  const hasSeenBranchingAnnouncement = useSettingsStore(
    (state) => state.hasSeenBranchingAnnouncement
  );
  const hasCompletedFirstQuest = useSettingsStore(
    (state) => state.hasCompletedFirstQuest
  );

  // Debug paywall modal state
  useEffect(() => {
    console.log('[Paywall Modal] State changed:', showPaywallModal);
  }, [showPaywallModal]);

  // Reset paywall modal when carousel index changes
  useEffect(() => {
    if (showPaywallModal) {
      console.log('[Paywall Modal] Resetting due to carousel swipe');
      setShowPaywallModal(false);
    }
  }, [activeIndex]);

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
  // State for story choices - now primarily from server
  const [storyOptions, setStoryOptions] = useState<QuestOption[]>([]);

  // Carousel state
  const [activeIndex, setActiveIndex] = useState(0);
  const progress = useSharedValue(0);

  // Get current map name based on next quest - prefer server data
  const currentMapName =
    serverQuests.length > 0
      ? getMapNameForQuest(serverQuests[0].customId)
      : availableQuests.length > 0
        ? getMapNameForQuest(availableQuests[0].id)
        : 'Vaedros Kingdom';

  // Calculate story progress - prefer server data if available
  const storyProgress = storylineProgress
    ? storylineProgress.progressPercentage / 100
    : completedQuests.filter((quest) => quest.mode === 'story').length /
      AVAILABLE_QUESTS.filter(
        (quest) => quest.mode === 'story' && !/quest-\d+b$/.test(quest.id)
      ).length;

  // Check if the storyline is complete
  const isStorylineComplete = storyProgress >= 0.999; // Account for floating point precision

  // Animation values
  const headerOpacity = useSharedValue(0);
  const contentOpacity = useSharedValue(0);
  const contentTranslateY = useSharedValue(50);
  const scrollContainerOpacity = useSharedValue(1);
  const animatedScrollStyle = useAnimatedStyle(() => ({
    opacity: scrollContainerOpacity.value,
  }));

  useEffect(() => {
    console.log('Home screen is mounting');
  }, []);

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

  // Get next quest options - prefer server data when available
  useEffect(() => {
    console.log('🔄 Story options useEffect running');
    console.log('🔄 Server options available:', serverOptions.length);
    console.log('🔄 Server quests available:', serverQuests.length);
    console.log('🔄 activeQuest:', activeQuest);
    console.log('🔄 pendingQuest:', pendingQuest);

    if (activeQuest || pendingQuest) {
      console.log('🔄 Returning early due to active/pending quest');
      return;
    }

    // If we have multiple server quests, create options from their decisionText
    // This represents branching paths where each quest has its own decision text
    if (serverQuests.length > 1) {
      console.log(
        '🔄 Creating options from multiple server quests with decisionText'
      );
      const optionsFromQuests = serverQuests.map((quest, index) => ({
        id: `option-${index}`,
        text: quest.decisionText || 'Continue', // Use each quest's decisionText
        nextQuestId: quest.customId,
        nextQuest: quest,
      }));
      setStoryOptions(optionsFromQuests);
      return;
    }

    // If we have a single server quest with decisionText, create a single option
    if (serverQuests.length === 1 && serverQuests[0].decisionText) {
      console.log(
        '🔄 Creating single option from server quest with decisionText'
      );
      const optionsFromQuest = [
        {
          id: 'option-0',
          text: serverQuests[0].decisionText,
          nextQuestId: serverQuests[0].customId,
          nextQuest: serverQuests[0],
        },
      ];
      setStoryOptions(optionsFromQuest);
      return;
    }

    // Only use serverOptions as a fallback if no quests with decisionText
    if (serverOptions.length > 0) {
      console.log('🔄 Using server options as fallback:', serverOptions);
      setStoryOptions(serverOptions);
      return;
    }

    // Fallback to local logic if server data not available
    console.log('🔄 Falling back to local quest logic');
    const storyQuests = completedQuests.filter(
      (quest) => quest.mode === 'story'
    );

    if (storyQuests.length === 0) {
      // No completed story quests - show first quest
      const firstQuest = AVAILABLE_QUESTS.find(
        (quest) => quest.mode === 'story'
      );
      if (firstQuest && firstQuest.mode === 'story' && firstQuest.options) {
        setStoryOptions(firstQuest.options);
      } else {
        throw new Error('No story quests found');
      }
    } else {
      // Get the last completed story quest
      const lastCompletedQuest = storyQuests[storyQuests.length - 1];
      console.log('lastCompletedQuest', lastCompletedQuest.id);

      // Find this quest in the AVAILABLE_QUESTS array to get its options
      const questData = AVAILABLE_QUESTS.find(
        (q) => q.id === lastCompletedQuest.id
      );

      if (
        questData &&
        questData.mode === 'story' &&
        questData.options &&
        questData.options.length > 0
      ) {
        console.log(
          '🔄 Setting story options from local data:',
          questData.options
        );
        setStoryOptions(questData.options);
      } else {
        console.log('🔄 No options found, setting empty');
        setStoryOptions([]);
      }
    }
  }, [completedQuests, activeQuest, pendingQuest, serverOptions, serverQuests]);

  // Refresh available quests when there's no active quest
  // Only use local refresh if server quests aren't being used
  useEffect(() => {
    if (!activeQuest && !pendingQuest && serverQuests.length === 0) {
      console.log('➡️ refreshing available quests locally');
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

  // Function to handle quest option selection
  const handleQuestOptionSelect = async (nextQuestId: string | null) => {
    console.log(
      '[handleQuestOptionSelect] Called with nextQuestId:',
      nextQuestId
    );
    posthog.capture('try_trigger_start_quest');
    if (!nextQuestId) {
      console.log(
        '[handleQuestOptionSelect] No nextQuestId provided, returning'
      );
      return;
    }

    // First check if this is an option quest (from serverOptions)
    let selectedQuest = null;
    const selectedOption = serverOptions.find(
      (opt) => opt.nextQuestId === nextQuestId
    );
    if (selectedOption && selectedOption.nextQuest) {
      console.log(
        '[handleQuestOptionSelect] Found quest in server options:',
        selectedOption.nextQuest
      );
      selectedQuest = selectedOption.nextQuest;
    } else {
      // Then check server quests
      selectedQuest = serverQuests.find(
        (quest) => quest.customId === nextQuestId
      );
    }

    // Convert server quest to client format if found
    if (selectedQuest) {
      const clientQuest = {
        ...selectedQuest,
        id: selectedQuest.customId,
        _id: selectedQuest._id, // Preserve MongoDB ID
        mode: selectedQuest.mode as 'story' | 'custom',
      };
      console.log('🎯 Selected server quest:', clientQuest);
      console.log('[handleQuestOptionSelect] Quest details:', {
        id: clientQuest.id,
        _id: clientQuest._id,
        customId: clientQuest.customId,
        mode: clientQuest.mode,
        title: clientQuest.title,
      });
      console.log(
        '[handleQuestOptionSelect] About to call prepareQuest on store'
      );
      posthog.capture('trigger_start_quest');
      prepareQuest(clientQuest as StoryQuestTemplate);
      console.log(
        '[handleQuestOptionSelect] Called prepareQuest on store, now calling QuestTimer.prepareQuest'
      );
      try {
        await QuestTimer.prepareQuest(clientQuest as StoryQuestTemplate);
        console.log(
          '[handleQuestOptionSelect] QuestTimer.prepareQuest completed successfully'
        );
        posthog.capture('success_start_quest');
      } catch (error) {
        console.error(
          '[handleQuestOptionSelect] QuestTimer.prepareQuest failed:',
          error
        );
        console.error(
          '[handleQuestOptionSelect] Error stack:',
          error instanceof Error ? error.stack : 'No stack'
        );
        throw error;
      }
    } else {
      // Fallback to local quest data
      const localQuest = AVAILABLE_QUESTS.find(
        (quest) => quest.id === nextQuestId
      );

      if (localQuest) {
        console.log('🎯 Selected local quest:', localQuest);
        posthog.capture('trigger_start_quest');
        prepareQuest(localQuest);
        await QuestTimer.prepareQuest(localQuest);
        posthog.capture('success_start_quest');
      } else {
        console.error(
          '[handleQuestOptionSelect] No quest found for nextQuestId:',
          nextQuestId
        );
        console.error(
          '[handleQuestOptionSelect] Available server quests:',
          serverQuests.map((q) => q.customId)
        );
        console.error(
          '[handleQuestOptionSelect] Available server options:',
          serverOptions.map((opt) => ({
            nextQuestId: opt.nextQuestId,
            hasNextQuest: !!opt.nextQuest,
          }))
        );
        console.error(
          '[handleQuestOptionSelect] Available local quests:',
          AVAILABLE_QUESTS.map((q) => q.id)
        );
      }
    }
  };

  // Handle custom quest button
  const handleStartCustomQuest = () => {
    try {
      router.push('/custom-quest');
    } catch (error) {
      console.error('Error navigating to custom quest:', error);
    }
  };

  // Handle cooperative quest button
  const handleCooperativeQuest = () => {
    try {
      posthog.capture('cooperative_quest_card_clicked');
      router.push('/cooperative-quest-menu');
    } catch (error) {
      console.error('Error navigating to cooperative quest menu:', error);
    }
  };

  // Check premium access for cooperative quests
  const {
    hasPremiumAccess: hasCoopAccess,
    checkPremiumAccess,
    refreshPremiumStatus,
  } = usePremiumAccess();

  // Also get hasPremiumAccess without renaming for use in other places
  const { hasPremiumAccess } = usePremiumAccess();

  // Debug log to understand timing
  useEffect(() => {
    console.log('[Home] User state:', user ? 'loaded' : 'not loaded');
    console.log('[Home] Has premium access for coop:', hasCoopAccess);
  }, [user, hasCoopAccess]);

  // Check premium status on mount
  // RevenueCat SDK handles caching and offline scenarios automatically
  useEffect(() => {
    console.log('[Home] Initial premium status check');
    refreshPremiumStatus();

    // TEMPORARY: Force refresh server premium status on app load for testing
    // TODO: Remove this after testing
    console.log('[Home] TEMP: Force refreshing server premium status...');
    import('@/lib/services/user').then(
      ({ refreshPremiumStatus: refreshServerPremium }) => {
        refreshServerPremium()
          .then((response) => {
            console.log(
              '[Home] TEMP: Server premium refresh response:',
              response
            );
          })
          .catch((error) => {
            console.error('[Home] TEMP: Server premium refresh error:', error);
          });
      }
    );
  }, []);

  // Prepare carousel data - prefer server data when available
  const carouselData = [
    {
      id: 'story',
      mode: 'story',
      title:
        serverQuests.length > 0
          ? serverQuests[0].title
          : availableQuests.length > 0
            ? availableQuests[0].title
            : storyOptions.length > 0
              ? 'Choose Your Path'
              : isLoadingQuests
                ? 'Loading quests...'
                : 'No quests available',
      recap: (() => {
        // Use server quest recap if available
        if (serverQuests.length > 0 && serverQuests[0].recap) {
          return serverQuests[0].recap;
        }

        // Get the last completed story quest for the recap
        const storyQuests = completedQuests.filter(
          (quest) => quest.mode === 'story' && quest.status === 'completed'
        );

        if (storyQuests.length > 0) {
          // Use the recap from the most recently completed story quest
          const lastCompletedStoryQuest = [...storyQuests].sort(
            (a, b) => (b.stopTime || 0) - (a.stopTime || 0)
          )[0];
          return (
            (lastCompletedStoryQuest as any)?.recap || 'Continue your journey'
          );
        }

        // Fallback if no story quests completed
        return serverQuests.length > 0 || availableQuests.length > 0
          ? 'Begin your journey'
          : 'Continue your journey';
      })(),
      subtitle: currentMapName,
      duration:
        serverQuests.length > 0
          ? serverQuests[0].durationMinutes
          : availableQuests.length > 0
            ? availableQuests[0].durationMinutes
            : storyOptions.length > 0 && storyOptions[0].nextQuestId
              ? AVAILABLE_QUESTS.find(
                  (q) => q.id === storyOptions[0].nextQuestId
                )?.durationMinutes || 0
              : 0,
      xp:
        serverQuests.length > 0
          ? serverQuests[0].reward.xp
          : availableQuests.length > 0
            ? availableQuests[0].reward.xp
            : storyOptions.length > 0 && storyOptions[0].nextQuestId
              ? AVAILABLE_QUESTS.find(
                  (q) => q.id === storyOptions[0].nextQuestId
                )?.reward.xp || 0
              : 0,
      progress: storyProgress,
      isPremium: serverQuests.length > 0 ? serverQuests[0].isPremium : false,
    },
    {
      id: 'custom',
      mode: 'custom',
      title: 'Start Custom Quest',
      subtitle: 'Free Play Mode',
      recap:
        'Start a custom quest and embark on an adventure of your own design.',
      duration: 5,
      xp: 15,
    },
  ];

  // Always add cooperative quest card (premium feature)
  carouselData.push({
    id: 'cooperative',
    mode: 'cooperative',
    title: 'Cooperative Quest',
    subtitle: 'Team Challenge',
    recap:
      'Invite a friend on a quest or join a quest and stay off your phone together',
    duration: 5,
    xp: 15,
    isPremium: true, // Cooperative quests are always premium
  });

  // Animated background style based on carousel progress
  const backgroundStyle = useAnimatedStyle(() => {
    const inputRange = [0, 1, 2]; // Always have 3 modes now
    const outputRange = [MODES[0].color, MODES[1].color, MODES[2].color];

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
      <View style={{ width: cardWidth }}>
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

  // Render story quest option buttons
  const renderStoryOptions = () => {
    if (activeIndex !== 0) return null; // Only show for story mode

    // Debug logging

    // If there's a single server quest available with no branching, show start button
    if (serverQuests.length === 1 && storyOptions.length === 0) {
      const quest = serverQuests[0];
      console.log('[renderStoryOptions] Single server quest:', quest);
      console.log(
        '[renderStoryOptions] isStorylineComplete:',
        isStorylineComplete
      );
      return (
        <Animated.View
          entering={FadeIn.duration(600).delay(200)}
          className="w-full items-center px-4"
        >
          {quest.isPremium && !hasPremiumAccess && (
            <PremiumCTATracker questId={quest.customId} type="storyline" />
          )}
          <Animated.View
            entering={FadeInDown.duration(600).delay(400)}
            style={{
              width: cardWidth,
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
                quest.isPremium && !hasPremiumAccess
                  ? 'Unlock full Vaedros storyline'
                  : isStorylineComplete
                    ? 'Begin your journey'
                    : 'Start Quest'
              }
              onPress={() => {
                console.log(
                  '[Story Quest Button] Pressed - isPremium:',
                  quest.isPremium,
                  'hasPremiumAccess:',
                  hasPremiumAccess
                );
                if (!quest.isPremium || hasPremiumAccess) {
                  handleQuestOptionSelect(quest.customId);
                } else {
                  console.log(
                    '[Story Quest Button] Setting showPaywallModal to true'
                  );
                  posthog.capture('premium_upsell_cta_clicked', {
                    upsell_type: 'storyline_quest',
                    trigger_location: 'home_storyline',
                    quest_type: 'story',
                    quest_id: quest.customId,
                  });
                  setShowPaywallModal(true);
                }
              }}
              className={`h-16 justify-center rounded-xl p-3 ${
                quest.isPremium && !hasPremiumAccess
                  ? 'bg-amber-400'
                  : 'bg-primary-300'
              }`}
              textClassName="text-sm text-white text-center leading-snug"
              textStyle={{ fontWeight: '700' }}
            />
          </Animated.View>
        </Animated.View>
      );
    }

    if (storyOptions.length === 0) {
      console.log('⚠️ No story options available');
      return null;
    }

    // Single option gets same treatment as multi-option
    if (storyOptions.length === 1) {
      const option = storyOptions[0];
      const nextQuest =
        option.nextQuest ||
        serverQuests.find((q) => q.customId === option.nextQuestId);
      const questIsPremium = nextQuest?.isPremium || false;

      return (
        <Animated.View
          entering={FadeIn.duration(600).delay(200)}
          className="w-full items-center px-4"
        >
          <Animated.View
            entering={FadeInDown.duration(600).delay(400)}
            style={{
              width: cardWidth,
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
                questIsPremium && !hasPremiumAccess
                  ? 'Unlock full Vaedros storyline'
                  : isStorylineComplete
                    ? 'Begin your journey'
                    : option.text
              }
              onPress={() => {
                if (questIsPremium && !hasPremiumAccess) {
                  posthog.capture('premium_upsell_cta_clicked', {
                    upsell_type: 'storyline_quest',
                    trigger_location: 'home_storyline_options',
                    quest_type: 'story',
                    quest_id: option.nextQuestId,
                  });
                  setShowPaywallModal(true);
                } else {
                  handleQuestOptionSelect(option.nextQuestId);
                }
              }}
              className={`h-16 justify-center rounded-xl p-3 ${
                questIsPremium && !hasPremiumAccess
                  ? 'bg-amber-400'
                  : 'bg-primary-300'
              }`}
              textClassName="text-sm text-white text-center leading-snug"
              textStyle={{ fontWeight: '700' }}
              disabled={!option.nextQuestId}
            />
          </Animated.View>
        </Animated.View>
      );
    }

    // Multiple options with arrow animations

    // Check if any options lead to premium content
    const anyOptionsPremium = storyOptions.some((option) => {
      const nextQuest =
        option.nextQuest ||
        serverQuests.find((q) => q.customId === option.nextQuestId);
      return nextQuest?.isPremium || false;
    });

    // If any options are premium and user doesn't have access, show a single unlock button
    if (anyOptionsPremium && !hasPremiumAccess) {
      return (
        <Animated.View
          entering={FadeIn.duration(600).delay(200)}
          className="w-full items-center px-4"
        >
          <Animated.View
            entering={FadeInDown.duration(600).delay(400)}
            style={{
              width: cardWidth,
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
              label="Unlock full Vaedros storyline"
              onPress={() => {
                console.log(
                  '[Story Options] Premium option detected - showing paywall'
                );
                setShowPaywallModal(true);
              }}
              className="h-16 justify-center rounded-xl bg-amber-400 p-3"
              textClassName="text-sm text-white text-center leading-snug"
              textStyle={{ fontWeight: '700' }}
            />
          </Animated.View>
        </Animated.View>
      );
    }

    return (
      <Animated.View
        entering={FadeIn.duration(600).delay(200)}
        className="w-full items-center px-4"
      >
        {/* Decision buttons */}
        <View className="w-full flex-row justify-between gap-3">
          {storyOptions.map((option: QuestOption, index: number) => {
            // Check if the next quest requires premium
            const nextQuest =
              option.nextQuest ||
              serverQuests.find((q) => q.customId === option.nextQuestId);
            const questIsPremium = nextQuest?.isPremium || false;

            return (
              <Animated.View
                key={option.id}
                entering={FadeInDown.duration(600).delay(400 + index * 100)}
                className="flex-1"
                style={{
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
                {questIsPremium && !hasPremiumAccess && (
                  <PremiumCTATracker
                    questId={option.nextQuestId || undefined}
                    type="storyline"
                  />
                )}
                <Button
                  label={
                    questIsPremium && !hasPremiumAccess
                      ? 'Unlock full Vaedros storyline'
                      : isStorylineComplete
                        ? 'Begin your journey'
                        : option.text
                  }
                  onPress={() => {
                    if (questIsPremium && !hasPremiumAccess) {
                      posthog.capture('premium_upsell_cta_clicked', {
                        upsell_type: 'storyline_quest',
                        trigger_location: 'home_storyline_options',
                        quest_type: 'story',
                        quest_id: option.nextQuestId,
                      });
                      setShowPaywallModal(true);
                    } else {
                      handleQuestOptionSelect(option.nextQuestId);
                    }
                  }}
                  className={`h-16 justify-center rounded-xl p-3 ${
                    questIsPremium && !hasPremiumAccess
                      ? 'bg-amber-400'
                      : index === 0
                        ? 'bg-neutral-300'
                        : 'bg-primary-300'
                  }`}
                  textClassName="text-sm text-white text-center leading-snug"
                  textStyle={{ fontWeight: '700' }}
                  disabled={!option.nextQuestId} // Disable if nextQuestId is null
                />
              </Animated.View>
            );
          })}
        </View>
      </Animated.View>
    );
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
            style={[animatedScrollStyle, { height: cardHeight + 20 }]}
          >
            <FlashList
              data={carouselData}
              horizontal
              snapToInterval={snapInterval}
              decelerationRate="fast"
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.id}
              initialScrollIndex={0} // Start at the first item
              contentContainerStyle={{
                paddingHorizontal: (screenWidth - cardWidth) / 2 - cardSpacing,
                paddingVertical: 10,
              }}
              ItemSeparatorComponent={() => (
                <View style={{ width: cardSpacing }} />
              )}
              onMomentumScrollEnd={(event) => {
                const offsetX = event.nativeEvent.contentOffset.x;
                const newIndex = Math.round(offsetX / snapInterval);
                setActiveIndex(newIndex);
                progress.value = withTiming(newIndex, { duration: 300 });
              }}
              renderItem={renderCarouselItem}
              estimatedItemSize={cardWidth}
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
              renderStoryOptions()
            ) : activeIndex === 1 ? (
              // Show create custom quest button for custom mode
              <Animated.View
                entering={FadeIn.duration(600).delay(200)}
                className="w-full items-center px-4"
              >
                <Animated.View
                  entering={FadeInDown.duration(600).delay(400)}
                  style={{
                    width: cardWidth,
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
                    width: cardWidth,
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
                      console.log(
                        '[Coop Button] Pressed - hasCoopAccess:',
                        hasCoopAccess
                      );
                      if (hasCoopAccess) {
                        handleCooperativeQuest();
                      } else {
                        console.log(
                          '[Coop Button] Setting showPaywallModal to true'
                        );
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
          console.log('[Paywall Modal] onClose called');
          setShowPaywallModal(false);
        }}
        onSuccess={async () => {
          console.log('[Paywall Modal] onSuccess called');
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
