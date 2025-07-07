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
  Pressable,
  ScrollView,
  Text,
  View,
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
    <View className="flex-1 bg-background">
      <FocusAwareStatusBar />
      <View className="flex-row items-center justify-between border-b border-[#EEEEEE] px-5 py-4">
        <Pressable onPress={handleCancel}>
          <Text className="text-base text-[#333]">Cancel</Text>
        </Pressable>
        <Text className="text-lg font-semibold">Custom quest</Text>
        <StreakCounter size="small" position="topRight" />
        <View className="w-14" />
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="p-5">
          {/* Paper planes illustration */}
          <PaperPlanes />

          {/* Quest Input with improved slider handling */}
          <CombinedQuestInput
            initialQuestName={questName}
            initialDuration={questDuration}
            onQuestNameChange={handleQuestNameChange}
            onDurationChange={handleDurationChange}
          />

          <View className="my-1.5 h-px bg-[#EEEEEE]" />

          {/* Category Dropdown */}
          <CategorySelector control={control} questCategory={questCategory} />


          {/* Continue Button (Large, Full-Width) */}
          <Button
            label="Start Quest"
            variant="default"
            size="lg"
            disabled={!canContinue}
            onPress={handleSubmit(onSubmit)}
            className={`mt-5 rounded-md bg-primary-400 py-2.5 ${
              canContinue ? 'opacity-100' : 'opacity-50'
            }`}
            textClassName="text-lg font-semibold text-white"
          />
        </View>
      </ScrollView>
    </View>
  );
}
