import { Search, X } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, TextInput } from 'react-native';

import CHARACTERS from '@/app/data/characters';
import { Pressable, ScrollView, Text, View } from '@/components/ui';
import { Checkbox } from '@/components/ui/checkbox';
import { useFriendManagement } from '@/lib/hooks/use-friend-management';
import { useUserStore } from '@/store/user-store';

interface FriendSelectorProps {
  onSelectionChange: (selectedIds: string[], selectedFriends?: any[]) => void;
  maxSelections?: number;
}

export function FriendSelector({
  onSelectionChange,
  maxSelections = 5,
}: FriendSelectorProps) {
  const [selectedFriends, setSelectedFriends] = useState<Set<string>>(
    new Set()
  );
  const [searchQuery, setSearchQuery] = useState('');
  const user = useUserStore((state) => state.user);
  const userEmail = user?.email || '';

  const { friendsData, isLoadingFriends } = useFriendManagement(userEmail);

  const friends = friendsData?.friends || [];

  // Sort friends alphabetically by character name
  const sortedFriends = [...friends].sort((a, b) => {
    const nameA = a?.character?.name || a?.displayName || a?.email || '';
    const nameB = b?.character?.name || b?.displayName || b?.email || '';
    return nameA.localeCompare(nameB);
  });

  // Filter friends based on search query
  const filteredFriends = sortedFriends.filter((friend) => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    const name =
      friend?.character?.name || friend?.displayName || friend?.email || '';
    const type = friend?.character?.type || '';
    return (
      name.toLowerCase().includes(searchLower) ||
      type.toLowerCase().includes(searchLower)
    );
  });

  // Determine which friends to display
  const displayedFriends = searchQuery
    ? filteredFriends
    : filteredFriends.slice(0, 5);

  useEffect(() => {
    const selectedIds = Array.from(selectedFriends);
    const selectedFriendData = friends.filter((friend) => {
      const friendId = friend.userId || friend.id || friend._id || friend.email;
      return selectedIds.includes(friendId);
    });
    onSelectionChange(selectedIds, selectedFriendData);
  }, [selectedFriends, friends]); // Removed onSelectionChange from dependencies

  const toggleFriend = (friendId: string) => {
    const newSelection = new Set(selectedFriends);
    if (newSelection.has(friendId)) {
      newSelection.delete(friendId);
    } else if (newSelection.size < maxSelections) {
      newSelection.add(friendId);
    }
    setSelectedFriends(newSelection);
  };

  if (isLoadingFriends) {
    return (
      <View className="py-4">
        <ActivityIndicator />
      </View>
    );
  }

  if (friends.length === 0) {
    return (
      <View className="py-4">
        <Text className="text-center text-gray-500">
          No friends to invite. Add friends from your profile to invite them to
          quests!
        </Text>
      </View>
    );
  }

  return (
    <View className="mt-4">
      <View className="mb-2 flex-row items-center justify-between">
        <Text className="text-base font-medium">Invite Friends</Text>
        {selectedFriends.size > 0 && (
          <Text className="text-sm text-gray-500">
            {selectedFriends.size} selected
          </Text>
        )}
      </View>

      {/* Search Bar */}
      <View className="mb-2 flex-row items-center rounded-lg border border-gray-200 px-3 py-2">
        <Search size={20} color="#9CA3AF" />
        <TextInput
          className="ml-2 flex-1 text-base"
          placeholder="Search friends..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#9CA3AF"
        />
        {searchQuery.length > 0 && (
          <Pressable onPress={() => setSearchQuery('')} className="ml-2">
            <X size={20} color="#9CA3AF" />
          </Pressable>
        )}
      </View>

      {/* Results count */}
      {searchQuery && (
        <Text className="mb-2 text-sm text-gray-500">
          {filteredFriends.length} result
          {filteredFriends.length !== 1 ? 's' : ''}
        </Text>
      )}

      <ScrollView
        className="max-h-48 rounded-lg border border-gray-200"
        showsVerticalScrollIndicator={true}
      >
        {displayedFriends.length === 0 ? (
          <View className="p-4">
            <Text className="text-center text-gray-500">
              {searchQuery ? 'No friends found' : 'No friends to display'}
            </Text>
          </View>
        ) : (
          displayedFriends.map((friend, index) => {
            if (!friend) {
              return null;
            }

            // Use the userId field from the friend object, not _id
            const friendId =
              friend.userId || friend.id || friend._id || friend.email;
            if (!friendId) {
              console.warn('Friend has no valid ID:', friend);
              return null;
            }

            return (
              <Pressable
                key={friendId}
                onPress={() => toggleFriend(friendId)}
                className="flex-row items-center border-b border-gray-100 px-4 py-3"
              >
                <Checkbox
                  checked={selectedFriends.has(friendId)}
                  onChange={() => toggleFriend(friendId)}
                  disabled={
                    !selectedFriends.has(friendId) &&
                    selectedFriends.size >= maxSelections
                  }
                  accessibilityLabel={`Select ${friend?.character?.name || friend?.email || 'friend'}`}
                />
                <View className="ml-3 flex-1">
                  <Text className="text-base font-medium">
                    {friend?.character?.name ||
                      friend?.displayName ||
                      friend?.email ||
                      'Unknown'}
                  </Text>
                  <Text className="text-sm text-gray-500">
                    {friend?.character?.type || 'Friend'}
                  </Text>
                </View>
                {(() => {
                  const character = CHARACTERS.find(
                    (c) => c.id === friend?.character?.type
                  );
                  return character ? (
                    <Image
                      source={character.profileImage}
                      className="size-10 rounded-full"
                    />
                  ) : (
                    <View className="size-10 items-center justify-center rounded-full bg-gray-200">
                      <Text className="text-xl">
                        {friend?.character?.type?.charAt(0).toUpperCase() ||
                          '?'}
                      </Text>
                    </View>
                  );
                })()}
              </Pressable>
            );
          })
        )}
      </ScrollView>

      {selectedFriends.size >= maxSelections && (
        <Text className="mt-2 text-xs text-gray-500">
          Maximum {maxSelections} friends can be invited
        </Text>
      )}
    </View>
  );
}
