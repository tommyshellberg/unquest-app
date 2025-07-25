import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, TextInput } from 'react-native';

import {
  FocusAwareStatusBar,
  ScreenContainer,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from '@/components/ui';
import { Button } from '@/components/ui/button';
import colors from '@/components/ui/colors';
import { useQuestStore } from '@/store/quest-store';
import type { ReflectionMood } from '@/store/types';

const REFLECTION_PROMPTS = [
  'How did it feel to disconnect for {duration}?',
  'What did you notice during your time away?',
  'What were you able to accomplish?',
  'How do you feel now compared to before?',
  'What thoughts came up while your phone was away?',
];

const MOOD_OPTIONS: { mood: ReflectionMood; emoji: string; label: string }[] = [
  { mood: 'great', emoji: '😊', label: 'Great' },
  { mood: 'calm', emoji: '😌', label: 'Calm' },
  { mood: 'energized', emoji: '💪', label: 'Energized' },
  { mood: 'relaxed', emoji: '😴', label: 'Relaxed' },
  { mood: 'thoughtful', emoji: '🤔', label: 'Thoughtful' },
  { mood: 'challenging', emoji: '😕', label: 'Challenging' },
];

export default function ReflectionScreen() {
  const { questId, duration } = useLocalSearchParams<{
    questId: string;
    duration: string;
  }>();
  const addReflectionToQuest = useQuestStore(
    (state) => state.addReflectionToQuest
  );

  const [selectedMood, setSelectedMood] = useState<ReflectionMood | null>(null);
  const [reflectionText, setReflectionText] = useState('');

  // Get a random prompt, replacing {duration} with the actual duration
  const prompt = React.useMemo(() => {
    const randomIndex = Math.floor(Math.random() * REFLECTION_PROMPTS.length);
    return REFLECTION_PROMPTS[randomIndex].replace('{duration}', duration);
  }, [duration]);

  const handleSaveReflection = () => {
    if (!questId) return;

    addReflectionToQuest(questId, {
      mood: selectedMood || undefined,
      text: reflectionText.trim() || undefined,
      createdAt: Date.now(),
      prompt: selectedMood || reflectionText.trim() ? prompt : undefined,
    });

    // Navigate back to home
    router.replace('/(app)');
  };

  const handleSkip = () => {
    router.replace('/(app)');
  };

  const characterCount = reflectionText.length;
  const maxCharacters = 500;

  return (
    <View className="flex-1 bg-background">
      <FocusAwareStatusBar />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <ScreenContainer className="flex-1">
          <ScrollView
            className="flex-1"
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View className="px-4 py-6">
              <Text className="mb-2 text-center text-2xl font-bold">
                Reflection Time
              </Text>
              <Text className="mb-6 text-center text-base text-neutral-600">
                {prompt}
              </Text>

              {/* Mood Selection */}
              <View className="mb-6">
                <Text className="mb-3 text-lg font-semibold">
                  How are you feeling?
                </Text>
                <View className="flex-row flex-wrap justify-between">
                  {MOOD_OPTIONS.map((option) => (
                    <TouchableOpacity
                      key={option.mood}
                      onPress={() => setSelectedMood(option.mood)}
                      className={`mb-3 w-[31%] items-center rounded-lg border-2 p-3 ${
                        selectedMood === option.mood
                          ? 'border-primary-300 bg-primary-50'
                          : 'border-neutral-200 bg-white'
                      }`}
                    >
                      <Text className="mb-1 text-2xl">{option.emoji}</Text>
                      <Text
                        className={`text-sm ${
                          selectedMood === option.mood
                            ? 'font-semibold text-primary-600'
                            : 'text-neutral-600'
                        }`}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Text Input */}
              <View className="mb-6">
                <Text className="mb-3 text-lg font-semibold">
                  Your thoughts (optional)
                </Text>
                <View className="rounded-lg border border-neutral-200 bg-white p-3">
                  <TextInput
                    multiline
                    numberOfLines={5}
                    maxLength={maxCharacters}
                    placeholder="Share your experience..."
                    placeholderTextColor={colors.neutral[400]}
                    value={reflectionText}
                    onChangeText={setReflectionText}
                    style={{
                      minHeight: 100,
                      textAlignVertical: 'top',
                      fontSize: 16,
                      color: colors.neutral[800],
                    }}
                  />
                  <Text className="mt-2 text-right text-sm text-neutral-500">
                    {characterCount}/{maxCharacters}
                  </Text>
                </View>
              </View>
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View className="border-t border-neutral-200 bg-white px-4 py-4">
            <Button
              label="Save Reflection"
              onPress={handleSaveReflection}
              disabled={!selectedMood && !reflectionText.trim()}
              className="mb-2"
            />
            <TouchableOpacity onPress={handleSkip} className="py-2">
              <Text className="text-center text-base text-neutral-600">
                Skip for now
              </Text>
            </TouchableOpacity>
          </View>
        </ScreenContainer>
      </KeyboardAvoidingView>
    </View>
  );
}
