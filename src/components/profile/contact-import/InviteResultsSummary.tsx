import { AlertCircle, CheckCircle } from 'lucide-react-native';
import React from 'react';
import { ScrollView, View } from 'react-native';

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
        <Text className="mb-4 text-lg text-black">
          {successful.length > 0 && failed.length > 0
            ? 'Invitations sent with some failures'
            : successful.length > 0
              ? 'All invitations sent successfully!'
              : 'Failed to send invitations'}
        </Text>

        {successful.length > 0 && (
          <View className="mb-2 flex-row items-center">
            <CheckCircle size={20} color="#2E948D" />
            <Text className="ml-2 text-lg text-primary-500">
              {successful.length} Successful
            </Text>
          </View>
        )}

        {failed.length > 0 && (
          <View className="flex-row items-center">
            <AlertCircle size={20} color="#E25A3B" />
            <Text className="ml-2 text-lg text-red-400">
              {failed.length} Failed
            </Text>
          </View>
        )}
      </View>

      <View className="mx-4 h-px bg-neutral-200" />

      <ScrollView className="flex-1 p-4">
        {successful.length > 0 && (
          <>
            <Text className="mb-3 text-sm font-semibold text-neutral-500">
              SUCCESSFULLY INVITED
            </Text>
            {successful.map((contact, index) => (
              <View
                key={`success-${index}`}
                className="flex-row items-center py-3"
              >
                <CheckCircle size={20} color="#2E948D" />
                <View className="ml-3 flex-1">
                  <Text className="text-base font-medium text-black">
                    {contact.name}
                  </Text>
                  <Text className="mt-1 text-sm text-neutral-500">
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
              <View className="my-4 h-px bg-neutral-200" />
            )}
            <Text className="mb-3 text-sm font-semibold text-neutral-500">
              FAILED TO INVITE
            </Text>
            {failed.map((contact, index) => (
              <View key={`failed-${index}`} className="py-3">
                <View className="flex-row items-start">
                  <AlertCircle size={20} color="#E25A3B" />
                  <View className="ml-3 flex-1">
                    <Text className="text-base font-medium text-black">
                      {contact.name}
                    </Text>
                    <Text className="mt-0.5 text-sm text-neutral-500">
                      {contact.email}
                    </Text>
                    <Text className="mt-1 text-sm text-red-400">
                      {contact.reason}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </>
        )}
      </ScrollView>

      <View className="border-t border-neutral-200 bg-background p-4">
        <Button label="DONE" onPress={onDone} className="w-full" />
      </View>
    </View>
  );
};
