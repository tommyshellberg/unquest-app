import React, { useEffect, useState } from 'react';

import { DailyReminderModal } from '@/components/modals/daily-reminder-modal';
import { useQuestStore } from '@/store/quest-store';
import { useSettingsStore } from '@/store/settings-store';

export function ReminderPromptController() {
  const [showReminderModal, setShowReminderModal] = useState(false);

  const completedQuests = useQuestStore((state) => state.completedQuests);
  const dailyReminder = useSettingsStore((state) => state.dailyReminder);
  const hasBeenPromptedForReminder = useSettingsStore(
    (state) => state.hasBeenPromptedForReminder
  );
  const setHasBeenPromptedForReminder = useSettingsStore(
    (state) => state.setHasBeenPromptedForReminder
  );

  useEffect(() => {
    // Check conditions to show reminder prompt:
    // 1. User has completed at least one quest
    // 2. User hasn't been prompted for reminder yet
    // 3. User doesn't already have a reminder set
    const hasCompletedQuests = completedQuests.length > 0;
    const hasReminderSet = dailyReminder.enabled && dailyReminder.time !== null;

    if (hasCompletedQuests && !hasReminderSet) {
      // Show prompt after a short delay to ensure app is fully loaded
      const timer = setTimeout(() => {
        setShowReminderModal(true);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [
    completedQuests,
    dailyReminder,
    hasBeenPromptedForReminder,
    setHasBeenPromptedForReminder,
  ]);

  const handleClose = () => {
    setShowReminderModal(false);
    setHasBeenPromptedForReminder(true);
  };

  return showReminderModal ? (
    <DailyReminderModal
      // Set default time to early evening (7:00 PM)
      defaultTime={new Date(new Date().setHours(19, 0, 0, 0))}
      onClose={handleClose}
    />
  ) : null;
}
