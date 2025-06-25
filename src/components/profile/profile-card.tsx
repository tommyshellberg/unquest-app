import { Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ImageBackground,
  Pressable,
  TextInput,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import CHARACTERS from '@/app/data/characters';
import { Card, Text, View } from '@/components/ui';
import { updateUserCharacter } from '@/lib/services/user';
import { useCharacterStore } from '@/store/character-store';

type ProfileCardProps = {
  /** The character data to render */
  character: any;
};

export function ProfileCard({ character }: ProfileCardProps) {
  const characterDetails = CHARACTERS.find((c) => c.id === character.type);
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(character.name);
  const [isLoading, setIsLoading] = useState(false);
  const updateCharacter = useCharacterStore((state) => state.updateCharacter);

  // Animation values for success feedback
  const successScale = useSharedValue(1);
  const successOpacity = useSharedValue(0);

  const successAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: successScale.value }],
    opacity: successOpacity.value,
  }));

  const handleSaveName = async () => {
    if (editedName.trim() === character.name) {
      setIsEditing(false);
      return;
    }

    setIsLoading(true);
    try {
      // Update on server
      await updateUserCharacter({ ...character, name: editedName.trim() });

      // Update local store
      updateCharacter({ name: editedName.trim() });

      // Success animation
      successOpacity.value = withSequence(
        withTiming(1, { duration: 200 }),
        withTiming(0, { duration: 800, delay: 400 })
      );
      successScale.value = withSequence(withSpring(1.2), withSpring(1));

      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update character name:', error);
      Alert.alert(
        'Update Failed',
        'Unable to update your character name. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="mx-4 mt-4 overflow-hidden">
      <ImageBackground
        source={characterDetails?.profileImage}
        className="aspect-[1.2] w-full"
        resizeMode="cover"
        imageStyle={{
          position: 'absolute',
          top: -60,
          width: '100%',
        }}
      >
        <View className="flex h-full flex-col justify-between">
          {/* Top area - empty but keeps the layout vertical */}
          <View />

          {/* Bottom section with player info and blur */}
          <BlurView intensity={80} tint="light" className="overflow-hidden p-5">
            <View>
              {/* Name row with edit icon */}
              <View className="flex-row items-center justify-between">
                {isEditing ? (
                  <View className="flex-1 flex-row items-center gap-2">
                    <TextInput
                      value={editedName}
                      onChangeText={setEditedName}
                      className="flex-1 rounded-lg bg-white/80 px-3 py-2 text-lg font-bold"
                      autoFocus
                      maxLength={20}
                      editable={!isLoading}
                    />
                    <Pressable
                      onPress={handleSaveName}
                      className="rounded-full bg-primary-500 p-2"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <ActivityIndicator size="small" color="white" />
                      ) : (
                        <Feather name="check" size={16} color="white" />
                      )}
                    </Pressable>
                    <Pressable
                      onPress={() => {
                        setEditedName(character.name);
                        setIsEditing(false);
                      }}
                      className="rounded-full bg-gray-400 p-2"
                      disabled={isLoading}
                    >
                      <Feather name="x" size={16} color="white" />
                    </Pressable>
                  </View>
                ) : (
                  <View className="flex-row items-center gap-2">
                    <View className="relative">
                      <Text className="text-2xl font-bold">
                        {character.name}
                      </Text>
                      {/* Success checkmark overlay */}
                      <Animated.View
                        style={[
                          successAnimatedStyle,
                          {
                            position: 'absolute',
                            right: -30,
                            top: '50%',
                            marginTop: -12,
                          },
                        ]}
                        pointerEvents="none"
                      >
                        <View className="rounded-full bg-primary-500 p-1">
                          <Feather name="check" size={16} color="white" />
                        </View>
                      </Animated.View>
                    </View>
                    <Pressable
                      onPress={() => setIsEditing(true)}
                      className="rounded-full p-1"
                    >
                      <Feather name="edit-2" size={18} color="#2E948D" />
                    </Pressable>
                  </View>
                )}
              </View>
              {/* Level and character type on second row */}
              <Text className="mt-1 text-gray-700">
                Level {character.level} {characterDetails?.type}
              </Text>
            </View>
          </BlurView>
        </View>
      </ImageBackground>
    </Card>
  );
}
