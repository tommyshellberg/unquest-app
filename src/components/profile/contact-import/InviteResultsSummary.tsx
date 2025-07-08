import React from 'react';
import { View, ScrollView } from 'react-native';
import { CheckCircle, AlertCircle } from 'lucide-react-native';
import { Button, Text } from '@/components/ui';

interface InviteResults {
  successful: { name: string; email: string }[];
  failed: { name: string; email: string; reason: string }[];
}

interface InviteResultsSummaryProps {
  results: InviteResults;
  onDone: () => void;
}

export const InviteResultsSummary: React.FC<InviteResultsSummaryProps> = ({
  results,
  onDone,
}) => {
  const { successful, failed } = results;
  const totalSent = successful.length + failed.length;

  return (
    <View className="flex-1 bg-background">
      <View className="items-center py-6">
        <Text className="text-lg text-black mb-4">
          {successful.length > 0 && failed.length > 0
            ? 'Invitations sent with some failures'
            : successful.length > 0
              ? 'All invitations sent successfully!'
              : 'Failed to send invitations'}
        </Text>

        {successful.length > 0 && (
          <View className="flex-row items-center mb-2">
            <CheckCircle size={20} color="#2E948D" />
            <Text className="text-lg text-primary-500 ml-2">
              {successful.length} Successful
            </Text>
          </View>
        )}

        {failed.length > 0 && (
          <View className="flex-row items-center">
            <AlertCircle size={20} color="#E25A3B" />
            <Text className="text-lg text-red-400 ml-2">
              {failed.length} Failed
            </Text>
          </View>
        )}
      </View>

      <View className="h-px bg-neutral-200 mx-4" />

      <ScrollView className="flex-1 px-4 py-4">
        {successful.length > 0 && (
          <>
            <Text className="text-sm font-semibold text-neutral-500 mb-3">
              SUCCESSFULLY INVITED
            </Text>
            {successful.map((contact, index) => (
              <View
                key={`success-${index}`}
                className="flex-row items-center py-3"
              >
                <CheckCircle size={20} color="#2E948D" />
                <View className="ml-3 flex-1">
                  <Text className="text-base text-black font-medium">
                    {contact.name}
                  </Text>
                  <Text className="text-sm text-neutral-500 mt-1">
                    {contact.email}
                  </Text>
                </View>
              </View>
            ))}
          </>
        )}

        {failed.length > 0 && (
          <>
            {successful.length > 0 && (
              <View className="h-px bg-neutral-200 my-4" />
            )}
            <Text className="text-sm font-semibold text-neutral-500 mb-3">
              FAILED TO INVITE
            </Text>
            {failed.map((contact, index) => (
              <View key={`failed-${index}`} className="py-3">
                <View className="flex-row items-start">
                  <AlertCircle size={20} color="#E25A3B" />
                  <View className="ml-3 flex-1">
                    <Text className="text-base text-black font-medium">
                      {contact.name}
                    </Text>
                    <Text className="text-sm text-neutral-500 mt-0.5">
                      {contact.email}
                    </Text>
                    <Text className="text-sm text-red-400 mt-1">
                      {contact.reason}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </>
        )}
      </ScrollView>

      <View className="p-4 bg-background border-t border-neutral-200">
        <Button label="DONE" onPress={onDone} className="w-full" />
      </View>
    </View>
  );
};
