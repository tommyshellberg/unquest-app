import { Picker } from '@react-native-picker/picker';
import { useNavigation } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Image, Platform } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { Button, FocusAwareStatusBar, Text, View } from '@/components/ui';
import { useAccountStore } from '@/store/account-store';

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
  const router = useRouter();
  const createAccount = useAccountStore((state) => state.createAccount);
  const navigation = useNavigation();

  // Use -1 as the "invalid" placeholder value.
  const [currentTime, setCurrentTime] = useState<number>(-1);
  const [targetTime, setTargetTime] = useState<number>(-1);

  // Animation shared values:
  const headerAnim = useSharedValue(0);
  const firstDropdownAnim = useSharedValue(0);
  const secondDropdownAnim = useSharedValue(0);
  const buttonAnim = useSharedValue(0);

  // Animate header and first drop-down on mount:
  useEffect(() => {
    headerAnim.value = withTiming(1, { duration: 500 });
    firstDropdownAnim.value = withDelay(600, withTiming(1, { duration: 500 }));
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

  const handleContinue = () => {
    // Prevent navigation if either drop-down value is invalid
    if (currentTime < 30 || targetTime < 30) return;
    // Save screen time goals to the account store
    createAccount(currentTime, targetTime);

    // Navigate to home instead of app-introduction
    router.replace('/(app)/home');
  };

  // Hide header and drawer for onboarding flow
  useEffect(() => {
    navigation.setOptions({
      headerShown: false,
      gestureEnabled: false,
    });
  }, [navigation]);

  return (
    <View className="flex-1 bg-gray-900">
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
          <Text className="font-semibold text-white">
            What's your current daily screen time?
          </Text>
          <View
            className={`overflow-hidden rounded-lg bg-amber-100 ${Platform.OS === 'ios' ? 'h-[150px]' : 'h-[50px]'}`}
          >
            <Picker
              selectedValue={currentTime}
              onValueChange={(itemValue) => setCurrentTime(itemValue)}
              className="w-full"
              itemStyle={{ fontSize: 18, height: 150 }}
            >
              <Picker.Item
                label="Select current screen time"
                value={-1}
                color="#ccc"
              />
              {TIME_OPTIONS.map((option) => (
                <Picker.Item
                  key={option.value}
                  label={option.label}
                  value={option.value}
                  color="#334738" // Forest color
                />
              ))}
            </Picker>
          </View>
        </Animated.View>

        {/* Conditionally animate and render the second drop-down (target screen time) only when the first is valid */}
        {currentTime >= 30 && (
          <Animated.View
            style={secondDropdownAnimatedStyle}
            className="mt-[5%] gap-4"
          >
            <Text className="text-base font-semibold text-white">
              What's your daily screen time goal?
            </Text>
            <View
              className={`overflow-hidden rounded-lg bg-amber-100 ${Platform.OS === 'ios' ? 'h-[150px]' : 'h-[50px]'}`}
            >
              <Picker
                selectedValue={targetTime}
                onValueChange={(itemValue) => setTargetTime(itemValue)}
                className="w-full"
                itemStyle={{ fontSize: 18, height: 150 }}
              >
                <Picker.Item
                  label="Select target screen time"
                  value={-1}
                  color="#ccc"
                />
                {TIME_OPTIONS.map((option) => (
                  <Picker.Item
                    key={option.value}
                    label={option.label}
                    value={option.value}
                    color="#334738" // Forest color
                  />
                ))}
              </Picker>
            </View>
          </Animated.View>
        )}

        {/* Animate Continue button (disabled if either value is invalid) */}
        <Animated.View style={buttonAnimatedStyle} className="mt-auto py-6">
          <Button
            label="Set My Goal"
            onPress={handleContinue}
            disabled={currentTime < 30 || targetTime < 30}
            className={`${currentTime < 30 || targetTime < 30 ? 'bg-gray-500 opacity-50' : ''}`}
          />
        </Animated.View>
      </View>
    </View>
  );
}
