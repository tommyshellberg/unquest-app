import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  Crown,
  TrendingUp,
  Trophy,
  Users,
} from 'lucide-react-native';
import React, { useState, useCallback } from 'react';
import { Image, Pressable, ScrollView, View } from 'react-native';

import { Button, Card, FocusAwareStatusBar, Text, useModal } from '@/components/ui';
import { InviteFriendModal } from '@/components/profile/invite-friend-modal';
import { useFriendManagement } from '@/lib/hooks/use-friend-management';
import { useProfileData } from '@/lib/hooks/use-profile-data';
import { useCharacterStore } from '@/store/character-store';
import { useQuestStore } from '@/store/quest-store';

import CHARACTERS from '../data/characters';

type CharacterType =
  | 'alchemist'
  | 'druid'
  | 'scout'
  | 'wizard'
  | 'knight'
  | 'bard';

type LeaderboardEntry = {
  rank: number;
  userId: string;
  username: string;
  characterType: CharacterType;
  metric: number;
  isCurrentUser?: boolean;
  isFriend?: boolean;
};

type LeaderboardType = 'quests' | 'minutes' | 'streak';
type ScopeType = 'friends' | 'global';

// Dummy data
const generateGlobalData = (
  type: LeaderboardType,
  currentUsername?: string,
  currentUserCharacterType?: CharacterType,
  currentUserMetric?: number
): LeaderboardEntry[] => {
  const userData = [
    { username: 'DragonSlayer77', characterType: 'knight' as CharacterType },
    { username: 'MysticWanderer', characterType: 'wizard' as CharacterType },
    { username: 'QuestMaster42', characterType: 'scout' as CharacterType },
    { username: 'SilentKnight', characterType: 'knight' as CharacterType },
    { username: 'PhoenixRising', characterType: 'druid' as CharacterType },
    { username: 'ThunderBolt99', characterType: 'wizard' as CharacterType },
    {
      username: currentUsername || 'User',
      characterType: currentUserCharacterType || ('bard' as CharacterType),
      isCurrentUser: true,
    },
    { username: 'IronWill88', characterType: 'knight' as CharacterType },
    { username: 'SwiftArrow', characterType: 'scout' as CharacterType },
    { username: 'GoldenEagle', characterType: 'alchemist' as CharacterType },
  ];

  const getMetric = (rank: number) => {
    switch (type) {
      case 'quests':
        return Math.max(150 - rank * 15, 10);
      case 'minutes':
        return Math.max(2000 - rank * 180, 100);
      case 'streak':
        return Math.max(45 - rank * 4, 2);
    }
  };

  return userData.map((user, i) => ({
    rank: i + 1,
    userId: user.isCurrentUser ? 'current-user' : `user-${i + 1}`,
    username: user.username,
    characterType: user.characterType,
    metric:
      user.isCurrentUser && currentUserMetric !== undefined
        ? currentUserMetric
        : getMetric(i),
    isCurrentUser: user.isCurrentUser || false,
    isFriend: i === 2 || i === 4, // QuestMaster42 and PhoenixRising are friends
  }));
};

const generateFriendsData = (
  type: LeaderboardType,
  currentUserCharacterType?: CharacterType,
  currentUsername?: string,
  currentUserMetric?: number
): LeaderboardEntry[] => {
  // For users with no friends, just show current user
  const currentUser = {
    username: currentUsername || 'User',
    characterType: currentUserCharacterType || ('bard' as CharacterType),
    metric: currentUserMetric || 0,
  };

  // Just return current user
  return [
    {
      rank: 1,
      userId: 'current-user',
      username: currentUser.username,
      characterType: currentUser.characterType,
      metric: currentUser.metric,
      isCurrentUser: true,
      isFriend: false,
    },
  ];
};

const LeaderboardItem = ({
  entry,
  type,
}: {
  entry: LeaderboardEntry;
  type: LeaderboardType;
}) => {
  const getMetricLabel = () => {
    switch (type) {
      case 'quests':
        return `${entry.metric} quests`;
      case 'minutes':
        return `${entry.metric} mins`;
      case 'streak':
        return `${entry.metric} days`;
    }
  };

  const character = CHARACTERS.find((c) => c.id === entry.characterType);

  return (
    <View
      className={`flex-row items-center px-4 py-3 ${
        entry.isCurrentUser ? 'bg-primary-100' : ''
      }`}
    >
      <Text
        className={`w-10 text-lg font-bold ${
          entry.rank <= 3 ? 'text-primary-500' : 'text-gray-600'
        }`}
      >
        {entry.rank}
      </Text>

      <Image
        source={character?.profileImage}
        className="ml-3 size-10 rounded-full bg-gray-300"
      />

      <View className="ml-3 flex-1">
        <Text
          className={`font-semibold ${
            entry.isCurrentUser ? 'text-primary-700' : 'text-gray-900'
          }`}
        >
          {entry.username}
          {entry.isCurrentUser && <Text className="text-sm"> (You)</Text>}
        </Text>
        {entry.isFriend && !entry.isCurrentUser && (
          <Text className="text-xs text-gray-500">Friend</Text>
        )}
      </View>

      <Text className="text-primary-600 text-lg font-bold">
        {getMetricLabel()}
      </Text>

      {entry.rank === 1 && (
        <Trophy size={20} color="#FFD700" className="ml-2" />
      )}
    </View>
  );
};

const LeaderboardHeader = ({
  topUser,
  type,
}: {
  topUser: LeaderboardEntry;
  type: LeaderboardType;
}) => {
  const getMetricLabel = () => {
    switch (type) {
      case 'quests':
        return 'Quests Completed';
      case 'minutes':
        return 'Minutes Off Phone';
      case 'streak':
        return 'Day Streak';
    }
  };

  const character = CHARACTERS.find((c) => c.id === topUser.characterType);

  return (
    <Card className="relative mx-4 mb-4 overflow-hidden">
      {/* Background Trophy */}
      <View className="absolute -right-8 -top-8 opacity-10">
        <Trophy
          size={120}
          color="#2E948D"
          style={{ transform: [{ rotate: '15deg' }] }}
        />
      </View>

      <View className="items-center p-6">
        {/* Crown icon above avatar */}
        <Crown size={28} color="#FFD700" className="mb-2" />

        <Image
          source={character?.profileImage}
          className="size-20 rounded-full bg-gray-300"
        />

        <Text className="mt-3 text-xl font-bold text-gray-900">
          {topUser.username}
        </Text>

        <Text className="text-primary-600 mt-1 text-3xl font-bold">
          {topUser.metric}
        </Text>

        <Text className="text-sm text-gray-600">{getMetricLabel()}</Text>
      </View>
    </Card>
  );
};

export default function LeaderboardScreen() {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState<LeaderboardType>('quests');
  const [scope, setScope] = useState<ScopeType>('global');

  // Get user's data
  const { userEmail } = useProfileData();
  const { 
    friendsData, 
    isLoadingFriends,
    inviteError,
    inviteSuccess,
    formMethods,
    handleCloseInviteModal,
    handleSendFriendRequest,
    inviteMutation,
  } = useFriendManagement(userEmail);
  const character = useCharacterStore((state) => state.character);
  const questStore = useQuestStore();
  const completedQuests = questStore.getCompletedQuests();

  // Create the modal instance
  const inviteModal = useModal();

  // Handle invite friends
  const handleInviteFriends = useCallback(() => {
    inviteModal.present();
  }, [inviteModal]);

  // Handle close invite modal
  const _handleCloseInviteModal = useCallback(() => {
    handleCloseInviteModal();
  }, [handleCloseInviteModal]);

  // Calculate user's actual metrics
  const getUserMetric = () => {
    switch (selectedType) {
      case 'quests':
        return completedQuests.length;
      case 'minutes':
        return completedQuests.reduce(
          (total, quest) => total + quest.durationMinutes,
          0
        );
      case 'streak':
        return useCharacterStore.getState().dailyQuestStreak;
    }
  };

  // Extract username from email or use character name
  const username = userEmail
    ? userEmail.split('@')[0]
    : character?.name || 'User';

  // Check if user actually has friends
  const hasFriends = friendsData && friendsData.length > 0;

  const leaderboardData =
    scope === 'global'
      ? generateGlobalData(
          selectedType,
          username,
          character?.type as CharacterType,
          getUserMetric()
        )
      : generateFriendsData(
          selectedType,
          character?.type as CharacterType,
          username,
          getUserMetric()
        );

  const topUser = leaderboardData[0];
  const restOfUsers = leaderboardData.slice(1);

  const tabs: {
    type: LeaderboardType;
    label: string;
    icon: React.ReactNode;
  }[] = [
    {
      type: 'quests',
      label: 'Quests',
      icon: <CheckCircle size={24} color="#666666" />,
    },
    {
      type: 'minutes',
      label: 'Minutes',
      icon: <Clock size={24} color="#666666" />,
    },
    {
      type: 'streak',
      label: 'Streaks',
      icon: <TrendingUp size={24} color="#666666" />,
    },
  ];

  return (
    <View className="flex-1 bg-background">
      <FocusAwareStatusBar />

      {/* Header */}
      <View className="px-4 pb-4 pt-2">
        <View className="flex-row items-center justify-between">
          <Pressable onPress={() => router.push('/profile')} className="p-2">
            <ArrowLeft size={24} color="#1f0f0c" />
          </Pressable>

          <Text className="text-xl font-bold">Leaderboard</Text>

          <View className="w-10" />
        </View>
      </View>

      {/* Scope Toggle */}
      <View className="mx-4 mb-4 flex-row rounded-full bg-gray-100 p-1">
        <Pressable
          onPress={() => setScope('friends')}
          className={`flex-1 rounded-full py-2 ${
            scope === 'friends' ? 'bg-white' : ''
          }`}
        >
          <Text
            className={`text-center font-semibold ${
              scope === 'friends' ? 'text-primary-600' : 'text-gray-600'
            }`}
          >
            Friends
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setScope('global')}
          className={`flex-1 rounded-full py-2 ${
            scope === 'global' ? 'bg-white' : ''
          }`}
        >
          <Text
            className={`text-center font-semibold ${
              scope === 'global' ? 'text-primary-600' : 'text-gray-600'
            }`}
          >
            Global
          </Text>
        </Pressable>
      </View>

      {/* Type Tabs */}
      <View className="mb-4 flex-row justify-around px-4">
        {tabs.map((tab) => (
          <Pressable
            key={tab.type}
            onPress={() => setSelectedType(tab.type)}
            className={`flex-1 items-center rounded-lg p-3 ${
              selectedType === tab.type ? 'bg-primary-100' : ''
            }`}
          >
            {React.cloneElement(tab.icon as React.ReactElement, {
              color: selectedType === tab.type ? '#2E948D' : '#666666',
            })}
            <Text
              className={`mt-1 text-sm ${
                selectedType === tab.type
                  ? 'text-primary-600 font-bold'
                  : 'text-gray-600'
              }`}
            >
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {scope === 'friends' ? (
          <>
            {/* Show current user */}
            {topUser && (
              <LeaderboardHeader topUser={topUser} type={selectedType} />
            )}

            {/* Show message about inviting friends */}
            {!hasFriends && (
              <Card className="mx-4 mb-4 p-6">
                <View className="items-center">
                  <Users size={48} color="#C9BFAF" className="mb-3" />
                  <Text className="mb-2 text-lg font-bold text-gray-900">
                    Invite Friends to Compete!
                  </Text>
                  <Text className="text-center text-gray-600">
                    You're doing great! Invite friends to see how you stack up
                    against each other.
                  </Text>
                </View>
              </Card>
            )}

            {/* Show friends list if any */}
            {restOfUsers.length > 0 && (
              <Card className="mx-4 mb-4">
                {restOfUsers.map((entry, index) => (
                  <React.Fragment key={entry.userId}>
                    <LeaderboardItem entry={entry} type={selectedType} />
                    {index < restOfUsers.length - 1 && (
                      <View className="ml-16 h-px bg-gray-200" />
                    )}
                  </React.Fragment>
                ))}
              </Card>
            )}

            {/* Invite Friends Button */}
            <View className="mx-4 mb-6 mt-4">
              <Button
                label={hasFriends ? 'Invite More Friends' : 'Invite Friends'}
                variant="default"
                onPress={handleInviteFriends}
              />
            </View>
          </>
        ) : (
          <>
            {/* Top User Highlight */}
            {topUser && (
              <LeaderboardHeader topUser={topUser} type={selectedType} />
            )}

            {/* Leaderboard List */}
            {restOfUsers.length > 0 && (
              <Card className="mx-4 mb-4">
                {restOfUsers.map((entry, index) => (
                  <React.Fragment key={entry.userId}>
                    <LeaderboardItem entry={entry} type={selectedType} />
                    {index < restOfUsers.length - 1 && (
                      <View className="ml-16 h-px bg-gray-200" />
                    )}
                  </React.Fragment>
                ))}
              </Card>
            )}

            {/* Your Position (if not in top 10) */}
            {!leaderboardData.some((e) => e.isCurrentUser) && (
              <Card className="mx-4 mb-4">
                <View className="items-center py-4">
                  <Text className="text-gray-600">Your Position</Text>
                  <Text className="text-primary-600 text-2xl font-bold">
                    #47
                  </Text>
                  <Text className="text-sm text-gray-600">Keep going!</Text>
                </View>
              </Card>
            )}
          </>
        )}
      </ScrollView>

      {/* Invite Friend Modal */}
      <InviteFriendModal
        modalRef={inviteModal.ref}
        onClose={_handleCloseInviteModal}
        onSubmit={handleSendFriendRequest}
        formMethods={formMethods}
        error={inviteError}
        success={inviteSuccess}
        isPending={inviteMutation?.isPending}
      />
    </View>
  );
}
