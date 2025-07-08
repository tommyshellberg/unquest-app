import React from 'react';
import { View, TextInput } from 'react-native';
import { Search } from 'lucide-react-native';

interface ContactSearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
}

export const ContactSearchBar: React.FC<ContactSearchBarProps> = ({
  value,
  onChangeText,
}) => {
  return (
    <View className="p-4 bg-background border-b border-neutral-200">
      <View className="flex-row items-center bg-cardBackground rounded-lg px-3 py-3">
        <Search size={20} color="#9E8E7F" />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder="Search contacts"
          placeholderTextColor="#9E8E7F"
          autoCapitalize="none"
          autoCorrect={false}
          className="flex-1 text-base text-black ml-3"
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
