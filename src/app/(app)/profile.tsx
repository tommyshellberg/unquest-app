import { useRouter } from 'expo-router';
import { Award, TrendingUp } from 'lucide-react-native';
import React, { useCallback, useEffect } from 'react';
import { Pressable, RefreshControl, ScrollView } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { DeleteFriendModal } from '@/components/profile/delete-friend-modal';
import { ExperienceCard } from '@/components/profile/experience-card';
import { FriendsList } from '@/components/profile/friends-list';
import {
  ContactsImportModal,
  type ContactsImportModalRef,
} from '@/components/profile/contact-import';
import { ProfileCard } from '@/components/profile/profile-card';
// Import components
import { RescindInvitationModal } from '@/components/profile/rescind-invitation-modal';
import { StatsCard } from '@/components/profile/stats-card';
import {
  Card,
  FocusAwareStatusBar,
  Text,
  useModal,
  View,
} from '@/components/ui';
import { useFriendManagement } from '@/lib/hooks/use-friend-management';
// Import hooks
import { useProfileData } from '@/lib/hooks/use-profile-data';
import { getItem } from '@/lib/storage';
import { useCharacterStore } from '@/store/character-store';
import { useQuestStore } from '@/store/quest-store';
import { useUserStore } from '@/store/user-store';
import { type CharacterType } from '@/store/types';

export default function ProfileScreen() {
  const router = useRouter();
  const character = useCharacterStore((state) => state.character);
  const completedQuests = useQuestStore((state) => state.getCompletedQuests());
  // Add a state to track if we need to redirect
  const [isRedirecting, setIsRedirecting] = React.useState(false);
  const streakCount = useCharacterStore((state) => state.dailyQuestStreak);
  const contactsModalRef = React.useRef<ContactsImportModalRef>(null);

  // Animation value for header
  const headerOpacity = useSharedValue(0);

  // Initialize animation
  useEffect(() => {
    headerOpacity.value = withTiming(1, { duration: 1000 });
  }, [headerOpacity]);

  // Animated style
  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
  }));

  // Get profile data from custom hook
  const { userEmail, fetchUserDetails } = useProfileData();

  // Handle friends, invitations, and mutations
  const {
    friendsData,
    combinedData,
    isLoadingFriends,
    isLoadingInvitations,
    refreshing,
    onRefresh,
    deleteModalVisible,
    rescindModalVisible,
    invitationToRescind,
    inviteError,
    inviteSuccess,
    formMethods,
    handleInviteFriends,
    handleCloseInviteModal,
    handleDeleteFriend,
    handleConfirmDelete,
    handleCancelDelete,
    handleRescindInvitation,
    handleConfirmRescind,
    handleCancelRescind,
    handleSendFriendRequest,
    handleAcceptInvitation,
    handleRejectInvitation,
    isOutgoingInvitation,
    acceptMutation,
    rejectMutation,
    rescindMutation,
    inviteMutation,
    sendBulkInvites,
  } = useFriendManagement(userEmail, contactsModalRef);

  // Create the modal instance at the parent level

  // Check if character exists and handle redirect
  useEffect(() => {
    if (!character && !isRedirecting) {
      // For verified users, we should sync character data from the server
      // rather than redirecting to onboarding
      const syncCharacterFromUser = async () => {
        try {
          const { getUserDetails } = await import('@/lib/services/user');
          const user = await getUserDetails();

          // Check if user has character data at the top level (legacy format)
          if (
            user &&
            (user as any).type &&
            (user as any).name &&
            (user as any).level !== undefined
          ) {
            // Create character from user data
            const characterStore = useCharacterStore.getState();
            characterStore.createCharacter(
              (user as any).type as CharacterType,
              (user as any).name
            );

            // Update with level and XP data
            const level = (user as any).level || 1;
            const calculateXPForLevel = (l: number): number => {
              return Math.floor(100 * Math.pow(1.5, l - 1));
            };

            characterStore.updateCharacter({
              type: (user as any).type,
              name: (user as any).name,
              level: level,
              currentXP: (user as any).xp || 0,
              xpToNextLevel: calculateXPForLevel(level),
            });

            // Update streak if available
            if ((user as any).dailyQuestStreak !== undefined) {
              characterStore.setStreak((user as any).dailyQuestStreak);
            }
          } else {
            // Only redirect to onboarding if this is truly a new user
            // Check for provisional data to determine if they're in onboarding
            const hasProvisionalData = !!(
              getItem('provisionalUserId') ||
              getItem('provisionalAccessToken') ||
              getItem('provisionalEmail')
            );

            if (hasProvisionalData) {
              // User is in onboarding flow, redirect to choose character
              setIsRedirecting(true);
              setTimeout(() => {
                router.replace('/onboarding/choose-character');
              }, 0);
            }
            // For verified users without character data, we'll show a message
            // rather than redirecting to onboarding
          }
        } catch (error) {
          console.error('Error syncing character data:', error);
        }
      };

      syncCharacterFromUser();
    }
  }, [character, router, isRedirecting]);

  // Fetch user details when the component mounts
  useEffect(() => {
    if (character) {
      fetchUserDetails();
    }
  }, [fetchUserDetails, character]);

  // Don't render anything while redirecting
  if (!character || isRedirecting) {
    return null; // Return empty instead of a loading view
  }

  // Get user from store for server stats
  const user = useUserStore((state) => state.user);

  // Calculate total minutes from completed quests
  // Use server stats if available, otherwise calculate from local data
  const totalMinutesOffPhone =
    user?.totalMinutesOffPhone ??
    completedQuests.reduce((total, quest) => total + quest.durationMinutes, 0);

  // Use server quest count if available
  const questCount = user?.totalQuestsCompleted ?? completedQuests.length;

  return (
    <View className="flex-1 bg-background">
      <FocusAwareStatusBar />

      {/* Header */}
      <Animated.View style={headerStyle} className="mb-4 px-4">
        <Text className="mb-3 mt-2 text-xl font-bold">Profile</Text>
        <Text>Track your journey, stats, and connect with friends.</Text>
      </Animated.View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#334738']}
            tintColor={'#334738'}
          />
        }
      >
        {/* Profile Card */}
        <ProfileCard character={character} />

        {/* Stats Card */}
        <StatsCard
          questCount={questCount}
          minutesSaved={totalMinutesOffPhone}
          streakCount={streakCount}
        />

        {/* Action Cards */}
        <View className="mx-4 mt-4 flex-row gap-3">
          <Pressable
            onPress={() => router.push('/leaderboard')}
            className="flex-1"
          >
            <Card className="items-center justify-center py-6">
              <TrendingUp size={32} color="#2E948D" />
              <Text className="mt-2 text-sm font-semibold text-gray-700">
                View Leaderboard
              </Text>
              <Text className="mt-1 text-center text-xs text-gray-600">
                See how others are doing
              </Text>
            </Card>
          </Pressable>

          <Pressable
            onPress={() => router.push('/achievements')}
            className="flex-1"
          >
            <Card className="items-center justify-center py-6">
              <Award size={32} color="#2E948D" />
              <Text className="mt-2 text-sm font-semibold text-gray-700">
                My Achievements
              </Text>
              <Text className="mt-1 text-center text-xs text-gray-600">
                Track your progress
              </Text>
            </Card>
          </Pressable>
        </View>

        {/* Experience Progress */}
        <ExperienceCard character={character} />

        {/* Friends Section */}
        <FriendsList
          combinedData={combinedData}
          isLoading={isLoadingFriends || isLoadingInvitations}
          onInvite={handleInviteFriends}
          onDelete={handleDeleteFriend}
          onRescind={handleRescindInvitation}
          onAccept={handleAcceptInvitation}
          onReject={handleRejectInvitation}
          isOutgoingInvitation={isOutgoingInvitation}
          acceptMutation={acceptMutation}
          rejectMutation={rejectMutation}
          rescindMutation={rescindMutation}
          userEmail={userEmail}
        />
      </ScrollView>

      {/* Modals */}
      <ContactsImportModal
        ref={contactsModalRef}
        sendBulkInvites={sendBulkInvites}
        friends={friendsData?.friends || []}
        userEmail={userEmail}
      />

      <DeleteFriendModal
        visible={deleteModalVisible}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />

      <RescindInvitationModal
        visible={rescindModalVisible}
        invitation={invitationToRescind}
        onConfirm={handleConfirmRescind}
        onCancel={handleCancelRescind}
        isPending={rescindMutation.isPending}
      />
    </View>
  );
}
