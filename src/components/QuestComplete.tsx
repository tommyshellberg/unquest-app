import React from 'react';

import { Image, ScreenContainer, View } from '@/components/ui';
import { useCustomQuestStory } from '@/hooks/useCustomQuestStory';

import { QuestCompleteActions } from './quest-complete/QuestCompleteActions';
import { QuestCompleteHeader } from './quest-complete/QuestCompleteHeader';
import { QuestCompleteStory } from './quest-complete/QuestCompleteStory';
import type { QuestCompleteProps } from './quest-complete/types';

export function QuestComplete({
  quest,
  story,
  onContinue,
  continueText = 'Continue',
  showActionButton = true,
  disableEnteringAnimations = false,
}: QuestCompleteProps) {
  const customStory = useCustomQuestStory(quest);
  const displayStory = customStory || story;

  return (
    <View className="relative flex-1">
      {/* Background Image */}
      <Image
        source={require('@/../assets/images/background/pending-quest-bg-alt.png')}
        className="absolute inset-0 size-full"
        resizeMode="cover"
      />

      {/* Semi-transparent overlay */}
      <View className="bg-background-light/80 absolute inset-0" />

      {/* Content */}
      <ScreenContainer fullScreen className="items-center justify-between px-4">
        <QuestCompleteHeader
          quest={quest}
          disableAnimations={disableEnteringAnimations}
        />

        <QuestCompleteStory
          story={displayStory}
          quest={quest}
          disableAnimations={disableEnteringAnimations}
        />

        {showActionButton && (
          <QuestCompleteActions
            quest={quest}
            onContinue={onContinue}
            continueText={continueText}
            disableAnimations={disableEnteringAnimations}
          />
        )}
      </ScreenContainer>
    </View>
  );
}

// Re-export types for convenience
export type { QuestCompleteProps } from './quest-complete/types';
