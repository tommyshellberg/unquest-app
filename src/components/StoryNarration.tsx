import { Feather } from '@expo/vector-icons';
import { Audio } from 'expo-av';
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

// Audio mapping to handle cases where we receive a number instead of a proper asset
const AUDIO_ASSETS = {
  'quest-1': require('@/../assets/audio/quest-1.mp3'),
  'quest-1a': require('@/../assets/audio/quest-1a.mp3'),
  'quest-1b': require('@/../assets/audio/quest-1b.mp3'),
  'quest-2': require('@/../assets/audio/quest-2.mp3'),
  'quest-2a': require('@/../assets/audio/quest-2a.mp3'),
  'quest-2b': require('@/../assets/audio/quest-2b.mp3'),
  'quest-3': require('@/../assets/audio/quest-3.mp3'),
  'quest-3a': require('@/../assets/audio/quest-3a.mp3'),
  'quest-3b': require('@/../assets/audio/quest-3b.mp3'),
  'quest-4': require('@/../assets/audio/quest-4.mp3'),
  'quest-4a': require('@/../assets/audio/quest-4a.mp3'),
  'quest-4b': require('@/../assets/audio/quest-4b.mp3'),
  'quest-5': require('@/../assets/audio/quest-5.mp3'),
  'quest-5a': require('@/../assets/audio/quest-5a.mp3'),
  'quest-5b': require('@/../assets/audio/quest-5b.mp3'),
  'quest-6': require('@/../assets/audio/quest-6.mp3'),
  'quest-6a': require('@/../assets/audio/quest-6a.mp3'),
  'quest-6b': require('@/../assets/audio/quest-6b.mp3'),
  'quest-7': require('@/../assets/audio/quest-7.mp3'),
  'quest-7a': require('@/../assets/audio/quest-7a.mp3'),
  'quest-7b': require('@/../assets/audio/quest-7b.mp3'),
  'quest-8': require('@/../assets/audio/quest-8.mp3'),
  'quest-8a': require('@/../assets/audio/quest-8a.mp3'),
  'quest-8b': require('@/../assets/audio/quest-8b.mp3'),
  'quest-9': require('@/../assets/audio/quest-9.mp3'),
  'quest-9a': require('@/../assets/audio/quest-9a.mp3'),
  'quest-9b': require('@/../assets/audio/quest-9b.mp3'),
  'quest-10': require('@/../assets/audio/quest-10.mp3'),
};

export function StoryNarration({ quest }: Props) {
  const progressBarRef = useRef<ProgressBarRef>(null);
  const appStateRef = useRef(AppState.currentState);
  const soundRef = useRef<Audio.Sound | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { id } = quest;

  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  // Prepare audio source based on platform
  const resolveAudioSource = () => {
    if (!id) return null;

    if (Platform.OS === 'android' && !__DEV__) {
      // For Android production builds, use Asset module
      const asset = Audio.Sound.createAsync({ uri: `asset:///raw/${id}` });
      return asset;
    }

    // For iOS and dev builds, use the require'd file
    return AUDIO_ASSETS[id];
  };

  // Initialize Audio
  useEffect(() => {
    const initAudio = async () => {
      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          shouldDuckAndroid: true,
        });
      } catch (error) {
        console.error('Failed to set audio mode:', error);
      }
    };

    initAudio();

    return () => {
      // Clean up
      if (soundRef.current) {
        soundRef.current
          .unloadAsync()
          .catch((e) => console.log('Unload error:', e));
        soundRef.current = null;
      }
      stopProgressTracking();
    };
  }, []);

  // Load audio when component mounts
  useEffect(() => {
    let isMounted = true;

    const loadAudio = async () => {
      try {
        // Clean up any existing sound object
        if (soundRef.current) {
          await soundRef.current.unloadAsync();
          soundRef.current = null;
        }

        const audioSource = resolveAudioSource();
        if (!audioSource) {
          throw new Error('Failed to resolve audio source');
        }

        setIsLoading(true);

        // Create the sound object
        const { sound, status } = await Audio.Sound.createAsync(
          audioSource,
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
        }

        setIsLoading(false);
      } catch (error) {
        console.error('Error loading audio:', error);
        if (isMounted) {
          setLoadError(
            `Failed to load audio: ${error instanceof Error ? error.message : 'unknown error'}`
          );
          setIsLoading(false);
        }
      }
    };

    loadAudio();

    return () => {
      isMounted = false;
    };
  }, [id]);

  // Status update callback
  const onPlaybackStatusUpdate = (status) => {
    if (!status.isLoaded) return;

    setIsPlaying(status.isPlaying);

    if (status.didJustFinish) {
      setIsPlaying(false);
      setProgress(0);
      stopProgressTracking();

      if (progressBarRef.current) {
        progressBarRef.current.setProgress(0);
      }
    }
  };

  // Progress tracking
  const startProgressTracking = () => {
    stopProgressTracking();

    progressIntervalRef.current = setInterval(async () => {
      if (!soundRef.current) {
        stopProgressTracking();
        return;
      }

      try {
        const status = await soundRef.current.getStatusAsync();
        if (status.isLoaded && status.durationMillis) {
          const newProgress = status.positionMillis / status.durationMillis;
          setProgress(newProgress);

          if (progressBarRef.current) {
            progressBarRef.current.setProgress(newProgress * 100);
          }
        }
      } catch (error) {
        console.error('Error getting sound status:', error);
        stopProgressTracking();
      }
    }, 100);
  };

  const stopProgressTracking = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  };

  // Play control
  const togglePlayback = async () => {
    if (!soundRef.current) return;

    try {
      if (isPlaying) {
        await soundRef.current.pauseAsync();
        setIsPlaying(false);
        stopProgressTracking();
      } else {
        await soundRef.current.playAsync();
        setIsPlaying(true);
        startProgressTracking();
      }
    } catch (error) {
      console.error('Error toggling playback:', error);
    }
  };

  // Replay control
  const handleReplay = async () => {
    if (!soundRef.current) return;

    try {
      await soundRef.current.stopAsync();
      await soundRef.current.playFromPositionAsync(0);
      setIsPlaying(true);
      setProgress(0);

      if (progressBarRef.current) {
        progressBarRef.current.setProgress(0);
      }

      startProgressTracking();
    } catch (error) {
      console.error('Error replaying:', error);
    }
  };

  // App state changes
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (
        appStateRef.current === 'active' &&
        nextAppState.match(/inactive|background/)
      ) {
        // Pause playback when app goes to background
        if (soundRef.current && isPlaying) {
          soundRef.current
            .pauseAsync()
            .then(() => setIsPlaying(false))
            .catch((e) =>
              console.error('Error pausing on app state change:', e)
            );
          stopProgressTracking();
        }
      }
      appStateRef.current = nextAppState;
    };

    const subscription = AppState.addEventListener(
      'change',
      handleAppStateChange
    );

    return () => {
      subscription.remove();
    };
  }, [isPlaying]);

  // Route focus changes
  useFocusEffect(
    useCallback(() => {
      return () => {
        // Pause when navigating away
        if (soundRef.current && isPlaying) {
          soundRef.current
            .pauseAsync()
            .then(() => setIsPlaying(false))
            .catch((e) => console.error('Error pausing on blur:', e));
          stopProgressTracking();
        }
      };
    }, [isPlaying])
  );

  // Format seconds to MM:SS format
  const formatTime = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  if (loadError) {
    return (
      <View className="bg-background-light mt-4 w-full items-center rounded-lg p-4">
        <Text className="text-red-500">{loadError}</Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View className="bg-background-light mt-4 w-full items-center rounded-lg p-4">
        <Text className="text-neutral-600">Loading audio narration...</Text>
      </View>
    );
  }

  const currentPosition = progress * duration;
  const isCompleted = duration > 0 && currentPosition >= duration && !isPlaying;

  // Render player UI
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
            {formatTime(currentPosition)}
          </Text>
          <Text className="text-xs text-neutral-600">
            {formatTime(duration)}
          </Text>
        </View>
      </View>

      <View className="mt-2 flex-row items-center justify-center">
        <Pressable className="mx-4 p-2" onPress={handleReplay}>
          <Feather name="rotate-ccw" size={24} color="#3B7A57" />
        </Pressable>

        {!isCompleted ? (
          <Pressable onPress={togglePlayback}>
            <Feather
              name={isPlaying ? 'pause-circle' : 'play-circle'}
              size={32}
              color="#3B7A57"
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
