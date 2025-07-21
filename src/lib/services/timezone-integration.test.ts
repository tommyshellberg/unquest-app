/**
 * Integration test to verify timezone detection works with the React Native app
 */
import * as Localization from 'expo-localization';

import { getDeviceTimezone } from './timezone-service';

// Mock expo-localization
jest.mock('expo-localization');

describe('Timezone Integration', () => {
  it('should correctly detect device timezone from expo-localization', () => {
    const testTimezone = 'America/Chicago';
    // @ts-ignore
    Localization.timezone = testTimezone;

    const detectedTimezone = getDeviceTimezone();

    expect(detectedTimezone).toBe(testTimezone);
  });

  it('should handle different timezone formats', () => {
    const timezones = [
      'America/New_York',
      'Europe/London',
      'Asia/Tokyo',
      'Australia/Sydney',
      'UTC',
    ];

    timezones.forEach((tz) => {
      // @ts-ignore
      Localization.timezone = tz;
      expect(getDeviceTimezone()).toBe(tz);
    });
  });
});
