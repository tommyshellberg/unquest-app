import { apiClient } from '@/api';
import type { StoryQuestTemplate } from '@/store/types';

import { createQuestRun, updateQuestRunStatus } from './quest-run-service';

// Mock the apiClient
jest.mock('@/api', () => ({
  apiClient: {
    post: jest.fn(),
    patch: jest.fn(),
  },
}));

describe('quest-run-service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createQuestRun', () => {
    it('should create a quest run for a story quest', async () => {
      // Arrange
      const mockResponse = {
        data: {
          id: 'mock-quest-run-id',
          status: 'pending',
          participants: ['user-123'],
          quest: {
            title: 'Test Quest',
            durationMinutes: 15,
            mode: 'story',
            category: '',
            reward: { xp: 100 },
            options: [],
          },
        },
      };

      (apiClient.post as jest.Mock).mockResolvedValueOnce(mockResponse);

      const mockStoryQuest: StoryQuestTemplate = {
        id: 'test-quest-id',
        title: 'Test Quest',
        durationMinutes: 15,
        mode: 'story',
        recap: 'Test recap',
        poiSlug: 'test-poi',
        story: 'Test story',
        options: [{ id: 'option1', text: 'Option 1', nextQuestId: null }],
        reward: { xp: 100 },
      };

      // Act
      const result = await createQuestRun(mockStoryQuest);

      // Assert
      expect(apiClient.post).toHaveBeenCalledWith('/quest-runs/', {
        quest: { questTemplateId: 'test-quest-id' },
      });
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle errors when creating a quest run', async () => {
      // Arrange
      const mockError = new Error('API error');
      (apiClient.post as jest.Mock).mockRejectedValueOnce(mockError);

      const mockStoryQuest: StoryQuestTemplate = {
        id: 'test-quest-id',
        title: 'Test Quest',
        durationMinutes: 15,
        mode: 'story',
        recap: 'Test recap',
        poiSlug: 'test-poi',
        story: 'Test story',
        options: [{ id: 'option1', text: 'Option 1', nextQuestId: null }],
        reward: { xp: 100 },
      };

      // Act & Assert
      await expect(createQuestRun(mockStoryQuest)).rejects.toThrow('API error');
      expect(apiClient.post).toHaveBeenCalledWith('/quest-runs/', {
        quest: { questTemplateId: 'test-quest-id' },
      });
    });
  });

  describe('updateQuestRunStatus', () => {
    it('should update a quest run status without liveActivityId', async () => {
      // Arrange
      const mockResponse = {
        data: {
          id: 'mock-quest-run-id',
          status: 'active',
          participants: ['user-123'],
          quest: {
            title: 'Test Quest',
            durationMinutes: 15,
            mode: 'story',
            category: '',
            reward: { xp: 100 },
            options: [],
          },
        },
      };

      (apiClient.patch as jest.Mock).mockResolvedValueOnce(mockResponse);

      // Act
      const result = await updateQuestRunStatus('mock-quest-run-id', 'active');

      // Assert
      expect(apiClient.patch).toHaveBeenCalledWith(
        '/quest-runs/mock-quest-run-id/status',
        { status: 'active' }
      );
      expect(result).toEqual(mockResponse.data);
    });

    it('should update a quest run status with liveActivityId', async () => {
      // Arrange
      const mockResponse = {
        data: {
          id: 'mock-quest-run-id',
          status: 'active',
          participants: ['user-123'],
          quest: {
            title: 'Test Quest',
            durationMinutes: 15,
            mode: 'story',
            category: '',
            reward: { xp: 100 },
            options: [],
          },
        },
      };

      (apiClient.patch as jest.Mock).mockResolvedValueOnce(mockResponse);

      // Act
      const result = await updateQuestRunStatus(
        'mock-quest-run-id',
        'active',
        'live-activity-123'
      );

      // Assert
      expect(apiClient.patch).toHaveBeenCalledWith(
        '/quest-runs/mock-quest-run-id/status',
        { status: 'active', liveActivityId: 'live-activity-123' }
      );
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle errors when updating a quest run status', async () => {
      // Arrange
      const mockError = new Error('API error');
      (apiClient.patch as jest.Mock).mockRejectedValueOnce(mockError);

      // Act & Assert
      await expect(
        updateQuestRunStatus('mock-quest-run-id', 'failed')
      ).rejects.toThrow('API error');
      expect(apiClient.patch).toHaveBeenCalledWith(
        '/quest-runs/mock-quest-run-id/status',
        { status: 'failed' }
      );
    });
  });
});
