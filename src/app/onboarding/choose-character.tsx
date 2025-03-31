import { useNavigation } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { memo, useCallback, useEffect, useState } from 'react';
import { Dimensions, FlatList, Image, TextInput } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';

import { Button, FocusAwareStatusBar, Text, View } from '@/components/ui';
import { updateUserCharacter } from '@/lib/services/user';
import { useCharacterStore } from '@/store/character-store';
import { type Character, type CharacterType } from '@/store/types';

import { CHARACTERS } from '../data/characters';

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
    <View className="w-full items-center justify-center">
      <View
        className={`w-full items-center overflow-hidden rounded-lg bg-gray-900 p-4
          ${isSelected ? 'scale-100 border-2 border-amber-100 opacity-100' : 'scale-90 opacity-60'}`}
      >
        {/* Card Header: Display the character type */}
        <Text className="mb-2 text-lg text-amber-100">{item.type}</Text>
        <Text className="mb-2 text-base text-amber-100">{item.title}</Text>

        {/* Card Body: Character image */}
        <View className="mb-2 w-full items-center">
          <Image
            source={item.image}
            className="h-[200px] w-full rounded-md"
            resizeMode="cover"
          />
        </View>

        {/* Card Footer: Character description */}
        <Text className="mb-2 text-center text-base text-amber-100">
          {item.description}
        </Text>
      </View>
    </View>
  );
};

// Memoize the Card so that it only re‑renders when the "isSelected" prop changes.
const Card = memo(CardComponent, (prevProps, nextProps) => {
  return prevProps.isSelected === nextProps.isSelected;
});

export default function ChooseCharacterScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const createCharacter = useCharacterStore((state) => state.createCharacter);

  // Initialize with the first character selected
  const [selectedCharacter, setSelectedCharacter] = useState<string>(
    CHARACTERS[0].id
  );
  const [inputName, setInputName] = useState<string>('');
  const [debouncedName, setDebouncedName] = useState<string>('');

  // Debounce the input name: update debouncedName 500ms after user stops typing.
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedName(inputName);
    }, 500);
    return () => clearTimeout(handler);
  }, [inputName]);

  // Shared values for animation: for scroll container and button
  const scrollContainerOpacity = useSharedValue(1); // Start visible
  const buttonOpacity = useSharedValue(1); // Start visible

  // Animated styles for container and continue button.
  const animatedScrollStyle = useAnimatedStyle(() => ({
    opacity: scrollContainerOpacity.value,
  }));

  const animatedButtonStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
  }));

  // Memoized renderItem callback for FlatList
  const renderItem = useCallback(
    ({ item }: { item: (typeof CHARACTERS)[0] }) => {
      const isSelected = selectedCharacter === item.id;
      return <Card item={item} isSelected={isSelected} />;
    },
    [selectedCharacter]
  );

  const handleContinue = async () => {
    if (!debouncedName.trim()) return;
    const selected = CHARACTERS.find((c) => c.id === selectedCharacter);
    if (!selected) return;

    // Create the new character object.
    const newCharacter = {
      level: 1,
      currentXP: 0,
      xpToNextLevel: 100,
      type: selected.id,
      name: debouncedName.trim(),
    };

    // Update local state
    createCharacter(selected.id as CharacterType, debouncedName.trim());

    // Update the user's character on the server.
    try {
      await updateUserCharacter(newCharacter as Character);
      console.log('User character successfully updated on the server');
    } catch (error) {
      console.error('Error updating user character on the server', error);
    }

    router.push('/onboarding/screen-time-goal');
  };

  // Hide header and drawer for onboarding flow
  useEffect(() => {
    navigation.setOptions({
      headerShown: false,
      gestureEnabled: false, // Disable swipe gesture for drawer
    });
  }, []);

  return (
    <View className="flex-1 bg-gray-900">
      <FocusAwareStatusBar />

      <Image
        source={require('@/../assets/images/background/onboarding.jpg')}
        className="absolute inset-0 size-full"
        resizeMode="cover"
      />

      <View className="mb-4 mt-12 gap-4 p-6">
        <Text className="text-xl font-bold">Choose Your Character</Text>
      </View>

      <View className="mb-10 px-6">
        <Text className="mb-2">Name Your Character</Text>
        <TextInput
          className="h-10 rounded border border-stone-500 px-2 text-white"
          value={inputName}
          onChangeText={(text) => {
            const filtered = text.replace(/[^a-zA-Z0-9\s]/g, '');
            setInputName(filtered);
          }}
          placeholder="Enter character name"
          placeholderTextColor="#E7DBC9"
        />
      </View>

      <Animated.View style={animatedScrollStyle} className="mb-4">
        <View className="mx-6 mb-6">
          <Text>Next, choose a character type.</Text>
        </View>
        <FlatList
          data={CHARACTERS}
          horizontal
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
            className={`rounded-full ${!debouncedName.trim() ? 'bg-gray-500 opacity-50' : ''}`}
          />
        </View>
      </Animated.View>
    </View>
  );
}
