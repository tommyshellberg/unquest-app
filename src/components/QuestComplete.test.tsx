import { router } from 'expo-router';
import { render, fireEvent } from '@testing-library/react-native';
import React from 'react';

import { QuestComplete } from './QuestComplete';
import { useCharacterStore } from '@/store/character-store';
import { useQuestStore } from '@/store/quest-store';
import { type Quest } from '@/store/types';

// Mock the router
jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
  },
}));

// Mock the stores
jest.mock('@/store/character-store');
jest.mock('@/store/quest-store');

describe('QuestComplete', () => {
  const mockClearRecentCompletedQuest = jest.fn();

  const mockQuest: Quest = {
    id: 'test-quest',
    title: 'Test Quest',
    mode: 'custom',
    category: 'fitness',
    durationMinutes: 30,
    reward: { xp: 100 },
    startTime: Date.now() - 30 * 60 * 1000,
    stopTime: Date.now(),
    status: 'completed',
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock useQuestStore to handle selector pattern
    (useQuestStore as unknown as jest.Mock).mockImplementation((selector) => {
      const state = {
        clearRecentCompletedQuest: mockClearRecentCompletedQuest,
      };
      return selector(state);
    });

    // Mock useCharacterStore to handle selector pattern
    (useCharacterStore as unknown as jest.Mock).mockImplementation(
      (selector) => {
        const state = {
          character: { name: 'Test Hero' },
        };
        return selector(state);
      }
    );
  });

  it('should navigate to home screen by default', () => {
    const { getByText } = render(
      <QuestComplete quest={mockQuest} story="Test story" />
    );

    const continueButton = getByText('Continue');
    fireEvent.press(continueButton);

    expect(mockClearRecentCompletedQuest).toHaveBeenCalled();
    expect(router.push).toHaveBeenCalledWith('/(app)');
  });

  it('should respect onContinue callback over default navigation', () => {
    const onContinue = jest.fn();

    const { getByText } = render(
      <QuestComplete
        quest={mockQuest}
        story="Test story"
        onContinue={onContinue}
      />
    );

    const continueButton = getByText('Continue');
    fireEvent.press(continueButton);

    expect(mockClearRecentCompletedQuest).toHaveBeenCalled();
    expect(onContinue).toHaveBeenCalled();
    expect(router.push).not.toHaveBeenCalled();
  });
});
