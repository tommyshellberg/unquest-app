import { useRouter } from 'expo-router';
import { Info } from 'lucide-react-native';
import { usePostHog } from 'posthog-react-native';
import React, { useEffect, useState } from 'react';

import { cooperativeQuestApi } from '@/api/cooperative-quest';
import { CombinedQuestInput } from '@/components/QuestForm/combined-quest-input';
import { FriendSelector } from '@/components/QuestForm/friend-selector';
import {
  Button,
  FocusAwareStatusBar,
  SafeAreaView,
  ScrollView,
  Text,
  View,
  ScreenContainer,
  ScreenHeader,
  TouchableOpacity,
} from '@/components/ui';
import { useCooperativeLobbyStore } from '@/store/cooperative-lobby-store';
import { useUserStore } from '@/store/user-store';

export default function CreateCooperativeQuestScreen() {
  const router = useRouter();
  const [questName, setQuestName] = useState('');
  const [questDuration, setQuestDuration] = useState(30);
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [selectedFriendData, setSelectedFriendData] = useState<any[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const posthog = usePostHog();
  const createLobby = useCooperativeLobbyStore((state) => state.createLobby);
  const leaveLobby = useCooperativeLobbyStore((state) => state.leaveLobby);
  const currentUser = useUserStore((state) => state.user);

  useEffect(() => {
    posthog.capture('open_create_cooperative_quest_screen');
    // Clear any existing lobby state when opening create screen
    leaveLobby();
  }, [posthog]);

  const canCreate = questName.trim().length > 0 && selectedFriends.length > 0;

  const handleCreate = async () => {
    if (!canCreate || !currentUser) return;

    setIsCreating(true);
    posthog.capture('trigger_create_cooperative_quest');

    try {
      // Call the new API endpoint to initialize the cooperative quest
      const response = await cooperativeQuestApi.initializeCooperativeQuest({
        title: questName.trim(),
        duration: questDuration,
        inviteeIds: selectedFriends, // Changed from 'invitees' to 'inviteeIds'
        questData: {
          category: 'social', // Cooperative quests are social by nature
          // Removed reward field - server will calculate this
        },
      });

      // Create the lobby in local state
      const lobby = {
        lobbyId: response.lobbyId,
        questTitle: questName.trim(),
        questDuration: questDuration,
        creatorId: currentUser.id,
        participants: [
          {
            id: currentUser.id,
            username: currentUser.character?.name || 'You',
            invitationStatus: 'accepted' as const,
            isReady: false,
            isCreator: true,
            joinedAt: new Date(),
          },
          ...selectedFriends.map((friendId) => {
            const friendData = selectedFriendData.find(
              (f) =>
                f._id === friendId || f.userId === friendId || f.id === friendId
            );
            return {
              id: friendId,
              username:
                friendData?.character?.name ||
                friendData?.displayName ||
                'Friend',
              invitationStatus: 'pending' as const,
              isReady: false,
              isCreator: false,
            };
          }),
        ],
        status: 'waiting' as const,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
        questData: {
          title: questName.trim(),
          duration: questDuration,
          category: 'social',
          // Note: reward will be calculated by server when quest is created
        },
      };

      createLobby(lobby);
      posthog.capture('cooperative_quest_invitation_created');

      // Navigate to the lobby
      router.replace(`/cooperative-quest-lobby/${response.lobbyId}`);
    } catch (error) {
      console.error('Error creating cooperative quest:', error);
      // TODO: Show error toast
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <FocusAwareStatusBar />

      {/* Header */}
      <View className="border-b border-neutral-200 px-5 py-4">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity onPress={() => router.back()}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#333" />
          </TouchableOpacity>
          <Text className="text-lg font-semibold">
            Create Cooperative Quest
          </Text>
          <View className="w-6" />
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="p-5">
          {/* Info Card */}
          <View className="mb-6 rounded-lg bg-primary-100 p-4">
            <View className="flex-row items-start">
              <Info size={20} color="#7C3AED" style={{ marginTop: 2 }} />
              <View className="ml-3 flex-1">
                <Text className="mb-1 font-semibold text-primary-600">
                  Team Challenge
                </Text>
                <Text className="text-sm text-primary-600">
                  All participants must keep their phones locked for the entire
                  duration. If anyone unlocks early, everyone fails together!
                </Text>
              </View>
            </View>
          </View>

          {/* Quest Name and Duration */}
          <CombinedQuestInput
            initialQuestName={questName}
            initialDuration={questDuration}
            onQuestNameChange={setQuestName}
            onDurationChange={setQuestDuration}
          />

          {/* Friend Selection */}
          <View className="mt-6">
            <Text className="mb-3 text-lg font-semibold">Invite Friends</Text>
            <Text className="mb-4 text-sm text-neutral-600">
              Select friends to join your quest. You need at least one friend to
              start a cooperative quest.
            </Text>
            <FriendSelector
              onSelectionChange={(ids, friendData) => {
                setSelectedFriends(ids);
                setSelectedFriendData(friendData || []);
              }}
            />
          </View>

          {/* Selected Friends Count */}
          {selectedFriends.length > 0 && (
            <View className="mt-4 flex-row items-center">
              <MaterialCommunityIcons
                name="account-group"
                size={20}
                color="#666"
              />
              <Text className="ml-2 text-sm text-neutral-600">
                {selectedFriends.length} friend
                {selectedFriends.length > 1 ? 's' : ''} selected
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Create Button */}
      <View className="border-t border-neutral-200 p-5">
        <Button
          label={isCreating ? 'Creating...' : 'Create Quest'}
          onPress={handleCreate}
          disabled={!canCreate || isCreating}
          className={`rounded-lg ${canCreate && !isCreating ? 'bg-primary-400' : 'bg-neutral-300'}`}
          textClassName="text-white font-bold text-lg"
        />
      </View>
    </SafeAreaView>
  );
}
