import * as Linking from 'expo-linking';
import React from 'react';

import { Button, Text, View } from '@/components/ui';

import { CONTACT_EMAIL, SEND_ATTEMPTS_THRESHOLD } from './constants';

type EmailSentViewProps = {
  email: string;
  onSendAgain: () => void;
  onChangeEmail: () => void;
  isLoading: boolean;
  sendAttempts: number;
};

/**
 * Success view shown after magic link email is sent
 * Shows confirmation message and options to resend or change email
 */
export function EmailSentView({
  email,
  onSendAgain,
  onChangeEmail,
  isLoading,
  sendAttempts,
}: EmailSentViewProps) {
  const handleContactSupport = () => {
    Linking.openURL(`mailto:${CONTACT_EMAIL}?subject=Login%20Help`);
  };

  const showSupportContact = sendAttempts > SEND_ATTEMPTS_THRESHOLD;

  return (
    <View className="p-6">
      <View className="mb-4">
        <Text className="text-center text-white">
          Email sent to <Text className="font-bold">{email}</Text>
        </Text>
        <Text className="mt-2 text-center text-white">
          It may take a few minutes to arrive. Please check your SPAM folder.
        </Text>
        {showSupportContact && (
          <Text className="mt-2 text-center text-white">
            {' '}
            Having trouble? {'\n'} Write us at{' '}
            <Text
              className="text-primary-500 underline"
              onPress={handleContactSupport}
              accessibilityRole="link"
              accessibilityLabel={`Contact support at ${CONTACT_EMAIL}`}
            >
              {CONTACT_EMAIL}
            </Text>
          </Text>
        )}
      </View>
      <Button
        testID="send-again-button"
        label="Send Again"
        onPress={onSendAgain}
        disabled={isLoading}
        className="mt-4 rounded-xl bg-primary-500"
        textClassName="text-white font-bold text-lg"
        accessibilityLabel="Send login link again"
        accessibilityHint="Resends the magic link to your email"
      />
      <Text
        className="mt-4 text-center text-primary-500 underline"
        onPress={onChangeEmail}
        accessibilityRole="button"
        accessibilityLabel="Enter a different email address"
      >
        Enter a different email address
      </Text>
    </View>
  );
}
