import { router } from 'expo-router';
import React, { useEffect } from 'react';
import { TouchableOpacity } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';

import { Image, Text, View } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { removeItem } from '@/lib/storage';
import { useOnboardingStore } from '@/store/onboarding-store';

import { EmailInputView } from './login/email-input-view';
import { EmailSentView } from './login/email-sent-view';
import { useMagicLink } from './login/hooks/use-magic-link';
import { BRAND_NAME, LOGO_SIZE } from './login/constants';
import type { LoginFormProps } from './login/types';

export type { LoginFormProps };

/**
 * Main login form component
 * Handles magic link authentication with email input and success states
 */
export const LoginForm = ({ onSubmit, initialError }: LoginFormProps) => {
  const resetOnboarding = useOnboardingStore((state) => state.resetOnboarding);
  const signOut = useAuth((state) => state.signOut);

  const {
    isLoading,
    error,
    emailSent,
    sendAttempts,
    submittedEmail,
    requestMagicLink: sendMagicLink,
    resetForm,
    setError,
  } = useMagicLink();

  // Handle initial error from URL params
  useEffect(() => {
    if (initialError) {
      setError(initialError);
    }
  }, [initialError, setError]);

  const handleEmailSubmit = async (email: string) => {
    await sendMagicLink(email, (submittedEmail) => {
      onSubmit?.({ email: submittedEmail });
    });
  };

  const handleCreateAccount = () => {
    // Clear all auth data and provisional data
    signOut();

    // Clear provisional data
    removeItem('provisionalRefreshToken');
    removeItem('provisionalAccessToken');
    removeItem('provisionalUserId');
    removeItem('provisionalEmail');

    // Reset onboarding state to allow starting fresh
    resetOnboarding();

    // Navigate to welcome screen
    router.replace('/onboarding/welcome');
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior="padding"
      keyboardVerticalOffset={10}
    >
      <View className="flex-1 bg-background">
        {/* Background image */}
        <View className="absolute inset-0 w-full flex-1">
          <Image
            source={require('@/../assets/images/background/onboarding-bg.png')}
            style={{ width: '100%', height: '100%' }}
            accessibilityLabel="Background illustration"
          />
        </View>

        {/* Logo at the top */}
        <View className="mt-12 items-center">
          <Image
            source={require('@/../assets/images/icon.png')}
            style={{ width: LOGO_SIZE, height: LOGO_SIZE }}
            accessibilityLabel={`${BRAND_NAME} app logo`}
          />
          <Text className="mt-2 text-3xl font-bold">{BRAND_NAME}</Text>
        </View>

        {/* Form in bottom half */}
        <View className="mb-12 flex-1 justify-end">
          {/* Form card */}
          <View className="mx-6 rounded-xl bg-cardBackground shadow-sm">
            {emailSent ? (
              <EmailSentView
                email={submittedEmail}
                onSendAgain={() => sendMagicLink(submittedEmail, () => {})}
                onChangeEmail={resetForm}
                isLoading={isLoading}
                sendAttempts={sendAttempts}
              />
            ) : (
              <EmailInputView
                onSubmit={handleEmailSubmit}
                isLoading={isLoading}
                error={error}
              />
            )}
          </View>

          {/* Link to go back to welcome screen */}
          <TouchableOpacity
            onPress={handleCreateAccount}
            className="mt-4 items-center"
            accessibilityRole="button"
            accessibilityLabel="Create a new account"
          >
            <Text className="font-semibold text-white underline">
              Create Account
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};
