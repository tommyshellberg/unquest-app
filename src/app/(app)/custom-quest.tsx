import { router } from 'expo-router';
import React from 'react';
import { useForm } from 'react-hook-form';

import { CategorySelector } from '@/components/QuestForm/category-selector';
// Import our new components with appropriate paths
import { CombinedQuestInput } from '@/components/QuestForm/combined-quest-input';
import { PaperPlanes } from '@/components/QuestForm/paper-planes';
// Import UI components from our project
import { Button, Pressable, ScrollView, Text, View } from '@/components/ui';
import QuestTimer from '@/lib/services/quest-timer';
import { useQuestStore } from '@/store/quest-store';
import { type CustomQuestTemplate } from '@/store/types';

// Define the form data type
type FormData = {
  questName: string;
  questDuration: number;
  questCategory: string;
};

export default function CustomQuestScreen() {
  // Initialize react-hook-form
  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
    watch,
  } = useForm<FormData>({
    defaultValues: {
      questName: '',
      questDuration: 30,
      questCategory: 'fitness',
    },
    mode: 'onChange',
  });

  // Watch values for real-time updates
  const questDuration = watch('questDuration');
  const questCategory = watch('questCategory');

  const onSubmit = async (data: FormData) => {
    console.log('handleCreateQuest', data);

    // Create a custom quest object
    const customQuest: CustomQuestTemplate = {
      id: `custom-${Date.now()}`,
      mode: 'custom',
      title: data.questName.trim(),
      durationMinutes: data.questDuration,
      category: data.questCategory,
      reward: {
        xp: Math.round(data.questDuration * 1.5), // Scale XP with duration
      },
    };

    console.log('customQuest', customQuest);

    // Start the quest
    try {
      // First update the store to set pendingQuest
      useQuestStore.getState().prepareQuest(customQuest);

      // Then prepare the quest in the background task
      await QuestTimer.prepareQuest(customQuest);

      // Navigate back to active quest screen
      console.log('Navigating to active quest from custom quest');
      router.replace('/(app)/active-quest');
    } catch (error) {
      console.error('Error preparing quest:', error);
    }
  };

  return (
    <View className="bg-background flex-1">
      <View className="flex-row items-center justify-between border-b border-[#EEEEEE] px-5 py-4">
        <Pressable onPress={() => router.back()}>
          <Text className="text-base text-[#333]">Cancel</Text>
        </Pressable>
        <Text className="text-lg font-semibold">Custom quest</Text>
        <View className="w-14" />
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="p-5">
          {/* Paper planes illustration */}
          <PaperPlanes />

          {/* Combined Quest Name and Duration Field */}
          <CombinedQuestInput
            control={control}
            questDuration={questDuration}
            errors={errors}
          />

          <View className="my-1.5 h-px bg-[#EEEEEE]" />

          {/* Category Dropdown */}
          <CategorySelector control={control} questCategory={questCategory} />

          {/* Continue Button (Large, Full-Width) */}
          <Button
            label="Continue"
            variant="default"
            size="lg"
            disabled={!isValid}
            onPress={handleSubmit(onSubmit)}
            className={`mt-5 rounded-md bg-primary-400 py-2.5 ${
              isValid ? 'opacity-100' : 'opacity-50'
            }`}
            textClassName="text-lg font-semibold text-white"
          />
        </View>
      </ScrollView>
    </View>
  );
}
