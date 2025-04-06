import { zodResolver } from '@hookform/resolvers/zod';
import axios from 'axios';
import React, { useState } from 'react';
import type { SubmitHandler } from 'react-hook-form';
import { useForm } from 'react-hook-form';
import { ActivityIndicator } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import * as z from 'zod';

import { requestMagicLink } from '@/api/auth';
import { Button, colors, ControlledInput, Text, View } from '@/components/ui';

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
  onCancel?: () => void;
};

export const LoginForm = ({ onSubmit, onCancel }: LoginFormProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [sendAttempts, setSendAttempts] = useState(0);

  const { handleSubmit, control, formState } = useForm<FormType>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: '',
    },
  });

  const handleMagicLinkRequest: SubmitHandler<FormType> = async (data) => {
    setError('');
    setIsLoading(true);
    setSendAttempts((prev) => prev + 1);

    try {
      await requestMagicLink(data.email);
      setEmailSent(true);
      onSubmit?.(data);
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

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior="padding"
      keyboardVerticalOffset={10}
    >
      <View className="flex-1 justify-center p-4">
        <View className="items-center justify-center">
          <Text
            testID="form-title"
            className="pb-6 text-center text-4xl font-bold"
          >
            Welcome to unQuest
          </Text>

          {emailSent ? (
            <Text className="mb-6 max-w-xs text-center text-gray-500">
              Email sent! It may take a few minutes to arrive. Please check your
              SPAM folder.
              {sendAttempts > 1 && (
                <>
                  {' '}
                  If you still don't receive it, please contact{' '}
                  <Text className="text-blue-500">hello@unquestapp.com</Text>.
                </>
              )}
            </Text>
          ) : (
            <Text className="mb-6 max-w-xs text-center text-gray-500">
              Enter your email address below to receive a magic link for login.
              No password is required.
            </Text>
          )}

          {error ? (
            <Text className="mb-4 text-center text-red-500">{error}</Text>
          ) : null}
        </View>

        <ControlledInput
          testID="email-input"
          control={control}
          name="email"
          label="Email"
          placeholder="Enter your email"
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <View className="mt-4 flex-row justify-between">
          {onCancel && (
            <Button
              testID="cancel-button"
              label="Back"
              onPress={onCancel}
              variant="outline"
              className="mr-2 flex-1"
            />
          )}

          <Button
            testID="login-button"
            label={emailSent ? 'Send Again' : 'Send Link'}
            onPress={handleSubmit(handleMagicLinkRequest)}
            disabled={isLoading || !formState.isValid}
            variant="default"
            className="flex-1"
          >
            {isLoading ? (
              <ActivityIndicator
                size="small"
                color={colors.primary[50]}
                testID="login-loading"
              />
            ) : null}
          </Button>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};
