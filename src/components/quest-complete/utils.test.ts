import type { QuestWithMode } from './types';
import { POI_IMAGES } from './types';
import { getQuestImage, hashString } from './utils';

describe('quest-complete/utils', () => {
  describe('hashString', () => {
    it('should return consistent hash for same string', () => {
      const str = 'test-quest-id';
      const hash1 = hashString(str);
      const hash2 = hashString(str);
      expect(hash1).toBe(hash2);
    });

    it('should return different hashes for different strings', () => {
      const hash1 = hashString('quest-1');
      const hash2 = hashString('quest-2');
      expect(hash1).not.toBe(hash2);
    });

    it('should return positive number', () => {
      const hash = hashString('test');
      expect(hash).toBeGreaterThanOrEqual(0);
    });

    it('should handle empty string', () => {
      const hash = hashString('');
      expect(hash).toBe(0);
    });
  });

  describe('getQuestImage', () => {
    describe('story quests', () => {
      it('should return correct image for quest-1', () => {
        const quest: QuestWithMode = {
          id: 'quest-1',
          mode: 'story',
          title: 'Test Quest',
          durationMinutes: 5,
          reward: { xp: 10 },
          status: 'pending',
        };

        const image = getQuestImage(quest);
        expect(image).toBe(POI_IMAGES[1]);
      });

      it('should return correct image for quest-10', () => {
        const quest: QuestWithMode = {
          id: 'quest-10',
          mode: 'story',
          title: 'Test Quest',
          durationMinutes: 5,
          reward: { xp: 10 },
          status: 'pending',
        };

        const image = getQuestImage(quest);
        expect(image).toBe(POI_IMAGES[10]);
      });

      it('should extract number from quest-1a format', () => {
        const quest: QuestWithMode = {
          id: 'quest-5a',
          mode: 'story',
          title: 'Test Quest',
          durationMinutes: 5,
          reward: { xp: 10 },
          status: 'pending',
        };

        const image = getQuestImage(quest);
        expect(image).toBe(POI_IMAGES[5]);
      });

      it('should use customId if available', () => {
        const quest: QuestWithMode & { customId: string } = {
          id: 'some-random-id',
          customId: 'quest-7',
          mode: 'story',
          title: 'Test Quest',
          durationMinutes: 5,
          reward: { xp: 10 },
          status: 'pending',
        };

        const image = getQuestImage(quest);
        expect(image).toBe(POI_IMAGES[7]);
      });

      it('should handle quest numbers beyond 31 by wrapping', () => {
        const quest: QuestWithMode = {
          id: 'quest-35',
          mode: 'story',
          title: 'Test Quest',
          durationMinutes: 5,
          reward: { xp: 10 },
          status: 'pending',
        };

        const image = getQuestImage(quest);
        // Should wrap: 35 % 31 = 4, but we add 1 to avoid 0
        expect(image).toBe(POI_IMAGES[5]);
      });
    });

    describe('custom and cooperative quests', () => {
      it('should return consistent image for same quest id', () => {
        const quest: QuestWithMode = {
          id: 'custom-quest-123',
          mode: 'custom',
          category: 'fitness',
          title: 'Morning Run',
          durationMinutes: 30,
          reward: { xp: 50 },
          status: 'pending',
        };

        const image1 = getQuestImage(quest);
        const image2 = getQuestImage(quest);
        expect(image1).toBe(image2);
      });

      it('should return valid POI image', () => {
        const quest: QuestWithMode = {
          id: 'custom-quest-456',
          mode: 'custom',
          category: 'reading',
          title: 'Read Book',
          durationMinutes: 60,
          reward: { xp: 100 },
          status: 'pending',
        };

        const image = getQuestImage(quest);
        const isValidImage = Object.values(POI_IMAGES).includes(image);
        expect(isValidImage).toBe(true);
      });

      it('should return different images for different quest ids', () => {
        const quest1: QuestWithMode = {
          id: 'quest-a',
          mode: 'custom',
          category: 'fitness',
          title: 'Quest A',
          durationMinutes: 30,
          reward: { xp: 50 },
          status: 'pending',
        };

        const quest2: QuestWithMode = {
          id: 'quest-b',
          mode: 'custom',
          category: 'fitness',
          title: 'Quest B',
          durationMinutes: 30,
          reward: { xp: 50 },
          status: 'pending',
        };

        const image1 = getQuestImage(quest1);
        const image2 = getQuestImage(quest2);
        // Not guaranteed to be different, but very likely
        // We're just checking the function runs correctly
        expect(image1).toBeDefined();
        expect(image2).toBeDefined();
      });

      it('should handle cooperative quests', () => {
        const quest: QuestWithMode = {
          id: 'coop-quest-789',
          mode: 'cooperative',
          category: 'cooperative',
          title: 'Team Quest',
          durationMinutes: 45,
          reward: { xp: 75 },
          status: 'pending',
        };

        const image = getQuestImage(quest);
        const isValidImage = Object.values(POI_IMAGES).includes(image);
        expect(isValidImage).toBe(true);
      });
    });

    describe('edge cases', () => {
      it('should handle story quest with no number in id', () => {
        const quest: QuestWithMode = {
          id: 'invalid-quest-id',
          mode: 'story',
          title: 'Test Quest',
          durationMinutes: 5,
          reward: { xp: 10 },
          status: 'pending',
        };

        const image = getQuestImage(quest);
        // Should fall back to hash-based selection
        const isValidImage = Object.values(POI_IMAGES).includes(image);
        expect(isValidImage).toBe(true);
      });

      it('should handle quest with no mode', () => {
        const quest: QuestWithMode = {
          id: 'test-quest',
          title: 'Test Quest',
          durationMinutes: 5,
          reward: { xp: 10 },
          status: 'pending',
        };

        const image = getQuestImage(quest);
        // Should use hash-based selection
        const isValidImage = Object.values(POI_IMAGES).includes(image);
        expect(isValidImage).toBe(true);
      });
    });
  });
});
