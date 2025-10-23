import { usePostHog } from 'posthog-react-native';
import React, { useEffect, useState } from 'react';
import { Modal, StyleSheet } from 'react-native';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';

import { Button, Text, View } from '@/components/ui';
import { useResetStoryline } from '@/api/quest';
import { useSettingsStore } from '@/store/settings-store';

type Props = {
  visible: boolean;
  onClose: () => void;
};

export function BranchingStoryAnnouncementModal({ visible, onClose }: Props) {
  const posthog = usePostHog();
  const setHasSeenBranchingAnnouncement = useSettingsStore(
    (state) => state.setHasSeenBranchingAnnouncement
  );
  const resetStorylineMutation = useResetStoryline();
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    if (visible) {
      posthog.capture('branching_announcement_viewed');
    }
  }, [visible, posthog]);

  const handleRestart = async () => {
    setIsResetting(true);
    posthog.capture('branching_announcement_accepted');

    try {
      await resetStorylineMutation.mutateAsync({ storylineId: 'vaedros' });
      setHasSeenBranchingAnnouncement(true);
      onClose();
    } catch (error) {
      console.error('Error resetting storyline:', error);
      // Still close the modal and mark as seen even if reset fails
      setHasSeenBranchingAnnouncement(true);
      onClose();
    } finally {
      setIsResetting(false);
    }
  };

  const handleContinue = () => {
    posthog.capture('branching_announcement_declined');
    setHasSeenBranchingAnnouncement(true);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View className="flex-1 bg-neutral-900 px-6">
        <Animated.View
          entering={FadeIn.duration(600)}
          className="flex-1 justify-center"
        >
          {/* Main Content */}
          <Animated.View entering={SlideInDown.delay(200).springify()}>
            {/* Icon/Visual Element */}
            <View className="mb-8 items-center">
              <Text className="text-6xl">⚔️</Text>
            </View>

            {/* Title */}
            <Text className="mb-4 text-center font-display text-4xl font-bold text-white">
              Your Story Just Got Deadlier
            </Text>

            {/* Subtitle */}
            <Text className="mb-8 text-center text-xl font-semibold text-primary-400">
              True Branching. Real Consequences.
            </Text>

            {/* Features List */}
            <View className="mb-12 space-y-4">
              <View className="flex-row items-start">
                <Text className="mr-3 text-2xl">🔀</Text>
                <View className="flex-1">
                  <Text className="text-lg font-semibold text-white">
                    Truly Branching Storylines
                  </Text>
                  <Text className="text-neutral-400">
                    Every choice leads to different paths and outcomes
                  </Text>
                </View>
              </View>

              <View className="flex-row items-start">
                <Text className="mr-3 text-2xl">💀</Text>
                <View className="flex-1">
                  <Text className="text-lg font-semibold text-white">
                    Deadly Consequences
                  </Text>
                  <Text className="text-neutral-400">
                    Make the wrong choice and your journey ends
                  </Text>
                </View>
              </View>

              <View className="flex-row items-start">
                <Text className="mr-3 text-2xl">🎭</Text>
                <View className="flex-1">
                  <Text className="text-lg font-semibold text-white">
                    Multiple Endings
                  </Text>
                  <Text className="text-neutral-400">
                    Discover different fates based on your decisions
                  </Text>
                </View>
              </View>
            </View>

            {/* Call to Action */}
            <Text className="mb-6 text-center text-neutral-300">
              Want to experience the full branching story from the beginning?
              Your progress and stats will be preserved.
            </Text>

            {/* Action Buttons */}
            <View className="space-y-3">
              <Button
                label={isResetting ? "Resetting..." : "Start Over & Explore All Paths"}
                onPress={handleRestart}
                disabled={isResetting}
                className="bg-primary-500"
              />

              <Button
                label="Continue Current Journey"
                onPress={handleContinue}
                variant="outline"
                disabled={isResetting}
              />
            </View>
          </Animated.View>
        </Animated.View>
      </View>
    </Modal>
  );
}
