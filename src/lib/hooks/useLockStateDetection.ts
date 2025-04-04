import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useEffect } from 'react';

// Import the modules directly
import addLockListener from '@/../modules/lock-state';
import QuestTimer from '@/lib/services/quest-timer';

export default function useLockStateDetection() {
  useEffect(() => {
    // Subscribe to the device locking
    const lockSub = addLockListener('LOCKED', async () => {
      console.log('Device locked!');

      // Notify QuestTimer that the phone is locked
      await QuestTimer.onPhoneLocked();
    });

    // Subscribe to the device unlocking
    const unlockSub = addLockListener('UNLOCKED', async () => {
      console.log('Device unlocked!');

      // Notify QuestTimer that the phone is unlocked
      await QuestTimer.onPhoneUnlocked();
    });

    // Set up notification handler for deep linking
    // @todo: this seems to do nothing
    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data;
        if (data?.screen === 'quest-complete') {
          // The navigation will be handled by the useCompletedQuestCheck hook
          // when the recentCompletedQuest state is detected
          router.replace('/(app)/quest-complete');
        }
      }
    );

    return () => {
      // Clean up the subscriptions
      lockSub.remove();
      unlockSub.remove();
      subscription.remove();
    };
  }, []);

  return;
}
