import { Feather } from '@expo/vector-icons';
import { AudioModule, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AppState,
  type AppStateStatus,
  Platform,
  Pressable,
  View,
} from 'react-native';

import { Text } from '@/components/ui';
import { ProgressBar, type ProgressBarRef } from '@/components/ui/progress-bar';
import { type StoryQuestTemplate } from '@/store/types';

type Props = {
  quest: StoryQuestTemplate;
};

// Create a mapping of paths to actual assets
const AUDIO_ASSETS = {
  '@/../assets/audio/quest-1.mp3': require('@/../assets/audio/quest-1.mp3'),
  '@/../assets/audio/quest-1a.mp3': require('@/../assets/audio/quest-1a.mp3'),
  '@/../assets/audio/quest-1b.mp3': require('@/../assets/audio/quest-1b.mp3'),
  '@/../assets/audio/quest-2.mp3': require('@/../assets/audio/quest-2.mp3'),
  '@/../assets/audio/quest-2a.mp3': require('@/../assets/audio/quest-2a.mp3'),
  '@/../assets/audio/quest-2b.mp3': require('@/../assets/audio/quest-2b.mp3'),
  '@/../assets/audio/quest-3.mp3': require('@/../assets/audio/quest-3.mp3'),
  '@/../assets/audio/quest-3a.mp3': require('@/../assets/audio/quest-3a.mp3'),
  '@/../assets/audio/quest-3b.mp3': require('@/../assets/audio/quest-3b.mp3'),
  '@/../assets/audio/quest-4.mp3': require('@/../assets/audio/quest-4.mp3'),
  '@/../assets/audio/quest-4a.mp3': require('@/../assets/audio/quest-4a.mp3'),
  '@/../assets/audio/quest-4b.mp3': require('@/../assets/audio/quest-4b.mp3'),
  '@/../assets/audio/quest-5.mp3': require('@/../assets/audio/quest-5.mp3'),
  '@/../assets/audio/quest-5a.mp3': require('@/../assets/audio/quest-5a.mp3'),
  '@/../assets/audio/quest-5b.mp3': require('@/../assets/audio/quest-5b.mp3'),
  '@/../assets/audio/quest-6.mp3': require('@/../assets/audio/quest-6.mp3'),
  '@/../assets/audio/quest-6a.mp3': require('@/../assets/audio/quest-6a.mp3'),
  '@/../assets/audio/quest-6b.mp3': require('@/../assets/audio/quest-6b.mp3'),
  '@/../assets/audio/quest-7.mp3': require('@/../assets/audio/quest-7.mp3'),
  '@/../assets/audio/quest-7a.mp3': require('@/../assets/audio/quest-7a.mp3'),
  '@/../assets/audio/quest-7b.mp3': require('@/../assets/audio/quest-7b.mp3'),
  '@/../assets/audio/quest-8.mp3': require('@/../assets/audio/quest-8.mp3'),
  '@/../assets/audio/quest-8a.mp3': require('@/../assets/audio/quest-8a.mp3'),
  '@/../assets/audio/quest-8b.mp3': require('@/../assets/audio/quest-8b.mp3'),
  '@/../assets/audio/quest-9.mp3': require('@/../assets/audio/quest-9.mp3'),
  '@/../assets/audio/quest-9a.mp3': require('@/../assets/audio/quest-9a.mp3'),
  '@/../assets/audio/quest-9b.mp3': require('@/../assets/audio/quest-9b.mp3'),
  '@/../assets/audio/quest-10.mp3': require('@/../assets/audio/quest-10.mp3'),
  '@/../assets/audio/quest-10a.mp3': require('@/../assets/audio/quest-10a.mp3'),
  '@/../assets/audio/quest-10b.mp3': require('@/../assets/audio/quest-10b.mp3'),
};

// Non-hook function to get the asset path
const getAssetPath = (audioPath: string) => {
  if (!audioPath) return null;

  // For Android in production mode, we need special handling
  if (Platform.OS === 'android' && !__DEV__) {
    console.log('Android production mode detected, using special URI handling');

    // Extract just the filename from the path
    const fileName = audioPath.split('/').pop()?.split('.')[0];

    if (!fileName) return null;

    // Try the raw resource approach (similar to PR)
    const rawResourceUri = `asset:///raw/${fileName}`;
    console.log(`Using raw resource URI: ${rawResourceUri}`);
    return { uri: rawResourceUri };
  }

  // Check if the path exists in our AUDIO_ASSETS object before accessing it
  if (Object.prototype.hasOwnProperty.call(AUDIO_ASSETS, audioPath)) {
    return AUDIO_ASSETS[audioPath as keyof typeof AUDIO_ASSETS];
  }

  // If it doesn't exist in our mapping, try to handle it as a URI
  console.warn(`Audio asset not found for path: ${audioPath}`);
  return null;
};

export function StoryNarration({ quest }: Props) {
  const progressBarRef = useRef<ProgressBarRef>(null);
  const appStateRef = useRef(AppState.currentState);
  const { audioFile } = quest;

  // State management
  const [audioSource, setAudioSource] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  // Always initialize the player hook, even if we don't have a source yet
  // Use a fallback empty object if no source is available
  const player = useAudioPlayer(audioSource || {});

  // Always get player status, even if loading
  const playerStatus = useAudioPlayerStatus(player);

  // Initialize audio
  useEffect(() => {
    (async () => {
      await AudioModule.setAudioModeAsync({
        playsInSilentMode: true,
      });
    })();
  }, []);

  // Load audio asynchronously
  useEffect(() => {
    const loadAudio = async () => {
      try {
        setIsLoading(true);
        const source = getAssetPath(audioFile);
        setAudioSource(source);
      } catch (error) {
        console.error('Error loading audio:', error);
        setLoadError(error?.message || "Couldn't load audio");
      } finally {
        setIsLoading(false);
      }
    };

    loadAudio();
  }, [audioFile]);

  // Calculate progress percentage based on status
  const progress = playerStatus.duration
    ? playerStatus.currentTime / playerStatus.duration
    : 0;

  // Check if audio has completed playback
  const isCompleted =
    playerStatus.didJustFinish ||
    (playerStatus.duration > 0 &&
      playerStatus.currentTime >= playerStatus.duration &&
      !playerStatus.playing);

  // Pause audio when screen loses focus (navigation)
  useFocusEffect(
    useCallback(() => {
      // Cleanup - pause audio when navigating away
      return () => {
        if (player.playing) {
          player.pause();
        }
      };
    }, [player])
  );

  // Set up app state change listener to pause audio when app goes to background
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (
        appStateRef.current === 'active' &&
        nextAppState.match(/inactive|background/)
      ) {
        // App is going to background, pause audio
        player.pause();
      }
      appStateRef.current = nextAppState;
    };

    const subscription = AppState.addEventListener(
      'change',
      handleAppStateChange
    );

    // Ensure audio is only active in foreground
    AudioModule.setIsAudioActiveAsync(true);

    return () => {
      subscription.remove();
    };
  }, [player]);

  // Update progress bar when position changes
  useEffect(() => {
    // Only update if we have a valid progress bar ref
    if (progressBarRef.current) {
      if (isCompleted) {
        progressBarRef.current.setProgress(100);
      } else {
        progressBarRef.current.setProgress(progress * 100);
      }
    }
  }, [progress, isCompleted]);

  // Format seconds to MM:SS
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  // Handle replay
  const handleReplay = () => {
    if (audioSource) {
      player.seekTo(0);
      try {
        player.play();
      } catch (error) {
        console.error(error);
      }
    }
  };

  // Render based on state
  if (isLoading) {
    return (
      <View className="bg-background-light mt-4 w-full items-center rounded-lg p-4">
        <Text className="text-neutral-600">Loading audio narration...</Text>
      </View>
    );
  }

  if (loadError || !audioSource) {
    return (
      <View className="bg-background-light mt-4 w-full items-center rounded-lg p-4">
        <Text className="text-red-500">
          {loadError || "Couldn't load audio narration"}
        </Text>
      </View>
    );
  }

  // Now render the actual player UI
  return (
    <View className="bg-background-light mt-4 w-full rounded-lg p-4">
      <View className="mb-2 w-full">
        <ProgressBar
          ref={progressBarRef}
          initialProgress={progress * 100}
          className="h-1.5 rounded"
        />
        <View className="mt-1 flex-row justify-between">
          <Text className="text-xs text-neutral-600">
            {formatTime(playerStatus.currentTime)}
          </Text>
          <Text className="text-xs text-neutral-600">
            {formatTime(playerStatus.duration)}
          </Text>
        </View>
      </View>

      <View className="mt-2 flex-row items-center justify-center">
        <Pressable
          className="mx-4 p-2"
          onPress={handleReplay}
          disabled={!playerStatus.isLoaded}
        >
          <Feather
            name="rotate-ccw"
            size={24}
            color="#3B7A57"
            style={!playerStatus.isLoaded ? { opacity: 0.5 } : undefined}
          />
        </Pressable>

        {!isCompleted ? (
          <Pressable
            onPress={() =>
              playerStatus.playing ? player.pause() : player.play()
            }
            disabled={!playerStatus.isLoaded}
          >
            <Feather
              name={playerStatus.playing ? 'pause-circle' : 'play-circle'}
              size={32}
              color="#3B7A57"
              style={!playerStatus.isLoaded ? { opacity: 0.5 } : undefined}
            />
          </Pressable>
        ) : (
          <Feather
            name="play-circle"
            size={32}
            color="#3B7A57"
            style={{ opacity: 0.3 }}
          />
        )}
      </View>
    </View>
  );
}
