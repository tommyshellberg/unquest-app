import { Redirect } from 'expo-router';
import { useEffect } from 'react';

import { useQuestStore } from '@/store/quest-store';
import { useSettingsStore } from '@/store/settings-store';

export function ReminderPromptController() {
  const completedQuests = useQuestStore((state) => state.completedQuests);
  const dailyReminder = useSettingsStore((state) => state.dailyReminder);
  const hasBeenPromptedForReminder = useSettingsStore(
    (state) => state.hasBeenPromptedForReminder
  );
  const setHasBeenPromptedForReminder = useSettingsStore(
    (state) => state.setHasBeenPromptedForReminder
  );

  // Check conditions to show reminder prompt
  const hasCompletedQuests = completedQuests.length > 0;
  const hasReminderSet = dailyReminder.enabled && dailyReminder.time !== null;
  const shouldPrompt =
    hasCompletedQuests && !hasReminderSet && !hasBeenPromptedForReminder;

  // Mark as prompted to prevent redirect loops
  useEffect(() => {
    if (shouldPrompt) {
      setHasBeenPromptedForReminder(true);
    }
  }, [shouldPrompt, setHasBeenPromptedForReminder]);

  // Redirect to reminder setup when conditions are met
  if (shouldPrompt) {
    console.log('Redirecting to reminder setup');
    // TODO: Redirect to reminder setup
    return <Redirect href="/(app)/reminder-setup" />;
  }

  // No need to render anything if not redirecting
  return null;
}
