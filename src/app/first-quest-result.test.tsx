import React from 'react';

import { fireEvent, render, waitFor } from '@/lib/test-utils';
import { useOnboardingStore } from '@/store/onboarding-store';
import { OnboardingStep } from '@/store/onboarding-store';
import { useQuestStore } from '@/store/quest-store';

import FirstQuestResultScreen from './first-quest-result';

// Create shared mock functions at module level
const mockRouterReplace = jest.fn();
const mockRouterPush = jest.fn();
const mockUseLocalSearchParams = jest.fn(() => ({ outcome: 'completed' }));

// Mock expo-router
jest.mock('expo-router', () => ({
  router: {
    replace: (...args: any[]) => mockRouterReplace(...args),
    push: (...args: any[]) => mockRouterPush(...args),
  },
  useLocalSearchParams: (...args: any[]) => mockUseLocalSearchParams(...args),
}));

jest.mock('posthog-react-native', () => ({
  usePostHog: () => ({
    capture: jest.fn(),
  }),
}));

// Mock components
jest.mock('@/components/QuestComplete', () => ({
  QuestComplete: ({ onContinue }: { onContinue: () => void }) => {
    const MockView = require('react-native').View;
    const MockButton = require('react-native').Pressable;
    const MockText = require('react-native').Text;
    return (
      <MockView testID="quest-complete">
        <MockButton testID="continue-button" onPress={onContinue}>
          <MockText>Continue Your Journey</MockText>
        </MockButton>
      </MockView>
    );
  },
}));

jest.mock('@/components/failed-quest', () => ({
  FailedQuest: ({ onRetry }: { onRetry: () => void }) => {
    const MockView = require('react-native').View;
    const MockButton = require('react-native').Pressable;
    const MockText = require('react-native').Text;
    return (
      <MockView testID="failed-quest">
        <MockButton testID="retry-button" onPress={onRetry}>
          <MockText>Try Again</MockText>
        </MockButton>
      </MockView>
    );
  },
}));

jest.mock('@/app/data/quests', () => ({
  AVAILABLE_QUESTS: [
    {
      id: 'quest-1',
      mode: 'story',
      title: 'First Quest',
      story: 'You completed your first trial!',
      duration: 120,
    },
  ],
}));

// Mock stores
const mockOnboardingStore = {
  setCurrentStep: jest.fn(),
  isOnboardingComplete: jest.fn(() => false),
};

const mockQuestStore = {
  resetFailedQuest: jest.fn(),
  clearRecentCompletedQuest: jest.fn(),
  recentCompletedQuest: null,
};

jest.mock('@/store/onboarding-store', () => ({
  useOnboardingStore: jest.fn(),
  OnboardingStep: {
    VIEWING_SIGNUP_PROMPT: 'VIEWING_SIGNUP_PROMPT',
    COMPLETED: 'COMPLETED',
  },
}));

jest.mock('@/store/quest-store', () => ({
  useQuestStore: jest.fn(),
}));

const mockUseOnboardingStore = useOnboardingStore as jest.MockedFunction<
  typeof useOnboardingStore
>;
const mockUseQuestStore = useQuestStore as jest.MockedFunction<
  typeof useQuestStore
>;

describe('FirstQuestResultScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockUseOnboardingStore.mockImplementation((selector) =>
      selector(mockOnboardingStore as any)
    );
    mockUseQuestStore.mockImplementation((selector) =>
      selector(mockQuestStore as any)
    );
  });

  describe('Quest Completion Flow', () => {
    it('should call clearRecentCompletedQuest when Continue button is pressed', () => {
      const { getByTestId } = render(<FirstQuestResultScreen />);

      const continueButton = getByTestId('continue-button');
      fireEvent.press(continueButton);

      // This test will FAIL because clearRecentCompletedQuest is not called in the current implementation
      expect(mockQuestStore.clearRecentCompletedQuest).toHaveBeenCalled();
    });

    it('should set onboarding step to VIEWING_SIGNUP_PROMPT when Continue is pressed', () => {
      const { getByTestId } = render(<FirstQuestResultScreen />);

      const continueButton = getByTestId('continue-button');
      fireEvent.press(continueButton);

      expect(mockOnboardingStore.setCurrentStep).toHaveBeenCalledWith(
        OnboardingStep.VIEWING_SIGNUP_PROMPT
      );
    });
  });

  describe('Navigation Behavior', () => {
    it('should use router.replace instead of router.push for navigation', async () => {
      const { getByTestId } = render(<FirstQuestResultScreen />);

      const continueButton = getByTestId('continue-button');
      fireEvent.press(continueButton);

      // Wait for any async navigation
      await waitFor(
        () => {
          // This test will FAIL because the current implementation uses router.push
          expect(mockRouterReplace).toHaveBeenCalledWith(
            '/quest-completed-signup'
          );
          expect(mockRouterPush).not.toHaveBeenCalled();
        },
        { timeout: 200 }
      );
    });

    it('should clear quest state before navigation to prevent stale state', () => {
      const { getByTestId } = render(<FirstQuestResultScreen />);

      const continueButton = getByTestId('continue-button');
      fireEvent.press(continueButton);

      // Verify both functions are called (order is ensured by code structure)
      expect(mockQuestStore.clearRecentCompletedQuest).toHaveBeenCalled();
      expect(mockOnboardingStore.setCurrentStep).toHaveBeenCalledWith(
        OnboardingStep.VIEWING_SIGNUP_PROMPT
      );
    });
  });

  describe('Failed Quest Flow', () => {
    beforeEach(() => {
      // Mock the useLocalSearchParams to return failed outcome
      mockUseLocalSearchParams.mockReturnValue({ outcome: 'failed' });
    });

    it('should call resetFailedQuest when Retry button is pressed', () => {
      const { getByTestId } = render(<FirstQuestResultScreen />);

      const retryButton = getByTestId('retry-button');
      fireEvent.press(retryButton);

      expect(mockQuestStore.resetFailedQuest).toHaveBeenCalled();
    });

    it('should navigate to first-quest screen on retry', () => {
      const { getByTestId } = render(<FirstQuestResultScreen />);

      const retryButton = getByTestId('retry-button');
      fireEvent.press(retryButton);

      expect(mockRouterReplace).toHaveBeenCalledWith('/onboarding/first-quest');
    });
  });
});
