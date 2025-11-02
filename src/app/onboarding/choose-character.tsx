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
import { createProvisionalUser } from '@/lib/services/user';
import { useCharacterStore } from '@/store/character-store';
import { OnboardingStep, useOnboardingStore } from '@/store/onboarding-store';
import { type Character, type CharacterType } from '@/store/types';

import CHARACTERS from '../data/characters';

// Local steps for this screen's flow
enum CharacterStep {
  INTRO_AND_NAME = 'intro_and_name',
  CHARACTER_SELECTION = 'character_selection',
}

// Get screen dimensions and define card dimensions
const screenWidth = Dimensions.get('window').width;
const cardWidth = screenWidth * 0.65; // 65% of screen width to show more of adjacent cards
const cardSpacing = 16; // Space between cards
const snapInterval = cardWidth + cardSpacing;

// --- Card Component ---
interface CardProps {
  item: (typeof CHARACTERS)[0];
  isSelected: boolean;
}

const CardComponent = ({ item, isSelected }: CardProps) => {
  return (
    <View className="items-center justify-center" style={{ width: cardWidth }}>
      <Card
        className={`elevation-2 w-full overflow-hidden ${isSelected ? 'scale-100' : 'scale-90 opacity-60'}`}
        style={{ height: screenWidth * 1.2 }} // Fixed height instead of aspect ratio
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
              className="overflow-hidden px-4 py-3"
            >
              <Text
                className="text-lg font-bold leading-tight"
                style={{
                  color: primary[500],
                  letterSpacing: 1,
                }}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {item.type.toUpperCase()}
              </Text>
            </BlurView>

            {/* Bottom section with description */}
            <BlurView
              intensity={Platform.OS === 'ios' ? 50 : 100}
              className="mt-auto overflow-hidden px-4 py-3"
            >
              <Text
                className="leading-relaxed"
                numberOfLines={3}
                ellipsizeMode="tail"
              >
                {item.description}
              </Text>
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

  // Local step state for this screen
  const [currentStep, setCurrentStep] = useState<CharacterStep>(
    CharacterStep.INTRO_AND_NAME
  );

  // Initialize with the first character selected
  const [selectedCharacter, setSelectedCharacter] = useState<string>(
    CHARACTERS[0].id
  );
  const [inputName, setInputName] = useState<string>('');
  const [debouncedName, setDebouncedName] = useState<string>('');
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
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

  // Clear error when user changes inputs
  useEffect(() => {
    if (error) {
      setError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedName, selectedCharacter]);

  // Handle step progression
  const handleStepForward = () => {
    switch (currentStep) {
      case CharacterStep.INTRO_AND_NAME:
        if (debouncedName.trim()) {
          setCurrentStep(CharacterStep.CHARACTER_SELECTION);
        }
        break;
      case CharacterStep.CHARACTER_SELECTION:
        handleContinue();
        break;
    }
  };

  const renderIntroAndName = () => {
    return (
      <View key="intro-and-name">
        <Animated.View entering={FadeInLeft.delay(100)}>
          <Text className="text-3xl font-bold">Your Character</Text>
        </Animated.View>
        <Animated.View entering={FadeInDown.delay(600)}>
          <Text className="mb-6 mt-1 text-lg font-bold leading-relaxed">
            Your companion on this journey
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(1100)}>
          <Text className="mb-4">
            Choose a character that reflects your personality. Each character
            offers a different approach to mindfulness and balance.
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(1600)}>
          <Text className="mb-6">
            In future updates, characters will gain unique abilities to help
            complete quests and earn rewards.
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(2100)}>
          <Text className="mb-2">Character Name</Text>
          <TextInput
            className="flex h-14 items-center rounded-lg border border-gray-300 px-4 text-lg text-white placeholder:text-muted-200"
            style={{ textAlignVertical: 'center' }}
            value={inputName}
            onChangeText={(text) => {
              const filtered = text.replace(/[^a-zA-Z0-9\s]/g, '');
              setInputName(filtered);
            }}
            placeholder="Enter character name"
            testID="character-name-input"
            autoFocus
          />
        </Animated.View>
      </View>
    );
  };

  const renderCharacterSelection = () => {
    return (
      <View key="character-selection" className="flex-1">
        <Animated.View entering={FadeInLeft.delay(100)}>
          <Text className="text-3xl font-bold">Hello, {debouncedName}</Text>
        </Animated.View>
        <Animated.View entering={FadeInLeft.delay(600)}>
          <Text className="mt-1 text-lg font-bold leading-relaxed">
            It's time to choose your hero.
          </Text>
        </Animated.View>
        <Animated.View entering={FadeInDown.delay(1000)}>
          <Text className="mt-6 text-base leading-relaxed">
            Each hero brings unique strengths.
          </Text>
          <Text className="mb-6 text-base leading-relaxed">
            Future updates will unlock special abilities and perks.
          </Text>
        </Animated.View>

        <Animated.View className="-mx-6 flex-1" entering={FadeIn.delay(1100)}>
          <FlatList
            data={CHARACTERS}
            horizontal
            testID="character-carousel"
            snapToInterval={snapInterval}
            decelerationRate="fast"
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id}
            initialScrollIndex={0}
            getItemLayout={(_data, index) => ({
              length: snapInterval,
              offset: snapInterval * index,
              index,
            })}
            contentContainerStyle={{
              paddingHorizontal: (screenWidth - cardWidth - cardSpacing) / 2,
            }}
            ItemSeparatorComponent={() => (
              <View style={{ width: cardSpacing }} />
            )}
            onMomentumScrollEnd={(event) => {
              const offsetX = event.nativeEvent.contentOffset.x;
              const newIndex = Math.round(offsetX / snapInterval);
              setSelectedCharacter(CHARACTERS[newIndex].id);
            }}
            renderItem={renderItem}
            removeClippedSubviews={true}
          />
        </Animated.View>
      </View>
    );
  };

  // Render content based on current step
  const renderStepContent = () => {
    switch (currentStep) {
      case CharacterStep.INTRO_AND_NAME:
        return renderIntroAndName();

      case CharacterStep.CHARACTER_SELECTION:
        return renderCharacterSelection();
      default:
        console.error('unexpected CharacterStep value: ', currentStep);
        return renderIntroAndName();
    }
  };

  // Get button text based on current step
  const getButtonText = () => {
    switch (currentStep) {
      case CharacterStep.INTRO_AND_NAME:
        return 'Continue';
      case CharacterStep.CHARACTER_SELECTION:
        return isCreating ? 'Creating...' : 'Create Character';
      default:
        return 'Continue';
    }
  };

  // Check if current step can proceed
  const canProceed = () => {
    switch (currentStep) {
      case CharacterStep.INTRO_AND_NAME:
        return debouncedName.trim().length > 0;
      case CharacterStep.CHARACTER_SELECTION:
        return debouncedName.trim().length > 0 && !isCreating;
      default:
        return false;
    }
  };

  const handleContinue = async () => {
    if (!debouncedName.trim() || isCreating) return;

    const selected = CHARACTERS.find((c) => c.id === selectedCharacter);
    if (!selected) return;

    setIsCreating(true);
    setError(null);

    try {
      posthog.capture('onboarding_trigger_continue_choose_character');

      // Create the new character object
      const newCharacter = {
        type: selected.id,
        name: debouncedName.trim(),
      };

      // 1. First update local character store
      createCharacter(selected.id as CharacterType, debouncedName.trim());
      posthog.capture('onboarding_update_character_local_store_success');

      // 2. Create a provisional user on the server
      await createProvisionalUser(newCharacter as Character);
      posthog.capture('onboarding_create_provisional_user_success');

      // Only proceed if both operations succeeded
      useOnboardingStore
        .getState()
        .setCurrentStep(OnboardingStep.VIEWING_INTRO);
    } catch (error: unknown) {
      // Handle specific error types
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      if (errorMessage === 'STORAGE_UNAVAILABLE') {
        posthog.capture('onboarding_storage_unavailable');
        setError(
          'Unable to access device storage. Please check storage permissions and available space.'
        );
        return; // Don't reset character store
      }

      if (errorMessage === 'PROVISIONAL_EMAIL_TAKEN') {
        posthog.capture('onboarding_provisional_email_taken');
        // This is recoverable - the provisional account already exists, so we can continue
        useOnboardingStore
          .getState()
          .setCurrentStep(OnboardingStep.VIEWING_INTRO);
      } else {
        // For all other errors, don't proceed and show error to user
        posthog.capture('onboarding_create_provisional_user_error', {
          error: errorMessage,
        });

        // Reset character store since we couldn't create provisional account
        useCharacterStore.getState().resetCharacter();

        // Show user-friendly error message
        if (
          errorMessage.includes('network') ||
          errorMessage.includes('fetch')
        ) {
          setError(
            'Network error. Please check your connection and try again.'
          );
        } else if (
          errorMessage.includes('server') ||
          errorMessage.includes('500')
        ) {
          setError('Server error. Please try again in a moment.');
        } else {
          setError('Failed to create account. Please try again.');
        }
      }
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <View className="flex-1">
      <FocusAwareStatusBar />

      <View className="absolute inset-0">
        <Image
          source={require('@/../assets/images/background/onboarding-bg.jpg')}
          className="size-full"
          resizeMode="cover"
        />
        <View className="absolute inset-0 bg-white/10" />
      </View>

      <View className="flex-1 justify-between p-6">
        {/* Step Content */}
        <View className="mt-6 flex-1">{renderStepContent()}</View>

        {/* Button Section */}
        <Animated.View
          className="mb-6"
          entering={FadeIn.delay(1800)}
          key={`button-${currentStep}`}
        >
          {error && (
            <View className="mb-4 rounded-lg bg-red-100 p-4">
              <Text className="text-center text-red-800">{error}</Text>
            </View>
          )}

          <Button
            label={getButtonText()}
            onPress={handleStepForward}
            disabled={!canProceed()}
            className={`rounded-xl bg-primary-500 ${!canProceed() ? 'opacity-50' : ''}`}
            textClassName="text-white font-bold"
          />
        </Animated.View>
      </View>
    </View>
  );
}
