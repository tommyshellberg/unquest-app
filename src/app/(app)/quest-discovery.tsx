import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { ActivityIndicator, RefreshControl } from 'react-native';
import { useQuery } from '@tanstack/react-query';

import { Button, FocusAwareStatusBar, Text, View, ScrollView, Pressable } from '@/components/ui';
import { getPendingInvitations } from '@/lib/services/invitation-service';
import { useInvitationActions } from '@/lib/hooks/use-cooperative-quest';
import { formatDistanceToNow } from 'date-fns';

export default function QuestDiscoveryScreen() {
  const router = useRouter();
  const { acceptInvitation, declineInvitation, isAccepting, isDeclining } = useInvitationActions();

  // Fetch pending invitations
  const { data: invitations, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['invitations', 'pending'],
    queryFn: getPendingInvitations,
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  const handleAccept = (invitationId: string) => {
    acceptInvitation(invitationId);
  };

  const handleDecline = (invitationId: string) => {
    declineInvitation(invitationId);
  };

  const renderInvitation = (invitation: any) => {
    const expiresIn = formatDistanceToNow(new Date(invitation.expiresAt), { addSuffix: true });
    
    return (
      <View key={invitation.id} className="mb-4 rounded-lg border border-gray-200 p-4">
        <View className="mb-2">
          <Text className="text-lg font-semibold">{invitation.questTitle}</Text>
          <Text className="text-sm text-gray-600">
            Invited by {invitation.hostName}
          </Text>
        </View>
        
        <View className="mb-3">
          <Text className="text-sm text-gray-500">
            Duration: {invitation.questDuration} minutes
          </Text>
          <Text className="text-sm text-gray-500">
            Expires {expiresIn}
          </Text>
        </View>
        
        <View className="flex-row space-x-2">
          <Button
            label="Accept"
            onPress={() => handleAccept(invitation.id)}
            disabled={isAccepting || isDeclining}
            className="flex-1"
            size="sm"
          />
          <Button
            label="Decline"
            onPress={() => handleDecline(invitation.id)}
            disabled={isAccepting || isDeclining}
            variant="secondary"
            className="flex-1"
            size="sm"
          />
        </View>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-background">
      <FocusAwareStatusBar />
      
      {/* Header */}
      <View className="flex-row items-center justify-between border-b border-[#EEEEEE] px-5 py-4">
        <Pressable onPress={() => router.back()}>
          <Text className="text-base text-[#333]">Back</Text>
        </Pressable>
        <Text className="text-lg font-semibold">Join a Quest</Text>
        <View className="w-14" />
      </View>

      {/* Content */}
      <ScrollView 
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
      >
        <View className="p-5">
          {/* Pending Invitations Section */}
          <View className="mb-6">
            <Text className="mb-3 text-lg font-semibold">Pending Invitations</Text>
            
            {isLoading ? (
              <ActivityIndicator className="py-8" />
            ) : invitations && invitations.length > 0 ? (
              invitations.map(renderInvitation)
            ) : (
              <View className="rounded-lg bg-gray-50 p-6">
                <Text className="text-center text-gray-500">
                  No pending invitations at the moment
                </Text>
              </View>
            )}
          </View>

          {/* Future: Public Quests Section */}
          <View>
            <Text className="mb-3 text-lg font-semibold">Public Quests</Text>
            <View className="rounded-lg bg-gray-50 p-6">
              <Text className="text-center text-gray-500">
                Public quest discovery coming soon!
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}