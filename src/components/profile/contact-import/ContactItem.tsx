import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import * as Contacts from 'expo-contacts';
import { Text } from '@/components/ui';
import { Check } from 'lucide-react-native';

interface ContactItemProps {
  contact: Contacts.Contact & { isFriend?: boolean };
  isSelected: boolean;
  isFriend: boolean;
  onPress: () => void;
}

export const ContactItem: React.FC<ContactItemProps> = ({
  contact,
  isSelected,
  isFriend,
  onPress,
}) => {
  const displayName = contact.name || contact.emails?.[0]?.email || 'Unknown';
  const email = contact.emails?.[0]?.email || '';

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isFriend}
      testID={`contact-item-${contact.id}`}
      className={`flex-row items-center justify-between px-4 py-4 bg-background ${
        isFriend ? 'opacity-60' : ''
      }`}
    >
      <View className="flex-1 mr-3">
        <Text
          className={`text-base font-medium ${isFriend ? 'text-neutral-500' : 'text-black'}`}
        >
          {displayName}
        </Text>
        {email && contact.name && (
          <Text className="text-sm text-neutral-500 mt-1">{email}</Text>
        )}
      </View>

      <View className="flex-row items-center">
        {isFriend && (
          <Text className="text-sm text-neutral-500 mr-3">Already invited</Text>
        )}

        {!isFriend && (
          <View
            className={`w-6 h-6 rounded-full border-2 items-center justify-center ${
              isSelected
                ? 'bg-primary-500 border-primary-500'
                : 'border-neutral-500 bg-background'
            }`}
          >
            {isSelected && <Check size={14} color="white" strokeWidth={3} />}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};
