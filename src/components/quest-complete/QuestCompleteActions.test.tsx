import { fireEvent, render } from '@testing-library/react-native';
import { router } from 'expo-router';
import React from 'react';

import { useQuestStore } from '@/store/quest-store';

import { QuestCompleteActions } from './QuestCompleteActions';
import type { QuestWithMode } from './types';

// Mock dependencies
jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
  },
}));

jest.mock('@/store/quest-store');

describe('QuestCompleteActions', () => {
  const mockClearRecentCompletedQuest = jest.fn();

  const mockQuestWithRunId: QuestWithMode & {
    questRunId: string;
  } = {
    id: 'quest-2',
    questRunId: 'run-123',
    mode: 'story',
    title: 'Test Quest',
    durationMinutes: 5,
    reward: { xp: 10 },
    status: 'completed',
  };

  const mockOnboardingQuest: QuestWithMode & {
    questRunId: string;
  } = {
    id: 'quest-1', // Onboarding quest
    questRunId: 'run-456',
    mode: 'story',
    title: 'First Quest',
    durationMinutes: 5,
    reward: { xp: 10 },
    status: 'completed',
  };

  const mockQuestWithoutRunId: QuestWithMode = {
    id: 'custom-1',
    mode: 'custom',
    category: 'fitness',
    title: 'Custom Quest',
    durationMinutes: 30,
    reward: { xp: 50 },
    status: 'completed',
  };

  beforeEach(() => {
    jest.clearAllMocks();

    (useQuestStore as unknown as jest.Mock).mockImplementation((selector) => {
      const state = {
        clearRecentCompletedQuest: mockClearRecentCompletedQuest,
      };
      return selector(state);
    });
  });

  describe('Continue Button', () => {
    it('should render continue button with default text', () => {
      const { getByText } = render(
        <QuestCompleteActions
          quest={mockQuestWithRunId}
          continueText="Continue"
        />
      );
      expect(getByText('Continue')).toBeTruthy();
    });

    it('should render continue button with custom text', () => {
      const { getByText } = render(
        <QuestCompleteActions
          quest={mockQuestWithRunId}
          continueText="Next Adventure"
        />
      );
      expect(getByText('Next Adventure')).toBeTruthy();
    });

    it('should call clearRecentCompletedQuest when pressed', () => {
      const { getByText } = render(
        <QuestCompleteActions
          quest={mockQuestWithRunId}
          continueText="Continue"
        />
      );

      fireEvent.press(getByText('Continue'));
      expect(mockClearRecentCompletedQuest).toHaveBeenCalled();
    });

    it('should navigate to home by default', () => {
      const { getByText } = render(
        <QuestCompleteActions
          quest={mockQuestWithRunId}
          continueText="Continue"
        />
      );

      fireEvent.press(getByText('Continue'));
      expect(router.push).toHaveBeenCalledWith('/(app)');
    });

    it('should call onContinue callback if provided', () => {
      const onContinue = jest.fn();
      const { getByText } = render(
        <QuestCompleteActions
          quest={mockQuestWithRunId}
          onContinue={onContinue}
          continueText="Continue"
        />
      );

      fireEvent.press(getByText('Continue'));
      expect(onContinue).toHaveBeenCalled();
      expect(router.push).not.toHaveBeenCalled();
    });
  });

  describe('Reflection Button', () => {
    it('should show reflection button for non-onboarding quests with questRunId', () => {
      const { getByText } = render(
        <QuestCompleteActions
          quest={mockQuestWithRunId}
          continueText="Continue"
        />
      );
      expect(getByText('Add Reflection')).toBeTruthy();
    });

    it('should NOT show reflection button for onboarding quest (quest-1)', () => {
      const { queryByText } = render(
        <QuestCompleteActions
          quest={mockOnboardingQuest}
          continueText="Continue"
        />
      );
      expect(queryByText('Add Reflection')).toBeNull();
    });

    it('should NOT show reflection button for quests without questRunId', () => {
      const { queryByText } = render(
        <QuestCompleteActions
          quest={mockQuestWithoutRunId}
          continueText="Continue"
        />
      );
      expect(queryByText('Add Reflection')).toBeNull();
    });

    it('should navigate to reflection screen when pressed', () => {
      const { getByText } = render(
        <QuestCompleteActions
          quest={mockQuestWithRunId}
          continueText="Continue"
        />
      );

      fireEvent.press(getByText('Add Reflection'));
      expect(router.push).toHaveBeenCalledWith({
        pathname: '/(app)/quest/reflection',
        params: {
          questId: 'quest-2',
          questRunId: 'run-123',
          duration: 5,
        },
      });
    });
  });

  describe('Accessibility', () => {
    it('should have accessible label for continue button', () => {
      const { getByLabelText } = render(
        <QuestCompleteActions
          quest={mockQuestWithRunId}
          continueText="Continue"
        />
      );
      expect(getByLabelText('Continue')).toBeTruthy();
    });

    it('should have accessible label for reflection button', () => {
      const { getByLabelText } = render(
        <QuestCompleteActions
          quest={mockQuestWithRunId}
          continueText="Continue"
        />
      );
      expect(getByLabelText('Reflect on quest')).toBeTruthy();
    });
  });

  describe('Layout', () => {
    it('should render buttons in a row', () => {
      const { getByTestId } = render(
        <QuestCompleteActions
          quest={mockQuestWithRunId}
          continueText="Continue"
        />
      );
      expect(getByTestId('quest-actions-container')).toBeTruthy();
    });

    it('should render only continue button when reflection not available', () => {
      const { getByText, queryByText } = render(
        <QuestCompleteActions
          quest={mockQuestWithoutRunId}
          continueText="Continue"
        />
      );
      expect(getByText('Continue')).toBeTruthy();
      expect(queryByText('Add Reflection')).toBeNull();
    });
  });
});
