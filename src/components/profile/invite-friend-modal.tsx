import React, { useEffect } from 'react';
import { Controller } from 'react-hook-form';

import { Button, Input, Text, View } from '@/components/ui';
import { Modal, useModal } from '@/components/ui/modal';

type InviteFriendModalProps = {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  formMethods: any;
  error: string;
  success: string;
  isPending: boolean;
};

export function InviteFriendModal({
  visible,
  onClose,
  onSubmit,
  formMethods,
  error,
  success,
  isPending,
}: InviteFriendModalProps) {
  const { ref, present, dismiss } = useModal();
  const { control, handleSubmit, formState } = formMethods;
  const { errors, isValid } = formState;

  // Show or hide the modal based on the visible prop
  useEffect(() => {
    if (visible) {
      present();
    } else {
      dismiss();
    }
  }, [visible, present, dismiss]);

  // Handle close - call the parent's onClose callback
  const handleClose = React.useCallback(() => {
    dismiss();
    onClose();
  }, [dismiss, onClose]);

  return (
    <Modal ref={ref} snapPoints={['60%']} title="Invite a Friend">
      <View className="p-4">
        <Text className="mb-4 text-center text-gray-600">
          Enter your friend's email address to send them a friend request.
        </Text>

        <Controller
          control={control}
          name="email"
          rules={{
            required: 'Email is required',
            pattern: {
              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              message: 'Please enter a valid email address',
            },
          }}
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Email Address"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              autoCapitalize="none"
              keyboardType="email-address"
              error={errors.email?.message}
            />
          )}
        />

        {error ? (
          <Text className="mb-2 text-center text-red-500">{error}</Text>
        ) : null}

        {success ? (
          <Text className="mb-2 text-center text-teal-700">{success}</Text>
        ) : null}

        <View className="mt-4 flex-row justify-between">
          <Button
            label={success ? 'Done' : 'Cancel'}
            onPress={handleClose}
            variant="outline"
            className="mr-2 flex-1"
          />

          {!success && (
            <Button
              label="Send Invite"
              onPress={handleSubmit(onSubmit)}
              className="ml-2 flex-1 bg-teal-700"
              loading={isPending}
              disabled={isPending || !isValid}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}
