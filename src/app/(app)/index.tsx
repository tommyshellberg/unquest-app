import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Dimensions, Image } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { getRefreshToken } from '@/api/token';
import { AVAILABLE_QUESTS } from '@/app/data/quests';
import { getMapNameForQuest } from '@/app/utils/map-utils';
import QuestCard from '@/components/home/quest-card';
import { Button, FocusAwareStatusBar, Text, View } from '@/components/ui';
import QuestTimer from '@/lib/services/quest-timer';
import { getUserDetails } from '@/lib/services/user';
import { useQuestStore } from '@/store/quest-store';
import { type QuestOption } from '@/store/types';

// Define screen dimensions for the carousel
const screenWidth = Dimensions.get('window').width;
const cardWidth = screenWidth * 0.75; // each card takes 75% of screen width
const snapInterval = cardWidth;

// Define our modes
const MODES = [
  { id: 'story', name: 'Story Mode', color: 'rgba(194, 199, 171, 0.9)' },
  { id: 'custom', name: 'Free Play Mode', color: 'rgba(146, 185, 191, 0.9)' },
];

export default function Home() {
  const router = useRouter();
  const activeQuest = useQuestStore((state) => state.activeQuest);
  const refreshAvailableQuests = useQuestStore(
    (state) => state.refreshAvailableQuests
  );
  const availableQuests = useQuestStore((state) => state.availableQuests);
  const completedQuests = useQuestStore((state) => state.getCompletedQuests());
  const prepareQuest = useQuestStore((state) => state.prepareQuest);

  // State for story choices
  const [storyOptions, setStoryOptions] = useState<QuestOption[]>([]);

  // Carousel state
  const [activeIndex, setActiveIndex] = useState(0);
  const progress = useSharedValue(0);

  // Get current map name based on next quest
  const currentMapName =
    availableQuests.length > 0
      ? getMapNameForQuest(availableQuests[0].id)
      : 'Vaedros Kingdom';

  // Calculate story progress
  const storyProgress =
    completedQuests.filter((quest) => quest.mode === 'story').length /
    AVAILABLE_QUESTS.filter((quest) => quest.mode === 'story').length;

  // Animation values
  const headerOpacity = useSharedValue(0);
  const contentOpacity = useSharedValue(0);
  const contentTranslateY = useSharedValue(50);
  const scrollContainerOpacity = useSharedValue(1);
  const animatedScrollStyle = useAnimatedStyle(() => ({
    opacity: scrollContainerOpacity.value,
  }));

  // Get next quest options based on the last completed story quest
  useEffect(() => {
    if (activeQuest) return; // Don't update if there's an active quest

    // Get the last completed story quest
    const storyQuests = completedQuests.filter(
      (quest) => quest.mode === 'story'
    );

    if (storyQuests.length === 0) {
      // No completed story quests - show first quest
      const firstQuest = AVAILABLE_QUESTS.find(
        (quest) => quest.mode === 'story'
      );
      // Check if we have a story quest and it has options
      if (firstQuest && firstQuest.mode === 'story' && firstQuest.options) {
        setStoryOptions(firstQuest.options);
      } else {
        setStoryOptions([]);
      }
    } else {
      // Get the last completed story quest
      const lastCompletedQuest = storyQuests[storyQuests.length - 1];

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
        // Get the next quest IDs from the options
        const nextQuestIds = questData.options.map(
          (option) => option.nextQuestId
        );

        // Filter out null nextQuestIds (end of storyline)
        const validNextQuestIds = nextQuestIds.filter((id) => id !== null);

        if (validNextQuestIds.length > 0) {
          // Find the next available quests
          const nextQuests = validNextQuestIds
            .map((id) => AVAILABLE_QUESTS.find((quest) => quest.id === id))
            .filter(Boolean);

          // Set the options for the next quest
          if (nextQuests.length > 0) {
            // Use the options from the last completed quest
            setStoryOptions(questData.options);
          } else {
            setStoryOptions([]);
          }
        } else {
          setStoryOptions([]);
        }
      } else {
        setStoryOptions([]);
      }
    }
  }, [completedQuests, activeQuest]);

  // Refresh available quests when there's no active quest
  useEffect(() => {
    if (!activeQuest) {
      refreshAvailableQuests();
    }
  }, [activeQuest, refreshAvailableQuests]);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const refreshToken = await getRefreshToken();
        if (!refreshToken) {
          console.log('No auth tokens available, skipping user data fetch');
          return;
        }

        const userData = await getUserDetails();
        console.log('Fetched user data:', userData);
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();
  }, []);

  // Initialize animations
  useEffect(() => {
    headerOpacity.value = withDelay(450, withTiming(1, { duration: 1000 }));
    contentOpacity.value = withDelay(1000, withTiming(1, { duration: 1000 }));
    contentTranslateY.value = withDelay(1000, withSpring(0));
  }, []);

  // Function to handle quest option selection
  const handleQuestOptionSelect = async (nextQuestId: string) => {
    if (!nextQuestId) return; // Don't proceed if there's no next quest

    // Find the quest by ID
    const selectedQuest = AVAILABLE_QUESTS.find(
      (quest) => quest.id === nextQuestId
    );

    if (selectedQuest) {
      prepareQuest(selectedQuest);
      await QuestTimer.prepareQuest(selectedQuest);
      console.log('Navigating to active quest from index');
      // Navigate to active quest
      router.replace('/active-quest');
    }
  };

  // Handle custom quest button
  const handleStartCustomQuest = () => {
    console.log('Starting custom quest');
    try {
      router.push('/custom-quest');
    } catch (error) {
      console.error('Error navigating to custom quest:', error);
    }
  };

  // Prepare carousel data
  const carouselData = [
    {
      id: 'story',
      mode: 'story',
      title:
        availableQuests.length > 0
          ? availableQuests[0].title
          : 'No quests available',
      recap:
        availableQuests.length > 0 && availableQuests[0].mode === 'story'
          ? availableQuests[0].recap
          : 'Continue your journey',
      subtitle: currentMapName,
      duration:
        availableQuests.length > 0 ? availableQuests[0].durationMinutes : 0,
      xp: availableQuests.length > 0 ? availableQuests[0].reward.xp : 0,
      progress: storyProgress,
    },
    {
      id: 'custom',
      mode: 'custom',
      title: 'Start Custom Quest',
      subtitle: 'Free Play Mode',
      duration: 30,
      xp: 50,
    },
  ];

  // Animated background style based on carousel progress
  const backgroundStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      progress.value,
      [0, 1],
      [MODES[0].color, MODES[1].color]
    );

    return {
      backgroundColor,
    };
  });

  // Animated styles
  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
  }));

  // Render story quest option buttons
  const renderStoryOptions = () => {
    if (activeIndex !== 0) return null; // Only show for story mode

    // If no completed quests, show "Wake up" button
    if (!completedQuests.some((quest) => quest.mode === 'story')) {
      // Find the first story quest
      const firstStoryQuest = AVAILABLE_QUESTS.find(
        (quest) => quest.mode === 'story'
      );

      if (firstStoryQuest) {
        return (
          <Button
            label="Wake up"
            onPress={() => handleQuestOptionSelect(firstStoryQuest.id)}
            className="mb-2 rounded-md bg-emerald-700"
          />
        );
      } else {
        return null;
      }
    }

    // Otherwise show buttons for each option in a row
    return (
      <View className="w-full flex-row justify-between gap-2">
        {storyOptions.map((option: QuestOption, index: number) => (
          <Button
            key={option.id}
            label={option.text}
            onPress={() => handleQuestOptionSelect(option.nextQuestId)}
            className={`min-h-[48px] flex-1 justify-center rounded-md py-1 ${index === 0 ? 'mr-1 bg-emerald-700' : 'ml-1 bg-sky-700'}`}
            textClassName="text-sm font-bold text-amber-100 text-center px-1 leading-tight"
            disabled={!option.nextQuestId} // Disable if nextQuestId is null
          />
        ))}
      </View>
    );
  };

  // Render item for the carousel
  const renderCarouselItem = ({ item }: { item: any }) => {
    return (
      <View className="w-full" style={{ width: cardWidth }}>
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
        />
      </View>
    );
  };

  return (
    <View className="flex-1">
      <FocusAwareStatusBar />

      {/* Background */}
      <View className="absolute inset-0">
        <Image
          source={require('@/../assets/images/background/active-quest.jpg')}
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

      <View className="pt-safe flex-1 flex-col">
        {/* Header */}
        <Animated.View style={headerStyle} className="mb-4 px-4">
          <Text className="mb-3 mt-2 text-xl font-bold">
            Choose Your Adventure
          </Text>
          <Text>
            Continue your epic story or embark on a new challenge in free play
            mode.
          </Text>
        </Animated.View>

        {/* Main content area */}
        <View className="flex-1 justify-center">
          <Animated.View style={[animatedScrollStyle]} className="mb-4">
            <FlashList
              data={carouselData}
              horizontal
              snapToInterval={snapInterval}
              decelerationRate="fast"
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.id}
              initialScrollIndex={0} // Start at the first item
              contentContainerStyle={{
                paddingHorizontal: (screenWidth - cardWidth) / 2,
                paddingBottom: 24, // Add some bottom padding
              }}
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
        {!activeQuest && (
          <View className="mt-auto w-full px-4 pb-8">
            {activeIndex === 0 ? (
              renderStoryOptions()
            ) : (
              // Show create custom quest button for custom mode
              <Button
                label="Create Custom Quest"
                onPress={handleStartCustomQuest}
                className="mb-2 rounded-md bg-emerald-700"
              />
            )}
          </View>
        )}
      </View>
    </View>
  );
}
