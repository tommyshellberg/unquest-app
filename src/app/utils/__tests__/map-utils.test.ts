import {
  getFogMaskForQuest,
  getMapForQuest,
  getMapNameForQuest,
} from '../map-utils';
import { FOG_MASKS } from '@/app/data/maps';

// Mock only the maps data dependencies
jest.mock('@/app/data/maps', () => {
  // Create a stub for the FOG_MASKS with predictable values
  const mockFogMasks = {};
  for (let i = 1; i <= 10; i++) {
    const key = i.toString().padStart(2, '0');
    mockFogMasks[key] = `fog-${key}`; // Use strings for easier testing
  }

  return {
    MAP_NAMES: {
      'map-1': 'Vaedros Kingdom',
      'map-2': 'Darkwood Forest',
    },
    QUEST_MAP_MAPPING: {
      'map-1': [
        { id: 'quest-1' },
        { id: 'quest-1a' },
        { id: 'quest-1b' },
        { id: 'quest-2' },
        { id: 'quest-3' },
      ],
      'map-2': [{ id: 'quest-4' }, { id: 'quest-5' }],
    },
    FOG_MASKS: mockFogMasks,
  };
});

describe('Map Utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getMapForQuest', () => {
    it('should return the correct map ID for a quest in map-1', () => {
      expect(getMapForQuest('quest-1')).toBe('map-1');
      expect(getMapForQuest('quest-2')).toBe('map-1');
      expect(getMapForQuest('quest-3')).toBe('map-1');
    });

    it('should return the correct map ID for a quest in map-2', () => {
      expect(getMapForQuest('quest-4')).toBe('map-2');
      expect(getMapForQuest('quest-5')).toBe('map-2');
    });

    it('should handle side-quest IDs correctly', () => {
      expect(getMapForQuest('quest-1a')).toBe('map-1');
      expect(getMapForQuest('quest-1b')).toBe('map-1');
    });

    it('should default to map-1 when quest ID is not found', () => {
      expect(getMapForQuest('quest-99')).toBe('map-1');
      expect(getMapForQuest('invalid-id')).toBe('map-1');
    });
  });

  describe('getMapNameForQuest', () => {
    it('should return the correct map name for quests', () => {
      expect(getMapNameForQuest('quest-1')).toBe('Vaedros Kingdom');
      expect(getMapNameForQuest('quest-4')).toBe('Darkwood Forest');
    });

    it('should handle unknown quest IDs gracefully', () => {
      expect(getMapNameForQuest('quest-99')).toBe('Vaedros Kingdom');
    });
  });

  describe('getFogMaskForQuest', () => {
    it('should return the same fog level as the quest', () => {
      expect(getFogMaskForQuest('quest-3')).toBe('fog-03');
      expect(getFogMaskForQuest('quest-3a')).toBe('fog-03');
      expect(getFogMaskForQuest('quest-1b')).toBe('fog-01');
    });

    it('should handle undefined/empty quest IDs', () => {
      expect(getFogMaskForQuest(undefined)).toBe('fog-01');
      expect(getFogMaskForQuest('')).toBe('fog-01');
    });

    it('should handle unusual quest ID formats', () => {
      // Should still extract the number part and subtract 1
      expect(getFogMaskForQuest('quest-2-special')).toBe('fog-02');
      expect(getFogMaskForQuest('quest-3abc')).toBe('fog-03');

      // Should default when no valid number found
      expect(getFogMaskForQuest('not-a-quest')).toBe('fog-01');
    });
  });
});
