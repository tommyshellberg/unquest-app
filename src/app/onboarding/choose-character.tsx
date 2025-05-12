import { BlurView } from 'expo-blur';
import { usePostHog } from 'posthog-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  ImageBackground,
  Platform,
  TextInput,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInLeft,
} from 'react-native-reanimated';

import { Button, FocusAwareStatusBar, Text, View } from '@/components/ui';
import { Card } from '@/components/ui/card';
import { primary } from '@/components/ui/colors';
import { updateUserCharacter } from '@/lib/services/user';
import { useCharacterStore } from '@/store/character-store';
import { OnboardingStep, useOnboardingStore } from '@/store/onboarding-store';
import { type Character, type CharacterType } from '@/store/types';

import CHARACTERS from '../data/characters';

// Get screen dimensions and define card dimensions
const screenWidth = Dimensions.get('window').width;
const cardWidth = screenWidth * 0.75; // each card takes 75% of screen width
const snapInterval = cardWidth;

// --- Card Component ---
interface CardProps {
  item: (typeof CHARACTERS)[0];
  isSelected: boolean;
}

const CardComponent = ({ item, isSelected }: CardProps) => {
  return (
    <View
      className="items-center justify-center px-2"
      style={{ width: cardWidth }}
    >
      <Card
        className={`elevation-2 aspect-[0.75] w-full overflow-hidden ${isSelected ? 'scale-100' : 'scale-90 opacity-60'}`}
      >
        <ImageBackground
          source={item.image}
          className="size-full"
          resizeMode="cover"
        >
          <View className="flex h-full flex-col justify-between">
            <BlurView
              intensity={10}
              tint="light"
              className="overflow-hidden p-4"
            >
              <Text
                className="text-xl font-bold"
                style={{
                  color: primary[500],
                  letterSpacing: 1,
                }}
              >
                {item.type.toUpperCase()}
              </Text>
            </BlurView>

            {/* Bottom section with description - now using BlurView */}
            <BlurView
              intensity={Platform.OS === 'ios' ? 50 : 100}
              tint="extraLight"
              className="mt-auto overflow-hidden p-4"
            >
              {/* Character Description */}
              <Text>{item.description}</Text>
            </BlurView>
          </View>
        </ImageBackground>
      </Card>
    </View>
  );
};

export default function ChooseCharacterScreen() {
  const createCharacter = useCharacterStore((state) => state.createCharacter);
  const posthog = usePostHog();
  // Initialize with the first character selected
  const [selectedCharacter, setSelectedCharacter] = useState<string>(
    CHARACTERS[0].id
  );
  const [inputName, setInputName] = useState<string>('');
  const [debouncedName, setDebouncedName] = useState<string>('');

  // Memoized renderItem callback for FlatList - must be declared before conditional returns
  const renderItem = useCallback(
    ({ item }: { item: (typeof CHARACTERS)[0] }) => {
      const isSelected = selectedCharacter === item.id;
      return <CardComponent item={item} isSelected={isSelected} />;
    },
    [selectedCharacter]
  );

  useEffect(() => {
    posthog.capture('onboarding_open_choose_character_screen');
  }, [posthog]);

  // Debounce the input name: update debouncedName 500ms after user stops typing.
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedName(inputName);
    }, 500);
    return () => clearTimeout(handler);
  }, [inputName]);

  const handleContinue = async () => {
    posthog.capture('onboarding_trigger_continue_choose_character');
    if (!debouncedName.trim()) return;
    const selected = CHARACTERS.find((c) => c.id === selectedCharacter);
    if (!selected) return;

    try {
      // Create the new character object
      const newCharacter = {
        level: 1,
        currentXP: 0,
        xpToNextLevel: 100,
        type: selected.id,
        name: debouncedName.trim(),
      };

      // 1. First update local character store
      createCharacter(selected.id as CharacterType, debouncedName.trim());
      posthog.capture('onboarding_update_character_local_store');
      // 2. Update the user's character on the server
      await updateUserCharacter(newCharacter as Character);
      posthog.capture('onboarding_update_character_server');
    } catch (error) {
      posthog.capture('onboarding_update_character_server_error');
    } finally {
      useOnboardingStore
        .getState()
        .setCurrentStep(OnboardingStep.CHARACTER_SELECTED);
    }
  };

  return (
    <View className="flex-1">
      <FocusAwareStatusBar />

      <View className="absolute inset-0">
        <Image
          source={require('@/../assets/images/background/onboarding.jpg')}
          className="size-full"
          resizeMode="cover"
        />
        <View className="absolute inset-0 bg-white/10" />
      </View>

      <Animated.View
        className="mb-4 mt-12 gap-4 p-6"
        entering={FadeInLeft.delay(100)}
      >
        <Text className="text-xl font-bold">Choose Your Character</Text>
      </Animated.View>

      <Animated.View className="mb-10 px-6" entering={FadeInDown.delay(600)}>
        <Text className="mb-2">Name Your Character</Text>
        <TextInput
          className="h-10 rounded border px-2 text-primary-400 placeholder:text-muted-200 dark:text-primary-400 dark:placeholder:text-muted-200"
          value={inputName}
          onChangeText={(text) => {
            const filtered = text.replace(/[^a-zA-Z0-9\s]/g, '');
            setInputName(filtered);
          }}
          placeholder="Enter character name"
          testID="character-name-input"
        />
      </Animated.View>

      <Animated.View className="mx-6 mb-2" entering={FadeInDown.delay(1100)}>
        <Text>Next, choose a character type.</Text>
      </Animated.View>

      <Animated.View className="mb-4 flex-1" entering={FadeIn.delay(1600)}>
        <FlatList
          data={CHARACTERS}
          horizontal
          testID="character-carousel"
          snapToInterval={snapInterval}
          decelerationRate="fast"
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id}
          initialScrollIndex={0} // Start at the first item
          getItemLayout={(_data, index) => ({
            length: cardWidth,
            offset: cardWidth * index,
            index,
          })}
          contentContainerStyle={{
            paddingHorizontal: (screenWidth - cardWidth) / 2,
          }}
          onMomentumScrollEnd={(event) => {
            const offsetX = event.nativeEvent.contentOffset.x;
            const newIndex = Math.round(offsetX / snapInterval);
            setSelectedCharacter(CHARACTERS[newIndex].id);
          }}
          renderItem={renderItem}
          removeClippedSubviews={true} // improves performance by clipping offscreen items
        />
      </Animated.View>

      {/* Continue Button */}
      <Animated.View className="p-6" entering={FadeIn.delay(2100)}>
        <Button
          label="Continue"
          onPress={handleContinue}
          disabled={!debouncedName.trim()}
          className={`rounded-xl bg-primary-500 ${!debouncedName.trim() ? 'opacity-50' : ''}`}
          textClassName="text-white font-bold"
        />
      </Animated.View>
    </View>
  );
}
