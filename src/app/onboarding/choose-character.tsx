import { BlurView } from 'expo-blur';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Animated,
  Dimensions,
  FlatList,
  Image,
  ImageBackground,
  TextInput,
} from 'react-native';
import { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';

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
              intensity={90}
              tint="light"
              className="overflow-hidden p-4"
            >
              <Text
                className="mb-1 text-2xl font-bold"
                style={{
                  color: primary[500],
                  letterSpacing: 1,
                }}
              >
                {item.type.toUpperCase()}
              </Text>

              {/* Character Title - Now smaller and supportive */}
              <Text>{item.title}</Text>
            </BlurView>

            {/* Bottom section with description - now using BlurView */}
            <BlurView
              intensity={90}
              tint="light"
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

  // Initialize with the first character selected
  const [selectedCharacter, setSelectedCharacter] = useState<string>(
    CHARACTERS[0].id
  );
  const [inputName, setInputName] = useState<string>('');
  const [debouncedName, setDebouncedName] = useState<string>('');

  // Shared values for animation: for scroll container and button
  // These must be declared before any conditional returns
  const scrollContainerOpacity = useSharedValue(1); // Start visible
  const buttonOpacity = useSharedValue(1); // Start visible

  // Animated styles for container and continue button.
  const animatedScrollStyle = useAnimatedStyle(() => ({
    opacity: scrollContainerOpacity.value,
  }));

  const animatedButtonStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
  }));

  // Memoized renderItem callback for FlatList - must be declared before conditional returns
  const renderItem = useCallback(
    ({ item }: { item: (typeof CHARACTERS)[0] }) => {
      const isSelected = selectedCharacter === item.id;
      return <CardComponent item={item} isSelected={isSelected} />;
    },
    [selectedCharacter]
  );

  // Debounce the input name: update debouncedName 500ms after user stops typing.
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedName(inputName);
    }, 500);
    return () => clearTimeout(handler);
  }, [inputName]);

  const handleContinue = async () => {
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
      console.log('updating character on server');
      // 2. Update the user's character on the server
      await updateUserCharacter(newCharacter as Character);

      console.log('character updated on server');
    } catch (error) {
      console.log('Error updating user character on the server', error);
    } finally {
      console.log('setting character selected step');
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

      <View className="mb-4 mt-12 gap-4 p-6">
        <Text className="text-xl font-bold">Choose Your Character</Text>
      </View>

      <View className="mb-10 px-6">
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
      </View>

      <View className="mx-6 mb-2">
        <Text>Next, choose a character type.</Text>
      </View>

      <Animated.View className="mb-4 flex-1" style={animatedScrollStyle}>
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
      <Animated.View style={animatedButtonStyle}>
        <View className="p-6">
          <Button
            label="Continue"
            onPress={handleContinue}
            disabled={!debouncedName.trim()}
            className={`rounded-xl bg-primary-500 ${!debouncedName.trim() ? 'opacity-50' : ''}`}
            textClassName="text-white font-bold"
          />
        </View>
      </Animated.View>
    </View>
  );
}
