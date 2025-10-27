import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import { usePostHog } from 'posthog-react-native';
import React, { forwardRef, useState } from 'react';

import { useResetStoryline } from '@/api/quest';
import { Button, Modal, Text, View } from '@/components/ui';
import { useSettingsStore } from '@/store/settings-store';

export const BranchingStoryAnnouncementModal = forwardRef<BottomSheetModal>(
  (_, ref) => {
    const posthog = usePostHog();
    const setHasSeenBranchingAnnouncement = useSettingsStore(
      (state) => state.setHasSeenBranchingAnnouncement
    );
    const resetStorylineMutation = useResetStoryline();
    const [isResetting, setIsResetting] = useState(false);

    const handleModalChange = (index: number) => {
      // Track when modal is presented (index >= 0)
      if (index >= 0) {
        posthog.capture('branching_announcement_viewed');
      }
    };

    const handleRestart = async () => {
      setIsResetting(true);
      posthog.capture('branching_announcement_accepted');

      try {
        await resetStorylineMutation.mutateAsync({ storylineId: 'vaedros' });

        // Track successful storyline reset
        posthog.capture('storyline_reset_success', {
          storyline_id: 'vaedros',
          source: 'branching_announcement_modal',
        });

        setHasSeenBranchingAnnouncement(true);
        // @ts-ignore - ref might be null but we check before calling
        ref?.current?.dismiss();
      } catch (error) {
        console.error('Error resetting storyline:', error);

        // Track failed storyline reset
        posthog.capture('storyline_reset_failed', {
          storyline_id: 'vaedros',
          source: 'branching_announcement_modal',
          error: error instanceof Error ? error.message : 'Unknown error',
        });

        // Still close the modal and mark as seen even if reset fails
        setHasSeenBranchingAnnouncement(true);
        // @ts-ignore - ref might be null but we check before calling
        ref?.current?.dismiss();
      } finally {
        setIsResetting(false);
      }
    };

    const handleContinue = () => {
      posthog.capture('branching_announcement_declined');
      setHasSeenBranchingAnnouncement(true);
      // @ts-ignore - ref might be null but we check before calling
      ref?.current?.dismiss();
    };

    return (
      <Modal
        ref={ref}
        snapPoints={['70%']}
        title="Branching Storylines"
        onChange={handleModalChange}
        backgroundStyle={{ backgroundColor: '#2c456b' }}
      >
        <View className="px-4 pb-6">
          {/* Icon/Visual Element */}
          <View className="mb-4 items-center">
            <Text className="text-4xl">⚔️</Text>
          </View>

          {/* Main Message */}
          <Text className="text-cream-500 mb-2 text-center text-2xl font-bold">
            Your Story Just Got Deadlier
          </Text>

          <Text className="text-cream-500 mb-6 text-center text-sm">
            unQuest now features branching storylines with real consequences.
            Some choices lead to victory, others... to death.
          </Text>

          {/* Reset Option */}
          <View className="mb-6 rounded-lg border border-primary-300 bg-primary-500/10 p-4">
            <Text className="text-cream-500 mb-2 text-base font-bold">
              Experience the storylines from the beginning
            </Text>
            <Text className="text-cream-300 mb-3 text-base">
              Restart at the first branching point. You'll keep all your
              achievements, stats, streaks, and XP. Only story progress resets.
            </Text>
            <Text className="text-cream-300 text-sm">
              ✓ Keep your level and XP
            </Text>
            <Text className="text-cream-300 text-sm">
              ✓ Keep your streaks and stats
            </Text>
            <Text className="text-cream-300 text-sm">
              ✓ Keep all achievements
            </Text>
          </View>

          {/* Action Buttons */}
          <View className="space-y-3">
            <Button
              label={
                isResetting ? 'Resetting...' : 'Restart at Branching Point'
              }
              onPress={handleRestart}
              disabled={isResetting}
              className="bg-primary-400"
            />

            <Button
              label="Continue Current Journey"
              onPress={handleContinue}
              variant="outline"
              disabled={isResetting}
              className="border-cream-500"
              textClassName="text-cream-500"
            />
          </View>
        </View>
      </Modal>
    );
  }
);
