import { useEffect, useMemo } from 'react';

import { useNextAvailableQuests } from '@/api/quest';
import { useQuestStore } from '@/store/quest-store';
import { useUserStore } from '@/store/user-store';

/**
 * Hook that syncs server-driven quest data with the local quest store
 */
export const useServerQuests = () => {
  const user = useUserStore((state) => state.user);
  const setServerAvailableQuests = useQuestStore(
    (state) => state.setServerAvailableQuests
  );
  const activeQuest = useQuestStore((state) => state.activeQuest);
  const pendingQuest = useQuestStore((state) => state.pendingQuest);

  // Only fetch when user is authenticated and no quest is active/pending
  const shouldFetch = !!user && !activeQuest && !pendingQuest;

  const { data, isLoading, error } = useNextAvailableQuests({
    enabled: shouldFetch,
    storylineId: 'vaedros',
    includeOptions: true,
  });

  // Sync server data to local store when it changes
  useEffect(() => {
    if (data && !isLoading && !error) {
      console.log('[useServerQuests] Syncing server quests to store:', {
        questCount: data.quests.length,
        hasMore: data.hasMoreQuests,
        complete: data.storylineComplete,
      });

      setServerAvailableQuests(
        data.quests,
        data.hasMoreQuests,
        data.storylineComplete
      );
    }
  }, [data, isLoading, error, setServerAvailableQuests]);

  // Memoize arrays to ensure referential stability
  const serverQuests = useMemo(() => data?.quests || [], [data?.quests]);

  // Create options from server data
  const options = useMemo(() => {
    // Only return explicitly provided options from the server
    // Don't create options from quests - let the component handle that
    // based on the decisionText in each quest
    if (data?.options && data.options.length > 0) {
      return data.options;
    }

    // Return empty array - the component will use decisionText from quests
    return [];
  }, [data?.options]);

  return {
    isLoading,
    error,
    serverQuests,
    hasMoreQuests: data?.hasMoreQuests || false,
    storylineComplete: data?.storylineComplete || false,
    storylineProgress: data?.storylineProgress,
    options,
  };
};
