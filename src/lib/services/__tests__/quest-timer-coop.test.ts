import { describe, expect, it, jest, beforeEach, afterEach } from '@jest/globals';
import { Platform } from 'react-native';
import { OneSignal } from 'react-native-onesignal';

import QuestTimer from '../quest-timer';
import { updateQuestRunStatus, createQuestRun } from '../quest-run-service';
import { setItem, getItem, removeItem } from '@/lib/storage';
import { type CustomQuestTemplate } from '@/store/types';

jest.mock('react-native-onesignal');
jest.mock('../quest-run-service');
jest.mock('@/lib/storage');
jest.mock('react-native', () => ({
  Platform: { OS: 'ios' },
}));

const mockOneSignal = OneSignal as jest.Mocked<typeof OneSignal>;
const mockUpdateQuestRunStatus = updateQuestRunStatus as jest.MockedFunction<
  typeof updateQuestRunStatus
>;
const mockCreateQuestRun = createQuestRun as jest.MockedFunction<
  typeof createQuestRun
>;
const mockSetItem = setItem as jest.MockedFunction<typeof setItem>;
const mockGetItem = getItem as jest.MockedFunction<typeof getItem>;
const mockRemoveItem = removeItem as jest.MockedFunction<typeof removeItem>;

describe('QuestTimer - Cooperative Quest Features', () => {
  const mockCooperativeQuest: CustomQuestTemplate = {
    id: 'coop-quest-1',
    mode: 'custom',
    title: 'Team Meditation',
    durationMinutes: 30,
    category: 'wellness',
    reward: { xp: 90 },
    inviteeIds: ['friend-1', 'friend-2'],
  };

  const mockSoloQuest: CustomQuestTemplate = {
    id: 'solo-quest-1',
    mode: 'custom',
    title: 'Solo Focus',
    durationMinutes: 20,
    category: 'productivity',
    reward: { xp: 60 },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockOneSignal.LiveActivities = {
      startDefault: jest.fn(),
    } as any;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('prepareQuest', () => {
    it('should show cooperative quest message for coop quests', async () => {
      mockCreateQuestRun.mockResolvedValue({ id: 'run-123' });

      await QuestTimer.prepareQuest(mockCooperativeQuest);

      expect(mockOneSignal.LiveActivities.startDefault).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          title: 'Cooperative Quest Ready',
          description: 'Waiting for all participants to be ready...',
        }),
        expect.any(Object)
      );
    });

    it('should show regular message for solo quests', async () => {
      mockCreateQuestRun.mockResolvedValue({ id: 'run-456' });

      await QuestTimer.prepareQuest(mockSoloQuest);

      expect(mockOneSignal.LiveActivities.startDefault).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          title: 'Quest Ready',
          description: 'Lock your phone to begin your quest',
        }),
        expect.any(Object)
      );
    });
  });

  describe('updateReadyState', () => {
    it('should update ready state successfully', async () => {
      // Set up quest run ID
      (QuestTimer as any).questRunId = 'run-123';
      (QuestTimer as any).oneSignalActivityId = 'activity-456';
      (QuestTimer as any).questTemplate = mockCooperativeQuest;

      await QuestTimer.updateReadyState(true);

      expect(mockUpdateQuestRunStatus).toHaveBeenCalledWith(
        'run-123',
        'pending',
        'activity-456',
        true
      );

      expect(mockOneSignal.LiveActivities.startDefault).toHaveBeenCalledWith(
        'activity-456',
        expect.objectContaining({
          title: 'Ready to Start!',
          description: 'Waiting for other participants...',
        }),
        expect.any(Object)
      );
    });

    it('should handle missing quest run ID', async () => {
      (QuestTimer as any).questRunId = null;
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await QuestTimer.updateReadyState(true);

      expect(consoleSpy).toHaveBeenCalledWith(
        'No quest run ID available to update ready state'
      );
      expect(mockUpdateQuestRunStatus).not.toHaveBeenCalled();
    });

    it('should update live activity for not ready state', async () => {
      (QuestTimer as any).questRunId = 'run-123';
      (QuestTimer as any).oneSignalActivityId = 'activity-456';
      (QuestTimer as any).questTemplate = mockCooperativeQuest;

      await QuestTimer.updateReadyState(false);

      expect(mockOneSignal.LiveActivities.startDefault).toHaveBeenCalledWith(
        'activity-456',
        expect.objectContaining({
          title: 'Cooperative Quest Ready',
          description: 'Tap "I\'m Ready" when you\'re prepared',
        }),
        expect.any(Object)
      );
    });

    it('should throw error on update failure', async () => {
      (QuestTimer as any).questRunId = 'run-123';
      mockUpdateQuestRunStatus.mockRejectedValue(new Error('Network error'));

      await expect(QuestTimer.updateReadyState(true)).rejects.toThrow(
        'Network error'
      );
    });
  });

  describe('isCooperativeQuest', () => {
    it('should return true for cooperative quests', () => {
      (QuestTimer as any).questTemplate = mockCooperativeQuest;
      expect(QuestTimer.isCooperativeQuest()).toBe(true);
    });

    it('should return false for solo quests', () => {
      (QuestTimer as any).questTemplate = mockSoloQuest;
      expect(QuestTimer.isCooperativeQuest()).toBe(false);
    });

    it('should return false when no quest template', () => {
      (QuestTimer as any).questTemplate = null;
      expect(QuestTimer.isCooperativeQuest()).toBe(false);
    });

    it('should return false for empty invitee list', () => {
      (QuestTimer as any).questTemplate = {
        ...mockCooperativeQuest,
        inviteeIds: [],
      };
      expect(QuestTimer.isCooperativeQuest()).toBe(false);
    });
  });

  describe('getQuestRunId', () => {
    it('should return quest run ID when available', () => {
      (QuestTimer as any).questRunId = 'run-123';
      expect(QuestTimer.getQuestRunId()).toBe('run-123');
    });

    it('should return null when no quest run ID', () => {
      (QuestTimer as any).questRunId = null;
      expect(QuestTimer.getQuestRunId()).toBeNull();
    });
  });

  describe('quest data persistence', () => {
    it('should save cooperative quest data', async () => {
      mockCreateQuestRun.mockResolvedValue({ id: 'run-123' });

      await QuestTimer.prepareQuest(mockCooperativeQuest);

      expect(mockSetItem).toHaveBeenCalledWith(
        'QUEST_TIMER_TEMPLATE',
        JSON.stringify(mockCooperativeQuest)
      );
      expect(mockSetItem).toHaveBeenCalledWith('QUEST_RUN_ID', 'run-123');
    });

    it('should load cooperative quest data', () => {
      mockGetItem.mockImplementation((key: string) => {
        switch (key) {
          case 'QUEST_TIMER_TEMPLATE':
            return JSON.stringify(mockCooperativeQuest);
          case 'QUEST_RUN_ID':
            return 'run-123';
          case 'ONESIGNAL_ACTIVITY_ID':
            return 'activity-456';
          default:
            return null;
        }
      });

      (QuestTimer as any).loadQuestData();

      expect((QuestTimer as any).questTemplate).toEqual(mockCooperativeQuest);
      expect((QuestTimer as any).questRunId).toBe('run-123');
      expect((QuestTimer as any).oneSignalActivityId).toBe('activity-456');
    });

    it('should clear cooperative quest data on stop', async () => {
      (QuestTimer as any).questRunId = 'run-123';
      (QuestTimer as any).oneSignalActivityId = 'activity-456';

      await QuestTimer.stopQuest();

      expect((QuestTimer as any).questRunId).toBeNull();
      expect(mockRemoveItem).toHaveBeenCalledWith('QUEST_RUN_ID');
    });
  });

  describe('onPhoneLocked', () => {
    it('should update quest run status to active for cooperative quests', async () => {
      (QuestTimer as any).questTemplate = mockCooperativeQuest;
      (QuestTimer as any).questRunId = 'run-123';
      (QuestTimer as any).oneSignalActivityId = 'activity-456';
      (QuestTimer as any).questStartTime = null;

      mockGetItem.mockReturnValue(JSON.stringify(mockCooperativeQuest));

      await QuestTimer.onPhoneLocked();

      expect(mockUpdateQuestRunStatus).toHaveBeenCalledWith(
        'run-123',
        'active',
        'activity-456'
      );
    });
  });

  describe('onPhoneUnlocked', () => {
    it('should update quest run status to failed for cooperative quests', async () => {
      (QuestTimer as any).questTemplate = mockCooperativeQuest;
      (QuestTimer as any).questRunId = 'run-123';
      (QuestTimer as any).questStartTime = Date.now() - 1000; // 1 second ago

      await QuestTimer.onPhoneUnlocked();

      expect(mockUpdateQuestRunStatus).toHaveBeenCalledWith('run-123', 'failed');
    });
  });
});