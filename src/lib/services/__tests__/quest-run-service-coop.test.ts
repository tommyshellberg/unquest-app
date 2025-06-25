import { describe, expect, it, jest, beforeEach } from '@jest/globals';

import { createQuestRun, updateQuestRunStatus, getQuestRunStatus } from '../quest-run-service';
import { apiClient } from '@/api';
import { provisionalApiClient } from '@/api/common/provisional-client';
import { getItem } from '@/lib/storage';
import { type CustomQuestTemplate } from '@/store/types';

jest.mock('@/api');
jest.mock('@/api/common/provisional-client');
jest.mock('@/lib/storage');

const mockedApiClient = apiClient as jest.Mocked<typeof apiClient>;
const mockedProvisionalApiClient = provisionalApiClient as jest.Mocked<
  typeof provisionalApiClient
>;
const mockedGetItem = getItem as jest.MockedFunction<typeof getItem>;

describe('Quest Run Service - Cooperative Features', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default to using authenticated client
    mockedGetItem.mockReturnValue('auth-token');
  });

  describe('createQuestRun', () => {
    it('should create quest run with inviteeIds for cooperative quests', async () => {
      const mockCooperativeQuest: CustomQuestTemplate = {
        id: 'quest-1',
        mode: 'custom',
        title: 'Team Meditation',
        durationMinutes: 30,
        category: 'wellness',
        reward: { xp: 90 },
        inviteeIds: ['user-2', 'user-3'],
      };

      const mockResponse = {
        id: 'run-456',
        questId: 'quest-1',
        userId: 'user-1',
        status: 'pending',
        invitationId: 'inv-123',
      };

      mockedApiClient.post.mockResolvedValueOnce({ data: mockResponse });

      const result = await createQuestRun(mockCooperativeQuest);

      expect(result).toEqual(mockResponse);
      expect(mockedApiClient.post).toHaveBeenCalledWith('/quest-runs', {
        questId: 'quest-1',
        durationMinutes: 30,
        inviteeIds: ['user-2', 'user-3'],
      });
    });

    it('should create quest run without inviteeIds for solo quests', async () => {
      const mockSoloQuest: CustomQuestTemplate = {
        id: 'quest-2',
        mode: 'custom',
        title: 'Solo Focus',
        durationMinutes: 20,
        category: 'productivity',
        reward: { xp: 60 },
      };

      const mockResponse = {
        id: 'run-789',
        questId: 'quest-2',
        userId: 'user-1',
        status: 'pending',
      };

      mockedApiClient.post.mockResolvedValueOnce({ data: mockResponse });

      const result = await createQuestRun(mockSoloQuest);

      expect(result).toEqual(mockResponse);
      expect(mockedApiClient.post).toHaveBeenCalledWith('/quest-runs', {
        questId: 'quest-2',
        durationMinutes: 20,
      });
    });
  });

  describe('updateQuestRunStatus', () => {
    it('should update quest run status with ready state', async () => {
      const mockResponse = {
        id: 'run-456',
        questId: 'quest-1',
        status: 'pending',
        participants: [
          { userId: 'user-1', ready: true, status: 'ready' },
        ],
      };

      mockedApiClient.put.mockResolvedValueOnce({ data: mockResponse });

      const result = await updateQuestRunStatus(
        'run-456',
        'pending',
        'activity-123',
        true
      );

      expect(result).toEqual(mockResponse);
      expect(mockedApiClient.put).toHaveBeenCalledWith(
        '/quest-runs/run-456/status',
        {
          status: 'pending',
          liveActivityId: 'activity-123',
          ready: true,
        }
      );
    });

    it('should update quest run status without ready state', async () => {
      const mockResponse = {
        id: 'run-456',
        questId: 'quest-1',
        status: 'active',
      };

      mockedApiClient.put.mockResolvedValueOnce({ data: mockResponse });

      const result = await updateQuestRunStatus('run-456', 'active');

      expect(result).toEqual(mockResponse);
      expect(mockedApiClient.put).toHaveBeenCalledWith(
        '/quest-runs/run-456/status',
        {
          status: 'active',
        }
      );
    });

    it('should handle provisional client for updates', async () => {
      mockedGetItem.mockReturnValue(null);
      mockedGetItem.mockReturnValueOnce('provisional-token');
      
      const mockResponse = {
        id: 'run-456',
        questId: 'quest-1',
        status: 'failed',
      };

      mockedProvisionalApiClient.put.mockResolvedValueOnce({
        data: mockResponse,
      });

      const result = await updateQuestRunStatus('run-456', 'failed');

      expect(result).toEqual(mockResponse);
      expect(mockedProvisionalApiClient.put).toHaveBeenCalledWith(
        '/quest-runs/run-456/status',
        {
          status: 'failed',
        }
      );
    });
  });

  describe('getQuestRunStatus', () => {
    it('should get quest run status with participants', async () => {
      const mockQuestRun = {
        id: 'run-456',
        questId: 'quest-1',
        userId: 'user-1',
        status: 'active',
        participants: [
          { userId: 'user-1', ready: true, status: 'active' },
          { userId: 'user-2', ready: true, status: 'active' },
          { userId: 'user-3', ready: false, status: 'pending' },
        ],
        startedAt: Date.now(),
      };

      mockedApiClient.get.mockResolvedValueOnce({ data: mockQuestRun });

      const result = await getQuestRunStatus('run-456');

      expect(result).toEqual(mockQuestRun);
      expect(mockedApiClient.get).toHaveBeenCalledWith('/quest-runs/run-456');
    });

    it('should handle quest run without participants', async () => {
      const mockQuestRun = {
        id: 'run-789',
        questId: 'quest-2',
        userId: 'user-1',
        status: 'completed',
        completedAt: Date.now(),
      };

      mockedApiClient.get.mockResolvedValueOnce({ data: mockQuestRun });

      const result = await getQuestRunStatus('run-789');

      expect(result).toEqual(mockQuestRun);
      expect(result.participants).toBeUndefined();
    });

    it('should use provisional client when appropriate', async () => {
      mockedGetItem.mockReturnValue(null);
      mockedGetItem.mockReturnValueOnce('provisional-token');
      
      const mockQuestRun = {
        id: 'run-456',
        questId: 'quest-1',
        userId: 'user-1',
        status: 'active',
      };

      mockedProvisionalApiClient.get.mockResolvedValueOnce({
        data: mockQuestRun,
      });

      const result = await getQuestRunStatus('run-456');

      expect(result).toEqual(mockQuestRun);
      expect(mockedProvisionalApiClient.get).toHaveBeenCalledWith(
        '/quest-runs/run-456'
      );
    });

    it('should handle errors gracefully', async () => {
      mockedApiClient.get.mockRejectedValueOnce(new Error('Network error'));

      await expect(getQuestRunStatus('run-456')).rejects.toThrow(
        'Network error'
      );
    });
  });
});