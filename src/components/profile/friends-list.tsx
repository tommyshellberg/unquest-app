import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Pressable } from 'react-native';

import { Button, Card, Text, View } from '@/components/ui';

import { FriendItem } from './friend-item';
import { InvitationItem } from './invitation-item';

type FriendsListProps = {
  combinedData: any[];
  isLoading: boolean;
  onInvite: () => void;
  onDelete: (friend: any) => void;
  onRescind: (invitation: any) => void;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
  isOutgoingInvitation: (invitation: any) => boolean;
  acceptMutation: any;
  rejectMutation: any;
  rescindMutation: any;
  userEmail: string;
};

export function FriendsList({
  combinedData,
  isLoading,
  onInvite,
  onDelete,
  onRescind,
  onAccept,
  onReject,
  isOutgoingInvitation,
  acceptMutation,
  rejectMutation,
  rescindMutation,
  userEmail,
}: FriendsListProps) {
  return (
    <View className="mx-4 mb-20 mt-4">
      <View className="flex-row items-center justify-between">
        <Text className="font-bold">Friends</Text>
        <Pressable className="flex-row items-center" onPress={onInvite}>
          <Feather name="plus" size={16} color="#334738" />
          <Text className="ml-1 text-teal-800">Invite</Text>
        </Pressable>
      </View>

      <View className="mt-2">
        {combinedData.map((item) => {
          if (item.type === 'friend') {
            return (
              <FriendItem
                key={item.id}
                friend={item.data}
                onDelete={onDelete}
              />
            );
          } else if (item.type === 'invitation') {
            return (
              <InvitationItem
                key={item.id}
                invitation={item.data}
                outgoing={item.outgoing}
                isOutgoingInvitation={isOutgoingInvitation}
                onAccept={onAccept}
                onReject={onReject}
                onRescind={onRescind}
                acceptMutation={acceptMutation}
                rejectMutation={rejectMutation}
                rescindMutation={rescindMutation}
                userEmail={userEmail}
              />
            );
          }
          return null;
        })}

        {combinedData.length === 0 && !isLoading && (
          <Card className="items-center p-5">
            <Text className="mb-3 text-center text-gray-600">
              Don't see someone you want to connect with?
            </Text>
            <Button
              label="Invite friends"
              onPress={onInvite}
              className="bg-teal-700"
            />
          </Card>
        )}

        {isLoading && (
          <View className="items-center py-4">
            <Text>Loading...</Text>
          </View>
        )}
      </View>
    </View>
  );
}
