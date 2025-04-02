import React, { useEffect } from 'react';

import { Button, Text, View } from '@/components/ui';
import { Modal, useModal } from '@/components/ui/modal';

type DeleteFriendModalProps = {
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function DeleteFriendModal({
  visible,
  onConfirm,
  onCancel,
}: DeleteFriendModalProps) {
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
    <Modal ref={ref} snapPoints={['40%']} title="Remove Friend">
      <View className="p-4">
        <Text className="mb-4 text-center">
          Are you sure you want to remove this friend?
        </Text>

        <View className="mt-4 flex-row justify-between">
          <Button
            label="Cancel"
            onPress={handleCancel}
            variant="outline"
            className="mr-2 flex-1"
          />
          <Button
            label="Remove"
            onPress={handleConfirm}
            className="ml-2 flex-1 bg-teal-700"
          />
        </View>
      </View>
    </Modal>
  );
}
