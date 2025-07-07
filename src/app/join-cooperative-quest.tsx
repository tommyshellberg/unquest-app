import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';

import { invitationApi } from '@/api/invitation';
import {
  Card,
  FocusAwareStatusBar,
  SafeAreaView,
  ScrollView,
  Text,
  View,
} from '@/components/ui';

interface InvitationCardProps {
  invitation: any;
  onAccept: () => void;
  onDecline: () => void;
  isProcessing: boolean;
}

function InvitationCard({
  invitation,
  onAccept,
  onDecline,
  isProcessing,
}: InvitationCardProps) {
  // Debug log the invitation structure
  console.log(
    'InvitationCard - Full invitation object:',
    JSON.stringify(invitation, null, 2)
  );

  // Look for quest title in multiple possible locations
  const questTitle =
    invitation.questTitle ||
    invitation.title ||
    invitation.metadata?.questTitle ||
    invitation.questData?.title ||
    invitation.quest?.title ||
    invitation.questRun?.title ||
    'Cooperative Quest';

  // Look for quest duration in multiple possible locations
  const questDuration =
    invitation.questDuration ||
    invitation.duration ||
    invitation.metadata?.questDuration ||
    invitation.questData?.duration ||
    invitation.quest?.duration ||
    invitation.questRun?.duration ||
    invitation.questRun?.durationMinutes ||
    30;

  return (
    <Card className="mb-4 bg-white p-4">
      <View className="mb-3">
        <Text className="text-lg font-semibold">{questTitle}</Text>
        <View className="mt-2 flex-row items-center">
          <MaterialCommunityIcons name="account" size={16} color="#666" />
          <Text className="ml-1 text-sm text-neutral-600">
            Invited by{' '}
            {invitation.inviter.characterName ||
              invitation.inviter.username ||
              'a friend'}
          </Text>
        </View>
        <View className="mt-1 flex-row items-center">
          <MaterialCommunityIcons name="clock-outline" size={16} color="#666" />
          <Text className="ml-1 text-sm text-neutral-600">
            {questDuration} minutes
          </Text>
        </View>
        <View className="mt-1 flex-row items-center">
          <MaterialCommunityIcons name="account-group" size={16} color="#666" />
          <Text className="ml-1 text-sm text-neutral-600">
            {invitation.acceptedCount}/{invitation.inviteeCount} accepted
          </Text>
        </View>
      </View>

      <View className="flex-row gap-3">
        <TouchableOpacity
          onPress={onDecline}
          disabled={isProcessing}
          className="flex-1 rounded-lg bg-neutral-200 px-4 py-3"
        >
          <Text className="text-center font-semibold text-neutral-700">
            Decline
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onAccept}
          disabled={isProcessing}
          className="flex-1 rounded-lg bg-primary-400 px-4 py-3"
        >
          <Text className="text-center font-semibold text-white">Accept</Text>
        </TouchableOpacity>
      </View>
    </Card>
  );
}

export default function JoinCooperativeQuest() {
  const router = useRouter();
  const [invitations, setInvitations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchInvitations = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      const pendingInvitations = await invitationApi.getPendingInvitations();
      console.log('=======================================');
      console.log('FETCHED INVITATIONS DEBUG:');
      console.log('Number of invitations:', pendingInvitations.length);
      pendingInvitations.forEach((inv, index) => {
        console.log(`Invitation ${index}:`, {
          id: inv.id,
          inviter: inv.inviter,
          quest: inv.quest,
          metadata: inv.metadata,
          questData: inv.questData,
          fullObject: JSON.stringify(inv, null, 2),
        });
      });
      console.log('=======================================');
      setInvitations(pendingInvitations);
    } catch (error) {
      console.error('Error fetching invitations:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchInvitations();
  }, []);

  const handleAccept = async (invitation: any) => {
    try {
      setProcessingId(invitation.id);

      // Accept the invitation
      const response = await invitationApi.respondToInvitation(
        invitation.id,
        'accepted'
      );

      // For cooperative quests, use the lobbyId from metadata or response
      const lobbyId =
        invitation.metadata?.lobbyId ||
        response.invitation?.lobbyId ||
        invitation.id;

      // Navigate to the lobby where it will join and get the full data from server
      router.replace(`/cooperative-quest-lobby/${lobbyId}`);
    } catch (error) {
      console.error('Error accepting invitation:', error);
      // TODO: Show error toast
    } finally {
      setProcessingId(null);
    }
  };

  const handleDecline = async (invitation: any) => {
    try {
      setProcessingId(invitation.id);

      // Decline the invitation
      await invitationApi.respondToInvitation(invitation.id, 'declined');

      // Remove from local list
      setInvitations(invitations.filter((inv) => inv.id !== invitation.id));
    } catch (error) {
      console.error('Error declining invitation:', error);
      // TODO: Show error toast
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-neutral-100">
      <FocusAwareStatusBar />

      {/* Header */}
      <View className="border-b border-neutral-200 bg-white px-5 py-4">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity onPress={() => router.back()}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#333" />
          </TouchableOpacity>
          <Text className="text-lg font-semibold">Join Quest</Text>
          <View className="w-6" />
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 20 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => fetchInvitations(true)}
          />
        }
      >
        {isLoading ? (
          <View className="flex-1 items-center justify-center py-20">
            <ActivityIndicator size="large" />
            <Text className="mt-4 text-neutral-600">
              Loading invitations...
            </Text>
          </View>
        ) : invitations.length === 0 ? (
          <>
            {/* No Invitations */}
            <View className="items-center py-10">
              <MaterialCommunityIcons
                name="inbox-outline"
                size={48}
                color="#999"
              />
              <Text className="mt-3 text-lg font-semibold">No Invitations</Text>
              <Text className="mt-2 text-center text-neutral-600">
                You don't have any pending quest invitations.
              </Text>
            </View>

            {/* Public Quests Section - Coming Soon */}
            <View className="mt-8">
              <View className="mb-4 flex-row items-center justify-between">
                <Text className="text-lg font-semibold">Public Quests</Text>
                <View className="rounded-full bg-amber-100 px-3 py-1">
                  <Text className="text-xs font-semibold text-amber-700">
                    Coming Soon
                  </Text>
                </View>
              </View>

              {/* Mock Public Quest Cards */}
              <View className="opacity-60">
                {[
                  {
                    title: 'Morning Productivity Challenge',
                    host: 'ProductivityPro',
                    duration: 25,
                    participants: '12/20',
                    startTime: 'Starts in 5 min',
                  },
                  {
                    title: 'Study Hall - No Distractions',
                    host: 'StudyBuddy',
                    duration: 45,
                    participants: '8/15',
                    startTime: 'Starts in 12 min',
                  },
                  {
                    title: 'Evening Wind Down',
                    host: 'ZenMaster',
                    duration: 30,
                    participants: '5/10',
                    startTime: 'Starts in 20 min',
                  },
                ].map((quest, index) => (
                  <Card key={index} className="mb-3 bg-white p-4">
                    <View className="mb-3">
                      <Text className="text-base font-semibold">
                        {quest.title}
                      </Text>
                      <View className="mt-2 flex-row items-center">
                        <MaterialCommunityIcons
                          name="account"
                          size={14}
                          color="#666"
                        />
                        <Text className="ml-1 text-xs text-neutral-600">
                          Hosted by {quest.host}
                        </Text>
                      </View>
                    </View>

                    <View className="mb-3 flex-row justify-between">
                      <View className="flex-row items-center">
                        <MaterialCommunityIcons
                          name="clock-outline"
                          size={14}
                          color="#666"
                        />
                        <Text className="ml-1 text-xs text-neutral-600">
                          {quest.duration} min
                        </Text>
                      </View>
                      <View className="flex-row items-center">
                        <MaterialCommunityIcons
                          name="account-group"
                          size={14}
                          color="#666"
                        />
                        <Text className="ml-1 text-xs text-neutral-600">
                          {quest.participants}
                        </Text>
                      </View>
                      <Text className="text-xs font-semibold text-primary-600">
                        {quest.startTime}
                      </Text>
                    </View>

                    <TouchableOpacity
                      disabled
                      className="rounded-lg bg-neutral-200 px-4 py-2"
                    >
                      <Text className="text-center text-sm font-semibold text-neutral-500">
                        Join (Coming Soon)
                      </Text>
                    </TouchableOpacity>
                  </Card>
                ))}
              </View>

              <View className="mt-4 rounded-lg bg-blue-50 p-4">
                <View className="flex-row items-start">
                  <MaterialCommunityIcons
                    name="information"
                    size={16}
                    color="#2563EB"
                    style={{ marginTop: 2 }}
                  />
                  <View className="ml-2 flex-1">
                    <Text className="text-sm font-semibold text-blue-700">
                      Public Quests are coming soon!
                    </Text>
                    <Text className="mt-1 text-xs text-blue-600">
                      Soon you'll be able to join quests created by the
                      community, compete on leaderboards, and find
                      accountability partners worldwide.
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </>
        ) : (
          <>
            {/* Pending Invitations Section */}
            <Text className="mb-4 text-lg font-semibold">
              Pending Invitations ({invitations.length})
            </Text>
            {invitations.map((invitation) => (
              <InvitationCard
                key={invitation.id}
                invitation={invitation}
                onAccept={() => handleAccept(invitation)}
                onDecline={() => handleDecline(invitation)}
                isProcessing={processingId === invitation.id}
              />
            ))}

            {/* Public Quests Section - Coming Soon */}
            <View className="mt-8">
              <View className="mb-4 flex-row items-center justify-between">
                <Text className="text-lg font-semibold">Public Quests</Text>
                <View className="rounded-full bg-amber-100 px-3 py-1">
                  <Text className="text-xs font-semibold text-amber-700">
                    Coming Soon
                  </Text>
                </View>
              </View>

              {/* Mock Public Quest Cards */}
              <View className="opacity-60">
                {[
                  {
                    title: 'Morning Productivity Challenge',
                    host: 'ProductivityPro',
                    duration: 25,
                    participants: '12/20',
                    startTime: 'Starts in 5 min',
                  },
                  {
                    title: 'Study Hall - No Distractions',
                    host: 'StudyBuddy',
                    duration: 45,
                    participants: '8/15',
                    startTime: 'Starts in 12 min',
                  },
                  {
                    title: 'Evening Wind Down',
                    host: 'ZenMaster',
                    duration: 30,
                    participants: '5/10',
                    startTime: 'Starts in 20 min',
                  },
                ].map((quest, index) => (
                  <Card key={index} className="mb-3 bg-white p-4">
                    <View className="mb-3">
                      <Text className="text-base font-semibold">
                        {quest.title}
                      </Text>
                      <View className="mt-2 flex-row items-center">
                        <MaterialCommunityIcons
                          name="account"
                          size={14}
                          color="#666"
                        />
                        <Text className="ml-1 text-xs text-neutral-600">
                          Hosted by {quest.host}
                        </Text>
                      </View>
                    </View>

                    <View className="mb-3 flex-row justify-between">
                      <View className="flex-row items-center">
                        <MaterialCommunityIcons
                          name="clock-outline"
                          size={14}
                          color="#666"
                        />
                        <Text className="ml-1 text-xs text-neutral-600">
                          {quest.duration} min
                        </Text>
                      </View>
                      <View className="flex-row items-center">
                        <MaterialCommunityIcons
                          name="account-group"
                          size={14}
                          color="#666"
                        />
                        <Text className="ml-1 text-xs text-neutral-600">
                          {quest.participants}
                        </Text>
                      </View>
                      <Text className="text-xs font-semibold text-primary-600">
                        {quest.startTime}
                      </Text>
                    </View>

                    <TouchableOpacity
                      disabled
                      className="rounded-lg bg-neutral-200 px-4 py-2"
                    >
                      <Text className="text-center text-sm font-semibold text-neutral-500">
                        Join (Coming Soon)
                      </Text>
                    </TouchableOpacity>
                  </Card>
                ))}
              </View>

              <View className="mt-4 rounded-lg bg-blue-50 p-4">
                <View className="flex-row items-start">
                  <MaterialCommunityIcons
                    name="information"
                    size={16}
                    color="#2563EB"
                    style={{ marginTop: 2 }}
                  />
                  <View className="ml-2 flex-1">
                    <Text className="text-sm font-semibold text-blue-700">
                      Public Quests are coming soon!
                    </Text>
                    <Text className="mt-1 text-xs text-blue-600">
                      Soon you'll be able to join quests created by the
                      community, compete on leaderboards, and find
                      accountability partners worldwide.
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
