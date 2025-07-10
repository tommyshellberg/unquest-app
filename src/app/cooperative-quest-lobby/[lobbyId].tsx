import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Check, Circle, Clock, X } from 'lucide-react-native';
import { usePostHog } from 'posthog-react-native';
import React, { useEffect, useState, useCallback } from 'react';
import { ActivityIndicator, TouchableOpacity, Alert } from 'react-native';

import { invitationApi } from '@/api/invitation';
import {
  Button,
  FocusAwareStatusBar,
  SafeAreaView,
  ScrollView,
  Text,
  View,
} from '@/components/ui';
import colors from '@/components/ui/colors';
import { InfoCard } from '@/components/ui/info-card';
import { useWebSocket } from '@/components/providers/websocket-provider';
import {
  useCooperativeLobbyStore,
  type CooperativeLobby,
} from '@/store/cooperative-lobby-store';
import { useUserStore } from '@/store/user-store';
import { useQuestStore } from '@/store/quest-store';
import type {
  LobbyParticipantJoinedPayload,
  LobbyParticipantUpdatedPayload,
  LobbyInvitationResponsePayload,
  LobbyReadyStatusPayload,
} from '@/lib/services/websocket-events.types';

interface ParticipantRowProps {
  participant: any;
  isCurrentUser: boolean;
}

function ParticipantRow({ participant, isCurrentUser }: ParticipantRowProps) {
  const getStatusIcon = () => {
    if (participant.invitationStatus === 'pending') {
      return <Clock size={20} color={colors.neutral[400]} />;
    }
    if (participant.invitationStatus === 'declined') {
      return <X size={20} color={colors.red[400]} />;
    }
    if (participant.isReady) {
      return <Check size={20} color={colors.primary[400]} />;
    }
    return <Circle size={20} color={colors.neutral[400]} />;
  };

  return (
    <View className="mb-3 flex-row items-center rounded-lg p-4" style={{ backgroundColor: colors.cardBackground }}>
      <View className="mr-3">{getStatusIcon()}</View>
      <View className="flex-1">
        <Text className="font-semibold" style={{ fontWeight: '700' }}>
          {participant.username} {isCurrentUser && '(You)'}{' '}
          {participant.isCreator && '👑'}
        </Text>
        <Text className="text-sm" style={{ color: colors.neutral[500] }}>
          {participant.invitationStatus === 'pending' &&
            'Waiting for response...'}
          {participant.invitationStatus === 'declined' && 'Declined invitation'}
          {participant.invitationStatus === 'accepted' &&
            !participant.isReady &&
            'In lobby'}
          {participant.invitationStatus === 'accepted' &&
            participant.isReady &&
            'Ready!'}
        </Text>
      </View>
    </View>
  );
}

export default function CooperativeQuestLobby() {
  const { lobbyId } = useLocalSearchParams<{ lobbyId: string }>();
  const router = useRouter();
  const posthog = usePostHog();
  const currentUser = useUserStore((state) => state.user);
  const currentLobby = useCooperativeLobbyStore((state) => state.currentLobby);
  const markUserReady = useCooperativeLobbyStore(
    (state) => state.markUserReady
  );
  const updateInvitationResponse = useCooperativeLobbyStore(
    (state) => state.updateInvitationResponse
  );
  const updateParticipant = useCooperativeLobbyStore(
    (state) => state.updateParticipant
  );
  const joinLobby = useCooperativeLobbyStore((state) => state.joinLobby);
  const leaveLobby = useCooperativeLobbyStore((state) => state.leaveLobby);

  const { emit, on, off, joinQuestRoom, leaveQuestRoom } = useWebSocket();
  const [isLoading, setIsLoading] = useState(true);
  const [hasTransitioned, setHasTransitioned] = useState(false);
  // For cooperative quests, the lobbyId IS the invitationId
  const invitationId = lobbyId;

  // Join the lobby room on mount
  useEffect(() => {
    if (lobbyId) {
      // Listen for lobby joined event (response to joining)
      const handleLobbyJoined = (data: any) => {
        console.log('=======================================');
        console.log('LOBBY JOINED EVENT DATA:');
        console.log('Lobby ID:', data.lobbyId);
        console.log('Quest data:', data.quest);
        console.log('Metadata:', data.metadata);
        console.log('Participants:', data.participants);
        console.log('Full data:', JSON.stringify(data, null, 2));
        console.log('=======================================');

        if (data.lobbyId === lobbyId) {
          // Always use fresh data from the server to avoid stale state
          console.log('Updating lobby with fresh server data');
          // Check multiple possible locations for quest data
          const questTitle =
            data.quest?.title ||
            data.metadata?.questTitle ||
            data.questData?.title ||
            data.title ||
            'Cooperative Quest';

          const questDuration =
            data.quest?.durationMinutes ||
            data.quest?.duration ||
            data.metadata?.questDuration ||
            data.questData?.duration ||
            data.duration ||
            30;

          const lobbyData: CooperativeLobby = {
            lobbyId: data.lobbyId,
            questTitle,
            questDuration,
            creatorId:
              data.participants?.find((p: any) => p.isCreator)?.userId ||
              data.creatorId ||
              '',
            participants:
              data.participants?.map((p: any) => ({
                id: p.userId,
                username: p.characterName || p.username || p.userId,
                invitationStatus: p.status || 'accepted',
                isReady: p.isReady || false,
                isCreator: p.isCreator || false,
                joinedAt: p.joinedAt ? new Date(p.joinedAt) : undefined,
              })) || [],
            status: 'waiting',
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + 5 * 60 * 1000),
            questData: data.quest || data.questData || data.metadata,
          };

          console.log('Created lobby data:', lobbyData);

          // Update the lobby store
          joinLobby(lobbyData);
          setIsLoading(false);

          // Check if we should immediately transition to ready screen
          // This happens when invitee joins after all have responded
          const allResponded = lobbyData.participants.every(
            (p) => p.invitationStatus !== 'pending'
          );
          const acceptedCount = lobbyData.participants.filter(
            (p) => p.invitationStatus === 'accepted'
          ).length;

          if (
            allResponded &&
            acceptedCount > 1 &&
            data.waitingForResponses === 0
          ) {
            console.log(
              'All already responded on join - will transition to ready screen'
            );
            // Set a flag to transition after the component renders
            setTimeout(() => {
              setHasTransitioned(true);
            }, 100);
          }
        }
      };

      // Subscribe to events first
      on('lobby:joined', handleLobbyJoined);

      // For cooperative quests, inviter joins with invitation ID
      // The lobbyId for cooperative quests IS the invitation ID
      console.log('Joining lobby with ID:', lobbyId);

      // Then join the lobby
      emit('lobby:join', { lobbyId });

      // Listen for WebSocket events
      const handleParticipantJoined = (data: LobbyParticipantJoinedPayload) => {
        console.log('Participant joined:', data);
        // Update local state with the new participant
        if (data.participant && data.lobbyId === lobbyId) {
          updateParticipant(data.participant.userId || data.userId, {
            username:
              data.participant.characterName ||
              data.participant.username ||
              data.participant.userId,
            invitationStatus: 'accepted',
            joinedAt: new Date(),
          });
        }
      };

      const handleParticipantUpdated = (
        data: LobbyParticipantUpdatedPayload
      ) => {
        console.log('Participant updated:', data);
        // Update local state
      };

      const handleInvitationResponse = (
        data: LobbyInvitationResponsePayload
      ) => {
        console.log('Invitation response:', data);
        console.log(
          'Current participants before update:',
          currentLobby?.participants
        );

        // Get the status from either 'status' or 'action' field
        const responseStatus = data.status || data.action;
        if (!responseStatus) {
          console.error('No status or action in invitation response');
          return;
        }

        // Update the invitation status
        updateInvitationResponse(data.userId, responseStatus);

        // If someone accepted, update their participant info with character name
        if (responseStatus === 'accepted') {
          // For cooperative quests, we're already in the right lobby since we're subscribed to it
          updateParticipant(data.userId, {
            username: data.characterName || data.username || data.userId,
            invitationStatus: 'accepted',
            joinedAt: new Date(),
          });

          // Check if this was the last pending invitation
          setTimeout(() => {
            const updatedLobby =
              useCooperativeLobbyStore.getState().currentLobby;
            if (updatedLobby) {
              const pendingCount = updatedLobby.participants.filter(
                (p) => p.invitationStatus === 'pending'
              ).length;
              const acceptedCount = updatedLobby.participants.filter(
                (p) => p.invitationStatus === 'accepted'
              ).length;

              console.log(
                `After invitation response - pending: ${pendingCount}, accepted: ${acceptedCount}`
              );

              // If no more pending and we have multiple accepted participants, transition
              if (pendingCount === 0 && acceptedCount > 1) {
                console.log(
                  'All responded with multiple participants - transitioning to ready screen'
                );
                setHasTransitioned(true);
              }
            }
          }, 100);
        } else if (responseStatus === 'declined') {
          updateInvitationResponse(data.userId, 'declined');
        }
      };

      const handleReadyStatus = (data: LobbyReadyStatusPayload) => {
        console.log('Ready status update:', data);
        markUserReady(data.userId, data.isReady);
      };

      // Remove quest created handler - this is now handled in the ready screen

      on('lobby:participant-joined', handleParticipantJoined);
      on('lobby:participant-updated', handleParticipantUpdated);
      on('lobby:invitation-response', handleInvitationResponse);
      on('invitation:response', handleInvitationResponse); // Server might emit this instead
      on('lobby:ready-status', handleReadyStatus);

      return () => {
        emit('lobby:leave', { lobbyId });
        off('lobby:joined', handleLobbyJoined);
        off('lobby:participant-joined', handleParticipantJoined);
        off('lobby:participant-updated', handleParticipantUpdated);
        off('lobby:invitation-response', handleInvitationResponse);
        off('invitation:response', handleInvitationResponse);
        off('lobby:ready-status', handleReadyStatus);
      };
    }
  }, [
    lobbyId,
    emit,
    on,
    off,
    joinLobby,
    updateInvitationResponse,
    markUserReady,
    updateParticipant,
  ]);

  // Calculate derived state before any conditional returns
  const currentParticipant = currentLobby?.participants.find(
    (p) => p.id === currentUser?.id
  );
  const isCreator = currentParticipant?.isCreator || false;
  const hasAccepted = currentParticipant?.invitationStatus === 'accepted';
  const isReady = currentParticipant?.isReady || false;

  // Check if all invited have responded
  const allResponded = currentLobby?.participants.every(
    (p) => p.invitationStatus !== 'pending'
  ) || false;
  const acceptedParticipants = currentLobby?.participants.filter(
    (p) => p.invitationStatus === 'accepted'
  ) || [];

  const allReady =
    acceptedParticipants.length > 0 &&
    acceptedParticipants.every((p) => p.isReady);

  // All hooks must be called before any conditional returns
  useEffect(() => {
    let timer: NodeJS.Timeout | undefined;
    
    if (hasTransitioned && currentLobby) {
      // Navigate after the flag is set
      console.log('Transitioning to ready screen...');
      timer = setTimeout(() => {
        router.replace('/cooperative-quest-ready');
      }, 1500);
    }
    
    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [hasTransitioned, currentLobby, router]);

  useEffect(() => {
    if (allResponded && acceptedParticipants.length > 1 && !hasTransitioned) {
      // Set the flag to trigger navigation
      setHasTransitioned(true);
    }
  }, [allResponded, acceptedParticipants.length, hasTransitioned]);

  // Define callbacks - ensure all are properly memoized
  const handleBackPress = useCallback(() => {
    const handleLeave = () => {
      // Track the quit event
      posthog.capture('cooperative_quest_quit_before_start');

      // Emit leave event to notify other participants
      if (currentLobby?.lobbyId && currentUser?.id) {
        emit('lobby:leave', {
          lobbyId: currentLobby.lobbyId,
          userId: currentUser.id,
        });
      }

      // Clear local lobby state
      leaveLobby();

      // Clear any cooperative quest run data
      const questStore = useQuestStore.getState();
      questStore.setCooperativeQuestRun(null);

      // Navigate back
      router.back();
    };

    if (isCreator) {
      Alert.alert(
        'Leave Quest Lobby?',
        'As the quest creator, leaving will cancel the quest for all participants. Are you sure?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Leave',
            style: 'destructive',
            onPress: handleLeave,
          },
        ]
      );
    } else if (hasAccepted) {
      Alert.alert(
        'Leave Quest Lobby?',
        "You've already accepted this quest invitation. Are you sure you want to leave?",
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Leave',
            style: 'destructive',
            onPress: handleLeave,
          },
        ]
      );
    } else {
      // If they haven't accepted yet, just leave without confirmation
      handleLeave();
    }
  }, [
    currentLobby,
    currentUser,
    emit,
    leaveLobby,
    isCreator,
    hasAccepted,
    router,
  ]);

  const handleAcceptDecline = useCallback(
    async (accept: boolean) => {
      if (!invitationId || !currentUser) return;

      try {
      await invitationApi.respondToInvitation(
        invitationId,
        accept ? 'accepted' : 'declined'
      );
      updateInvitationResponse(
        currentUser!.id,
        accept ? 'accepted' : 'declined'
      );

      if (!accept) {
        // Clear lobby state when declining
        leaveLobby();
        router.back();
      }
      } catch (error) {
        console.error('Error responding to invitation:', error);
      }
    },
    [invitationId, currentUser, updateInvitationResponse, leaveLobby, router]
  );

  const handleReadyToggle = useCallback(() => {
    if (!currentUser || !currentLobby) return;

    const newReadyState = !isReady;

    posthog.capture(
      newReadyState
        ? 'cooperative_quest_ready_clicked'
        : 'cooperative_quest_unready_clicked'
    );

    emit(newReadyState ? 'lobby:ready' : 'lobby:unready', { lobbyId });
    markUserReady(currentUser.id, newReadyState);
  }, [currentUser, currentLobby, isReady, emit, lobbyId, markUserReady, posthog]);

  const handleStartNow = useCallback(async () => {
    if (!isCreator) return;

    try {
      // Navigate to ready screen for all accepted participants
      router.replace('/cooperative-quest-ready');
    } catch (error) {
      console.error('Error starting quest:', error);
    }
  }, [isCreator, router]);

  // Show loading only during initial load
  if (isLoading && !currentLobby) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" />
        <Text className="mt-4">Loading lobby...</Text>
      </SafeAreaView>
    );
  }

  if (!currentLobby || !currentUser) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center">
        <Text>Error: Lobby not found</Text>
      </SafeAreaView>
    );
  }

  console.log('Current lobby participants:', currentLobby.participants);

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
      <FocusAwareStatusBar />

      {/* Header */}
      <View className="border-b px-5 pb-4" style={{ borderBottomColor: colors.neutral[200] }}>
        <View className="flex-row items-center justify-between">
          <TouchableOpacity onPress={handleBackPress}>
            <ArrowLeft size={24} color={colors.black} />
          </TouchableOpacity>
          <Text className="text-lg font-semibold" style={{ fontWeight: '700' }}>Quest Lobby</Text>
          <View className="w-6" />
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="p-5">
          {/* Quest Info */}
          <View className="mb-6 rounded-lg p-4" style={{ backgroundColor: colors.cardBackground }}>
            <Text className="mb-2 text-xl font-bold" style={{ fontWeight: '700' }}>
              {currentLobby.questTitle}
            </Text>
            <View className="flex-row items-center">
              <Clock size={16} color={colors.neutral[400]} />
              <Text className="ml-1 text-sm" style={{ color: colors.neutral[500] }}>
                {currentLobby.questDuration} minutes
              </Text>
            </View>
          </View>

          {/* Participants */}
          <Text className="mb-3 text-lg font-semibold" style={{ fontWeight: '700' }}>Participants</Text>
          {currentLobby.participants.map((participant) => (
            <ParticipantRow
              key={participant.id}
              participant={participant}
              isCurrentUser={participant.id === currentUser.id}
            />
          ))}

          {/* Status Messages */}
          {!allResponded && (
            <View className="mt-4 rounded-lg p-4" style={{ backgroundColor: colors.secondary[100] }}>
              <Text className="text-sm" style={{ color: colors.secondary[500] }}>
                Waiting for all invitations to be responded to...
              </Text>
            </View>
          )}

          {allResponded && !allReady && acceptedParticipants.length > 0 && (
            <InfoCard
              title="How Cooperative Quests Work"
              description="All participants must keep their phones locked for the entire duration. If anyone unlocks early, everyone fails together!"
              variant="solid"
            />
          )}

          {allReady && (
            <View className="mt-4 rounded-lg p-4" style={{ backgroundColor: colors.primary[100] }}>
              <Text className="text-base font-semibold" style={{ color: colors.primary[500], fontWeight: '700' }}>
                All players ready! Quest will start soon...
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View className="border-t p-5" style={{ borderTopColor: colors.neutral[200] }}>
        {!hasAccepted && currentParticipant?.invitationStatus === 'pending' && (
          <View className="flex-row gap-3">
            <Button
              label="Decline"
              onPress={() => handleAcceptDecline(false)}
              className="flex-1 rounded-lg bg-neutral-300"
              textClassName="text-neutral-700 font-bold"
            />
            <Button
              label="Accept"
              onPress={() => handleAcceptDecline(true)}
              className="flex-1 rounded-lg bg-primary-400"
              textClassName="text-white font-bold"
            />
          </View>
        )}

        {isCreator && acceptedParticipants.length > 0 && !allResponded && (
          <Button
            label="Start Now (Skip waiting for remaining invites)"
            onPress={handleStartNow}
            className="rounded-lg bg-secondary-400"
            textClassName="text-white font-bold"
          />
        )}

        {allResponded && acceptedParticipants.length > 1 && (
          <View className="rounded-lg p-4" style={{ backgroundColor: colors.primary[100] }}>
            <Text className="text-center text-base font-semibold" style={{ color: colors.primary[500], fontWeight: '700' }}>
              All players have responded! Preparing to start quest...
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
