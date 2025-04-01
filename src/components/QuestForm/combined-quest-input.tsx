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
      <View className="mb-2.5 flex-row items-center">
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
              error={errors.questName?.message}
            />
          )}
          name="questName"
        />
      </View>

      <View className="mb-2.5 flex-row items-center">
        <Text className="text-2xl font-medium text-[#333]">
          for {questDuration} minutes
        </Text>
      </View>

      {/* Temporary replacement for Slider with basic input */}
      <Controller
        control={control}
        render={({ field: { onChange, value } }) => (
          <View className="mt-5">
            {/* Simplified slider replacement */}
            <View className="my-4 flex-row items-center justify-between">
              <Text className="text-base text-[#777]">1 min</Text>
              <Input
                value={value.toString()}
                onChangeText={(text) => {
                  const num = parseInt(text);
                  if (!isNaN(num) && num >= 1 && num <= 120) {
                    onChange(num);
                  }
                }}
                keyboardType="numeric"
                className="w-16 rounded-md border border-[#3B7A57] bg-white px-2 py-1 text-center"
              />
              <Text className="text-base text-[#777]">120 min</Text>
            </View>

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
