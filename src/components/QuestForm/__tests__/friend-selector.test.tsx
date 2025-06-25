import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { describe, expect, it, jest, beforeEach } from '@jest/globals';

import { FriendSelector } from '../friend-selector';
import { useFriendManagement } from '@/lib/hooks/use-friend-management';
import { useUserStore } from '@/store/user-store';

jest.mock('@/lib/hooks/use-friend-management');
jest.mock('@/store/user-store');

const mockUseFriendManagement = useFriendManagement as jest.MockedFunction<
  typeof useFriendManagement
>;
const mockUseUserStore = useUserStore as unknown as jest.MockedFunction<
  () => any
>;

describe('FriendSelector', () => {
  const mockOnSelectionChange = jest.fn();
  const mockFriends = [
    {
      _id: 'friend-1',
      email: 'alice@example.com',
      displayName: 'Alice',
      character: {
        name: 'Alice the Alchemist',
        type: 'alchemist',
      },
    },
    {
      _id: 'friend-2',
      email: 'bob@example.com',
      displayName: 'Bob',
      character: {
        name: 'Bob the Bard',
        type: 'bard',
      },
    },
    {
      _id: 'friend-3',
      email: 'charlie@example.com',
      displayName: 'Charlie',
      character: {
        name: 'Charlie the Knight',
        type: 'knight',
      },
    },
    {
      _id: 'friend-4',
      email: 'diana@example.com',
      displayName: 'Diana',
      character: {
        name: 'Diana the Druid',
        type: 'druid',
      },
    },
    {
      _id: 'friend-5',
      email: 'eve@example.com',
      displayName: 'Eve',
      character: {
        name: 'Eve the Scout',
        type: 'scout',
      },
    },
    {
      _id: 'friend-6',
      email: 'frank@example.com',
      displayName: 'Frank',
      character: {
        name: 'Frank the Wizard',
        type: 'wizard',
      },
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseUserStore.mockReturnValue({
      user: { email: 'test@example.com' },
    });
  });

  it('should render loading state', () => {
    mockUseFriendManagement.mockReturnValue({
      friendsData: null,
      isLoadingFriends: true,
    } as any);

    render(<FriendSelector onSelectionChange={mockOnSelectionChange} />);

    expect(screen.getByTestId('activity-indicator')).toBeTruthy();
  });

  it('should render empty state when no friends', () => {
    mockUseFriendManagement.mockReturnValue({
      friendsData: { friends: [] },
      isLoadingFriends: false,
    } as any);

    render(<FriendSelector onSelectionChange={mockOnSelectionChange} />);

    expect(
      screen.getByText(
        'No friends to invite. Add friends from your profile to invite them to quests!'
      )
    ).toBeTruthy();
  });

  it('should display first 5 friends by default', () => {
    mockUseFriendManagement.mockReturnValue({
      friendsData: { friends: mockFriends },
      isLoadingFriends: false,
    } as any);

    render(<FriendSelector onSelectionChange={mockOnSelectionChange} />);

    // Should only show first 5 friends
    expect(screen.getByText('Alice the Alchemist')).toBeTruthy();
    expect(screen.getByText('Bob the Bard')).toBeTruthy();
    expect(screen.getByText('Charlie the Knight')).toBeTruthy();
    expect(screen.getByText('Diana the Druid')).toBeTruthy();
    expect(screen.getByText('Eve the Scout')).toBeTruthy();
    expect(screen.queryByText('Frank the Wizard')).toBeNull();
  });

  it('should allow selecting friends', async () => {
    mockUseFriendManagement.mockReturnValue({
      friendsData: { friends: mockFriends.slice(0, 3) },
      isLoadingFriends: false,
    } as any);

    render(<FriendSelector onSelectionChange={mockOnSelectionChange} />);

    const aliceCheckbox = screen.getAllByLabelText(/Select Alice/)[0];
    fireEvent.press(aliceCheckbox);

    await waitFor(() => {
      expect(mockOnSelectionChange).toHaveBeenCalledWith(['friend-1']);
    });

    expect(screen.getByText('1 selected')).toBeTruthy();
  });

  it('should allow searching friends', () => {
    mockUseFriendManagement.mockReturnValue({
      friendsData: { friends: mockFriends },
      isLoadingFriends: false,
    } as any);

    render(<FriendSelector onSelectionChange={mockOnSelectionChange} />);

    const searchInput = screen.getByPlaceholderText('Search friends...');
    fireEvent.changeText(searchInput, 'wizard');

    // Should only show Frank the Wizard
    expect(screen.queryByText('Alice the Alchemist')).toBeNull();
    expect(screen.getByText('Frank the Wizard')).toBeTruthy();
    expect(screen.getByText('1 result')).toBeTruthy();
  });

  it('should clear search when X is pressed', () => {
    mockUseFriendManagement.mockReturnValue({
      friendsData: { friends: mockFriends },
      isLoadingFriends: false,
    } as any);

    render(<FriendSelector onSelectionChange={mockOnSelectionChange} />);

    const searchInput = screen.getByPlaceholderText('Search friends...');
    fireEvent.changeText(searchInput, 'wizard');

    // Clear search
    const clearButton = screen.getByTestId('clear-search');
    fireEvent.press(clearButton);

    // Should show first 5 friends again
    expect(screen.getByText('Alice the Alchemist')).toBeTruthy();
    expect(screen.queryByText('Frank the Wizard')).toBeNull();
  });

  it('should enforce max selections', async () => {
    mockUseFriendManagement.mockReturnValue({
      friendsData: { friends: mockFriends.slice(0, 3) },
      isLoadingFriends: false,
    } as any);

    render(
      <FriendSelector
        onSelectionChange={mockOnSelectionChange}
        maxSelections={2}
      />
    );

    // Select first two friends
    fireEvent.press(screen.getAllByLabelText(/Select Alice/)[0]);
    fireEvent.press(screen.getAllByLabelText(/Select Bob/)[0]);

    await waitFor(() => {
      expect(mockOnSelectionChange).toHaveBeenLastCalledWith([
        'friend-1',
        'friend-2',
      ]);
    });

    // Third friend should be disabled
    const charlieCheckbox = screen.getAllByLabelText(/Select Charlie/)[0];
    fireEvent.press(charlieCheckbox);

    // Should still only have 2 selected
    await waitFor(() => {
      expect(mockOnSelectionChange).toHaveBeenLastCalledWith([
        'friend-1',
        'friend-2',
      ]);
    });

    expect(screen.getByText('Maximum 2 friends can be invited')).toBeTruthy();
  });

  it('should sort friends alphabetically', () => {
    const unsortedFriends = [
      { ...mockFriends[2] }, // Charlie
      { ...mockFriends[0] }, // Alice
      { ...mockFriends[1] }, // Bob
    ];

    mockUseFriendManagement.mockReturnValue({
      friendsData: { friends: unsortedFriends },
      isLoadingFriends: false,
    } as any);

    render(<FriendSelector onSelectionChange={mockOnSelectionChange} />);

    const friendNames = screen
      .getAllByText(/the/)
      .map((el) => el.props.children);

    expect(friendNames[0]).toBe('Alice the Alchemist');
    expect(friendNames[1]).toBe('Bob the Bard');
    expect(friendNames[2]).toBe('Charlie the Knight');
  });

  it('should handle friends without character data', () => {
    const friendsWithMissingData = [
      {
        _id: 'friend-x',
        email: 'nochara@example.com',
        // No character data
      },
    ];

    mockUseFriendManagement.mockReturnValue({
      friendsData: { friends: friendsWithMissingData },
      isLoadingFriends: false,
    } as any);

    render(<FriendSelector onSelectionChange={mockOnSelectionChange} />);

    expect(screen.getByText('nochara@example.com')).toBeTruthy();
    expect(screen.getByText('Friend')).toBeTruthy();
  });
});