import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';

import { AVAILABLE_QUESTS } from '@/app/data/quests'; // Assuming quest-1 details come from here
import { FailedQuest } from '@/components/failed-quest';
import { QuestComplete } from '@/components/QuestComplete';
import { Button, FocusAwareStatusBar, Text, View } from '@/components/ui';
import { OnboardingStep, useOnboardingStore } from '@/store/onboarding-store';
import { useQuestStore } from '@/store/quest-store';
import { type Quest } from '@/store/types'; // Import Quest type for better type safety

export default function FirstQuestResultScreen() {
  const { outcome } = useLocalSearchParams<{
    outcome: 'completed' | 'failed';
  }>();
  const setOnboardingStep = useOnboardingStore((state) => state.setCurrentStep);
  const resetFailedQuest = useQuestStore((state) => state.resetFailedQuest);

  // Find quest-1 details (assuming it has a fixed ID like 'quest-1')
  const firstQuestData = AVAILABLE_QUESTS.find((q) => q.id === 'quest-1');

  React.useEffect(() => {
    if (outcome === 'completed') {
      setOnboardingStep(OnboardingStep.VIEWING_SIGNUP_PROMPT);
    }
    // No specific onboarding step for failure here, as retrying might loop back
  }, [outcome, setOnboardingStep]);

  const handleCompletedContinue = () => {
    router.push('/quest-completed-signup');
  };

  if (!firstQuestData) {
    // Handle case where quest-1 is not found, though unlikely
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Text>Error: First quest data not found.</Text>
        <Button label="Go Home" onPress={() => router.replace('/')} />
      </View>
    );
  }

  // Base properties for the quest object passed to components
  const baseQuestProps = {
    ...firstQuestData,
    startTime: Date.now(), // Add a default startTime
    // heroName can be added if available from a character store, or QuestComplete can use its own default
  };

  if (outcome === 'completed') {
    const completedQuestForDisplay: Quest = {
      ...baseQuestProps,
      status: 'completed' as const, // Ensure status is of type QuestStatus
      stopTime: Date.now(),
      // Explicitly cast to Quest; ensure all required fields are present or made optional in QuestComplete/FailedQuest if not always available
    } as Quest;
    console.log(
      '[FirstQuestResult] Completed quest for display:',
      completedQuestForDisplay
    );
    console.log(
      '[FirstQuestResult] Quest mode:',
      completedQuestForDisplay.mode
    );
    console.log(
      '[FirstQuestResult] Quest audioFile:',
      completedQuestForDisplay.mode === 'story' ? completedQuestForDisplay.audioFile : 'N/A (custom quest)'
    );

    return (
      <View className="flex-1 bg-background">
        <FocusAwareStatusBar />
        <QuestComplete
          quest={completedQuestForDisplay}
          story={
            firstQuestData.mode === 'story' && firstQuestData.story
              ? firstQuestData.story
              : 'You completed your first trial!'
          }
          onContinue={handleCompletedContinue}
          continueText="Continue Your Journey"
          showActionButton={true} // Always show for this screen
        />
      </View>
    );
  }

  if (outcome === 'failed') {
    const failedQuestForDisplay: Quest = {
      ...baseQuestProps,
      status: 'failed' as const, // Ensure status is of type QuestStatus
    } as Quest;
    console.log(
      '[FirstQuestResult] Failed quest for display:',
      failedQuestForDisplay
    );
    return (
      <View className="flex-1 bg-background">
        <FocusAwareStatusBar />
        <FailedQuest
          quest={failedQuestForDisplay}
          onRetry={() => {
            resetFailedQuest(); // Clear the failed state
            router.replace('/onboarding/first-quest'); // Go to app entry, should re-trigger onboarding to first quest
          }}
        />
      </View>
    );
  }

  // Fallback for invalid outcome or if params are not loaded yet
  return (
    <View className="flex-1 items-center justify-center bg-background">
      <FocusAwareStatusBar />
      <Text>Loading quest result...</Text>
    </View>
  );
}
