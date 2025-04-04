import Slider from '@react-native-community/slider';
import { format } from 'date-fns';
import React from 'react';
import { type Control, Controller } from 'react-hook-form';

// Import UI components
import { Input, Text, View } from '@/components/ui';

type CombinedQuestInputProps = {
  control: Control<any>;
  questDuration: number;
  errors: any;
};

export const CombinedQuestInput = ({
  control,
  questDuration,
  errors,
}: CombinedQuestInputProps) => {
  // Calculate start and end times
  const now = new Date();
  const endTime = new Date(now.getTime() + questDuration * 60000);

  return (
    <View className="my-5 rounded-xl bg-[#F5F5F0] p-5 shadow-sm">
      <View className="mb-2.5">
        <View className="flex-row items-center">
          <Text className="text-2xl font-medium text-[#333]">I want to</Text>
          <Controller
            control={control}
            rules={{
              required: "Please enter what you'll be doing",
            }}
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="go for a run"
                className="ml-2 h-10 flex-1 border-b border-[#3B7A57] bg-transparent px-2 text-2xl"
                placeholderTextColor="#999"
                error=""
                autoCapitalize="none"
                autoComplete="off"
                autoFocus={true}
                inputMode="text"
                multiline={false}
                style={{ includeFontPadding: false }}
              />
            )}
            name="questName"
          />
        </View>
        {/* Fixed-height error container to prevent layout shift */}
        <View className="h-5 pl-20">
          {errors.questName?.message && (
            <Text className="text-sm text-red-500">
              {errors.questName?.message}
            </Text>
          )}
        </View>
      </View>

      <View className="mb-2.5 flex-row items-center">
        <Text className="text-2xl font-medium text-[#333]">
          for {questDuration} minutes
        </Text>
      </View>

      {/* Slider for duration */}
      <Controller
        control={control}
        render={({ field: { onChange, value } }) => (
          <View className="mt-5">
            <Slider
              style={{ width: '100%', height: 40 }}
              minimumValue={1}
              maximumValue={120}
              step={1}
              value={value}
              onValueChange={onChange}
              minimumTrackTintColor="#3B7A57" // Forest green
              maximumTrackTintColor="#EAEAE5"
              thumbTintColor="#3B7A57"
            />

            <View className="mt-4 flex-row justify-between">
              <View className="w-[48%] items-center rounded-lg bg-[#EAEAE5] p-3">
                <Text className="mb-1 text-sm text-[#777]">FROM</Text>
                <Text className="text-2xl font-semibold text-[#333]">
                  {format(now, 'h:mm a')}
                </Text>
              </View>
              <View className="w-[48%] items-center rounded-lg bg-[#EAEAE5] p-3">
                <Text className="mb-1 text-sm text-[#777]">TO</Text>
                <Text className="text-2xl font-semibold text-[#333]">
                  {format(endTime, 'h:mm a')}
                </Text>
              </View>
            </View>
          </View>
        )}
        name="questDuration"
      />
    </View>
  );
};
