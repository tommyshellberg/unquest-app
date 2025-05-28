import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { Swords } from 'lucide-react-native';
import { usePostHog } from 'posthog-react-native';
import React, { useState } from 'react';
import { Platform, Pressable } from 'react-native';

import { Button, FocusAwareStatusBar, Text, View } from '@/components/ui';
import { scheduleDailyReminderNotification } from '@/lib/services/notifications';
import { useSettingsStore } from '@/store/settings-store';

export default function ReminderSetup() {
  const router = useRouter();
  const [reminderTime, setReminderTime] = useState<Date>(
    new Date(new Date().setHours(10, 0, 0, 0))
  );

  const posthog = usePostHog();
  const setDailyReminder = useSettingsStore((state) => state.setDailyReminder);

  const handleTimeChange = (event: any, selectedDate?: Date) => {
    if (selectedDate) {
      setReminderTime(selectedDate);
    }
  };

  const handleSetReminder = async () => {
    const success = await scheduleDailyReminderNotification(
      reminderTime.getHours(),
      reminderTime.getMinutes()
    );

    setDailyReminder({
      enabled: success,
      time: {
        hour: reminderTime.getHours(),
        minute: reminderTime.getMinutes(),
      },
    });

    console.log('[ReminderSetup] Setting daily reminder');
    posthog.capture('set_daily_reminder');
    router.replace('/(app)');
  };

  const handleSkip = () => {
    setDailyReminder({ enabled: false, time: null });
    console.log('[ReminderSetup] declined daily reminder');
    posthog.capture('declined_daily_reminder');
    router.replace('/(app)');
  };

  return (
    <View className="flex-1 bg-primary-400 px-6">
      <FocusAwareStatusBar />

      {/* Header with back button would go here */}
      <View className="h-2" />

      <View className="flex-1 items-center justify-between py-2">
        {/* Decorative icon - new addition */}
        <View className="relative size-32 items-center justify-center">
          <View className="absolute size-20 items-center justify-center rounded-full bg-primary-300/50">
            <Swords size={32} color="#FFFFFF" />
          </View>
          {/* Path decoration */}
          <View className="absolute size-28 rotate-45 rounded-full border border-white/10" />
        </View>

        <View className="w-full items-center">
          <Text className="mb-4 text-center text-2xl font-bold text-white">
            When will you quest each day?
          </Text>

          <Text className="mb-4 text-center text-white">
            Set a daily reminder to help build lasting habits. We'll send you a
            gentle nudge when it's time to start your quest.
          </Text>

          {/* Time picker - keeping as is */}
          <View className="my-4 w-full">
            {Platform.OS === 'ios' ? (
              <DateTimePicker
                value={reminderTime}
                mode="time"
                display="spinner"
                onChange={handleTimeChange}
                minuteInterval={5}
                textColor="#FFFFFF"
                themeVariant="dark"
                style={{ height: 180, width: '100%' }}
              />
            ) : (
              <DateTimePicker
                value={reminderTime}
                mode="time"
                display="spinner"
                onChange={handleTimeChange}
                minuteInterval={5}
                textColor="#FFFFFF"
                themeVariant="dark"
              />
            )}
          </View>
        </View>

        {/* Buttons */}
        <View className="w-full pb-6">
          <Button
            label="Set daily reminder"
            onPress={handleSetReminder}
            className="mb-6 bg-primary-500"
            textClassName="text-white font-bold"
          />

          <Pressable onPress={handleSkip} className="items-center">
            <Text className="text-center text-white underline">
              Skip for now
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
