import { OnboardingStep, useOnboardingStore } from './onboarding-store';

// Mock the storage module
jest.mock('@/lib/storage', () => ({
  getItem: jest.fn(() => null),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

describe('OnboardingStore', () => {
  beforeEach(() => {
    // Clear any persisted state and reset to initial state
    useOnboardingStore.setState({
      currentStep: OnboardingStep.NOT_STARTED,
    });
  });

  describe('setCurrentStep', () => {
    it('allows forward movement', () => {
      // Start at NOT_STARTED
      expect(useOnboardingStore.getState().currentStep).toBe(
        OnboardingStep.NOT_STARTED
      );

      // Move forward to SELECTING_CHARACTER
      useOnboardingStore
        .getState()
        .setCurrentStep(OnboardingStep.SELECTING_CHARACTER);
      expect(useOnboardingStore.getState().currentStep).toBe(
        OnboardingStep.SELECTING_CHARACTER
      );

      // Move forward to VIEWING_INTRO
      useOnboardingStore
        .getState()
        .setCurrentStep(OnboardingStep.VIEWING_INTRO);
      expect(useOnboardingStore.getState().currentStep).toBe(
        OnboardingStep.VIEWING_INTRO
      );

      // Move forward to REQUESTING_NOTIFICATIONS
      useOnboardingStore
        .getState()
        .setCurrentStep(OnboardingStep.REQUESTING_NOTIFICATIONS);
      expect(useOnboardingStore.getState().currentStep).toBe(
        OnboardingStep.REQUESTING_NOTIFICATIONS
      );

      // Move forward to STARTING_FIRST_QUEST
      useOnboardingStore
        .getState()
        .setCurrentStep(OnboardingStep.STARTING_FIRST_QUEST);
      expect(useOnboardingStore.getState().currentStep).toBe(
        OnboardingStep.STARTING_FIRST_QUEST
      );

      // Move forward to COMPLETED
      useOnboardingStore.getState().setCurrentStep(OnboardingStep.COMPLETED);
      expect(useOnboardingStore.getState().currentStep).toBe(
        OnboardingStep.COMPLETED
      );
    });

    it('allows staying at the same step', () => {
      // Move to VIEWING_INTRO
      useOnboardingStore
        .getState()
        .setCurrentStep(OnboardingStep.VIEWING_INTRO);
      expect(useOnboardingStore.getState().currentStep).toBe(
        OnboardingStep.VIEWING_INTRO
      );

      // Try to set the same step again
      useOnboardingStore
        .getState()
        .setCurrentStep(OnboardingStep.VIEWING_INTRO);
      expect(useOnboardingStore.getState().currentStep).toBe(
        OnboardingStep.VIEWING_INTRO
      );
    });

    it('prevents backward movement', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      // Move to COMPLETED
      useOnboardingStore.getState().setCurrentStep(OnboardingStep.COMPLETED);
      expect(useOnboardingStore.getState().currentStep).toBe(
        OnboardingStep.COMPLETED
      );

      // Try to move backward to VIEWING_SIGNUP_PROMPT
      useOnboardingStore
        .getState()
        .setCurrentStep(OnboardingStep.VIEWING_SIGNUP_PROMPT);

      // Should remain at COMPLETED
      expect(useOnboardingStore.getState().currentStep).toBe(
        OnboardingStep.COMPLETED
      );

      // Should have logged a warning
      expect(consoleSpy).toHaveBeenCalledWith(
        '[Onboarding] Attempted backward movement from completed to viewing_signup_prompt - blocked'
      );

      consoleSpy.mockRestore();
    });

    it('prevents multiple backward movements', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      // Move to VIEWING_INTRO
      useOnboardingStore
        .getState()
        .setCurrentStep(OnboardingStep.VIEWING_INTRO);
      expect(useOnboardingStore.getState().currentStep).toBe(
        OnboardingStep.VIEWING_INTRO
      );

      // Try to move backward to SELECTING_CHARACTER
      useOnboardingStore
        .getState()
        .setCurrentStep(OnboardingStep.SELECTING_CHARACTER);
      expect(useOnboardingStore.getState().currentStep).toBe(
        OnboardingStep.VIEWING_INTRO
      );

      // Try to move backward to NOT_STARTED
      useOnboardingStore.getState().setCurrentStep(OnboardingStep.NOT_STARTED);
      expect(useOnboardingStore.getState().currentStep).toBe(
        OnboardingStep.VIEWING_INTRO
      );

      // Should have logged warnings for both attempts
      expect(consoleSpy).toHaveBeenCalledTimes(2);

      consoleSpy.mockRestore();
    });

    it('logs successful forward movements', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      useOnboardingStore
        .getState()
        .setCurrentStep(OnboardingStep.VIEWING_INTRO);

      expect(consoleSpy).toHaveBeenCalledWith(
        '[Onboarding] Moving from not_started to viewing_intro'
      );

      consoleSpy.mockRestore();
    });
  });

  describe('helper methods', () => {
    it('correctly identifies onboarding completion', () => {
      // Should not be complete initially
      expect(useOnboardingStore.getState().isOnboardingComplete()).toBe(false);

      // Should not be complete at intermediate steps
      useOnboardingStore
        .getState()
        .setCurrentStep(OnboardingStep.SELECTING_CHARACTER);
      expect(useOnboardingStore.getState().isOnboardingComplete()).toBe(false);

      useOnboardingStore
        .getState()
        .setCurrentStep(OnboardingStep.VIEWING_SIGNUP_PROMPT);
      expect(useOnboardingStore.getState().isOnboardingComplete()).toBe(false);

      // Should be complete only at COMPLETED step
      useOnboardingStore.getState().setCurrentStep(OnboardingStep.COMPLETED);
      expect(useOnboardingStore.getState().isOnboardingComplete()).toBe(true);
    });

    it('correctly identifies first quest completion', () => {
      // Should not have completed first quest initially
      expect(useOnboardingStore.getState().hasCompletedFirstQuest()).toBe(
        false
      );

      // Should not have completed at early steps
      useOnboardingStore
        .getState()
        .setCurrentStep(OnboardingStep.SELECTING_CHARACTER);
      expect(useOnboardingStore.getState().hasCompletedFirstQuest()).toBe(
        false
      );

      // Should not have completed yet at STARTING_FIRST_QUEST
      useOnboardingStore
        .getState()
        .setCurrentStep(OnboardingStep.STARTING_FIRST_QUEST);
      expect(useOnboardingStore.getState().hasCompletedFirstQuest()).toBe(false);

      // Should have completed from VIEWING_SIGNUP_PROMPT onwards
      useOnboardingStore
        .getState()
        .setCurrentStep(OnboardingStep.VIEWING_SIGNUP_PROMPT);
      expect(useOnboardingStore.getState().hasCompletedFirstQuest()).toBe(true);

      useOnboardingStore.getState().setCurrentStep(OnboardingStep.COMPLETED);
      expect(useOnboardingStore.getState().hasCompletedFirstQuest()).toBe(true);
    });

    it('correctly identifies signup prompt status', () => {
      // Should not have seen signup prompt initially
      expect(useOnboardingStore.getState().hasSeenSignupPrompt()).toBe(false);

      // Should not have seen at early steps
      useOnboardingStore
        .getState()
        .setCurrentStep(OnboardingStep.STARTING_FIRST_QUEST);
      expect(useOnboardingStore.getState().hasSeenSignupPrompt()).toBe(false);

      // Should have seen from VIEWING_SIGNUP_PROMPT onwards
      useOnboardingStore
        .getState()
        .setCurrentStep(OnboardingStep.VIEWING_SIGNUP_PROMPT);
      expect(useOnboardingStore.getState().hasSeenSignupPrompt()).toBe(true);

      useOnboardingStore.getState().setCurrentStep(OnboardingStep.COMPLETED);
      expect(useOnboardingStore.getState().hasSeenSignupPrompt()).toBe(true);
    });
  });

  describe('resetOnboarding', () => {
    it('resets to initial state', () => {
      // Move to a later step
      useOnboardingStore.getState().setCurrentStep(OnboardingStep.COMPLETED);
      expect(useOnboardingStore.getState().currentStep).toBe(
        OnboardingStep.COMPLETED
      );
      expect(useOnboardingStore.getState().isOnboardingComplete()).toBe(true);

      // Reset
      useOnboardingStore.getState().resetOnboarding();

      // Should be back to initial state
      expect(useOnboardingStore.getState().currentStep).toBe(
        OnboardingStep.NOT_STARTED
      );
      expect(useOnboardingStore.getState().isOnboardingComplete()).toBe(false);
      expect(useOnboardingStore.getState().hasCompletedFirstQuest()).toBe(
        false
      );
      expect(useOnboardingStore.getState().hasSeenSignupPrompt()).toBe(false);
    });
  });
});
