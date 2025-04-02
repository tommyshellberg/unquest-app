import React, { useEffect } from 'react';

import { Button, Text, View } from '@/components/ui';
import { Modal, useModal } from '@/components/ui/modal';

type RescindInvitationModalProps = {
  visible: boolean;
  invitation: any;
  onConfirm: () => void;
  onCancel: () => void;
  isPending: boolean;
};

export function RescindInvitationModal({
  visible,
  invitation,
  onConfirm,
  onCancel,
  isPending,
}: RescindInvitationModalProps) {
  const { ref, present, dismiss } = useModal();

  // Show or hide the modal based on the visible prop
  useEffect(() => {
    if (visible) {
      present();
    } else {
      dismiss();
    }
  }, [visible, present, dismiss]);

  // Handle cancellation - call the parent's onCancel callback
  const handleCancel = React.useCallback(() => {
    dismiss();
    onCancel();
  }, [dismiss, onCancel]);

  // Handle confirmation - call the parent's onConfirm callback
  const handleConfirm = React.useCallback(() => {
    onConfirm();
  }, [onConfirm]);

  return (
    <Modal ref={ref} snapPoints={['40%']} title="Cancel Invite">
      <View className="p-4">
        <Text className="mb-2 text-center text-lg font-bold">
          Cancel Invite
        </Text>
        <Text className="mb-2 text-center">
          Are you sure you want to cancel your invitation to{' '}
          {invitation?.recipientUser?.character?.name ||
            invitation?.recipient ||
            'this user'}
          ?
        </Text>
        <Text className="mb-4 text-center">
          They will no longer see your friend request.
        </Text>

        <View className="mt-4 flex-row justify-between">
          <Button
            label="Keep"
            onPress={handleCancel}
            variant="outline"
            className="mr-2 flex-1"
          />
          <Button
            label="Cancel"
            onPress={handleConfirm}
            className="ml-2 flex-1 bg-red-500"
            loading={isPending}
            disabled={isPending}
          />
        </View>
      </View>
    </Modal>
  );
}
