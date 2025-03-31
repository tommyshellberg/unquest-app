import { useRouter } from 'expo-router';
import React from 'react';

import {
  Button,
  FocusAwareStatusBar,
  Image,
  SafeAreaView,
  Text,
  View,
} from '@/components/ui';
import { useIsFirstTime } from '@/lib/hooks';

export default function Onboarding() {
  const [_, setIsFirstTime] = useIsFirstTime();
  const router = useRouter();

  const handleGetStarted = () => {
    // Mark that it's no longer first time, then navigate to login
    setIsFirstTime(false);
    router.replace('/login');
  };

  return (
    <View className="flex h-full">
      <FocusAwareStatusBar />

      {/* Background image using Cover component */}
      <View className="absolute inset-0 w-full flex-1">
        <Image
          source={require('@/../assets/images/background/onboarding.jpg')}
          style={{ width: '100%', height: '100%' }}
        />
      </View>

      <View className="flex-1 px-6 py-4">
        {/* Top logo and title section */}
        <View className="mt-8 items-center">
          <Image
            source={require('@/../assets/images/unquestlogo-downscaled.png')}
            style={{ width: 120, height: 120 }}
          />
          <Text className="mt-2 text-3xl font-bold">unQuest</Text>
          <Text className="text-lg font-semibold">Level Up By Logging Off</Text>
        </View>

        {/* Middle description section */}
        <View className="flex-1 justify-center">
          <Text className="text-center text-xl">
            The only game that rewards you{'\n'}for not playing it.
          </Text>
        </View>

        {/* Bottom button section */}
        <SafeAreaView className="mb-10">
          <Button
            testID="get-started-button"
            label="Begin Your Journey"
            onPress={handleGetStarted}
          />
        </SafeAreaView>
      </View>
    </View>
  );
}
