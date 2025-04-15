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

    return () => {
      // Clean up the subscriptions
      lockSub.remove();
      unlockSub.remove();
    };
  }, []);

  return;
}
