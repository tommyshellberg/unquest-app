import { router } from 'expo-router';
import { usePostHog } from 'posthog-react-native';
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';

import { CategorySelector } from '@/components/QuestForm/category-selector';
// Import our new components with appropriate paths
import { CombinedQuestInput } from '@/components/QuestForm/combined-quest-input';
import { PaperPlanes } from '@/components/QuestForm/paper-planes';
import { StreakCounter } from '@/components/StreakCounter';
// Import UI components from our project
import {
  Button,
  FocusAwareStatusBar,
  SafeAreaView,
  ScrollView,
  Text,
  View,
  ScreenContainer,
  ScreenHeader,
  TouchableOpacity,
} from '@/components/ui';
import QuestTimer from '@/lib/services/quest-timer';
import { useQuestStore } from '@/store/quest-store';
import { type CustomQuestTemplate } from '@/store/types';

// Define the form data type
type FormData = {
  questCategory: string;
};

export default function CustomQuestScreen() {
  // Local state for the quest data
  const [questName, setQuestName] = useState('');
  const [questDuration, setQuestDuration] = useState(30);
  const posthog = usePostHog();

  // Initialize react-hook-form just for the category
  const { control, handleSubmit, watch, reset } = useForm<FormData>({
    defaultValues: {
      questCategory: 'fitness',
    },
    mode: 'onChange',
  });

  // Watch values for real-time updates
  const questCategory = watch('questCategory');

  // Determine if we can proceed
  const canContinue = questName.trim().length > 0;

  const handleQuestNameChange = (name: string) => {
    setQuestName(name);
  };

  const handleDurationChange = (duration: number) => {
    // This is only called when sliding is complete
    setQuestDuration(duration);
  };

  const handleCancel = () => {
    // Reset all form values to defaults
    setQuestName('');
    setQuestDuration(30);
    reset({ questCategory: 'fitness' });

    // Navigate back
    router.back();
  };

  useEffect(() => {
    posthog.capture('open_custom_quest_screen');
  }, [posthog]);


  const onSubmit = async (data: FormData) => {
    posthog.capture('trigger_start_custom_quest');

    // Create a custom quest object
    const customQuest: CustomQuestTemplate = {
      id: `custom-${Date.now()}`,
      mode: 'custom',
      title: questName.trim(),
      durationMinutes: questDuration,
      category: data.questCategory,
      reward: {
        xp: Math.round(questDuration * 3),
      },
    };

    // Start the quest
    try {
      // First update the store to set pendingQuest
      useQuestStore.getState().prepareQuest(customQuest);

      // Then prepare the quest in the background task
      await QuestTimer.prepareQuest(customQuest);
      posthog.capture('sucess_start_custom_quest');

      // Go to regular pending quest
      router.push('/pending-quest');
    } catch (error) {
      console.error('Error preparing quest:', error);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-neutral-100">
      <FocusAwareStatusBar />
      
      <ScreenContainer bottomPadding={0}>
        {/* Header */}
        <ScreenHeader
          title="Custom Quest"
          subtitle="Create your own quest with a personalized name and duration"
          showBackButton
        />

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <View className="mb-4">
            {/* Paper planes illustration */}
            <PaperPlanes />
          </View>

          {/* Quest Input with improved slider handling */}
          <CombinedQuestInput
            initialQuestName={questName}
            initialDuration={questDuration}
            onQuestNameChange={handleQuestNameChange}
            onDurationChange={handleDurationChange}
          />

          <View className="my-3 h-px bg-[#EEEEEE]" />

          {/* Category Dropdown */}
          <CategorySelector control={control} questCategory={questCategory} />


          {/* Continue Button (Large, Full-Width) */}
          <Button
            label="Start Quest"
            variant="default"
            size="lg"
            disabled={!canContinue}
            onPress={handleSubmit(onSubmit)}
            className={`mt-4 mb-4 rounded-md bg-primary-400 py-3 ${
              canContinue ? 'opacity-100' : 'opacity-50'
            }`}
            textClassName="text-lg font-semibold text-white"
          />
        </ScrollView>
      </ScreenContainer>
    </SafeAreaView>
  );
}
