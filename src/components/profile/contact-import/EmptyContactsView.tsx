import React from 'react';
import { View, Text as RNText } from 'react-native';
import { Button, Text } from '@/components/ui';

interface EmptyContactsViewProps {
  onImportContacts: () => void;
  onManualAdd: () => void;
}

export const EmptyContactsView: React.FC<EmptyContactsViewProps> = ({
  onImportContacts,
  onManualAdd,
}) => {
  return (
    <View className="flex-1 items-center justify-center p-6 bg-background">
      <Text className="text-xl font-semibold text-black mb-2">
        Invite Friends
      </Text>
      <Text className="text-base text-neutral-500 mb-8 text-center">
        Import your contacts to easily invite friends to unQuest
      </Text>

      <Button
        label="IMPORT CONTACTS"
        onPress={onImportContacts}
        className="w-full mb-4"
      />

      <Button
        label="ADD MANUAL CONTACT"
        onPress={onManualAdd}
        variant="ghost"
        className="w-full"
      />
    </View>
  );
};
