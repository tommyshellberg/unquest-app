import type * as Contacts from 'expo-contacts';
import { Check } from 'lucide-react-native';
import React from 'react';
import { TouchableOpacity, View } from 'react-native';

import { Text } from '@/components/ui';

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
      className={`flex-row items-center justify-between bg-background p-4 ${
        isFriend ? 'opacity-60' : ''
      }`}
    >
      <View className="mr-3 flex-1">
        <Text
          className={`text-base font-medium ${isFriend ? 'text-neutral-500' : 'text-black'}`}
        >
          {displayName}
        </Text>
        {email && contact.name && (
          <Text className="mt-1 text-sm text-neutral-500">{email}</Text>
        )}
      </View>

      <View className="flex-row items-center">
        {isFriend && (
          <Text className="mr-3 text-sm text-neutral-500">Already invited</Text>
        )}

        {!isFriend && (
          <View
            className={`size-6 items-center justify-center rounded-full border-2 ${
              isSelected
                ? 'border-primary-500 bg-primary-500'
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
