import DateTimePicker from '@react-native-community/datetimepicker';
import { usePostHog } from 'posthog-react-native';
import React, { useState } from 'react';

import { Button, Card, Text, View } from '@/components/ui';
import { scheduleDailyReminderNotification } from '@/lib/services/notifications';
import { useSettingsStore } from '@/store/settings-store';

type Props = {
  defaultTime: Date;
  onClose: () => void;
};

export function DailyReminderModal({ defaultTime, onClose }: Props) {
  const [reminderTime, setReminderTime] = useState<Date>(defaultTime);
  const [wantsReminder, setWantsReminder] = useState<boolean | null>(null);

  const posthog = usePostHog();
  const setDailyReminder = useSettingsStore((state) => state.setDailyReminder);

  const handleTimeChange = (event: any, selectedDate?: Date) => {
    if (selectedDate) {
      setReminderTime(selectedDate);
    }
  };

  const handleScheduleNotification = async (time: Date) => {
    const success = await scheduleDailyReminderNotification(
      time.getHours(),
      time.getMinutes()
    );

    setDailyReminder({
      enabled: success,
      time: {
        hour: time.getHours(),
        minute: time.getMinutes(),
      },
    });

    posthog.capture('set_daily_reminder');

    return success;
  };

  const handleSubmit = async () => {
    if (wantsReminder) {
      await handleScheduleNotification(reminderTime);
    } else {
      setDailyReminder({ enabled: false, time: null });
      posthog.capture('declined_daily_reminder');
    }
    onClose();
  };

  return (
    <Card className="m-4 p-6">
      <Text className="mb-4 text-xl font-bold">Daily Reminder</Text>
      <Text className="mb-6">Want a daily nudge to start your next quest?</Text>

      <View className="mb-6 space-y-4">
        <Button
          label="Yes, remind me"
          variant={wantsReminder ? 'default' : 'outline'}
          onPress={() => setWantsReminder(true)}
        />

        {wantsReminder && (
          <View className="my-2 items-center">
            <Text className="mb-2">at</Text>
            <DateTimePicker
              value={reminderTime}
              mode="time"
              is24Hour={false}
              display="spinner"
              onChange={handleTimeChange}
            />
          </View>
        )}

        <Button
          label="No thanks"
          variant={wantsReminder === false ? 'default' : 'outline'}
          onPress={() => setWantsReminder(false)}
        />
      </View>

      <Button
        label="Confirm"
        onPress={handleSubmit}
        disabled={wantsReminder === null}
      />
    </Card>
  );
}
