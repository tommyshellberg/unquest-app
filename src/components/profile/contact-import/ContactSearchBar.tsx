import { Search } from 'lucide-react-native';
import React from 'react';
import { TextInput, View } from 'react-native';

interface ContactSearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
}

export const ContactSearchBar: React.FC<ContactSearchBarProps> = ({
  value,
  onChangeText,
}) => {
  return (
    <View className="border-b border-neutral-200 bg-background p-4">
      <View className="flex-row items-center rounded-lg bg-cardBackground p-3">
        <Search size={20} color="#9E8E7F" />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder="Search contacts"
          placeholderTextColor="#9E8E7F"
          autoCapitalize="none"
          autoCorrect={false}
          className="ml-3 flex-1 text-base text-black"
          style={{
            fontSize: 16,
            color: '#1f0f0c',
            paddingVertical: 0,
          }}
        />
      </View>
    </View>
  );
};
