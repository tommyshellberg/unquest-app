import { render } from '@testing-library/react-native';
import React from 'react';

import { QuestImage } from './QuestImage';
import type { QuestWithMode } from './types';

// Mock Lottie
jest.mock('lottie-react-native', () => 'LottieView');

describe('QuestImage', () => {
  const mockStoryQuest: QuestWithMode = {
    id: 'quest-1',
    mode: 'story',
    title: 'Test Story Quest',
    durationMinutes: 5,
    reward: { xp: 10 },
    status: 'pending',
  };

  const mockCustomQuest: QuestWithMode = {
    id: 'custom-123',
    mode: 'custom',
    category: 'fitness',
    title: 'Test Custom Quest',
    durationMinutes: 30,
    reward: { xp: 50 },
    status: 'pending',
  };

  describe('Rendering', () => {
    it('should render image for story quest', () => {
      const { getByTestId } = render(<QuestImage quest={mockStoryQuest} />);
      expect(getByTestId('quest-image')).toBeTruthy();
    });

    it('should render image for custom quest', () => {
      const { getByTestId } = render(<QuestImage quest={mockCustomQuest} />);
      expect(getByTestId('quest-image')).toBeTruthy();
    });

    it('should render XP badge', () => {
      const { getByText } = render(<QuestImage quest={mockStoryQuest} />);
      expect(getByText('+10 XP')).toBeTruthy();
    });

    it('should render Lottie animation', () => {
      const { UNSAFE_getByType } = render(
        <QuestImage quest={mockStoryQuest} />
      );
      const lottieViews = UNSAFE_getByType('LottieView' as any);
      expect(lottieViews).toBeTruthy();
    });
  });

  describe('XP Display', () => {
    it('should display correct XP for different reward amounts', () => {
      const questWith100XP: QuestWithMode = {
        ...mockCustomQuest,
        reward: { xp: 100 },
      };

      const { getByText } = render(<QuestImage quest={questWith100XP} />);
      expect(getByText('+100 XP')).toBeTruthy();
    });

    it('should handle large XP values', () => {
      const questWithLargeXP: QuestWithMode = {
        ...mockCustomQuest,
        reward: { xp: 9999 },
      };

      const { getByText } = render(<QuestImage quest={questWithLargeXP} />);
      expect(getByText('+9999 XP')).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible label for XP badge', () => {
      const { getByLabelText } = render(<QuestImage quest={mockStoryQuest} />);
      expect(getByLabelText('Experience points reward: 10 XP')).toBeTruthy();
    });

    it('should have accessible label for quest image container', () => {
      const { getByTestId } = render(<QuestImage quest={mockStoryQuest} />);
      expect(getByTestId('quest-image-container')).toBeTruthy();
    });
  });

  describe('Image Selection', () => {
    it('should use consistent image for same quest', () => {
      const { getByTestId: getByTestId1 } = render(
        <QuestImage quest={mockStoryQuest} />
      );
      const { getByTestId: getByTestId2 } = render(
        <QuestImage quest={mockStoryQuest} />
      );

      const image1 = getByTestId1('quest-image');
      const image2 = getByTestId2('quest-image');

      expect(image1.props.source).toEqual(image2.props.source);
    });
  });

  describe('Animation Behavior', () => {
    it('should not disable animations by default', () => {
      const { UNSAFE_getByType } = render(
        <QuestImage quest={mockStoryQuest} />
      );
      const lottieView = UNSAFE_getByType('LottieView' as any);
      expect(lottieView.props.autoPlay).toBe(false);
    });

    it('should respect disableAnimations prop', () => {
      const { UNSAFE_queryByType } = render(
        <QuestImage quest={mockStoryQuest} disableAnimations={true} />
      );
      // Animation should still be present but won't auto-play
      const lottieView = UNSAFE_queryByType('LottieView' as any);
      expect(lottieView).toBeTruthy();
    });
  });
});
