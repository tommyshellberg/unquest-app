import { Picker } from '@react-native-picker/picker';
import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { Animated, Image, Platform } from 'react-native';
import {
  useAnimatedStyle,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { useSharedValue } from 'react-native-reanimated';

import { apiClient } from '@/api/common/client';
import { Button, FocusAwareStatusBar, Text, View } from '@/components/ui';
import { muted, primary } from '@/components/ui/colors';
import { OnboardingStep, useOnboardingStore } from '@/store/onboarding-store';
import { useUserStore } from '@/store/user-store';

// Generate time options in 30-minute increments (30m to 12h)
const TIME_OPTIONS = Array.from({ length: 24 }, (_, i) => {
  const value = (i + 1) * 30; // starts at 30 minutes
  const hours = Math.floor(value / 60);
  const minutes = value % 60;
  return {
    label: `${hours}h${minutes ? ` ${minutes}m` : ''}`,
    value,
  };
});

export default function ScreenTimeGoalScreen() {
  const navigation = useNavigation();

  // Replace accountStore with userStore
  const user = useUserStore((state) => state.user);
  const updateUser = useUserStore((state) => state.updateUser);

  // Use -1 as the "invalid" placeholder value.
  const [currentTime, setCurrentTime] = useState<number>(-1);
  const [targetTime, setTargetTime] = useState<number>(-1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Animation shared values:
  const headerAnim = useSharedValue(0);
  const firstDropdownAnim = useSharedValue(0);
  const secondDropdownAnim = useSharedValue(0);
  const buttonAnim = useSharedValue(0);

  // Animate header and first drop-down on mount:
  useEffect(() => {
    headerAnim.value = withTiming(1, { duration: 500 });
    firstDropdownAnim.value = withDelay(600, withTiming(1, { duration: 500 }));
  }, [firstDropdownAnim, headerAnim]);

  useEffect(() => {
    console.log('screen time goal screen mounted');
  }, []);

  // Animate second drop-down when first drop-down has a valid value:
  useEffect(() => {
    if (currentTime >= 30) {
      secondDropdownAnim.value = withTiming(1, { duration: 500 });
    } else {
      secondDropdownAnim.value = 0;
      // Also clear second value if first selection is removed.
      setTargetTime(-1);
    }
  }, [currentTime, secondDropdownAnim]);

  // Animate Continue button only when both values are valid:
  useEffect(() => {
    if (currentTime >= 30 && targetTime >= 30) {
      buttonAnim.value = withTiming(1, { duration: 500 });
    } else {
      buttonAnim.value = 0;
    }
  }, [currentTime, targetTime, buttonAnim]);

  // Animated styles:
  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerAnim.value,
    transform: [{ translateY: 20 * (1 - headerAnim.value) }],
  }));

  const firstDropdownAnimatedStyle = useAnimatedStyle(() => ({
    opacity: firstDropdownAnim.value,
    transform: [{ translateY: 20 * (1 - firstDropdownAnim.value) }],
  }));

  const secondDropdownAnimatedStyle = useAnimatedStyle(() => ({
    opacity: secondDropdownAnim.value,
    transform: [{ translateY: 20 * (1 - secondDropdownAnim.value) }],
  }));

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    opacity: buttonAnim.value,
    transform: [{ translateY: 20 * (1 - buttonAnim.value) }],
  }));

  const handleContinue = async () => {
    // Prevent navigation if either drop-down value is invalid or if already submitting
    if (currentTime < 30 || targetTime < 30 || isSubmitting) return;

    setIsSubmitting(true);

    try {
      // 1. Update local state with user store
      updateUser({
        ...user,
        screenTimeGoals: {
          currentTime,
          targetTime,
        },
      });

      // 3. Mark onboarding as COMPLETED (since we're skipping the first-quest screen)
      useOnboardingStore.getState().setCurrentStep(OnboardingStep.GOALS_SET);

      // 4. Update on the server
      await apiClient.patch('/users/me', {
        screenTimeGoals: {
          currentTime,
          targetTime,
        },
      });

      console.log('User screen time goals updated on the server');
    } catch (error) {
      console.error('Error updating user scdreen time goals:', error);
      setIsSubmitting(false);
    }
  };

  // Hide header and drawer for onboarding flow
  useEffect(() => {
    navigation.setOptions({
      headerShown: false,
      gestureEnabled: false,
    });
  }, [navigation]);

  return (
    <View className="flex-1">
      <FocusAwareStatusBar />

      <Image
        source={require('@/../assets/images/background/onboarding.jpg')}
        className="absolute inset-0 size-full"
        resizeMode="cover"
      />

      <View className="flex-1 p-6">
        {/* Animate header & description */}
        <Animated.View style={headerAnimatedStyle} className="mt-[10%] gap-2">
          <Text className="text-xl font-bold">Set Your Goals</Text>
          <Text>
            The journey to better habits starts with acknowledging where we are.
          </Text>
        </Animated.View>

        {/* Animate first drop-down (current daily screen time) */}
        <Animated.View
          style={firstDropdownAnimatedStyle}
          className="mt-[5%] gap-4"
        >
          <Text className="font-semibold">
            What's your current daily screen time?
          </Text>
          <View
            className={`overflow-hidden rounded-lg bg-white ${Platform.OS === 'ios' ? 'h-[150px]' : 'h-[50px]'}`}
          >
            <Picker
              selectedValue={currentTime}
              onValueChange={(itemValue) => setCurrentTime(itemValue)}
              className="w-full"
              itemStyle={{ fontSize: 18, height: 150, color: primary[400] }}
              testID="current-screen-time-picker"
            >
              <Picker.Item
                label="Select current screen time"
                value={-1}
                color={muted[500]}
              />
              {TIME_OPTIONS.map((option) => (
                <Picker.Item
                  key={option.value}
                  label={option.label}
                  value={option.value}
                  color={primary[400]}
                />
              ))}
            </Picker>
          </View>
        </Animated.View>

        {/* Conditionally animate and render the second drop-down (target screen time) only when the first is valid */}
        <Animated.View
          style={secondDropdownAnimatedStyle}
          className="mt-[5%] gap-4"
        >
          <Text className="font-semibold">
            What's your daily screen time goal?
          </Text>
          <View
            className={`overflow-hidden rounded-lg bg-white ${Platform.OS === 'ios' ? 'h-[150px]' : 'h-[50px]'}`}
          >
            <Picker
              selectedValue={targetTime}
              onValueChange={(itemValue) => setTargetTime(itemValue)}
              className="w-full"
              itemStyle={{ fontSize: 18, height: 150, color: primary[400] }}
              testID="target-screen-time-picker"
            >
              <Picker.Item
                label="Select target screen time"
                value={-1}
                color={muted[500]}
              />
              {TIME_OPTIONS.map((option) => (
                <Picker.Item
                  key={option.value}
                  label={option.label}
                  value={option.value}
                  color={primary[400]}
                />
              ))}
            </Picker>
          </View>
        </Animated.View>

        {/* Animate Continue button (disabled if either value is invalid) */}
        <Animated.View style={buttonAnimatedStyle} className="mt-auto py-6">
          <Button
            label={'Set My Goal'}
            onPress={handleContinue}
            disabled={currentTime < 30 || targetTime < 30 || isSubmitting}
            className={`${currentTime < 30 || targetTime < 30 || isSubmitting ? 'bg-primary-500 opacity-50' : ''}`}
            textClassName="text-white font-bold"
            loading={isSubmitting}
          />
        </Animated.View>
      </View>
    </View>
  );
}
