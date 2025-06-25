import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { describe, expect, it, jest, beforeEach } from '@jest/globals';

import { QuestComplete } from '../QuestComplete';
import { FailedQuest } from '../failed-quest';
import { useCooperativeQuest } from '@/lib/hooks/use-cooperative-quest';
import { scheduleCooperativeQuestCompleteNotification } from '@/lib/services/notifications';
import { type Quest, type CooperativeQuestRun } from '@/store/types';

jest.mock('@/lib/hooks/use-cooperative-quest');
jest.mock('@/lib/services/notifications');
jest.mock('react-native-reanimated', () => ({
  ...jest.requireActual('react-native-reanimated/mock'),
  FadeInDown: {
    delay: () => ({ duration: () => ({}) }),
  },
}));

const mockUseCooperativeQuest = useCooperativeQuest as jest.MockedFunction<
  typeof useCooperativeQuest
>;
const mockScheduleNotification =
  scheduleCooperativeQuestCompleteNotification as jest.MockedFunction<
    typeof scheduleCooperativeQuestCompleteNotification
  >;

describe('QuestComplete - Cooperative Quest Features', () => {
  const mockQuest: Quest = {
    id: 'quest-1',
    mode: 'custom',
    title: 'Team Meditation',
    durationMinutes: 30,
    reward: { xp: 90 },
    startTime: Date.now() - 31 * 60 * 1000,
    stopTime: Date.now(),
    status: 'completed',
  };

  const mockCooperativeQuestRun: CooperativeQuestRun = {
    id: 'run-456',
    questId: 'quest-1',
    userId: 'user-1',
    status: 'completed',
    participants: [
      {
        userId: 'user-1',
        ready: true,
        status: 'completed',
        userName: 'Alice',
      },
      {
        userId: 'user-2',
        ready: true,
        status: 'completed',
        userName: 'Bob',
      },
      {
        userId: 'user-3',
        ready: true,
        status: 'failed',
        userName: 'Charlie',
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should show cooperative quest completion message', () => {
    mockUseCooperativeQuest.mockReturnValue({
      isCooperativeQuest: true,
      cooperativeQuestRun: mockCooperativeQuestRun,
      currentInvitation: null,
    });

    render(
      <QuestComplete
        quest={mockQuest}
        story="Great teamwork!"
        onContinue={jest.fn()}
      />
    );

    expect(
      screen.getByText('You and your friends completed the quest!')
    ).toBeTruthy();
  });

  it('should show solo quest completion message', () => {
    mockUseCooperativeQuest.mockReturnValue({
      isCooperativeQuest: false,
      cooperativeQuestRun: null,
      currentInvitation: null,
    });

    render(
      <QuestComplete
        quest={mockQuest}
        story="Well done!"
        onContinue={jest.fn()}
      />
    );

    expect(screen.getByText("You've completed the quest!")).toBeTruthy();
  });

  it('should display participants who completed the quest', () => {
    mockUseCooperativeQuest.mockReturnValue({
      isCooperativeQuest: true,
      cooperativeQuestRun: mockCooperativeQuestRun,
      currentInvitation: null,
    });

    render(
      <QuestComplete
        quest={mockQuest}
        story="Great teamwork!"
        onContinue={jest.fn()}
      />
    );

    expect(screen.getByText('Quest Completed With:')).toBeTruthy();
    expect(screen.getByText('Alice')).toBeTruthy();
    expect(screen.getByText('Bob')).toBeTruthy();
    // Charlie should not be shown as they failed
    expect(screen.queryByText('Charlie')).toBeNull();
  });

  it('should schedule cooperative quest notification', () => {
    mockUseCooperativeQuest.mockReturnValue({
      isCooperativeQuest: true,
      cooperativeQuestRun: mockCooperativeQuestRun,
      currentInvitation: null,
    });

    render(
      <QuestComplete
        quest={mockQuest}
        story="Great teamwork!"
        onContinue={jest.fn()}
      />
    );

    expect(mockScheduleNotification).toHaveBeenCalledWith('Team Meditation', 3);
  });

  it('should not schedule notification for solo quests', () => {
    mockUseCooperativeQuest.mockReturnValue({
      isCooperativeQuest: false,
      cooperativeQuestRun: null,
      currentInvitation: null,
    });

    render(
      <QuestComplete
        quest={mockQuest}
        story="Well done!"
        onContinue={jest.fn()}
      />
    );

    expect(mockScheduleNotification).not.toHaveBeenCalled();
  });

  it('should handle missing participant names', () => {
    const questRunWithoutNames = {
      ...mockCooperativeQuestRun,
      participants: [
        {
          userId: 'user-1',
          ready: true,
          status: 'completed' as const,
          // No userName
        },
        {
          userId: 'user-2',
          ready: true,
          status: 'completed' as const,
          userName: undefined,
        },
      ],
    };

    mockUseCooperativeQuest.mockReturnValue({
      isCooperativeQuest: true,
      cooperativeQuestRun: questRunWithoutNames,
      currentInvitation: null,
    });

    render(
      <QuestComplete
        quest={mockQuest}
        story="Great teamwork!"
        onContinue={jest.fn()}
      />
    );

    // Should show "Friend" as fallback
    const friendTexts = screen.getAllByText('Friend');
    expect(friendTexts).toHaveLength(2);
  });
});

describe('FailedQuest - Cooperative Quest Features', () => {
  const mockQuest = {
    id: 'quest-1',
    mode: 'custom' as const,
    title: 'Team Focus Session',
    durationMinutes: 45,
    reward: { xp: 135 },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should show cooperative quest failure message', () => {
    mockUseCooperativeQuest.mockReturnValue({
      isCooperativeQuest: true,
      cooperativeQuestRun: {} as CooperativeQuestRun,
      currentInvitation: null,
    });

    render(<FailedQuest quest={mockQuest} onRetry={jest.fn()} />);

    expect(screen.getByText('The team quest was interrupted!')).toBeTruthy();
    expect(
      screen.getByText('When doing quests together, everyone needs to stay focused.')
    ).toBeTruthy();
    expect(
      screen.getByText(
        'Coordinate with your friends and try again when everyone is ready.'
      )
    ).toBeTruthy();
  });

  it('should show solo quest failure message', () => {
    mockUseCooperativeQuest.mockReturnValue({
      isCooperativeQuest: false,
      cooperativeQuestRun: null,
      currentInvitation: null,
    });

    render(<FailedQuest quest={mockQuest} onRetry={jest.fn()} />);

    expect(
      screen.getByText('It's okay to fail – every setback teaches you a lesson.')
    ).toBeTruthy();
    expect(screen.getByText('Resist unlocking out of boredom.')).toBeTruthy();
    expect(
      screen.getByText('Using your phone less helps build focus and mindfulness.')
    ).toBeTruthy();
  });

  it('should show quest title for both quest types', () => {
    // Test cooperative quest
    mockUseCooperativeQuest.mockReturnValue({
      isCooperativeQuest: true,
      cooperativeQuestRun: {} as CooperativeQuestRun,
      currentInvitation: null,
    });

    const { rerender } = render(
      <FailedQuest quest={mockQuest} onRetry={jest.fn()} />
    );

    expect(screen.getByText('Team Focus Session')).toBeTruthy();

    // Test solo quest
    mockUseCooperativeQuest.mockReturnValue({
      isCooperativeQuest: false,
      cooperativeQuestRun: null,
      currentInvitation: null,
    });

    rerender(<FailedQuest quest={mockQuest} onRetry={jest.fn()} />);

    expect(screen.getByText('Team Focus Session')).toBeTruthy();
  });
});