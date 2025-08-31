import { useRouter } from 'expo-router';
import { ArrowLeft, Check, Circle, Clock } from 'lucide-react-native';
import { usePostHog } from 'posthog-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, TouchableOpacity } from 'react-native';

import { useWebSocket } from '@/components/providers/websocket-provider';
import {
  Button,
  FocusAwareStatusBar,
  ScrollView,
  Text,
  View,
} from '@/components/ui';
import colors from '@/components/ui/colors';
import { InfoCard } from '@/components/ui/info-card';
import QuestTimer from '@/lib/services/quest-timer';
import type { LobbyReadyStatusPayload } from '@/lib/services/websocket-events.types';
import { useCooperativeLobbyStore } from '@/store/cooperative-lobby-store';
import { useQuestStore } from '@/store/quest-store';
import type { CustomQuestTemplate } from '@/store/types';
import { useUserStore } from '@/store/user-store';

interface ParticipantReadyRowProps {
  participant: any;
  isCurrentUser: boolean;
}

function ParticipantReadyRow({
  participant,
  isCurrentUser,
}: ParticipantReadyRowProps) {
  const getStatusIcon = () => {
    if (participant.isReady) {
      return <Check size={20} color={colors.primary[400]} />;
    }
    return <Circle size={20} color={colors.neutral[400]} />;
  };

  return (
    <View
      className="mb-3 flex-row items-center rounded-lg p-4"
      style={{ backgroundColor: colors.cardBackground }}
    >
      <View className="mr-3">{getStatusIcon()}</View>
      <View className="flex-1">
        <Text className="font-semibold" style={{ fontWeight: '700' }}>
          {participant.username} {isCurrentUser && '(You)'}
        </Text>
        <Text className="text-sm" style={{ color: colors.neutral[500] }}>
          {participant.isReady ? 'Ready!' : 'Not ready yet'}
        </Text>
      </View>
    </View>
  );
}

export default function CooperativeQuestReady() {
  const router = useRouter();
  const posthog = usePostHog();
  const currentUser = useUserStore((state) => state.user);
  const currentLobby = useCooperativeLobbyStore((state) => state.currentLobby);
  const leaveLobby = useCooperativeLobbyStore((state) => state.leaveLobby);
  const markUserReady = useCooperativeLobbyStore(
    (state) => state.markUserReady
  );
  const updateLobbyStatus = useCooperativeLobbyStore(
    (state) => state.updateLobbyStatus
  );
  const updateParticipant = useCooperativeLobbyStore(
    (state) => state.updateParticipant
  );
  const setCountdown = useCooperativeLobbyStore((state) => state.setCountdown);
  const countdownSeconds = useCooperativeLobbyStore(
    (state) => state.countdownSeconds
  );
  const prepareQuest = useQuestStore((state) => state.prepareQuest);

  const { emit, on, off } = useWebSocket();
  const [isLoading, setIsLoading] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);

  useEffect(() => {
    if (!currentLobby) {
      router.replace('/');
      return;
    }

    // Prevent multiple joins
    if (hasJoined) {
      return;
    }

    // Join the lobby room to receive updates
    console.log('Ready screen joining lobby:', currentLobby.lobbyId);
    emit('lobby:join', { lobbyId: currentLobby.lobbyId });
    setHasJoined(true);

    // Listen for lobby joined event to get latest participant data
    const handleLobbyJoined = (data: any) => {
      console.log('Ready screen - lobby joined data:', data);
      if (data.lobbyId === currentLobby.lobbyId && data.participants) {
        // Update participant names and ready states from server
        data.participants.forEach((p: any) => {
          updateParticipant(p.userId, {
            username: p.characterName || p.username || p.userId,
          });
          // Also update ready state from server data
          if (p.ready !== undefined) {
            markUserReady(p.userId, p.ready);
          }
        });
      }
    };

    // Listen for ready status updates
    const handleReadyStatus = (data: LobbyReadyStatusPayload) => {
      console.log('Ready status update:', data);
      markUserReady(data.userId, data.isReady);
    };

    // Listen for participant ready events (server sends these)
    const handleParticipantReady = (data: any) => {
      console.log('Participant ready event:', data);
      if (data.userId && data.participant) {
        markUserReady(data.userId, data.participant.ready || false);
      }
    };

    // Listen for all participants ready event
    const handleAllReady = (data: any) => {
      console.log('All participants ready:', data);
      if (data.allReady && data.lobbyId === currentLobby.lobbyId) {
        updateLobbyStatus('ready');
      }
    };

    // Listen for quest created event
    const handleQuestCreated = async (data: any) => {
      console.log('Quest created event received:', data);
      // Server sends { questRun, startCountdown }
      if (data.questRun && data.startCountdown) {
        handleQuestCreatedResponse(data.questRun);
      }
    };

    on('lobby:joined', handleLobbyJoined);
    on('lobby:ready-status', handleReadyStatus);
    on('lobby:participant-ready', handleParticipantReady);
    on('lobby:all-participants-ready', handleAllReady);
    on('lobby:quest-created', handleQuestCreated);

    return () => {
      if (currentLobby?.lobbyId) {
        emit('lobby:leave', { lobbyId: currentLobby.lobbyId });
      }
      off('lobby:joined', handleLobbyJoined);
      off('lobby:ready-status', handleReadyStatus);
      off('lobby:participant-ready', handleParticipantReady);
      off('lobby:all-participants-ready', handleAllReady);
      off('lobby:quest-created', handleQuestCreated);
      setHasJoined(false);
    };
  }, [
    currentLobby?.lobbyId, // Only depend on lobbyId, not the whole object
    emit,
    on,
    off,
    router,
  ]);

  if (!currentLobby || !currentUser) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const currentParticipant = currentLobby.participants.find(
    (p) => p.id === currentUser.id
  );
  const isReady = currentParticipant?.isReady || false;
  const acceptedParticipants = currentLobby.participants.filter(
    (p) => p.invitationStatus === 'accepted'
  );
  const allReady = acceptedParticipants.every((p) => p.isReady);
  const isCreator = currentParticipant?.isCreator || false;

  // Define the quest created handler
  const handleQuestCreatedResponse = useCallback(
    async (questRun: any) => {
      console.log('Quest created, preparing quest:', questRun);

      // Transform questRun data to match CustomQuestTemplate format
      const questId =
        questRun.questId || questRun._id || questRun.id || `coop-${Date.now()}`;
      console.log(
        'Creating quest template with ID:',
        questId,
        'from questRun:',
        questRun
      );

      const questTemplate: CustomQuestTemplate = {
        id: questId,
        title:
          questRun.title || questRun.quest?.title || currentLobby.questTitle,
        durationMinutes:
          questRun.durationMinutes ||
          questRun.quest?.durationMinutes ||
          currentLobby.questDuration,
        reward: questRun.reward ||
          questRun.quest?.reward || { xp: currentLobby.questDuration * 10 },
        mode: 'custom',
        category: 'cooperative',
        // Don't include inviteeIds in the template - the server already created the quest
        // with all participants. Including inviteeIds would trigger a new quest creation
      };

      // Get the quest run ID from the server response
      const questRunId = questRun.id || questRun._id;
      if (!questRunId) {
        console.error(
          '[CooperativeQuestReady] No quest run ID in server response:',
          questRun
        );
        throw new Error('Server did not provide quest run ID');
      }

      // Store the full questRun data in the quest store for cooperative features
      const questStore = useQuestStore.getState();

      // Ensure the cooperative quest run is set with the server-created quest run
      const cooperativeQuestRunData = {
        id: questRunId,
        questId: questId,
        hostId: questRun.hostId || questRun.creatorId,
        status: questRun.status || 'pending',
        participants: questRun.participants || [],
        invitationId: questRun.invitationId,
        actualStartTime: questRun.actualStartTime,
        scheduledEndTime: questRun.scheduledEndTime,
        createdAt: questRun.createdAt || Date.now(),
        updatedAt: questRun.updatedAt || Date.now(),
      };

      console.log(
        '[CooperativeQuestReady] Setting cooperative quest run:',
        cooperativeQuestRunData
      );
      questStore.setCooperativeQuestRun(cooperativeQuestRunData);

      // Prepare quest with transformed data
      prepareQuest(questTemplate);

      // For cooperative quests, pass the quest run ID directly to avoid race conditions
      await QuestTimer.prepareQuest(questTemplate, questRunId);

      // Navigate to cooperative pending quest which will show the countdown
      router.replace('/cooperative-pending-quest');
    },
    [currentLobby, prepareQuest, router]
  );

  // When all are ready, creator should create the quest
  useEffect(() => {
    if (allReady && isCreator && currentLobby?.lobbyId) {
      // Small delay to ensure everyone sees the "all ready" state
      const timer = setTimeout(() => {
        console.log('Creating cooperative quest as creator via WebSocket...');
        // Send WebSocket event to create quest, server will emit lobby:quest-created to all
        emit('lobby:create-quest', {
          lobbyId: currentLobby.lobbyId,
          forceStart: false,
        });
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [allReady, isCreator, currentLobby?.lobbyId, emit]);

  const handleBackPress = useCallback(() => {
    const handleLeave = () => {
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

    Alert.alert(
      'Leave Quest?',
      'Are you sure you want to leave? The quest will start soon!',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: handleLeave,
        },
      ]
    );
  }, [currentLobby, currentUser, emit, leaveLobby, router]);

  const handleReadyToggle = () => {
    if (!currentUser || !currentLobby) return;

    setIsLoading(true);
    const newReadyState = !isReady;

    posthog.capture(
      newReadyState
        ? 'cooperative_quest_ready_clicked'
        : 'cooperative_quest_unready_clicked'
    );

    emit(newReadyState ? 'lobby:ready' : 'lobby:unready', {
      lobbyId: currentLobby.lobbyId,
    });
    markUserReady(currentUser.id, newReadyState);
    setIsLoading(false);
  };

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <FocusAwareStatusBar />

      {/* Header */}
      <View
        className="border-b px-5 pb-4"
        style={{ borderBottomColor: colors.neutral[200] }}
      >
        <View className="flex-row items-center justify-between">
          <TouchableOpacity onPress={handleBackPress}>
            <ArrowLeft size={24} color={colors.black} />
          </TouchableOpacity>
          <Text className="text-lg font-semibold" style={{ fontWeight: '700' }}>
            Get Ready
          </Text>
          <View className="w-6" />
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="p-5">
          {/* Quest Info */}
          <View
            className="mb-6 rounded-lg p-4"
            style={{ backgroundColor: colors.cardBackground }}
          >
            <Text
              className="mb-2 text-xl font-bold"
              style={{ fontWeight: '700' }}
            >
              {currentLobby.questTitle}
            </Text>
            <View className="flex-row items-center">
              <Clock size={16} color={colors.neutral[400]} />
              <Text
                className="ml-1 text-sm"
                style={{ color: colors.neutral[500] }}
              >
                {currentLobby.questDuration} minutes
              </Text>
            </View>
          </View>

          {/* Instructions */}
          <InfoCard
            title="Ready to start?"
            description="Mark yourself as ready below. Once all players are ready, a countdown will begin. The quest begins when everyone's phone is locked!"
          />

          {/* Participants Ready Status */}
          <Text
            className="mb-3 mt-6 text-lg font-semibold"
            style={{ fontWeight: '700' }}
          >
            Ready Status
          </Text>
          {acceptedParticipants.map((participant) => (
            <ParticipantReadyRow
              key={participant.id}
              participant={participant}
              isCurrentUser={participant.id === currentUser.id}
            />
          ))}

          {allReady && (
            <View
              className="mt-4 rounded-lg p-4"
              style={{ backgroundColor: colors.primary[100] }}
            >
              <Text
                className="text-center text-base font-semibold"
                style={{ color: colors.primary[500], fontWeight: '700' }}
              >
                All players ready! Quest starting soon...
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Ready Button */}
      <View
        className="border-t p-5"
        style={{ borderTopColor: colors.neutral[200] }}
      >
        <Button
          label={isReady ? 'Not Ready' : "I'm Ready!"}
          onPress={handleReadyToggle}
          disabled={isLoading}
          className={`rounded-lg ${isReady ? 'bg-red-300' : 'bg-primary-400'}`}
          textClassName={`font-bold text-lg ${isReady ? 'text-neutral-700' : 'text-white'}`}
        />
      </View>
    </View>
  );
}
