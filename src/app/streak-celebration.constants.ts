/**
 * Animation timing constants for streak celebration screen
 */
export const ANIMATION_TIMING = {
  WEEK_VIEW_DELAY: 800,
  WEEK_VIEW_DURATION: 800,
  CONFETTI_DELAY: 100,
  DAY_ANIMATION_START_DELAY: 1200,
  DAY_ANIMATION_STAGGER: 200,
} as const;

/**
 * Spring animation configuration
 */
export const SPRING_CONFIG = {
  DAMPING: 12,
  STIFFNESS: 150,
} as const;

/**
 * Container and layout dimensions
 */
export const LAYOUT = {
  CONFETTI_CONTAINER_HEIGHT: 180,
  CONFETTI_SIZE_MULTIPLIER: 1.5,
  DAY_CIRCLE_SIZE: 48,
  WEEK_VIEW_PADDING: 24,
} as const;

/**
 * Animation interpolation values
 */
export const INTERPOLATION = {
  CONFETTI_OPACITY: 0.9,
  SCALE_FROM: 1,
  SCALE_BOUNCE: 1.2,
  SCALE_TO: 1,
  FLAME_SCALE_FROM: 0.5,
  FLAME_SCALE_BOUNCE: 1.3,
  FLAME_SCALE_TO: 1,
} as const;

/**
 * Color values for streak celebration
 * Using design system colors where possible
 */
export const COLORS = {
  DAY_NAME_TEXT: '#8FA5B2',
  WEEK_VIEW_BACKGROUND: '#2A4754',
  REMINDER_TEXT: '#F2E5DD',
} as const;

/**
 * Day name abbreviations
 */
export const DAY_NAMES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'] as const;

/**
 * Streak visualization constants
 */
export const STREAK = {
  DAYS_TO_SHOW: 5,
  MIN_STREAK_FOR_FULL_VIEW: 5,
  MILLISECONDS_IN_DAY: 24 * 60 * 60 * 1000,
} as const;
