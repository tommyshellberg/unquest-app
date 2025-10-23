import * as Linking from 'expo-linking';
import React, { useState } from 'react';
import { TextInput } from 'react-native';

import { Button, Text, View } from '@/components/ui';

import { BRAND_NAME, TERMS_URL } from './constants';
import { emailSchema } from './types';

type EmailInputViewProps = {
  onSubmit: (email: string) => void;
  isLoading: boolean;
  error: string;
};

/**
 * Email input form view for magic link authentication
 * Handles email input, validation, and submission
 */
export function EmailInputView({
  onSubmit,
  isLoading,
  error,
}: EmailInputViewProps) {
  const [email, setEmail] = useState('');

  const isValidEmail = (emailToValidate: string): boolean => {
    return emailSchema.safeParse({ email: emailToValidate }).success;
  };

  const handleSubmit = () => {
    onSubmit(email);
  };

  return (
    <View className="p-6">
      {/* Email input with label on left */}
      <View className="mb-6 flex-row items-center border-b border-neutral-300 pb-2">
        <Text className="w-28 font-semibold text-white">EMAIL</Text>
        <TextInput
          testID="email-input"
          placeholder="Enter your email"
          placeholderTextColor="#9CA3AF"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
          className="flex-1 py-2 text-lg font-semibold text-primary-500"
          accessibilityLabel="Email address"
          accessibilityHint="Enter your email to receive a login link"
        />
      </View>

      {/* Terms and privacy */}
      <Text className="mb-4 px-6 text-center text-sm">
        By signing in to this app you agree with our{' '}
        <Text
          className="text-charcoal-600 underline"
          onPress={() => Linking.openURL(TERMS_URL)}
          accessibilityRole="link"
          accessibilityLabel="Terms of Use and Privacy Policy"
        >
          Terms of Use and Privacy Policy
        </Text>
        .
      </Text>

      {/* Error message */}
      {error ? (
        <Text className="mb-4 text-center text-red-400" testID="error-message">
          {error}
        </Text>
      ) : null}

      {/* Submit button */}
      <Button
        testID="login-button"
        label="Send Link"
        loading={isLoading}
        onPress={handleSubmit}
        disabled={isLoading || !isValidEmail(email)}
        className={`rounded-xl bg-primary-500 ${!isValidEmail(email) ? 'opacity-50' : ''}`}
        textClassName="text-white font-bold"
        accessibilityLabel="Send login link"
        accessibilityHint="Sends a magic link to your email for authentication"
      />
    </View>
  );
}
