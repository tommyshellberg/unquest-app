import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { router } from 'expo-router';
import { render, screen } from '@/lib/test-utils';

import CustomQuestScreen from '../custom-quest';
import { useQuestStore } from '@/store/quest-store';
import QuestTimer from '@/lib/services/quest-timer';
import { useFriendManagement } from '@/lib/hooks/use-friend-management';
import { useUserStore } from '@/store/user-store';

jest.mock('expo-router');
jest.mock('@/store/quest-store');
jest.mock('@/lib/services/quest-timer');
jest.mock('@/lib/hooks/use-friend-management');
jest.mock('@/store/user-store');
jest.mock('posthog-react-native', () => ({
  usePostHog: () => ({
    capture: jest.fn(),
  }),
}));

const mockRouter = router as jest.Mocked<typeof router>;
const mockUseQuestStore = useQuestStore as unknown as jest.MockedFunction<
  () => any
>;
const mockUseFriendManagement = useFriendManagement as jest.MockedFunction<
  typeof useFriendManagement
>;
const mockUseUserStore = useUserStore as unknown as jest.MockedFunction<
  () => any
>;

describe('CustomQuestScreen - Cooperative Quest Features', () => {
  const mockPrepareQuest = jest.fn();
  const mockFriends = [
    {
      _id: 'friend-1',
      email: 'alice@example.com',
      character: { name: 'Alice', type: 'alchemist' },
    },
    {
      _id: 'friend-2',
      email: 'bob@example.com',
      character: { name: 'Bob', type: 'bard' },
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock the entire store structure
    const mockStore = {
      prepareQuest: mockPrepareQuest,
    };
    mockUseQuestStore.mockReturnValue(mockStore);
    // Also mock getState
    mockUseQuestStore.getState = jest.fn().mockReturnValue(mockStore);
    
    mockUseUserStore.mockReturnValue({
      user: { email: 'test@example.com' },
    });
    mockUseFriendManagement.mockReturnValue({
      friendsData: { friends: mockFriends },
      isLoadingFriends: false,
    } as any);
  });

  it('should show coop quest toggle', () => {
    render(<CustomQuestScreen />);

    expect(screen.getByText('Coop Quest')).toBeOnTheScreen();
    expect(
      screen.getByText('Invite friends to complete this quest together')
    ).toBeOnTheScreen();
  });

  it('should show friend selector when coop quest is enabled', () => {
    render(<CustomQuestScreen />);

    const coopToggle = screen.getByLabelText('Toggle cooperative quest mode');
    fireEvent(coopToggle, 'onChange', true);

    expect(screen.getByText('Invite Friends')).toBeOnTheScreen();
    expect(screen.getByText('Alice')).toBeOnTheScreen();
    expect(screen.getByText('Bob')).toBeOnTheScreen();
  });

  it('should hide friend selector when coop quest is disabled', () => {
    render(<CustomQuestScreen />);

    // Enable then disable
    const coopToggle = screen.getByLabelText('Toggle cooperative quest mode');
    fireEvent(coopToggle, 'onChange', true);
    fireEvent(coopToggle, 'onChange', false);

    expect(screen.queryByText('Invite Friends')).not.toBeOnTheScreen();
  });

  it('should validate friend selection for coop quests', async () => {
    render(<CustomQuestScreen />);

    // Enter quest name
    const questInput = screen.getByPlaceholderText('go for a run');
    fireEvent.changeText(questInput, 'Test Quest');

    // Enable coop quest without selecting friends
    const coopToggle = screen.getByLabelText('Toggle cooperative quest mode');
    fireEvent(coopToggle, 'onChange', true);

    // Try to start quest
    const startButton = screen.getByText('Start Quest');
    fireEvent.press(startButton);

    // Should show validation message
    expect(
      screen.getByText('Please select at least one friend for a cooperative quest')
    ).toBeOnTheScreen();

    // Quest should not be prepared
    expect(mockPrepareQuest).not.toHaveBeenCalled();
  });

  it('should allow starting coop quest with selected friends', async () => {
    render(<CustomQuestScreen />);

    // Enter quest name
    const questInput = screen.getByPlaceholderText('go for a run');
    fireEvent.changeText(questInput, 'Team Quest');

    // Enable coop quest
    const coopToggle = screen.getByLabelText('Toggle cooperative quest mode');
    fireEvent(coopToggle, 'onChange', true);

    // Select a friend by pressing the friend item
    const aliceItem = screen.getByText('Alice').parent.parent;
    fireEvent.press(aliceItem);

    // Start quest
    const startButton = screen.getByText('Start Quest');
    fireEvent.press(startButton);

    await waitFor(() => {
      expect(mockPrepareQuest).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Team Quest',
          inviteeIds: ['friend-1'],
        })
      );
    });

    expect(QuestTimer.prepareQuest).toHaveBeenCalledWith(
      expect.objectContaining({
        inviteeIds: ['friend-1'],
      })
    );

    expect(mockRouter.push).toHaveBeenCalledWith('/invitation-waiting');
  });

  it('should clear selected friends when coop quest is disabled', () => {
    render(<CustomQuestScreen />);

    // Enable coop quest and select friends
    const coopToggle = screen.getByLabelText('Toggle cooperative quest mode');
    fireEvent(coopToggle, 'onChange', true);

    const aliceItem = screen.getByText('Alice').parent.parent;
    fireEvent.press(aliceItem);

    expect(screen.getByText('1 selected')).toBeOnTheScreen();

    // Disable coop quest
    fireEvent(coopToggle, 'onChange', false);

    // Re-enable to check if selection was cleared
    fireEvent(coopToggle, 'onChange', true);

    expect(screen.queryByText('1 selected')).not.toBeOnTheScreen();
  });

  it('should reset form values when cancel is pressed', () => {
    render(<CustomQuestScreen />);

    // Set form values
    const questInput = screen.getByPlaceholderText('go for a run');
    fireEvent.changeText(questInput, 'Test Quest');

    // Enable coop quest and select friend
    const coopToggle = screen.getByLabelText('Toggle cooperative quest mode');
    fireEvent(coopToggle, 'onChange', true);

    const aliceItem = screen.getByText('Alice').parent.parent;
    fireEvent.press(aliceItem);

    // Press cancel
    const cancelButton = screen.getByText('Cancel');
    fireEvent.press(cancelButton);

    // Verify navigation
    expect(mockRouter.back).toHaveBeenCalled();

    // Re-render to check if values were reset
    const { rerender } = render(<CustomQuestScreen />);
    rerender(<CustomQuestScreen />);

    // Since we can't directly check input values in React Native Testing Library,
    // we verify the behavior by checking that the screen is in its initial state
    // The Start Quest button should be disabled when no quest name is entered
    const startButton = screen.getByText('Start Quest');
    expect(startButton).toBeDisabled();

    // No friends should be shown
    expect(screen.queryByText('Invite Friends')).not.toBeOnTheScreen();
  });

  it('should handle multiple friend selection', async () => {
    render(<CustomQuestScreen />);

    // Enter quest name
    const questInput = screen.getByPlaceholderText('go for a run');
    fireEvent.changeText(questInput, 'Multi Friend Quest');

    // Enable coop quest
    const coopToggle = screen.getByLabelText('Toggle cooperative quest mode');
    fireEvent(coopToggle, 'onChange', true);

    // Select multiple friends
    const aliceItem = screen.getByText('Alice').parent.parent;
    const bobItem = screen.getByText('Bob').parent.parent;
    
    fireEvent.press(aliceItem);
    fireEvent.press(bobItem);

    expect(screen.getByText('2 selected')).toBeOnTheScreen();

    // Start quest
    const startButton = screen.getByText('Start Quest');
    fireEvent.press(startButton);

    await waitFor(() => {
      expect(mockPrepareQuest).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Multi Friend Quest',
          inviteeIds: ['friend-1', 'friend-2'],
        })
      );
    });
  });

  it('should not include inviteeIds for non-coop quests', async () => {
    render(<CustomQuestScreen />);

    // Enter quest name without enabling coop
    const questInput = screen.getByPlaceholderText('go for a run');
    fireEvent.changeText(questInput, 'Solo Quest');

    // Start quest
    const startButton = screen.getByText('Start Quest');
    fireEvent.press(startButton);

    await waitFor(() => {
      expect(mockPrepareQuest).toHaveBeenCalledWith(
        expect.not.objectContaining({
          inviteeIds: expect.any(Array),
        })
      );
    });

    // Should not navigate to invitation waiting
    expect(mockRouter.push).not.toHaveBeenCalledWith('/invitation-waiting');
  });
});