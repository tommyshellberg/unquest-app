import React from 'react';
import { fireEvent, render, screen } from '@/lib/test-utils';

// Mock the router
const mockPush = jest.fn();
const mockBack = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
    back: mockBack,
  }),
}));

// Import the component
import CooperativeQuestMenu from './cooperative-quest-menu';

describe('CooperativeQuestMenu', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render all menu options', () => {
    render(<CooperativeQuestMenu />);

    // Check header
    expect(screen.getByText('Cooperative Quests')).toBeTruthy();
    expect(
      screen.getByText(
        'Team up with friends to complete quests together. Everyone must keep their phones locked to succeed!'
      )
    ).toBeTruthy();

    // Check menu options
    expect(screen.getByText('Create Quest')).toBeTruthy();
    expect(
      screen.getByText('Start a new cooperative quest and invite friends')
    ).toBeTruthy();

    expect(screen.getByText('Join Quest')).toBeTruthy();
    expect(
      screen.getByText("Enter a quest code to join a friend's quest")
    ).toBeTruthy();

    expect(screen.getByText('Add Friends')).toBeTruthy();
    expect(
      screen.getByText('Connect with friends to quest together')
    ).toBeTruthy();

    // Check info section
    expect(screen.getByText('How it works')).toBeTruthy();
    expect(
      screen.getByText(
        'In cooperative quests, all participants must keep their phones locked for the entire duration. If anyone unlocks early, everyone fails together!'
      )
    ).toBeTruthy();
  });

  it('should navigate to create quest screen when Create Quest is pressed', () => {
    render(<CooperativeQuestMenu />);

    const createButton = screen.getByText('Create Quest');
    fireEvent.press(createButton);

    expect(mockPush).toHaveBeenCalledWith('/create-cooperative-quest');
  });

  it('should navigate to join quest screen when Join Quest is pressed', () => {
    render(<CooperativeQuestMenu />);

    const joinButton = screen.getByText('Join Quest');
    fireEvent.press(joinButton);

    expect(mockPush).toHaveBeenCalledWith('/join-cooperative-quest');
  });

  it('should navigate to friends screen when Add Friends is pressed', () => {
    render(<CooperativeQuestMenu />);

    const friendsButton = screen.getByText('Add Friends');
    fireEvent.press(friendsButton);

    expect(mockPush).toHaveBeenCalledWith('/friends');
  });

  it('should navigate back when back button is pressed', () => {
    render(<CooperativeQuestMenu />);

    const backButton = screen.getByText('Back');
    fireEvent.press(backButton);

    expect(mockBack).toHaveBeenCalled();
  });
});
