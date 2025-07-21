import { useRouter } from 'expo-router';
import {
  CheckCircle,
  Clock,
  Crown,
  TrendingUp,
  Trophy,
  Users,
} from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Image } from 'react-native';

import {
  type LeaderboardEntry as ApiLeaderboardEntry,
  useLeaderboardStats,
} from '@/api/stats';
import {
  ContactsImportModal,
  type ContactsImportModalRef,
} from '@/components/profile/contact-import';
import {
  Button,
  Card,
  FocusAwareStatusBar,
  SafeAreaView,
  Text,
  ScreenContainer,
  ScreenHeader,
  View,
  ScrollView,
  TouchableOpacity,
  Pressable,
} from '@/components/ui';
import colors from '@/components/ui/colors';
import { useFriendManagement } from '@/lib/hooks/use-friend-management';
import { useProfileData } from '@/lib/hooks/use-profile-data';
import { useCharacterStore } from '@/store/character-store';
import { useQuestStore } from '@/store/quest-store';
import { useUserStore } from '@/store/user-store';

import CHARACTERS from '../data/characters';

type CharacterType =
  | 'alchemist'
  | 'druid'
  | 'scout'
  | 'wizard'
  | 'knight'
  | 'bard';

type LeaderboardEntry = {
  rank?: number;
  userId: string;
  username: string;
  characterType: CharacterType;
  metric: number;
  isCurrentUser?: boolean;
  isFriend?: boolean;
  isSeparated?: boolean;
};

type LeaderboardType = 'quests' | 'minutes' | 'streak';
type ScopeType = 'friends' | 'global';

const subheading = 'See how you rank against other players and friends.';

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
      className="flex-row items-center px-4 py-3"
      style={
        entry.isCurrentUser ? { backgroundColor: colors.primary[100] } : {}
      }
    >
      <Text
        className={`w-10 text-lg font-bold ${
          entry.rank && entry.rank <= 3 ? 'text-primary-500' : 'text-gray-600'
        }`}
      >
        {entry.rank || ''}
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
    <Card className="relative mb-4 overflow-hidden">
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
  const contactsModalRef = React.useRef<ContactsImportModalRef>(null);

  // Get user's data
  const { userEmail } = useProfileData();
  const {
    friendsData,
    isLoadingFriends,
    inviteError,
    inviteSuccess,
    formMethods,
    handleInviteFriends: handleInviteFriendsFromHook,
    handleCloseInviteModal,
    handleSendFriendRequest,
    inviteMutation,
    sendBulkInvites,
  } = useFriendManagement(userEmail, contactsModalRef);

  // Get current user data from stores
  const currentUserId = useUserStore((state) => state.user?.id);
  const character = useCharacterStore((state) => state.character);
  const completedQuests = useQuestStore((state) => state.completedQuests);
  const dailyQuestStreak = useCharacterStore((state) => state.dailyQuestStreak);

  // Calculate total minutes from completed quests
  const totalMinutes = useMemo(() => {
    return completedQuests.reduce((total, quest) => {
      if (quest.startTime && quest.stopTime && quest.status === 'completed') {
        return total + Math.round((quest.stopTime - quest.startTime) / 60000);
      }
      return total;
    }, 0);
  }, [completedQuests]);

  // Fetch leaderboard data
  const {
    data: leaderboardStats,
    isLoading: isLoadingStats,
    error: statsError,
  } = useLeaderboardStats();

  // Use the handleInviteFriends from the hook
  const handleInviteFriends = handleInviteFriendsFromHook;

  // Check if user actually has friends
  const hasFriends =
    friendsData && friendsData.friends && friendsData.friends.length > 0;

  // Transform API data to UI format
  const leaderboardData = useMemo((): LeaderboardEntry[] => {
    if (!leaderboardStats) return [];

    let apiData: ApiLeaderboardEntry[] = [];
    let allApiData: ApiLeaderboardEntry[] = [];

    if (scope === 'friends' && leaderboardStats.friends) {
      // Use friends data from API
      switch (selectedType) {
        case 'quests':
          apiData = leaderboardStats.friends.questsCompleted || [];
          allApiData = leaderboardStats.friends.questsCompleted || [];
          break;
        case 'minutes':
          apiData = leaderboardStats.friends.questMinutes || [];
          allApiData = leaderboardStats.friends.questMinutes || [];
          break;
        case 'streak':
          apiData = leaderboardStats.friends.longestStreak || [];
          allApiData = leaderboardStats.friends.longestStreak || [];
          break;
      }
    } else {
      // Use global data
      switch (selectedType) {
        case 'quests':
          apiData = leaderboardStats.global.questsCompleted || [];
          allApiData = leaderboardStats.global.questsCompleted || [];
          break;
        case 'minutes':
          apiData = leaderboardStats.global.questMinutes || [];
          allApiData = leaderboardStats.global.questMinutes || [];
          break;
        case 'streak':
          apiData = leaderboardStats.global.longestStreak || [];
          allApiData = leaderboardStats.global.longestStreak || [];
          break;
      }
    }

    // Transform API data to UI format for top 10
    const top10 = apiData.slice(0, 10).map((entry, index) => ({
      rank: index + 1,
      userId: entry.userId,
      username: entry.characterName,
      characterType: entry.characterType as CharacterType,
      metric: entry.value,
      isCurrentUser: entry.userId === currentUserId,
      isFriend:
        scope === 'friends' ||
        friendsData?.friends?.some((friend) => friend._id === entry.userId) ||
        false,
    }));

    // Check if current user is in top 10
    const userInTop10 = top10.some((entry) => entry.isCurrentUser);

    // If user not in top 10, add them without rank from local data
    if (!userInTop10 && currentUserId && character) {
      // Get user's metric based on selected type
      let userMetric = 0;
      switch (selectedType) {
        case 'quests':
          userMetric = completedQuests.length;
          break;
        case 'minutes':
          userMetric = totalMinutes;
          break;
        case 'streak':
          userMetric = dailyQuestStreak;
          break;
      }

      // Only add user if they have data for this metric
      if (userMetric > 0) {
        const userLeaderboardEntry: LeaderboardEntry = {
          userId: currentUserId,
          username: character.name,
          characterType: character.type,
          metric: userMetric,
          isCurrentUser: true,
          isFriend: scope === 'friends',
          isSeparated: true,
        };

        // Add user entry without rank number
        if (top10.length > 0) {
          return [...top10, userLeaderboardEntry];
        }
        return [userLeaderboardEntry];
      }
    }

    return top10;
  }, [
    leaderboardStats,
    selectedType,
    scope,
    currentUserId,
    friendsData,
    character,
    completedQuests.length,
    totalMinutes,
    dailyQuestStreak,
  ]);

  const topUser = leaderboardData[0];
  const restOfUsers = leaderboardData.slice(1);

  // Find current user's position if not in top 10
  const currentUserPosition = useMemo(() => {
    if (!leaderboardStats || scope === 'friends') return null;

    let apiData: ApiLeaderboardEntry[] = [];
    switch (selectedType) {
      case 'quests':
        apiData = leaderboardStats.global.questsCompleted || [];
        break;
      case 'minutes':
        apiData = leaderboardStats.global.questMinutes || [];
        break;
      case 'streak':
        apiData = leaderboardStats.global.longestStreak || [];
        break;
    }

    const userIndex = apiData.findIndex(
      (entry) => entry.userId === currentUserId
    );
    return userIndex >= 0 ? userIndex + 1 : null;
  }, [leaderboardStats, selectedType, scope, currentUserId]);

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

  // Handle loading state
  if (isLoadingStats || isLoadingFriends) {
    return (
      <SafeAreaView className="flex-1 bg-neutral-100">
        <FocusAwareStatusBar />
        <ScreenContainer>
          {/* Header */}
          <ScreenHeader
            title="Leaderboard"
            subtitle={subheading}
            showBackButton
            onBackPress={() => router.push('/profile')}
          />
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#2E948D" />
            <Text className="mt-2 text-gray-600">Loading leaderboard...</Text>
          </View>
        </ScreenContainer>
      </SafeAreaView>
    );
  }

  // Handle error state
  if (statsError) {
    return (
      <SafeAreaView className="flex-1 bg-neutral-100">
        <FocusAwareStatusBar />
        <ScreenContainer>
          {/* Header */}
          <ScreenHeader
            title="Leaderboard"
            subtitle={subheading}
            showBackButton
            onBackPress={() => router.push('/profile')}
          />
          <View className="flex-1 items-center justify-center px-4">
            <Text className="text-center text-gray-600">
              Unable to load leaderboard data
            </Text>
            <Button
              label="Try Again"
              variant="ghost"
              onPress={() => window.location.reload()}
              className="mt-4"
            />
          </View>
        </ScreenContainer>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-neutral-100">
      <FocusAwareStatusBar />

      <ScreenContainer>
        {/* Header */}
        <ScreenHeader
          title="Leaderboard"
          subtitle={subheading}
          showBackButton
          onBackPress={() => router.push('/profile')}
        />

        {/* Scope Toggle */}
        <View className="mb-4 flex-row rounded-full bg-gray-100 p-1">
          <Pressable
            onPress={() => setScope('friends')}
            className={`flex-1 rounded-full py-2 ${
              scope === 'friends' ? 'bg-neutral-300' : ''
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
              scope === 'global' ? 'bg-neutral-300' : ''
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
        <View className="mb-4 flex-row justify-around">
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
          {scope === 'friends' && !leaderboardStats?.friends ? (
            <Card className="mt-8 p-6">
              <View className="items-center">
                <Users size={48} color="#C9BFAF" className="mb-3" />
                <Text className="mb-2 text-lg font-bold text-gray-900">
                  Sign in to see friends
                </Text>
                <Text className="text-center text-gray-600">
                  You need to be signed in to view your friends' rankings.
                </Text>
              </View>
            </Card>
          ) : leaderboardData.length === 0 ? (
            <Card className="mt-8 p-6">
              <View className="items-center">
                <Trophy size={48} color="#C9BFAF" className="mb-3" />
                <Text className="mb-2 text-lg font-bold text-gray-900">
                  No Data Yet
                </Text>
                <Text className="text-center text-gray-600">
                  {scope === 'friends'
                    ? "Your friends haven't started their journey yet."
                    : 'Complete some quests to appear on the leaderboard!'}
                </Text>
              </View>
            </Card>
          ) : scope === 'friends' ? (
            <>
              {/* Show current user */}
              {topUser && (
                <LeaderboardHeader topUser={topUser} type={selectedType} />
              )}

              {/* Show message about inviting friends */}
              {!hasFriends && (
                <Card className="mb-4 p-6">
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
              {restOfUsers.length > 0 ? (
                <Card className="mb-4">
                  {restOfUsers.map((entry, index) => (
                    <React.Fragment key={entry.userId}>
                      {entry.isSeparated && index > 0 && (
                        <View className="my-2 px-4">
                          <Text className="text-center text-sm text-gray-500">
                            • • •
                          </Text>
                        </View>
                      )}
                      <LeaderboardItem entry={entry} type={selectedType} />
                      {index < restOfUsers.length - 1 &&
                        !restOfUsers[index + 1]?.isSeparated && (
                          <View className="ml-16 h-px bg-gray-200" />
                        )}
                    </React.Fragment>
                  ))}
                </Card>
              ) : (
                hasFriends &&
                leaderboardData.length === 0 && (
                  <Card className="mb-4 p-6">
                    <View className="items-center">
                      <Text className="text-center text-gray-600">
                        {selectedType === 'quests'
                          ? 'No friends have completed quests yet. Be the first!'
                          : selectedType === 'minutes'
                            ? 'No friends have saved time yet. Start your journey!'
                            : 'No friends have active streaks. Start yours today!'}
                      </Text>
                    </View>
                  </Card>
                )
              )}

              {/* Invite Friends Button */}
              <View className="mb-6 mt-4">
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
                <Card className="mb-4">
                  {restOfUsers.map((entry, index) => (
                    <React.Fragment key={entry.userId}>
                      {entry.isSeparated && index > 0 && (
                        <View className="my-2 px-4">
                          <Text className="text-center text-sm text-gray-500">
                            • • •
                          </Text>
                        </View>
                      )}
                      <LeaderboardItem entry={entry} type={selectedType} />
                      {index < restOfUsers.length - 1 &&
                        !restOfUsers[index + 1]?.isSeparated && (
                          <View className="ml-16 h-px bg-gray-200" />
                        )}
                    </React.Fragment>
                  ))}
                </Card>
              )}

              {/* Removed separate position card since user is now always shown in the list */}
            </>
          )}
        </ScrollView>
      </ScreenContainer>

      {/* Invite Friend Modal */}
      <ContactsImportModal
        ref={contactsModalRef}
        sendBulkInvites={sendBulkInvites}
        friends={friendsData?.friends || []}
        userEmail={userEmail}
      />
    </SafeAreaView>
  );
}
