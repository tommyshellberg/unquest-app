import React from 'react';
import { View } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { Button, Input, Text } from '@/components/ui';

interface ManualEmailViewProps {
  email: string;
  onEmailChange: (email: string) => void;
  onSubmit: () => void;
  onBack: () => void;
  isSubmitting: boolean;
}

export const ManualEmailView: React.FC<ManualEmailViewProps> = ({
  email,
  onEmailChange,
  onSubmit,
  onBack,
  isSubmitting,
}) => {
  return (
    <View className="flex-1 p-4 bg-background">
      <Button
        label=""
        onPress={onBack}
        variant="ghost"
        leftIcon={<ArrowLeft size={20} color="#9E8E7F" />}
        className="mb-4 self-start"
      />

      <Text className="text-lg font-semibold text-black mb-2">
        Enter email address
      </Text>

      <Text className="text-base text-neutral-500 mb-6">
        Enter the email address of the friend you want to invite.
      </Text>

      <Input
        value={email}
        onChangeText={onEmailChange}
        placeholder="friend@example.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        autoFocus
        className="mb-6"
      />

      <Button
        label="SEND INVITE"
        onPress={onSubmit}
        disabled={!email.trim() || isSubmitting}
        loading={isSubmitting}
        className="w-full"
      />
    </View>
  );
};
