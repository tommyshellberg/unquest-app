import { Clock } from 'lucide-react-native';
import React from 'react';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { getCharacterAvatar } from '@/app/utils/character-utils';
import { Card, Text, View } from '@/components/ui';
import colors from '@/components/ui/colors';

import { ANIMATION_CONFIG, TEST_IDS, UI_CONFIG } from '../constants';
import { CharacterData, PendingQuestData } from '../types';
import { getQuestSubtitle } from '../utils';

interface QuestInfoCardProps {
  quest: PendingQuestData;
  character: CharacterData | null;
}

/**
 * QuestInfoCard component
 *
 * Displays quest information including title, duration, and subtitle
 * with character avatar header image
 */
export function QuestInfoCard({ quest, character }: QuestInfoCardProps) {
  const subtitle = getQuestSubtitle(quest.mode);

  return (
    <Card
      testID={TEST_IDS.QUEST_CARD}
      headerImage={getCharacterAvatar(character?.type)}
      headerImageStyle={{ height: UI_CONFIG.HEADER_IMAGE_HEIGHT }}
    >
      <View className="p-6">
        {/* Quest Title and Duration - Same Row */}
        <Animated.View
          entering={FadeInDown.delay(
            ANIMATION_CONFIG.QUEST_TITLE_DELAY
          ).duration(ANIMATION_CONFIG.QUEST_INFO_FADE_DURATION)}
          className="mb-1 flex-row items-baseline justify-between"
        >
          <Text
            className="flex-1 text-2xl font-bold text-white"
            style={{ fontWeight: '700' }}
            accessibilityRole="header"
            accessibilityLabel={`Quest title: ${quest.title}`}
          >
            {quest.title}
          </Text>
          <View className="ml-3 flex-row items-center">
            <Clock size={UI_CONFIG.CLOCK_ICON_SIZE} color={colors.secondary[300]} />
            <Text
              className="ml-1 text-sm text-neutral-200"
              accessibilityLabel={`Duration: ${quest.durationMinutes} minutes`}
            >
              {quest.durationMinutes} min
            </Text>
          </View>
        </Animated.View>

        {/* Subtitle */}
        <Animated.Text
          entering={FadeInDown.delay(
            ANIMATION_CONFIG.QUEST_SUBTITLE_DELAY
          ).duration(ANIMATION_CONFIG.QUEST_INFO_FADE_DURATION)}
          className="text-sm leading-relaxed text-neutral-200"
          accessibilityLabel={subtitle}
        >
          {subtitle}
        </Animated.Text>
      </View>
    </Card>
  );
}
