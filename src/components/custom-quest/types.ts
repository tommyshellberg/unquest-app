/**
 * Custom Quest Screen Types
 *
 * TypeScript type definitions for the custom quest creation feature.
 */

// ============================================================================
// Form Data Types
// ============================================================================

/** Form data structure for custom quest creation */
export type CustomQuestFormData = {
  /** User-entered quest name/title */
  questName: string;
  /** Quest duration in minutes */
  questDuration: number;
  /** Quest category (fitness, work, social, etc.) */
  questCategory: string;
};

// ============================================================================
// Validation Types
// ============================================================================

/** Form validation state */
export type CustomQuestFormValidation = {
  /** Whether the form is valid and can be submitted */
  canContinue: boolean;
  /** Optional validation error messages */
  validationErrors?: {
    questName?: string;
    questDuration?: string;
    questCategory?: string;
  };
};

// ============================================================================
// Quest Creation Types
// ============================================================================

/** Result of quest creation attempt */
export type QuestCreationResult = {
  /** Whether quest creation was successful */
  success: boolean;
  /** Error if quest creation failed */
  error?: Error;
};

/** Quest creation state */
export type QuestCreationState = {
  /** Whether a quest creation is in progress */
  isCreating: boolean;
  /** Error message if creation failed */
  error: string | null;
};
