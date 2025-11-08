import { getMetricLabel, getMetricLabelFull } from './leaderboard-utils';

describe('Leaderboard Utils', () => {
  describe('getMetricLabel', () => {
    it('should return correct label for quests', () => {
      expect(getMetricLabel('quests', 150)).toBe('150 quests');
    });

    it('should return correct label for single quest', () => {
      expect(getMetricLabel('quests', 1)).toBe('1 quests');
    });

    it('should return correct label for zero quests', () => {
      expect(getMetricLabel('quests', 0)).toBe('0 quests');
    });

    it('should return correct label for minutes', () => {
      expect(getMetricLabel('minutes', 3200)).toBe('3200 mins');
    });

    it('should return correct label for single minute', () => {
      expect(getMetricLabel('minutes', 1)).toBe('1 mins');
    });

    it('should return correct label for streak', () => {
      expect(getMetricLabel('streak', 45)).toBe('45 days');
    });

    it('should return correct label for single day streak', () => {
      expect(getMetricLabel('streak', 1)).toBe('1 days');
    });

    it('should handle large numbers', () => {
      expect(getMetricLabel('quests', 9999)).toBe('9999 quests');
      expect(getMetricLabel('minutes', 100000)).toBe('100000 mins');
      expect(getMetricLabel('streak', 365)).toBe('365 days');
    });
  });

  describe('getMetricLabelFull', () => {
    it('should return full label for quests', () => {
      expect(getMetricLabelFull('quests')).toBe('Quests Completed');
    });

    it('should return full label for minutes', () => {
      expect(getMetricLabelFull('minutes')).toBe('Minutes Off Phone');
    });

    it('should return full label for streak', () => {
      expect(getMetricLabelFull('streak')).toBe('Day Streak');
    });
  });
});
