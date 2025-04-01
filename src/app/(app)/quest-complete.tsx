import { router } from 'expo-router';
import React, { useEffect } from 'react';
import { ActivityIndicator } from 'react-native';

import { AVAILABLE_CUSTOM_QUEST_STORIES } from '@/app/data/quests';
import { QuestComplete as QuestCompleteComponent } from '@/components/QuestComplete';
import { useQuestStore } from '@/store/quest-store';

export default function QuestCompleteScreen() {
  const recentCompletedQuest = useQuestStore(
    (state) => state.recentCompletedQuest
  );
  const clearRecentCompletedQuest = useQuestStore(
    (state) => state.clearRecentCompletedQuest
  );

  // Use useEffect for navigation if there's no quest
  useEffect(() => {
    if (!recentCompletedQuest) {
      console.log('no quest to display, redirecting to home');
      router.replace('/home');
    }
  }, [recentCompletedQuest]);

  // Clear recentCompletedQuest when component unmounts
  useEffect(() => {
    console.log('QuestCompleteScreen mounting');
    // Return cleanup function that will run when component unmounts
    return () => {
      console.log(
        'QuestCompleteScreen unmounting, clearing recentCompletedQuest'
      );
      clearRecentCompletedQuest();
    };
  }, [clearRecentCompletedQuest]);

  // If there's no quest to display, show a loading state until redirect happens
  if (!recentCompletedQuest) {
    return <ActivityIndicator />;
  }

  // Generate completion text based on quest type
  const getQuestCompletionText = () => {
    // For story quests, use the built-in story
    if (recentCompletedQuest.mode === 'story') {
      console.log('recentCompletedQuest.story', recentCompletedQuest.story);
      return recentCompletedQuest.story;
    }

    // For custom quests, find a matching story from our collection
    if (recentCompletedQuest.mode === 'custom') {
      // Filter stories that match the quest category
      const matchingStories = AVAILABLE_CUSTOM_QUEST_STORIES.filter(
        (storyItem) =>
          storyItem.category.toLowerCase() ===
          recentCompletedQuest.category.toLowerCase()
      );

      // If we have matching stories, pick a random one
      if (matchingStories.length > 0) {
        const randomIndex = Math.floor(Math.random() * matchingStories.length);
        const selectedStory = matchingStories[randomIndex];

        // Return the story with a brief intro
        return `${selectedStory.story}\n\nYou've earned ${recentCompletedQuest.reward.xp} XP for completing this quest.`;
      }
    }

    // Fallback if no matching story is found
    return (
      `Congratulations on completing your custom quest!\n\n` +
      `Quest: ${recentCompletedQuest.title}\n` +
      `Duration: ${recentCompletedQuest.durationMinutes} minutes\n` +
      `Category: ${recentCompletedQuest.category}\n\n` +
      `You've earned ${recentCompletedQuest.reward.xp} XP for staying focused and completing this quest.`
    );
  };

  const handleClaimReward = async () => {
    try {
      console.log('navigating to profile');
      // Navigate to profile screen
      router.replace('/profile');
    } catch (error) {
      console.error('Navigation error:', error);
    }
  };

  return (
    <QuestCompleteComponent
      quest={recentCompletedQuest}
      onClaim={handleClaimReward}
      story={getQuestCompletionText()}
      hasAudio={recentCompletedQuest.mode === 'story'}
    />
  );
}
