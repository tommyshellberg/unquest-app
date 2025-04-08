import { useRouter } from 'expo-router';
import React, { useCallback, useEffect } from 'react';
import { RefreshControl, ScrollView } from 'react-native';

import { DeleteFriendModal } from '@/components/profile/delete-friend-modal';
import { ExperienceCard } from '@/components/profile/experience-card';
import { FriendsList } from '@/components/profile/friends-list';
import { InviteFriendModal } from '@/components/profile/invite-friend-modal';
import { ProfileCard } from '@/components/profile/profile-card';
// Import components
import { ProfileHeader } from '@/components/profile/profile-header';
import { RescindInvitationModal } from '@/components/profile/rescind-invitation-modal';
import { StatsCard } from '@/components/profile/stats-card';
import { FocusAwareStatusBar, useModal, View } from '@/components/ui';
import { useFriendManagement } from '@/lib/hooks/use-friend-management';
// Import hooks
import { useProfileData } from '@/lib/hooks/use-profile-data';
import { useCharacterStore } from '@/store/character-store';
import { useQuestStore } from '@/store/quest-store';

export default function ProfileScreen() {
  const router = useRouter();
  const character = useCharacterStore((state) => state.character);
  const completedQuests = useQuestStore((state) => state.getCompletedQuests());
  // Add a state to track if we need to redirect
  const [isRedirecting, setIsRedirecting] = React.useState(false);

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
    inviteModalVisible,
    deleteModalVisible,
    rescindModalVisible,
    invitationToRescind,
    inviteError,
    inviteSuccess,
    formMethods,
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
  } = useFriendManagement(userEmail);

  // Create the modal instance at the parent level
  const inviteModal = useModal();

  // Update the handleInviteFriends to use modal.present
  const handleInviteFriends = useCallback(() => {
    inviteModal.present();
  }, [inviteModal]);

  // Update the handleCloseInviteModal to use modal.dismiss
  const _handleCloseInviteModal = useCallback(() => {
    handleCloseInviteModal();
  }, [handleCloseInviteModal]);

  // Check if character exists and handle redirect
  useEffect(() => {
    if (!character && !isRedirecting) {
      // Set redirecting state to prevent double redirects
      setIsRedirecting(true);
      // Use setTimeout to ensure this happens after the current render cycle
      setTimeout(() => {
        router.replace('/onboarding/choose-character');
      }, 0);
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

  // Calculate total minutes from completed quests
  const totalMinutesOffPhone = completedQuests.reduce(
    (total, quest) => total + quest.durationMinutes,
    0
  );

  return (
    <View className="bg-background flex-1">
      <FocusAwareStatusBar />

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
        {/* Header */}
        <ProfileHeader onSettingsPress={() => router.push('/settings')} />

        {/* Profile Card */}
        <ProfileCard character={character} />

        {/* Stats Card */}
        <StatsCard
          questCount={completedQuests.length}
          minutesSaved={totalMinutesOffPhone}
          friendsCount={friendsData?.count || 0}
        />

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
      <InviteFriendModal
        modalRef={inviteModal.ref}
        onClose={_handleCloseInviteModal}
        onSubmit={handleSendFriendRequest}
        formMethods={formMethods}
        error={inviteError}
        success={inviteSuccess}
        isPending={inviteMutation?.isPending}
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
