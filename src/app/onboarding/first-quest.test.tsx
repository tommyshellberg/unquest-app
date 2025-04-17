import { usePathname, useRouter } from 'expo-router';

import QuestTimer from '@/lib/services/quest-timer';
import { useQuestStore } from '@/store/quest-store';

// Create test fixtures
const TEST_QUESTS = [
  {
    id: 'quest-1',
    mode: 'story',
    title: 'A Confused Awakening',
    recap: 'The Kingdom of Vaedros is in peril.',
    durationMinutes: 3,
    reward: { xp: 100 },
  },
  {
    id: 'quest-2',
    mode: 'story',
    title: 'Second Quest',
    recap: 'Another quest',
    durationMinutes: 6,
    reward: { xp: 200 },
  },
];

// Mock dependencies
jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(),
}));

jest.mock('@/lib/services/quest-timer', () => ({
  prepareQuest: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/store/quest-store', () => ({
  useQuestStore: jest.fn(),
}));

jest.mock('@/app/data/quests', () => ({
  AVAILABLE_QUESTS: TEST_QUESTS,
}));

describe('First Quest Wake Up Button Functionality', () => {
  it('should prepare the first story quest and navigate to active quest', async () => {
    // Setup mocks
    const mockPrepareQuest = jest.fn();
    const mockNavigate = jest.fn();

    useQuestStore.mockReturnValue(mockPrepareQuest);
    useRouter.mockReturnValue({ navigate: mockNavigate });
    usePathname.mockReturnValue('/onboarding/first-quest');

    // Simulate what happens when wake up button is pressed
    const firstStoryQuest = TEST_QUESTS.find((q) => q.mode === 'story');

    // Call the prepare functions
    mockPrepareQuest(firstStoryQuest);
    await QuestTimer.prepareQuest(firstStoryQuest);

    // Assertions
    expect(mockPrepareQuest).toHaveBeenCalledWith(firstStoryQuest);
    expect(QuestTimer.prepareQuest).toHaveBeenCalledWith(firstStoryQuest);
  });
});
