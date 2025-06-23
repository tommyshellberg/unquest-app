import { Shield, TrendingUp, Users } from 'lucide-react-native';
import React from 'react';
import { View } from 'react-native';

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
    <View className="flex-1 bg-background p-6">
      {/* Benefits Section */}
      <View className="mb-8">
        {/* Benefit Items */}
        <View>
          <View className="mb-4 flex-row items-center">
            <View className="mr-4 size-12 items-center justify-center rounded-full bg-primary-100">
              <Users size={24} color="#2E948D" />
            </View>
            <View className="flex-1">
              <Text className="text-base font-semibold text-neutral-800">
                Complete quests together
              </Text>
              <Text className="text-sm text-neutral-500">
                Motivate each other to stay focused
              </Text>
            </View>
          </View>

          <View className="mb-4 flex-row items-center">
            <View className="mr-4 size-12 items-center justify-center rounded-full bg-primary-100">
              <TrendingUp size={24} color="#2E948D" />
            </View>
            <View className="flex-1">
              <Text className="text-base font-semibold text-neutral-800">
                Track shared progress
              </Text>
              <Text className="text-sm text-neutral-500">
                See your friends' achievements & streaks
              </Text>
            </View>
          </View>

          <View className="flex-row items-center">
            <View className="mr-4 size-12 items-center justify-center rounded-full bg-primary-100">
              <Shield size={24} color="#2E948D" />
            </View>
            <View className="flex-1">
              <Text className="text-base font-semibold text-neutral-800">
                Build accountability
              </Text>
              <Text className="text-sm text-neutral-500">
                Stay committed with friend support
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Buttons */}
      <View className="mt-auto">
        <Button
          label="Import Contacts"
          onPress={onImportContacts}
          className="mb-3 w-full"
        />

        <Button
          label="Add Manual Contact"
          onPress={onManualAdd}
          variant="ghost"
          className="w-full"
        />
      </View>
    </View>
  );
};
