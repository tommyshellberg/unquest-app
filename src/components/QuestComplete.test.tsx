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
    
    // Default mock implementations
    (useQuestStore.getState as jest.Mock).mockReturnValue({
      clearRecentCompletedQuest: jest.fn(),
      lastCompletedQuestTimestamp: null,
    });
    
    (useCharacterStore.getState as jest.Mock).mockReturnValue({
      character: { name: 'Test Hero' },
      dailyQuestStreak: 0,
      lastStreakCelebrationShown: null,
    });
  });

  it('should navigate to home screen by default', () => {
    const { getByText } = render(
      <QuestComplete quest={mockQuest} story="Test story" />
    );

    const continueButton = getByText('Continue');
    fireEvent.press(continueButton);

    expect(router.push).toHaveBeenCalledWith('/(app)');
  });

  it('should navigate to streak celebration for first quest of the day with streak', () => {
    // Set up a scenario where:
    // 1. User has a streak
    // 2. Last quest was completed yesterday
    // 3. Haven't shown celebration today
    const yesterday = Date.now() - 24 * 60 * 60 * 1000;
    
    (useQuestStore.getState as jest.Mock).mockReturnValue({
      clearRecentCompletedQuest: jest.fn(),
      lastCompletedQuestTimestamp: yesterday,
    });
    
    (useCharacterStore.getState as jest.Mock).mockReturnValue({
      character: { name: 'Test Hero' },
      dailyQuestStreak: 3, // Has a 3-day streak
      lastStreakCelebrationShown: null, // Never shown
    });

    const { getByText } = render(
      <QuestComplete quest={mockQuest} story="Test story" />
    );

    const continueButton = getByText('Continue');
    fireEvent.press(continueButton);

    expect(router.push).toHaveBeenCalledWith('/streak-celebration');
  });

  it('should not show streak celebration if already shown today', () => {
    const yesterday = Date.now() - 24 * 60 * 60 * 1000;
    const todayMorning = new Date();
    todayMorning.setHours(8, 0, 0, 0);
    
    (useQuestStore.getState as jest.Mock).mockReturnValue({
      clearRecentCompletedQuest: jest.fn(),
      lastCompletedQuestTimestamp: yesterday,
    });
    
    (useCharacterStore.getState as jest.Mock).mockReturnValue({
      character: { name: 'Test Hero' },
      dailyQuestStreak: 3,
      lastStreakCelebrationShown: todayMorning.getTime(), // Shown earlier today
    });

    const { getByText } = render(
      <QuestComplete quest={mockQuest} story="Test story" />
    );

    const continueButton = getByText('Continue');
    fireEvent.press(continueButton);

    expect(router.push).toHaveBeenCalledWith('/(app)');
  });

  it('should not show streak celebration for second quest of the same day', () => {
    const earlierToday = Date.now() - 2 * 60 * 60 * 1000; // 2 hours ago
    
    (useQuestStore.getState as jest.Mock).mockReturnValue({
      clearRecentCompletedQuest: jest.fn(),
      lastCompletedQuestTimestamp: earlierToday,
    });
    
    (useCharacterStore.getState as jest.Mock).mockReturnValue({
      character: { name: 'Test Hero' },
      dailyQuestStreak: 1,
      lastStreakCelebrationShown: null,
    });

    const { getByText } = render(
      <QuestComplete quest={mockQuest} story="Test story" />
    );

    const continueButton = getByText('Continue');
    fireEvent.press(continueButton);

    expect(router.push).toHaveBeenCalledWith('/(app)');
  });

  it('should not show streak celebration if no streak', () => {
    const yesterday = Date.now() - 24 * 60 * 60 * 1000;
    
    (useQuestStore.getState as jest.Mock).mockReturnValue({
      clearRecentCompletedQuest: jest.fn(),
      lastCompletedQuestTimestamp: yesterday,
    });
    
    (useCharacterStore.getState as jest.Mock).mockReturnValue({
      character: { name: 'Test Hero' },
      dailyQuestStreak: 0, // No streak
      lastStreakCelebrationShown: null,
    });

    const { getByText } = render(
      <QuestComplete quest={mockQuest} story="Test story" />
    );

    const continueButton = getByText('Continue');
    fireEvent.press(continueButton);

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

    expect(onContinue).toHaveBeenCalled();
    expect(router.push).not.toHaveBeenCalled();
  });
});