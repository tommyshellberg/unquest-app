import { zodResolver } from '@hookform/resolvers/zod';
import axios from 'axios';
import * as Linking from 'expo-linking';
import { Link } from 'expo-router';
import React, { useEffect, useState } from 'react';
import type { SubmitHandler } from 'react-hook-form';
import { useForm } from 'react-hook-form';
import { TextInput } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import * as z from 'zod';

import { requestMagicLink } from '@/api/auth';
import { Button, Image, Text, View } from '@/components/ui';

const schema = z.object({
  email: z
    .string({
      required_error: 'Email is required',
    })
    .email('Invalid email format'),
});

export type FormType = z.infer<typeof schema>;

export type LoginFormProps = {
  onSubmit?: SubmitHandler<FormType>;
  initialError?: string | null;
};

export const LoginForm = ({ onSubmit, initialError }: LoginFormProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [sendAttempts, setSendAttempts] = useState(0);
  const [email, setEmail] = useState('');

  useEffect(() => {
    if (initialError) {
      setError(initialError);
      setEmailSent(false);
    }
  }, [initialError]);

  const { handleSubmit, formState } = useForm<FormType>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: '',
    },
    mode: 'onChange',
  });

  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleMagicLinkRequest = async () => {
    if (!email || !isValidEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setError('');
    setIsLoading(true);
    setSendAttempts((prev) => prev + 1);

    try {
      await requestMagicLink(email);
      setEmailSent(true);
      onSubmit?.({ email });
    } catch (err) {
      console.error('Magic link request failed:', err);

      if (axios.isAxiosError(err)) {
        if (err.code === 'ECONNABORTED') {
          setError('Request timed out. Please try again.');
        } else if (!err.response) {
          setError(
            'Network error. Please check your connection and try again.'
          );
        } else {
          setError(
            `Failed to send login link: ${err.response.data?.message || err.message}`
          );
        }
      } else {
        setError(
          `Failed to send login link: ${err?.message || 'Unknown error'}`
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleContactSupport = () => {
    Linking.openURL('mailto:hello@unquestapp.com?subject=Login%20Help');
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior="padding"
      keyboardVerticalOffset={10}
    >
      <View className="flex-1 bg-white">
        <View className="absolute inset-0 w-full flex-1">
          <Image
            source={require('@/../assets/images/background/onboarding.jpg')}
            style={{ width: '100%', height: '100%' }}
          />
        </View>
        {/* Logo at the top */}
        <View className="mt-12 items-center">
          <Image
            source={require('@/../assets/images/unquestlogo-downscaled.png')}
            style={{ width: 100, height: 100 }}
          />
          <Text className="mt-2 text-3xl font-bold">Welcome to unQuest</Text>
        </View>

        {/* Form in bottom half */}
        <View className="mb-12 flex-1 justify-end">
          {/* Form card */}
          <View className="mx-6 rounded-xl bg-white shadow-sm">
            {emailSent ? (
              <View className="p-6">
                <View className="mb-4">
                  <Text className="text-center text-neutral-500">
                    Email sent to <Text className="font-bold">{email}</Text>
                  </Text>
                  <Text className="mt-2 text-center text-neutral-500">
                    It may take a few minutes to arrive. Please check your SPAM
                    folder.
                  </Text>
                  {sendAttempts > 2 && (
                    <Text className="mt-2 text-center text-neutral-500">
                      {' '}
                      Having trouble? Write us at{' '}
                      <Text
                        className="text-primary-500 underline"
                        onPress={handleContactSupport}
                      >
                        hello@unquestapp.com
                      </Text>
                    </Text>
                  )}
                </View>
                <Button
                  testID="login-button"
                  label="Send Again"
                  onPress={handleMagicLinkRequest}
                  disabled={isLoading}
                  className="mt-4 rounded-xl bg-primary-500"
                  textClassName="text-white font-bold text-lg"
                />
                <Text
                  className="mt-4 text-center text-primary-500 underline"
                  onPress={() => setEmailSent(false)}
                >
                  Enter a different email address
                </Text>
              </View>
            ) : (
              <View className="p-6">
                {/* Email input with label on left */}
                <View className="mb-6 flex-row items-center border-b border-neutral-300 pb-2 dark:border-neutral-300">
                  <Text className="w-28 font-medium text-neutral-500 dark:text-neutral-500">
                    EMAIL
                  </Text>
                  <TextInput
                    testID="email-input"
                    placeholder="Enter your email"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                    className="flex-1 py-2 text-primary-500 placeholder:text-muted-200 dark:text-primary-500 dark:placeholder:text-muted-200"
                  />
                </View>

                {/* Terms and privacy */}
                <Text className="mb-4 px-6 text-center text-sm">
                  By signing in to this app you agree with our{' '}
                  <Link
                    href="https://unquestapp.com/terms"
                    className="text-charcoal-600 underline"
                  >
                    Terms of Use and Privacy Policy
                  </Link>
                  .
                </Text>

                {error ? (
                  <Text className="mb-4 text-center text-red-400">{error}</Text>
                ) : null}

                <Button
                  testID="login-button"
                  label="Send Link"
                  loading={isLoading}
                  onPress={handleMagicLinkRequest}
                  disabled={isLoading || !isValidEmail(email)}
                  className={`rounded-xl bg-primary-500 dark:bg-primary-500 ${!isValidEmail(email) ? 'opacity-50' : ''}`}
                  textClassName="text-white dark:text-white font-bold"
                />
              </View>
            )}
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};
