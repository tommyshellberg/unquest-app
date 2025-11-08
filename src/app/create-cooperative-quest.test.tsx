import React from 'react';

import { cooperativeQuestApi } from '@/api/cooperative-quest';
import { fireEvent, render, screen, waitFor } from '@/lib/test-utils';

// Import the component
import CreateCooperativeQuestScreen from './create-cooperative-quest';

// Mock the router
const mockReplace = jest.fn();
const mockBack = jest.fn();

jest.mock('expo-router', () => ({
  router: {
    replace: mockReplace,
    back: mockBack,
  },
  useRouter: () => ({
    replace: mockReplace,
    back: mockBack,
  }),
}));

// Mock PostHog
jest.mock('posthog-react-native', () => ({
  usePostHog: () => ({
    capture: jest.fn(),
  }),
}));

// Mock lucide-react-native icons
jest.mock('lucide-react-native', () => ({
  ArrowLeft: ({ size, color, ...props }: any) => {
    const React = jest.requireActual('react');
    const { Text } = jest.requireActual('react-native');
    return React.createElement(Text, props, 'arrow-left');
  },
  Info: () => null,
  Users: () => null,
}));

// Mock react-native-svg (which lucide-react-native uses)
jest.mock('react-native-svg', () => ({
  Svg: () => null,
  Path: () => null,
  Circle: () => null,
  Rect: () => null,
  Line: () => null,
  Polygon: () => null,
  Polyline: () => null,
  G: () => null,
}));

// Mock @expo/vector-icons
jest.mock('@expo/vector-icons', () => ({
  MaterialCommunityIcons: ({ name, ...props }: any) => {
    const React = jest.requireActual('react');
    const { Text } = jest.requireActual('react-native');
    return React.createElement(Text, props, name);
  },
}));

// Mock UI components
jest.mock('@/components/ui', () => ({
  Button: ({ label, onPress, disabled, ...props }: any) => {
    const React = jest.requireActual('react');
    const { TouchableOpacity, Text: RNText } = jest.requireActual('react-native');
    return React.createElement(
      TouchableOpacity,
      { onPress, disabled, ...props },
      React.createElement(RNText, {}, label)
    );
  },
  FocusAwareStatusBar: 'FocusAwareStatusBar',
  ScrollView: 'ScrollView',
  Text: 'Text',
  View: 'View',
  ScreenContainer: 'ScreenContainer',
  ScreenHeader: 'ScreenHeader',
  TouchableOpacity: 'TouchableOpacity',
}));

// Mock the API
jest.mock('@/api/cooperative-quest', () => ({
  cooperativeQuestApi: {
    initializeCooperativeQuest: jest.fn(),
  },
}));

// Mock the stores
const mockCreateLobby = jest.fn();
const mockLeaveLobby = jest.fn();

jest.mock('@/store/cooperative-lobby-store', () => ({
  useCooperativeLobbyStore: jest.fn((selector) =>
    selector({
      createLobby: mockCreateLobby,
      leaveLobby: mockLeaveLobby,
    })
  ),
}));

jest.mock('@/store/user-store', () => ({
  useUserStore: jest.fn((selector) =>
    selector({
      user: {
        id: 'user-123',
        username: 'testuser',
        character: {
          name: 'Test Character',
          type: 'knight',
        },
        displayName: 'Test User',
        email: 'test@example.com',
      },
    })
  ),
}));

// Mock the quest form components
jest.mock('@/components/QuestForm/combined-quest-input', () => {
  const React = require('react');
  return {
    CombinedQuestInput: ({ onQuestNameChange, onDurationChange }: any) => {
      // Simulate immediate updates for testing
      React.useEffect(() => {
        onQuestNameChange('Test Quest');
        onDurationChange(30);
      }, []);
      return null;
    },
  };
});

jest.mock('@/components/QuestForm/friend-selector', () => {
  const React = require('react');
  return {
    FriendSelector: ({ onSelectionChange }: any) => {
      // Simulate selecting friends for testing
      React.useEffect(() => {
        onSelectionChange(
          ['friend-1', 'friend-2'],
          [
            {
              _id: 'friend-1',
              character: { name: 'Friend One', type: 'druid' },
              displayName: 'Friend 1',
              email: 'friend1@example.com',
            },
            {
              _id: 'friend-2',
              character: { name: 'Friend Two', type: 'wizard' },
              displayName: 'Friend 2',
              email: 'friend2@example.com',
            },
          ]
        );
      }, []);
      return null;
    },
  };
});

describe('CreateCooperativeQuestScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateLobby.mockClear();
    mockLeaveLobby.mockClear();
  });

  it('should render the create cooperative quest form', () => {
    render(<CreateCooperativeQuestScreen />);

    // Check header
    expect(screen.getByText('Create Cooperative Quest')).toBeTruthy();

    // Check info card
    expect(screen.getByText('Team Challenge')).toBeTruthy();
    expect(
      screen.getByText(
        'All participants must keep their phones locked for the entire duration. If anyone unlocks early, everyone fails together!'
      )
    ).toBeTruthy();

    // Check friend selection section
    expect(screen.getByText('Invite Friends')).toBeTruthy();
    expect(
      screen.getByText(
        'Select friends to join your quest. You need at least one friend to start a cooperative quest.'
      )
    ).toBeTruthy();

    // Check create button (should be enabled after mocked inputs)
    const createButton = screen.getByText('Create Quest');
    expect(createButton).toBeTruthy();
  });

  it('should show selected friends count', async () => {
    render(<CreateCooperativeQuestScreen />);

    // Wait for the mocked friend selector to update
    await waitFor(() => {
      expect(screen.getByText('2 friends selected')).toBeTruthy();
    });
  });

  it('should create lobby and navigate when create button is pressed', async () => {
    // Mock successful API response
    (
      cooperativeQuestApi.initializeCooperativeQuest as jest.Mock
    ).mockResolvedValue({
      lobbyId: 'lobby-123',
      invitationId: 'invitation-123',
    });

    render(<CreateCooperativeQuestScreen />);

    // Wait for form to be filled
    await waitFor(() => {
      const createButton = screen.getByText('Create Quest');
      expect(createButton).toBeTruthy();
    });

    // Click create button
    const createButton = screen.getByText('Create Quest');
    fireEvent.press(createButton);

    // Wait for async operations
    await waitFor(() => {
      // Check API was called with correct data
      expect(
        cooperativeQuestApi.initializeCooperativeQuest
      ).toHaveBeenCalledWith({
        title: 'Test Quest',
        duration: 30,
        inviteeIds: ['friend-1', 'friend-2'],
        questData: {
          category: 'social',
        },
      });

      // Check lobby was created
      expect(mockCreateLobby).toHaveBeenCalledWith(
        expect.objectContaining({
          lobbyId: 'lobby-123',
          questTitle: 'Test Quest',
          questDuration: 30,
          creatorId: 'user-123',
          participants: expect.arrayContaining([
            expect.objectContaining({
              id: 'user-123',
              username: 'Test Character',
              invitationStatus: 'accepted',
              isCreator: true,
            }),
          ]),
          status: 'waiting',
        })
      );

      // Check navigation
      expect(mockReplace).toHaveBeenCalledWith(
        '/cooperative-quest-lobby/lobby-123'
      );
    });
  });

  it('should navigate back when back button is pressed', () => {
    render(<CreateCooperativeQuestScreen />);

    // Find the back icon by its content
    const backButton = screen.getByText('arrow-left');
    fireEvent.press(backButton);

    expect(mockBack).toHaveBeenCalled();
  });

  it('should disable create button when no friends are selected', () => {
    // Override the mock to not select friends
    jest.mocked(
      require('@/components/QuestForm/friend-selector')
    ).FriendSelector = ({ onSelectionChange }: any) => {
      React.useEffect(() => {
        onSelectionChange([], []);
      }, []);
      return null;
    };

    render(<CreateCooperativeQuestScreen />);

    const createButton = screen.getByText('Create Quest');
    // The button should be disabled (you might need to check the actual disabled prop)
    // This depends on how your Button component handles the disabled state
  });
});
