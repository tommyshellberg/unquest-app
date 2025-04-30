import 'react-native-get-random-values';

import { jest } from '@jest/globals';
import { Platform } from 'react-native';
// Import OneSignal for mocking
import { OneSignal } from 'react-native-onesignal';

// Import mocked modules
import {
  createQuestRun,
  updateQuestRunStatus,
} from '@/lib/services/quest-run-service';
// Import types
import type { StoryQuestTemplate } from '@/store/types';

import QuestTimer from './quest-timer';

// Mock dependencies
jest.mock('@/lib/services/quest-run-service', () => ({
  createQuestRun: jest.fn().mockResolvedValue({ id: 'mock-quest-run-id' }),
  updateQuestRunStatus: jest.fn().mockResolvedValue({}),
}));

jest.mock('@/lib/services/notifications', () => ({
  areNotificationsEnabled: jest.fn().mockResolvedValue(true),
  clearAllNotifications: jest.fn(),
  scheduleQuestCompletionNotification: jest.fn(),
}));

const mockGetItem = jest.fn().mockImplementation((key: string) => {
  if (key === 'QUEST_RUN_ID') return 'mock-quest-run-id';
  if (key === 'QUEST_TIMER_START_TIME') return '0'; // Mock timestamp
  if (key === 'QUEST_TIMER_TEMPLATE')
    return JSON.stringify({
      id: 'test-quest-id',
      title: 'Test Quest',
      durationMinutes: 15,
      mode: 'story',
      recap: 'Test quest recap',
      poiSlug: 'test-poi',
      story: 'Test story content',
      audioFile: 'test-audio.mp3',
      options: [{ id: 'option1', text: 'Option 1', nextQuestId: null }],
      reward: { xp: 100 },
    });
  if (key === 'ONESIGNAL_ACTIVITY_ID') return 'mock-activity-id';
  return null;
});

jest.mock('@/lib/storage', () => ({
  getItem: mockGetItem,
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

jest.mock('@/store/quest-store', () => {
  const mockStore = {
    setLiveActivityId: jest.fn(),
    startQuest: jest.fn(),
    completeQuest: jest.fn(),
    failQuest: jest.fn(),
    activeQuest: {
      id: 'test-quest-id',
      startTime: 0,
    },
  };

  return {
    useQuestStore: {
      getState: jest.fn().mockReturnValue(mockStore),
    },
  };
});

jest.mock('react-native-bg-actions', () => ({
  start: jest.fn().mockResolvedValue(undefined),
  stop: jest.fn().mockResolvedValue(undefined),
  isRunning: jest.fn().mockReturnValue(false),
  updateNotification: jest.fn().mockResolvedValue(undefined),
}));

describe('QuestTimer', () => {
  // Reset all mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock Platform.OS as 'ios' for consistent testing
    Platform.OS = 'ios';
    // Mock Date.now to ensure consistent timing
    jest.spyOn(Date, 'now').mockReturnValue(1000); // Mock timestamp
  });

  describe('prepareQuest', () => {
    it('creates a quest run on the server with status pending', async () => {
      // Arrange
      const mockQuestTemplate: StoryQuestTemplate = {
        id: 'test-quest-id',
        title: 'Test Quest',
        durationMinutes: 15,
        mode: 'story',
        recap: 'Test quest recap',
        poiSlug: 'test-poi',
        story: 'Test story content',
        audioFile: 'test-audio.mp3',
        options: [{ id: 'option1', text: 'Option 1', nextQuestId: null }],
        reward: { xp: 100 },
      };

      // Act
      await QuestTimer.prepareQuest(mockQuestTemplate);

      // Assert
      expect(createQuestRun).toHaveBeenCalledWith(mockQuestTemplate);

      // Verify OneSignal LiveActivity was started with pending status
      expect(OneSignal.LiveActivities.startDefault).toHaveBeenCalledWith(
        expect.any(String), // Activity ID
        expect.objectContaining({
          title: 'Quest Ready',
          description: 'Lock your phone to begin your quest',
        }),
        expect.objectContaining({
          durationMinutes: 15,
          status: 'pending',
        })
      );
    });

    it('continues with quest preparation even if server request fails', async () => {
      // Arrange
      (createQuestRun as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      );

      const mockQuestTemplate: StoryQuestTemplate = {
        id: 'test-quest-id',
        title: 'Test Quest',
        durationMinutes: 15,
        mode: 'story',
        recap: 'Test quest recap',
        poiSlug: 'test-poi',
        story: 'Test story content',
        audioFile: 'test-audio.mp3',
        options: [{ id: 'option1', text: 'Option 1', nextQuestId: null }],
        reward: { xp: 100 },
      };

      // Act
      await QuestTimer.prepareQuest(mockQuestTemplate);

      // Assert
      expect(createQuestRun).toHaveBeenCalledWith(mockQuestTemplate);

      // Verify we still continue with LiveActivity setup despite the error
      expect(OneSignal.LiveActivities.startDefault).toHaveBeenCalled();
    });
  });

  describe('onPhoneLocked', () => {
    it('updates quest run status to active when phone is locked', async () => {
      // Arrange
      const mockQuestTemplate: StoryQuestTemplate = {
        id: 'test-quest-id',
        title: 'Test Quest',
        durationMinutes: 15,
        mode: 'story',
        recap: 'Test quest recap',
        poiSlug: 'test-poi',
        story: 'Test story content',
        audioFile: 'test-audio.mp3',
        options: [{ id: 'option1', text: 'Option 1', nextQuestId: null }],
        reward: { xp: 100 },
      };

      // Set up internal state directly for onPhoneLocked
      // This simulates the state after prepareQuest is called
      // @ts-ignore - accessing private static properties for testing
      QuestTimer.questTemplate = mockQuestTemplate;
      // @ts-ignore - accessing private static properties for testing
      QuestTimer.questRunId = 'mock-quest-run-id';
      // @ts-ignore - accessing private static properties for testing
      QuestTimer.questStartTime = null; // this is important to trigger the quest start path
      // @ts-ignore - accessing private static properties for testing
      QuestTimer.isPhoneLocked = false;

      // Act
      await QuestTimer.onPhoneLocked();

      // Assert
      expect(updateQuestRunStatus).toHaveBeenCalledWith(
        'mock-quest-run-id',
        'active',
        expect.any(String)
      );

      // Verify LiveActivity was updated with active status
      expect(OneSignal.LiveActivities.startDefault).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          title: 'Test Quest',
        }),
        expect.objectContaining({
          status: 'active',
        })
      );
    });
  });

  describe('onPhoneUnlocked', () => {
    it('updates quest run status to failed when phone is unlocked during quest', async () => {
      // Arrange - set up with a quest that's in progress (shorter duration to ensure it fails)
      const mockQuestTemplate: StoryQuestTemplate = {
        id: 'test-quest-id',
        title: 'Test Quest',
        durationMinutes: 1, // Shorter duration
        mode: 'story',
        recap: 'Test quest recap',
        poiSlug: 'test-poi',
        story: 'Test story content',
        audioFile: 'test-audio.mp3',
        options: [{ id: 'option1', text: 'Option 1', nextQuestId: null }],
        reward: { xp: 100 },
      };

      // Mock a quest run in progress - very important for the test!
      // @ts-ignore - accessing private static properties for testing
      QuestTimer.questTemplate = mockQuestTemplate;
      // @ts-ignore - accessing private static properties for testing
      QuestTimer.questRunId = 'mock-quest-run-id';
      // @ts-ignore - accessing private static properties for testing
      QuestTimer.questStartTime = Date.now() - 10000; // Started 10 seconds ago
      // @ts-ignore - accessing private static properties for testing
      QuestTimer.isPhoneLocked = true;
      // @ts-ignore - accessing private static properties for testing
      QuestTimer.oneSignalActivityId = 'mock-activity-id';

      // Mock the store to have an active quest
      jest.spyOn(QuestTimer, 'loadQuestData').mockImplementation(async () => {
        // Don't need to do anything as we've already set the state manually
      });

      // Act - unlock the phone before quest duration is complete
      await QuestTimer.onPhoneUnlocked();

      // Assert
      expect(updateQuestRunStatus).toHaveBeenCalledWith(
        'mock-quest-run-id',
        'failed'
      );

      // Verify LiveActivity was updated with failed status
      expect(OneSignal.LiveActivities.startDefault).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          title: 'Quest Failed',
          description: 'Try again next time',
        }),
        expect.objectContaining({
          status: 'failed',
        })
      );
    });
  });
});
