/**
 * Animation timing constants for QuestComplete screen
 * All values in milliseconds
 */
export const ANIMATION_TIMING = {
  // Initial delays before animations start
  HEADER_DELAY: 200,
  STORY_DELAY: 600,
  ACTIONS_DELAY: 1000,

  // Animation durations
  HEADER_DURATION: 800,
  STORY_DURATION: 800,
  ACTIONS_DURATION: 800,

  // Lottie animation delay
  LOTTIE_DELAY: 300,

  // Stagger delay for entering animations
  ENTERING_DELAY_1: 200,
  ENTERING_DELAY_2: 400,
} as const;

/**
 * Number of POI images available
 */
export const TOTAL_POI_IMAGES = 31;

/**
 * Quest ID that marks the end of onboarding
 * Users cannot add reflections to this quest
 */
export const ONBOARDING_QUEST_ID = 'quest-1';
