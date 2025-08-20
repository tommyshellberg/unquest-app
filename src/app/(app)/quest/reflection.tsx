import Slider from '@react-native-community/slider';
import { router, useLocalSearchParams } from 'expo-router';
import { Angry, Frown, Laugh, Meh, Smile } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, TextInput } from 'react-native';

import { useCreateQuestReflection } from '@/api/quest-reflection';
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

const ACTIVITY_CATEGORIES = [
  { id: 'fitness', label: 'Fitness' },
  { id: 'work', label: 'Work' },
  { id: 'self-care', label: 'Self-care' },
  { id: 'social', label: 'Social' },
  { id: 'learning', label: 'Learning' },
  { id: 'creative', label: 'Creative' },
  { id: 'household', label: 'Household' },
  { id: 'outdoors', label: 'Outdoors' },
  { id: 'other', label: 'Other' },
];

const MOOD_ICONS = [
  { value: 1, Icon: Angry, color: '#EF4444' },
  { value: 2, Icon: Frown, color: '#F59E0B' },
  { value: 3, Icon: Meh, color: '#6B7280' },
  { value: 4, Icon: Smile, color: '#10B981' },
  { value: 5, Icon: Laugh, color: '#3B82F6' },
];

export default function ReflectionScreen() {
  const { questId, questRunId, from } = useLocalSearchParams<{
    questId: string;
    questRunId: string;
    from?: string;
  }>();
  const addReflectionToQuest = useQuestStore(
    (state) => state.addReflectionToQuest
  );
  const createReflectionMutation = useCreateQuestReflection();

  const [moodValue, setMoodValue] = useState(3); // Default to neutral (3)
  const [reflectionText, setReflectionText] = useState('');
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);

  // Clear form data when the screen mounts with a new quest
  React.useEffect(() => {
    setMoodValue(3);
    setReflectionText('');
    setSelectedActivities([]);
  }, [questId, questRunId]);

  const currentMoodIcon = useMemo(
    () =>
      MOOD_ICONS.find((m) => m.value === Math.round(moodValue)) ||
      MOOD_ICONS[2],
    [moodValue]
  );

  const handleSaveReflection = async () => {
    if (!questRunId || createReflectionMutation.isPending) return;

    try {
      // Create reflection on server using mutation
      await createReflectionMutation.mutateAsync({
        questRunId,
        mood: moodValue,
        text: reflectionText.trim() || undefined,
        activities:
          selectedActivities.length > 0 ? selectedActivities : undefined,
      });

      // Also save locally for offline access
      if (questId) {
        addReflectionToQuest(questId, {
          mood: moodValue,
          text: reflectionText.trim() || undefined,
          activities: selectedActivities,
          createdAt: Date.now(),
        });
      }

      // Navigate back appropriately
      if (from === 'quest-detail') {
        router.back();
      } else {
        router.replace('/(app)');
      }
    } catch (error) {
      console.error('Failed to save reflection:', error);
      // Still navigate away even if server save failed
      if (from === 'quest-detail') {
        router.back();
      } else {
        router.replace('/(app)');
      }
    }
  };

  const handleSkip = () => {
    if (from === 'quest-detail') {
      router.back();
    } else {
      router.replace('/(app)');
    }
  };

  const toggleActivity = (activityId: string) => {
    setSelectedActivities((prev) =>
      prev.includes(activityId)
        ? prev.filter((id) => id !== activityId)
        : [...prev, activityId]
    );
  };

  const characterCount = reflectionText.length;
  const maxCharacters = 200;

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
                How do you feel after this quest? Take a moment to reflect on
                your time spent away from your phone.
              </Text>

              {/* Mood Slider */}
              <View className="mb-6">
                <Text className="mb-3 text-lg font-semibold">
                  How are you feeling?
                </Text>
                <View className="items-center rounded-lg bg-white p-4">
                  <currentMoodIcon.Icon
                    size={48}
                    color={currentMoodIcon.color}
                    className="mb-4"
                  />
                  <Slider
                    style={{ width: '100%', height: 40 }}
                    minimumValue={1}
                    maximumValue={5}
                    value={moodValue}
                    onSlidingComplete={setMoodValue}
                    minimumTrackTintColor={currentMoodIcon.color}
                    maximumTrackTintColor={colors.neutral[300]}
                    thumbTintColor={currentMoodIcon.color}
                    step={1}
                  />
                  <View className="mt-2 w-full flex-row justify-between">
                    {MOOD_ICONS.map((mood) => (
                      <mood.Icon
                        key={mood.value}
                        size={20}
                        color={
                          mood.value === Math.round(moodValue)
                            ? mood.color
                            : colors.neutral[400]
                        }
                      />
                    ))}
                  </View>
                </View>
              </View>

              {/* Activities */}
              <View className="mb-6">
                <Text className="mb-3 text-lg font-semibold">
                  What did you do? (optional)
                </Text>
                <View className="flex-row flex-wrap">
                  {ACTIVITY_CATEGORIES.map((activity) => (
                    <TouchableOpacity
                      key={activity.id}
                      onPress={() => toggleActivity(activity.id)}
                      className={`mb-2 mr-2 rounded-full px-4 py-2 ${
                        selectedActivities.includes(activity.id)
                          ? 'bg-primary-300'
                          : 'bg-neutral-100'
                      }`}
                    >
                      <Text
                        className={`text-sm ${
                          selectedActivities.includes(activity.id)
                            ? 'font-semibold text-white'
                            : 'text-neutral-700'
                        }`}
                      >
                        {activity.label}
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
                    numberOfLines={4}
                    maxLength={maxCharacters}
                    placeholder="Share your experience..."
                    placeholderTextColor={colors.neutral[400]}
                    value={reflectionText}
                    onChangeText={setReflectionText}
                    style={{
                      minHeight: 80,
                      textAlignVertical: 'top',
                      fontSize: 16,
                      color: colors.neutral[500],
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
          <View className="border-t border-neutral-200 bg-white p-4">
            <Button
              label={
                createReflectionMutation.isPending
                  ? 'Saving...'
                  : 'Save Reflection'
              }
              onPress={handleSaveReflection}
              disabled={
                createReflectionMutation.isPending ||
                (!moodValue &&
                  !reflectionText.trim() &&
                  selectedActivities.length === 0)
              }
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
