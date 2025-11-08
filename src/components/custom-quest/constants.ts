/**
 * Custom Quest Screen Constants
 *
 * All magic numbers, strings, and configuration values for the custom quest creation feature.
 * Following Emberglow design system and business rules.
 */

// ============================================================================
// Default Values
// ============================================================================

/** Default quest duration in minutes (30 min) */
export const DEFAULT_QUEST_DURATION_MINUTES = 30;

/** Default quest category */
export const DEFAULT_QUEST_CATEGORY = 'fitness';

// ============================================================================
// Validation & Constraints
// ============================================================================

/** Minimum quest duration in minutes */
export const MIN_QUEST_DURATION_MINUTES = 5;

/** Maximum quest duration in minutes (4 hours) */
export const MAX_QUEST_DURATION_MINUTES = 240;

/** Step size for duration slider */
export const DURATION_STEP_MINUTES = 5;

// ============================================================================
// Business Logic - XP Calculation
// ============================================================================

/** XP earned per minute of quest duration (used in formula: duration * multiplier) */
export const XP_PER_MINUTE_MULTIPLIER = 3;

// ============================================================================
// UI Layout
// ============================================================================

/** Bottom padding for scroll view to ensure content visibility above button */
export const SCROLL_VIEW_BOTTOM_PADDING = 80;

// ============================================================================
// Screen Copy (Emberglow Branding)
// ============================================================================

/** Screen title */
export const SCREEN_TITLE = 'Custom Quest';

/** Screen subtitle - emphasizes disconnection and personal focus (Emberglow brand voice) */
export const SCREEN_SUBTITLE =
  'Design a personal challenge to disconnect and focus on what matters';

/** Start quest button label */
export const START_BUTTON_LABEL = 'Start Quest';

/** Error message shown when quest creation fails */
export const ERROR_MESSAGE_QUEST_CREATION_FAILED =
  'Failed to start quest. Please try again.';

// ============================================================================
// Accessibility Labels
// ============================================================================

/** Accessibility label for start button when enabled */
export const A11Y_START_BUTTON_ENABLED = 'Start your custom quest';

/** Accessibility label for start button when disabled */
export const A11Y_START_BUTTON_DISABLED = 'Enter a quest name to continue';

/** Accessibility hint for start button */
export const A11Y_START_BUTTON_HINT =
  'Begins your custom quest timer after a countdown';

/** Accessibility label for form container */
export const A11Y_FORM_LABEL = 'Custom quest creation form';

// ============================================================================
// Analytics Events
// ============================================================================

/** PostHog event names for custom quest analytics */
export const ANALYTICS_EVENTS = {
  /** Fired when custom quest screen is opened */
  OPEN_SCREEN: 'open_custom_quest_screen',

  /** Fired when user taps Start Quest button */
  START_QUEST_TRIGGER: 'trigger_start_custom_quest',

  /** Fired when quest is successfully created and started */
  START_QUEST_SUCCESS: 'success_start_custom_quest', // Fixed typo from 'sucess'

  /** Fired when quest creation fails */
  START_QUEST_ERROR: 'error_start_custom_quest',
} as const;
