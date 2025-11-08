import { renderHook, waitFor } from '@testing-library/react-native';

// Mock AVAILABLE_QUESTS before importing the hook
const mockQuest1 = {
  id: 'quest-1',
  mode: 'story' as const,
  options: [
    { id: 'opt-1', text: 'Go left', nextQuestId: 'quest-2a' },
    { id: 'opt-2', text: 'Go right', nextQuestId: 'quest-2b' },
  ],
};

const mockQuest2a = {
  id: 'quest-2a',
  mode: 'story' as const,
  options: [{ id: 'opt-1', text: 'Continue', nextQuestId: 'quest-3' }],
};

jest.mock('@/app/data/quests', () => ({
  AVAILABLE_QUESTS: [mockQuest1, mockQuest2a],
}));

// Import after mocking
const { useStoryOptions } = require('./use-story-options');

describe('useStoryOptions', () => {
  describe('When No Active/Pending Quest', () => {
    it('should return empty options when active quest exists', async () => {
      const { result } = renderHook(() =>
        useStoryOptions({
          completedQuests: [],
          activeQuest: { id: 'quest-1' } as any,
          pendingQuest: null,
          serverOptions: [],
          serverQuests: [],
        })
      );

      await waitFor(() => {
        expect(result.current.storyOptions).toEqual([]);
      });
    });

    it('should return empty options when pending quest exists', async () => {
      const { result } = renderHook(() =>
        useStoryOptions({
          completedQuests: [],
          activeQuest: null,
          pendingQuest: { id: 'quest-1' } as any,
          serverOptions: [],
          serverQuests: [],
        })
      );

      await waitFor(() => {
        expect(result.current.storyOptions).toEqual([]);
      });
    });
  });

  describe('Multiple Server Quests with decisionText', () => {
    it('should create options from multiple server quests', async () => {
      const serverQuests = [
        {
          customId: 'quest-4a',
          decisionText: 'Stay and investigate',
          title: 'Quest A',
        },
        {
          customId: 'quest-4b',
          decisionText: 'Continue before nightfall',
          title: 'Quest B',
        },
      ];

      const { result } = renderHook(() =>
        useStoryOptions({
          completedQuests: [],
          activeQuest: null,
          pendingQuest: null,
          serverOptions: [],
          serverQuests: serverQuests as any,
        })
      );

      await waitFor(() => {
        expect(result.current.storyOptions).toHaveLength(2);
        expect(result.current.storyOptions[0]).toMatchObject({
          id: 'option-0',
          text: 'Stay and investigate',
          nextQuestId: 'quest-4a',
        });
        expect(result.current.storyOptions[1]).toMatchObject({
          id: 'option-1',
          text: 'Continue before nightfall',
          nextQuestId: 'quest-4b',
        });
      });
    });

    it('should use Continue as fallback when decisionText missing', async () => {
      const serverQuests = [
        { customId: 'quest-4a', title: 'Quest A' },
        { customId: 'quest-4b', title: 'Quest B' },
      ];

      const { result } = renderHook(() =>
        useStoryOptions({
          completedQuests: [],
          activeQuest: null,
          pendingQuest: null,
          serverOptions: [],
          serverQuests: serverQuests as any,
        })
      );

      await waitFor(() => {
        expect(result.current.storyOptions).toHaveLength(2);
        expect(result.current.storyOptions[0].text).toBe('Continue');
        expect(result.current.storyOptions[1].text).toBe('Continue');
      });
    });
  });

  describe('Single Server Quest with decisionText', () => {
    it('should create single option from server quest', async () => {
      const serverQuests = [
        {
          customId: 'quest-5',
          decisionText: 'Approach the lake',
          title: 'Lake Quest',
        },
      ];

      const { result } = renderHook(() =>
        useStoryOptions({
          completedQuests: [],
          activeQuest: null,
          pendingQuest: null,
          serverOptions: [],
          serverQuests: serverQuests as any,
        })
      );

      await waitFor(() => {
        expect(result.current.storyOptions).toHaveLength(1);
        expect(result.current.storyOptions[0]).toMatchObject({
          id: 'option-0',
          text: 'Approach the lake',
          nextQuestId: 'quest-5',
        });
      });
    });
  });

  describe('Server Options Fallback', () => {
    it('should use serverOptions when no quest decisionText', async () => {
      const serverOptions = [
        { id: 'opt-1', text: 'Option A', nextQuestId: 'quest-x' },
        { id: 'opt-2', text: 'Option B', nextQuestId: 'quest-y' },
      ];

      const { result } = renderHook(() =>
        useStoryOptions({
          completedQuests: [],
          activeQuest: null,
          pendingQuest: null,
          serverOptions,
          serverQuests: [],
        })
      );

      await waitFor(() => {
        expect(result.current.storyOptions).toEqual(serverOptions);
      });
    });

    it('should prefer quest decisionText over serverOptions', async () => {
      const serverQuests = [
        { customId: 'quest-1', decisionText: 'From quest', title: 'Quest' },
      ];
      const serverOptions = [
        { id: 'opt-1', text: 'From options', nextQuestId: 'quest-x' },
      ];

      const { result } = renderHook(() =>
        useStoryOptions({
          completedQuests: [],
          activeQuest: null,
          pendingQuest: null,
          serverOptions,
          serverQuests: serverQuests as any,
        })
      );

      await waitFor(() => {
        expect(result.current.storyOptions[0].text).toBe('From quest');
      });
    });
  });

  describe('Local Quest Fallback', () => {
    it('should show first quest options when no completed quests', async () => {
      const { result } = renderHook(() =>
        useStoryOptions({
          completedQuests: [],
          activeQuest: null,
          pendingQuest: null,
          serverOptions: [],
          serverQuests: [],
        })
      );

      await waitFor(() => {
        expect(result.current.storyOptions).toEqual(mockQuest1.options);
      });
    });

    it('should show next options based on last completed quest', async () => {
      const completedQuests = [
        { id: 'quest-1', mode: 'story', status: 'completed' },
      ];

      const { result } = renderHook(() =>
        useStoryOptions({
          completedQuests: completedQuests as any,
          activeQuest: null,
          pendingQuest: null,
          serverOptions: [],
          serverQuests: [],
        })
      );

      await waitFor(() => {
        expect(result.current.storyOptions).toEqual(mockQuest1.options);
      });
    });

    it('should return empty when no options available', async () => {
      const completedQuests = [
        { id: 'unknown-quest', mode: 'story', status: 'completed' },
      ];

      const { result } = renderHook(() =>
        useStoryOptions({
          completedQuests: completedQuests as any,
          activeQuest: null,
          pendingQuest: null,
          serverOptions: [],
          serverQuests: [],
        })
      );

      await waitFor(() => {
        expect(result.current.storyOptions).toEqual([]);
      });
    });
  });

  describe('Updates on Dependency Changes', () => {
    it('should update when completedQuests change', async () => {
      const { result, rerender } = renderHook(
        ({ completedQuests }) =>
          useStoryOptions({
            completedQuests,
            activeQuest: null,
            pendingQuest: null,
            serverOptions: [],
            serverQuests: [],
          }),
        {
          initialProps: {
            completedQuests: [],
          },
        }
      );

      // Initially shows first quest options
      await waitFor(() => {
        expect(result.current.storyOptions).toEqual(mockQuest1.options);
      });

      // Update with completed quest
      rerender({
        completedQuests: [
          { id: 'quest-1', mode: 'story', status: 'completed' },
        ] as any,
      });

      // Should still show quest-1 options (as it's the last completed)
      await waitFor(() => {
        expect(result.current.storyOptions).toEqual(mockQuest1.options);
      });
    });
  });
});
