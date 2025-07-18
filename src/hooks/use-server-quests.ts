import { useEffect, useMemo } from 'react';

import { useNextAvailableQuests } from '@/api/quest';
import { useQuestStore } from '@/store/quest-store';
import { useUserStore } from '@/store/user-store';

/**
 * Hook that syncs server-driven quest data with the local quest store
 */
export const useServerQuests = () => {
  const user = useUserStore((state) => state.user);
  const setServerAvailableQuests = useQuestStore((state) => state.setServerAvailableQuests);
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
  
  // Create options from multiple available quests (branching paths)
  const options = useMemo(() => {
    // If server explicitly provides options, use them
    if (data?.options && data.options.length > 0) {
      return data.options;
    }
    
    // If there are multiple available quests, they represent branching options
    if (serverQuests.length > 1) {
      return serverQuests.map((quest, index) => ({
        id: `option-${index + 1}`,
        text: quest.decisionText || 'Continue', // Use decisionText if available, fallback to Continue
        nextQuestId: quest.customId,
        nextQuest: quest,
      }));
    }
    
    return [];
  }, [data?.options, serverQuests]);
  
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