import { useRouter } from 'expo-router';
import {
  Award,
  BowArrow,
  Clock,
  Crown,
  Hourglass,
  MapPinCheck,
  Sword,
  Swords,
  Target,
  Timer,
  Trophy,
  Watch,
} from 'lucide-react-native';
import React, { useRef } from 'react';
import { Dimensions } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';

import {
  Card,
  FocusAwareStatusBar,
  ProgressBar,
  ScreenContainer,
  ScreenHeader,
  ScrollView,
  Text,
  View,
} from '@/components/ui';
import { useCharacterStore } from '@/store/character-store';
import { useQuestStore } from '@/store/quest-store';

type AchievementCategory = 'streak' | 'quests' | 'minutes';
type AchievementLevel = 1 | 2 | 3;

type Achievement = {
  id: string;
  category: AchievementCategory;
  level: AchievementLevel;
  title: string;
  description: string;
  requirement: number;
  currentProgress: number;
  isUnlocked: boolean;
  unlockedAt?: Date;
};

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_WIDTH = SCREEN_WIDTH - 80; // 40px padding on each side
const CARD_HEIGHT = 280; // Fixed height for all cards
const CARD_SPACING = 16;

// Dummy data
const achievements: Achievement[] = [
  // Streak achievements
  {
    id: 'streak-1',
    category: 'streak',
    level: 1,
    title: 'First Steps',
    description: 'Complete quests for 2 days in a row',
    requirement: 2,
    currentProgress: 1,
    isUnlocked: false,
  },
  {
    id: 'streak-2',
    category: 'streak',
    level: 2,
    title: 'Committed',
    description: 'Complete quests for 10 days in a row',
    requirement: 10,
    currentProgress: 1,
    isUnlocked: false,
  },
  {
    id: 'streak-3',
    category: 'streak',
    level: 3,
    title: 'Unstoppable',
    description: 'Complete quests for 30 days in a row',
    requirement: 30,
    currentProgress: 1,
    isUnlocked: false,
  },
  // Quest achievements
  {
    id: 'quests-1',
    category: 'quests',
    level: 1,
    title: 'Quest Beginner',
    description: 'Complete 3 quests',
    requirement: 3,
    currentProgress: 2,
    isUnlocked: false,
  },
  {
    id: 'quests-2',
    category: 'quests',
    level: 2,
    title: 'Quest Adventurer',
    description: 'Complete 25 quests',
    requirement: 25,
    currentProgress: 2,
    isUnlocked: false,
  },
  {
    id: 'quests-3',
    category: 'quests',
    level: 3,
    title: 'Quest Master',
    description: 'Complete 100 quests',
    requirement: 100,
    currentProgress: 2,
    isUnlocked: false,
  },
  // Minutes achievements
  {
    id: 'minutes-1',
    category: 'minutes',
    level: 1,
    title: 'Time Saver',
    description: 'Save 10 minutes off your phone',
    requirement: 10,
    currentProgress: 15,
    isUnlocked: true,
    unlockedAt: new Date('2024-01-15'),
  },
  {
    id: 'minutes-2',
    category: 'minutes',
    level: 2,
    title: 'Time Guardian',
    description: 'Save 100 minutes off your phone',
    requirement: 100,
    currentProgress: 15,
    isUnlocked: false,
  },
  {
    id: 'minutes-3',
    category: 'minutes',
    level: 3,
    title: 'Time Lord',
    description: 'Save 1000 minutes off your phone',
    requirement: 1000,
    currentProgress: 15,
    isUnlocked: false,
  },
];

const AchievementCard = ({ achievement }: { achievement: Achievement }) => {
  const progress = Math.min(
    achievement.currentProgress / achievement.requirement,
    1
  );

  const getIcon = () => {
    const iconColor = achievement.isUnlocked ? '#FFFFFF' : '#666666';
    const iconSize = 32;

    if (achievement.category === 'streak') {
      switch (achievement.level) {
        case 1:
          return <Sword size={iconSize} color={iconColor} />;
        case 2:
          return <Swords size={iconSize} color={iconColor} />;
        case 3:
          return <BowArrow size={iconSize} color={iconColor} />;
      }
    } else if (achievement.category === 'quests') {
      switch (achievement.level) {
        case 1:
          return <Award size={iconSize} color={iconColor} />;
        case 2:
          return <Trophy size={iconSize} color={iconColor} />;
        case 3:
          return <Crown size={iconSize} color={iconColor} />;
      }
    } else if (achievement.category === 'minutes') {
      switch (achievement.level) {
        case 1:
          return <Watch size={iconSize} color={iconColor} />;
        case 2:
          return <Clock size={iconSize} color={iconColor} />;
        case 3:
          return <Hourglass size={iconSize} color={iconColor} />;
      }
    }
  };

  return (
    <Card
      style={{
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
      }}
      className={`p-6 ${achievement.isUnlocked ? 'bg-primary-100' : ''}`}
    >
      <View className="flex-1 justify-between">
        <View>
          <View className="mb-4 flex-row items-center justify-between">
            <View
              className={`size-16 items-center justify-center rounded-full ${
                achievement.isUnlocked ? 'bg-primary-500' : 'bg-gray-200'
              }`}
            >
              {getIcon()}
            </View>

            {achievement.isUnlocked && (
              <View className="rounded-full bg-primary-500 px-3 py-1">
                <Text className="text-sm font-bold text-white">Unlocked!</Text>
              </View>
            )}
          </View>

          <Text
            className={`text-xl font-bold ${
              achievement.isUnlocked ? 'text-primary-700' : 'text-gray-800'
            }`}
          >
            {achievement.title}
          </Text>

          <Text className="mt-2 text-gray-600">{achievement.description}</Text>
        </View>

        <View>
          <View className="mb-2 flex-row justify-between">
            <Text className="text-sm font-semibold text-gray-700">
              Progress
            </Text>
            <Text className="text-primary-600 text-sm font-bold">
              {achievement.currentProgress}/{achievement.requirement}
            </Text>
          </View>

          <ProgressBar
            initialProgress={progress * 100}
            progressColor={achievement.isUnlocked ? '#5E8977' : '#D1D5DB'}
            backgroundColor="#F3F4F6"
          />

          {achievement.isUnlocked && achievement.unlockedAt && (
            <Text className="mt-3 text-xs text-gray-500">
              Unlocked on {achievement.unlockedAt.toLocaleDateString()}
            </Text>
          )}
        </View>
      </View>
    </Card>
  );
};

const AchievementSection = ({
  category,
  achievements,
}: {
  category: AchievementCategory;
  achievements: Achievement[];
}) => {
  const scrollX = useSharedValue(0);
  const scrollViewRef = useRef<Animated.ScrollView>(null);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  const getCategoryTitle = () => {
    switch (category) {
      case 'streak':
        return 'Daily Streak';
      case 'quests':
        return 'Quest Completion';
      case 'minutes':
        return 'Time Saved';
    }
  };

  const getCategoryIcon = () => {
    switch (category) {
      case 'streak':
        return <Target size={24} color="#2E948D" />;
      case 'quests':
        return <MapPinCheck size={24} color="#2E948D" />;
      case 'minutes':
        return <Timer size={24} color="#2E948D" />;
    }
  };

  return (
    <View className="mb-12">
      <View className="mb-4 flex-row items-center px-4">
        {getCategoryIcon()}
        <Text className="ml-2 text-lg font-bold text-gray-900">
          {getCategoryTitle()}
        </Text>
      </View>

      <Animated.ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        snapToInterval={CARD_WIDTH + CARD_SPACING}
        decelerationRate="fast"
        contentContainerStyle={{ paddingHorizontal: 40 }}
      >
        {achievements.map((achievement, index) => (
          <View key={achievement.id} style={{ marginRight: CARD_SPACING }}>
            <AchievementCard achievement={achievement} />
          </View>
        ))}
      </Animated.ScrollView>

      {/* Page Indicators */}
      <View className="mt-4 flex-row justify-center">
        {achievements.map((_, index) => {
          const inputRange = [
            (index - 1) * (CARD_WIDTH + CARD_SPACING),
            index * (CARD_WIDTH + CARD_SPACING),
            (index + 1) * (CARD_WIDTH + CARD_SPACING),
          ];

          const dotStyle = useAnimatedStyle(() => {
            const scale = interpolate(
              scrollX.value,
              inputRange,
              [0.8, 1.4, 0.8],
              'clamp'
            );

            const opacity = interpolate(
              scrollX.value,
              inputRange,
              [0.4, 1, 0.4],
              'clamp'
            );

            return {
              transform: [{ scale }],
              opacity,
            };
          });

          return (
            <Animated.View
              key={index}
              style={[dotStyle]}
              className="mx-1 size-2 rounded-full bg-primary-500"
            />
          );
        })}
      </View>
    </View>
  );
};

export default function AchievementsScreen() {
  const router = useRouter();

  // Get real user data
  const dailyQuestStreak = useCharacterStore((state) => state.dailyQuestStreak);
  const completedQuests = useQuestStore((state) => state.getCompletedQuests());
  const totalQuestCount = completedQuests.length;
  const totalMinutesSaved = completedQuests.reduce(
    (total, quest) => total + quest.durationMinutes,
    0
  );

  // Generate achievements with real data
  const generateAchievements = (): Achievement[] => {
    return [
      // Streak achievements
      {
        id: 'streak-1',
        category: 'streak' as const,
        level: 1 as const,
        title: 'First Steps',
        description: 'Complete quests for 2 days in a row',
        requirement: 2,
        currentProgress: dailyQuestStreak,
        isUnlocked: dailyQuestStreak >= 2,
        unlockedAt: dailyQuestStreak >= 2 ? new Date() : undefined,
      },
      {
        id: 'streak-2',
        category: 'streak' as const,
        level: 2 as const,
        title: 'Committed',
        description: 'Complete quests for 10 days in a row',
        requirement: 10,
        currentProgress: dailyQuestStreak,
        isUnlocked: dailyQuestStreak >= 10,
        unlockedAt: dailyQuestStreak >= 10 ? new Date() : undefined,
      },
      {
        id: 'streak-3',
        category: 'streak' as const,
        level: 3 as const,
        title: 'Unstoppable',
        description: 'Complete quests for 30 days in a row',
        requirement: 30,
        currentProgress: dailyQuestStreak,
        isUnlocked: dailyQuestStreak >= 30,
        unlockedAt: dailyQuestStreak >= 30 ? new Date() : undefined,
      },
      // Quest achievements
      {
        id: 'quests-1',
        category: 'quests' as const,
        level: 1 as const,
        title: 'Quest Beginner',
        description: 'Complete 3 quests',
        requirement: 3,
        currentProgress: totalQuestCount,
        isUnlocked: totalQuestCount >= 3,
        unlockedAt: totalQuestCount >= 3 ? new Date() : undefined,
      },
      {
        id: 'quests-2',
        category: 'quests' as const,
        level: 2 as const,
        title: 'Quest Adventurer',
        description: 'Complete 25 quests',
        requirement: 25,
        currentProgress: totalQuestCount,
        isUnlocked: totalQuestCount >= 25,
        unlockedAt: totalQuestCount >= 25 ? new Date() : undefined,
      },
      {
        id: 'quests-3',
        category: 'quests' as const,
        level: 3 as const,
        title: 'Quest Master',
        description: 'Complete 100 quests',
        requirement: 100,
        currentProgress: totalQuestCount,
        isUnlocked: totalQuestCount >= 100,
        unlockedAt: totalQuestCount >= 100 ? new Date() : undefined,
      },
      // Minutes achievements
      {
        id: 'minutes-1',
        category: 'minutes' as const,
        level: 1 as const,
        title: 'Time Saver',
        description: 'Save 10 minutes off your phone',
        requirement: 10,
        currentProgress: totalMinutesSaved,
        isUnlocked: totalMinutesSaved >= 10,
        unlockedAt: totalMinutesSaved >= 10 ? new Date() : undefined,
      },
      {
        id: 'minutes-2',
        category: 'minutes' as const,
        level: 2 as const,
        title: 'Time Guardian',
        description: 'Save 100 minutes off your phone',
        requirement: 100,
        currentProgress: totalMinutesSaved,
        isUnlocked: totalMinutesSaved >= 100,
        unlockedAt: totalMinutesSaved >= 100 ? new Date() : undefined,
      },
      {
        id: 'minutes-3',
        category: 'minutes' as const,
        level: 3 as const,
        title: 'Time Lord',
        description: 'Save 1000 minutes off your phone',
        requirement: 1000,
        currentProgress: totalMinutesSaved,
        isUnlocked: totalMinutesSaved >= 1000,
        unlockedAt: totalMinutesSaved >= 1000 ? new Date() : undefined,
      },
    ];
  };

  const achievements = generateAchievements();
  const streakAchievements = achievements.filter(
    (a) => a.category === 'streak'
  );
  const questAchievements = achievements.filter((a) => a.category === 'quests');
  const minutesAchievements = achievements.filter(
    (a) => a.category === 'minutes'
  );

  const totalAchievements = achievements.length;
  const unlockedAchievements = achievements.filter((a) => a.isUnlocked).length;

  return (
    <View className="flex-1 bg-background">
      <FocusAwareStatusBar />

      <ScreenContainer>
        {/* Header */}
        <ScreenHeader
          title="Achievements"
          subtitle={`Track your progress • ${unlockedAchievements}/${totalAchievements} Unlocked`}
          showBackButton
          onBackPress={() => router.push('/profile')}
        />

        <ScrollView
          className="-mx-4 flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: 20 }}
        >
          {/* Achievement Sections */}
          <AchievementSection
            category="streak"
            achievements={streakAchievements}
          />
          <AchievementSection
            category="quests"
            achievements={questAchievements}
          />
          <AchievementSection
            category="minutes"
            achievements={minutesAchievements}
          />

          <View className="h-8" />
        </ScrollView>
      </ScreenContainer>
    </View>
  );
}
