import 'react-native-get-random-values';

import { jest } from '@jest/globals';
import { Platform } from 'react-native';
// Import OneSignal for mocking
import { OneSignal } from 'react-native-onesignal';

// Import mocked modules
import {
  createQuestRun,
  updateQuestRunStatus,
  updatePhoneLockStatus,
  getQuestRunStatus,
} from '@/lib/services/quest-run-service';
// Import types
import type { StoryQuestTemplate } from '@/store/types';
// Import the store for assertions
import { useQuestStore } from '@/store/quest-store';

import QuestTimer from './quest-timer';

// Mock dependencies
jest.mock('@/lib/services/quest-run-service', () => ({
  createQuestRun: jest.fn().mockResolvedValue({ id: 'mock-quest-run-id' }),
  updateQuestRunStatus: jest.fn().mockResolvedValue({}),
  updatePhoneLockStatus: jest.fn().mockResolvedValue({ 
    id: 'mock-quest-run-id', 
    status: 'active',
    participants: []
  }),
  getQuestRunStatus: jest.fn().mockResolvedValue({
    id: 'mock-quest-run-id',
    status: 'active',
    actualStartTime: Date.now(),
    scheduledEndTime: Date.now() + 900000,
  }),
}));

jest.mock('react-native-onesignal', () => ({
  OneSignal: {
    LiveActivities: {
      startDefault: jest.fn(),
      exit: jest.fn(),
      setupDefault: jest.fn(),
      updateDefault: jest.fn(),
    },
  },
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

const mockSetItem = jest.fn();
const mockRemoveItem = jest.fn();

jest.mock('@/lib/storage', () => ({
  getItem: mockGetItem,
  setItem: mockSetItem,
  removeItem: mockRemoveItem,
}));

jest.mock('@/store/quest-store', () => {
  const mockStore = {
    setLiveActivityId: jest.fn(),
    startQuest: jest.fn(),
    completeQuest: jest.fn(),
    failQuest: jest.fn(),
    resetActiveQuest: jest.fn(),
    setCooperativeQuestRun: jest.fn(),
    activeQuest: {
      id: 'test-quest-id',
      startTime: 0,
    },
    cooperativeQuestRun: null,
  };

  return {
    useQuestStore: {
      getState: jest.fn().mockReturnValue(mockStore),
    },
  };
});

jest.mock('@/store/user-store', () => ({
  useUserStore: {
    getState: jest.fn(() => ({
      user: { id: 'test-user-id' },
    })),
  },
}));

jest.mock('@/store/character-store', () => ({
  useCharacterStore: {
    getState: jest.fn(() => ({
      character: { id: 'test-character-id' },
    })),
  },
}));

// Mock uuid
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-uuid-' + Math.random()),
}));

// Mock react-native-bg-actions
jest.mock('react-native-bg-actions', () => ({
  start: jest.fn(),
  stop: jest.fn(),
  isRunning: jest.fn().mockReturnValue(false),
  updateNotification: jest.fn(),
  // Add the default export
  default: {
    start: jest.fn(),
    stop: jest.fn(),
    isRunning: jest.fn().mockReturnValue(false),
    updateNotification: jest.fn(),
  },
}));

describe('QuestTimer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset Platform.OS to ios for most tests
    Platform.OS = 'ios';
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
      expect(mockSetItem).toHaveBeenCalledWith('QUEST_TIMER_TEMPLATE', JSON.stringify(mockQuestTemplate));
      expect(mockSetItem).toHaveBeenCalledWith('QUEST_RUN_ID', 'mock-quest-run-id');
    });

    it('continues with quest preparation even if server request fails', async () => {
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

      // Mock server failure
      (createQuestRun as jest.Mock).mockRejectedValue(new Error('Server error'));

      // Act
      await QuestTimer.prepareQuest(mockQuestTemplate);

      // Assert - should continue with quest preparation despite server error
      expect(createQuestRun).toHaveBeenCalledWith(mockQuestTemplate);
      expect(mockSetItem).toHaveBeenCalledWith('QUEST_TIMER_TEMPLATE', JSON.stringify(mockQuestTemplate));
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
        options: [],
        reward: { xp: 100 },
      };

      // Prepare quest first
      await QuestTimer.prepareQuest(mockQuestTemplate);

      // Act
      await QuestTimer.onPhoneLocked();

      // Assert
      expect(updatePhoneLockStatus).toHaveBeenCalledWith(
        'mock-quest-run-id',
        true,
        expect.any(String)
      );
    });

    it('should handle duplicate phone lock calls', async () => {
      // Arrange
      // @ts-ignore
      QuestTimer.isPhoneLocked = true;
      
      // Act
      await QuestTimer.onPhoneLocked();
      
      // Assert
      expect(updatePhoneLockStatus).not.toHaveBeenCalled();
    });
  });

  describe('stopQuest', () => {
    it('should stop quest and clear all data', async () => {
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
        options: [],
        reward: { xp: 100 },
      };

      // Prepare quest first
      await QuestTimer.prepareQuest(mockQuestTemplate);

      // Act
      await QuestTimer.stopQuest();

      // Assert - should clear storage
      expect(mockRemoveItem).toHaveBeenCalledWith('QUEST_TIMER_TEMPLATE');
      expect(mockRemoveItem).toHaveBeenCalledWith('QUEST_TIMER_START_TIME');
      expect(mockRemoveItem).toHaveBeenCalledWith('ONESIGNAL_ACTIVITY_ID');
      expect(mockRemoveItem).toHaveBeenCalledWith('QUEST_RUN_ID');
    });

    it('should handle Android platform', async () => {
      // Arrange
      Platform.OS = 'android';
      const BackgroundService = require('react-native-bg-actions');
      BackgroundService.isRunning.mockReturnValue(true);

      // Act
      await QuestTimer.stopQuest();

      // Assert
      expect(BackgroundService.stop).toHaveBeenCalled();
    });
  });

  describe('onPhoneUnlocked', () => {
    it('marks quest as failed locally when phone is unlocked during quest', async () => {
      // Arrange - set up with a quest that's in progress
      const mockQuestTemplate: StoryQuestTemplate = {
        id: 'test-quest-id',
        title: 'Test Quest',
        durationMinutes: 1, // Short duration
        mode: 'story',
        recap: 'Test quest recap',
        poiSlug: 'test-poi',
        story: 'Test story content',
        audioFile: 'test-audio.mp3',
        options: [{ id: 'option1', text: 'Option 1', nextQuestId: null }],
        reward: { xp: 100 },
      };

      // Prepare quest first
      await QuestTimer.prepareQuest(mockQuestTemplate);
      
      // Mock the quest as started
      // @ts-ignore
      QuestTimer.questStartTime = Date.now() - 10000; // Started 10 seconds ago
      // @ts-ignore
      QuestTimer.isPhoneLocked = true;

      // Act - unlock the phone before quest duration is complete
      await QuestTimer.onPhoneUnlocked();

      // Assert - verify unlock status was sent to server
      expect(updatePhoneLockStatus).toHaveBeenCalledWith(
        'mock-quest-run-id',
        false
      );

      // Verify quest was failed locally
      const questStore = useQuestStore.getState();
      expect(questStore.failQuest).toHaveBeenCalled();
    });

    it('handles cooperative quest unlock differently than single-player', async () => {
      // Arrange - set up cooperative quest
      const mockQuestTemplate: StoryQuestTemplate = {
        id: 'test-quest-id',
        title: 'Cooperative Quest',
        durationMinutes: 5,
        mode: 'story',
        recap: 'Test cooperative quest',
        poiSlug: 'test-poi',
        story: 'Test story content',
        audioFile: 'test-audio.mp3',
        options: [],
        reward: { xp: 100 },
      };

      // Mock cooperative quest run in store
      const mockCooperativeQuestRun = {
        id: 'mock-quest-run-id',
        questId: 'test-quest-id',
        status: 'active',
        participants: []
      };
      
      (useQuestStore.getState as jest.Mock).mockReturnValue({
        ...useQuestStore.getState(),
        cooperativeQuestRun: mockCooperativeQuestRun,
        failQuest: jest.fn(),
        activeQuest: {
          id: 'test-quest-id',
          startTime: 0,
        }
      });

      // Prepare quest first
      await QuestTimer.prepareQuest(mockQuestTemplate);

      // Act
      await QuestTimer.onPhoneUnlocked();

      // Assert - should send unlock status to server
      expect(updatePhoneLockStatus).toHaveBeenCalledWith(
        'mock-quest-run-id',
        false
      );
    });
  });

  describe('prepareQuest with cooperative quest', () => {
    it('should throw error if cooperative quest has no questRunId', async () => {
      // Arrange
      const cooperativeQuest: StoryQuestTemplate = {
        id: 'coop-quest-1',
        title: 'Cooperative Quest',
        durationMinutes: 10,
        mode: 'story',
        category: 'cooperative',
        recap: 'Test cooperative quest',
        poiSlug: 'test-poi',
        story: 'Test story',
        audioFile: 'test.mp3',
        options: [],
        reward: { xp: 200 },
      };
      
      // Act & Assert
      await expect(QuestTimer.prepareQuest(cooperativeQuest)).rejects.toThrow(
        'Cooperative quest must have an existing quest run ID from server'
      );
    });
    
    it('should use provided cooperativeQuestRunId for cooperative quests', async () => {
      // Arrange
      const cooperativeQuest: StoryQuestTemplate = {
        id: 'coop-quest-1',
        title: 'Cooperative Quest',
        durationMinutes: 10,
        mode: 'story',
        category: 'cooperative',
        recap: 'Test cooperative quest',
        poiSlug: 'test-poi',
        story: 'Test story',
        audioFile: 'test.mp3',
        options: [],
        reward: { xp: 200 },
      };
      
      // Act
      await QuestTimer.prepareQuest(cooperativeQuest, 'existing-coop-run-id');
      
      // Assert
      expect(createQuestRun).not.toHaveBeenCalled(); // Should not create new quest run
      expect(mockSetItem).toHaveBeenCalledWith('QUEST_RUN_ID', 'existing-coop-run-id');
    });
  });

  describe('Android platform specific tests', () => {
    beforeEach(() => {
      Platform.OS = 'android';
    });
    
    it('should use BackgroundService for Android', async () => {
      // Arrange
      const BackgroundService = require('react-native-bg-actions');
      const mockQuestTemplate: StoryQuestTemplate = {
        id: 'test-quest-id',
        title: 'Test Quest',
        durationMinutes: 15,
        mode: 'story',
        recap: 'Test quest recap',
        poiSlug: 'test-poi',
        story: 'Test story content',
        audioFile: 'test-audio.mp3',
        options: [],
        reward: { xp: 100 },
      };
      
      // Act
      await QuestTimer.prepareQuest(mockQuestTemplate);
      
      // Assert
      expect(BackgroundService.start).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({
          taskName: 'QuestTimer',
          taskTitle: 'Quest Ready',
          taskDesc: 'Lock your phone to begin your quest',
          parameters: expect.objectContaining({
            questDuration: 900000, // 15 * 60 * 1000
            questTitle: 'Test Quest',
            questId: 'test-quest-id',
          }),
        })
      );
      expect(OneSignal.LiveActivities.startDefault).not.toHaveBeenCalled();
    });
  });
});