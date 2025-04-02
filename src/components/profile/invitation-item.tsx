import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Image, Pressable } from 'react-native';

import { getCharacterAvatar } from '@/../utils/character-utils';
import { Card, Text, View } from '@/components/ui';

type InvitationItemProps = {
  invitation: any;
  outgoing?: boolean;
  isOutgoingInvitation: (invitation: any) => boolean;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
  onRescind: (invitation: any) => void;
  acceptMutation: any;
  rejectMutation: any;
  rescindMutation: any;
  userEmail: string;
};

export function InvitationItem({
  invitation,
  outgoing,
  isOutgoingInvitation,
  onAccept,
  onReject,
  onRescind,
  acceptMutation,
  rejectMutation,
  rescindMutation,
}: InvitationItemProps) {
  const isOutgoing = outgoing || isOutgoingInvitation(invitation);
  const userToShow = isOutgoing
    ? invitation.recipientUser || {
        email: invitation.recipient,
        character: null,
      }
    : invitation.sender;

  const isAccepting =
    acceptMutation.isPending && acceptMutation.variables === invitation.id;
  const isRejecting =
    rejectMutation.isPending && rejectMutation.variables === invitation.id;
  const isRescinding =
    rescindMutation.isPending && rescindMutation.variables === invitation.id;
  const isProcessing = isAccepting || isRejecting || isRescinding;

  return (
    <Card className="mb-2 flex-row items-center p-3">
      <View className="relative">
        <Image
          source={getCharacterAvatar(userToShow.character?.type)}
          className="size-10 rounded-full"
        />
        <View className="absolute -right-1 -top-1 size-2.5 rounded-full border border-white bg-yellow-400" />
      </View>

      <View className="ml-3 flex-1">
        <Text className="font-bold">
          {userToShow.character?.name || 'Unknown'}
        </Text>
        <Text className="text-gray-600">
          {userToShow.character?.type ||
            (isOutgoing ? invitation.recipient : userToShow.email)}
        </Text>
      </View>

      {isOutgoing ? (
        <View className="flex-row items-center space-x-2">
          <View className="rounded-full bg-gray-200 px-2 py-1">
            <Text className="text-xs font-bold text-gray-600">Invited</Text>
          </View>

          <Pressable
            className="size-8 items-center justify-center rounded-full bg-red-500"
            onPress={() => onRescind(invitation)}
            disabled={isProcessing}
          >
            <Feather name="x" size={16} color="white" />
          </Pressable>
        </View>
      ) : (
        <View className="flex-row items-center space-x-2">
          <Pressable
            className="size-8 items-center justify-center rounded-full bg-red-500"
            onPress={() => onReject(invitation.id)}
            disabled={isProcessing}
          >
            {isRejecting ? (
              <View className="size-4 animate-spin rounded-full border-2 border-white" />
            ) : (
              <Feather name="x" size={16} color="white" />
            )}
          </Pressable>

          <Pressable
            className="size-8 items-center justify-center rounded-full bg-teal-700"
            onPress={() => onAccept(invitation.id)}
            disabled={isProcessing}
          >
            {isAccepting ? (
              <View className="size-4 animate-spin rounded-full border-2 border-white" />
            ) : (
              <Feather name="check" size={16} color="white" />
            )}
          </Pressable>
        </View>
      )}
    </Card>
  );
}
