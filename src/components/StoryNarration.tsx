import { Feather } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useRef, useState } from 'react';
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

export function StoryNarration({ quest }: Props) {
  const progressBarRef = useRef<ProgressBarRef>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const appStateRef = useRef(AppState.currentState);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);
  const [audioInitialized, setAudioInitialized] = useState(false);

  // Derived state - no useEffect needed (React best practice)
  const progress = duration > 0 ? position / duration : 0;
  const isCompleted = duration > 0 && position >= duration && !isPlaying;

  // Initialize audio - only runs once when component mounts
  React.useEffect(() => {
    let isMounted = true;

    const initializeAudio = async () => {
      try {
        // Set audio mode
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          shouldDuckAndroid: true,
        });

        // Load the audio file - quest.audioFile is already the required asset
        if (!quest.audioFile) {
          throw new Error('No audio file provided');
        }

        const { sound, status } = await Audio.Sound.createAsync(
          quest.audioFile,
          { shouldPlay: false },
          onPlaybackStatusUpdate
        );

        if (!isMounted) {
          await sound.unloadAsync();
          return;
        }

        soundRef.current = sound;

        if (status.isLoaded) {
          setDuration(status.durationMillis || 0);
          setAudioInitialized(true);
        }

        // Add a small delay on Android to ensure the audio system is fully ready
        if (Platform.OS === 'android') {
          setTimeout(() => {
            setIsLoading(false);
          }, 500);
        } else {
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Failed to load audio:', error);
        if (isMounted) {
          setLoadError('Failed to load audio narration');
          setIsLoading(false);
        }
      }
    };

    initializeAudio();

    return () => {
      isMounted = false;
      if (soundRef.current) {
        soundRef.current.unloadAsync().catch(console.error);
        soundRef.current = null;
      }
      stopProgressTracking();
    };
  }, [quest.id]); // Only depend on quest.id, not the entire audioFile object

  // Status update callback - handles all playback state
  const onPlaybackStatusUpdate = (status: Audio.AVPlaybackStatus) => {
    if (!status.isLoaded) return;

    setIsPlaying(status.isPlaying);
    setPosition(status.positionMillis || 0);

    if (status.didJustFinish) {
      setIsPlaying(false);
      setPosition(0);
      stopProgressTracking();
      progressBarRef.current?.setProgress(0);
    }
  };

  // Progress tracking functions
  const startProgressTracking = () => {
    stopProgressTracking();
    progressIntervalRef.current = setInterval(() => {
      if (soundRef.current) {
        soundRef.current.getStatusAsync().catch(() => {
          stopProgressTracking();
        });
      }
    }, 100);
  };

  const stopProgressTracking = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  };

  // Event handlers
  const togglePlayback = async () => {
    if (!soundRef.current) return;

    try {
      if (isPlaying) {
        await soundRef.current.pauseAsync();
        stopProgressTracking();
      } else {
        await soundRef.current.playAsync();
        startProgressTracking();
      }
    } catch (error) {
      console.error('Error toggling playback:', error);
    }
  };

  const handleReplay = async () => {
    if (!soundRef.current) return;

    try {
      await soundRef.current.stopAsync();
      await soundRef.current.playFromPositionAsync(0);
      setPosition(0);
      progressBarRef.current?.setProgress(0);
      startProgressTracking();
    } catch (error) {
      console.error('Error replaying:', error);
    }
  };

  // Handle app state changes
  React.useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (
        appStateRef.current === 'active' &&
        nextAppState.match(/inactive|background/) &&
        soundRef.current &&
        isPlaying
      ) {
        soundRef.current.pauseAsync().catch(console.error);
        stopProgressTracking();
      }
      appStateRef.current = nextAppState;
    };

    const subscription = AppState.addEventListener(
      'change',
      handleAppStateChange
    );
    return () => subscription.remove();
  }, [isPlaying]);

  // Handle navigation focus
  useFocusEffect(
    useCallback(() => {
      return () => {
        if (soundRef.current && isPlaying) {
          soundRef.current.pauseAsync().catch(console.error);
          stopProgressTracking();
        }
      };
    }, [isPlaying])
  );

  // Update progress bar when progress changes
  React.useEffect(() => {
    progressBarRef.current?.setProgress(progress * 100);
  }, [progress]);

  // Format time helper
  const formatTime = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  // Early returns for error and loading states
  if (!quest.audioFile) {
    return null;
  }

  if (loadError) {
    return (
      <View className="bg-background-light mt-4 w-full items-center rounded-lg p-4">
        <Text className="text-red-500">{loadError}</Text>
      </View>
    );
  }

  return (
    <View className="bg-background-light mt-4 w-full rounded-lg p-4">
      {isLoading && (
        <View className="absolute inset-0 z-10 items-center justify-center rounded-lg bg-background-light">
          <Text className="text-sm text-neutral-600">Loading audio...</Text>
        </View>
      )}
      <View className="mb-2 w-full">
        <ProgressBar
          ref={progressBarRef}
          initialProgress={progress * 100}
          className="h-1.5 rounded"
          style={{ backgroundColor: '#e5e5e5' }}
        />
        <View className="mt-1 flex-row justify-between">
          <Text className="text-xs text-neutral-600">
            {formatTime(position)}
          </Text>
          <Text className="text-xs text-neutral-600">
            {formatTime(duration)}
          </Text>
        </View>
      </View>

      <View className="mt-2 flex-row items-center justify-center">
        <Pressable
          className="mx-4 p-2"
          onPress={handleReplay}
          disabled={isLoading || !audioInitialized}
          style={{ opacity: isLoading || !audioInitialized ? 0.3 : 1 }}
        >
          <Feather name="rotate-ccw" size={24} color="#3B7A57" />
        </Pressable>

        {!isCompleted ? (
          <Pressable
            onPress={togglePlayback}
            disabled={isLoading || !audioInitialized}
          >
            <Feather
              name={isPlaying ? 'pause-circle' : 'play-circle'}
              size={32}
              color="#3B7A57"
              style={{ opacity: isLoading || !audioInitialized ? 0.3 : 1 }}
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
