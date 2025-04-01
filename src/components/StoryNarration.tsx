import { Feather } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import React, { useEffect, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui';
import { ProgressBar, type ProgressBarRef } from '@/components/ui/progress-bar';

type Props = {
  questId: string;
  audioFile?: any; // Accept the audio file directly
};

export function StoryNarration({ questId, audioFile }: Props) {
  const soundRef = useRef<Audio.Sound | null>(null);
  const progressBarRef = useRef<ProgressBarRef>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const componentMountedRef = useRef(true);

  // Set up the mounted ref to track component lifecycle
  useEffect(() => {
    componentMountedRef.current = true;
    console.log('StoryNarration mounted for quest:', questId);

    return () => {
      componentMountedRef.current = false;
      console.log('StoryNarration unmounted for quest:', questId);
    };
  }, [questId]);

  // Load audio when component mounts
  useEffect(() => {
    // If no audio file is provided, set an error and don't try to load
    if (!audioFile) {
      setLoadError('No audio file available for this quest');
      setIsLoading(false);
      return;
    }

    const loadAudio = async () => {
      try {
        console.log(`Loading audio for quest: ${questId}`);

        // Configure audio session for playback
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          shouldDuckAndroid: true,
        });

        // Create the sound object directly without asset downloading
        const { sound } = await Audio.Sound.createAsync(
          audioFile,
          { shouldPlay: false },
          (status) => {
            if (!componentMountedRef.current) return;

            if (status.isLoaded) {
              setIsPlaying(status.isPlaying);

              if (status.durationMillis && duration === 0) {
                setDuration(status.durationMillis);
              }

              if (status.didJustFinish) {
                setIsPlaying(false);
                setProgress(0);
                progressBarRef.current?.setProgress(0);
                stopProgressTracking();
              }
            }
          }
        );

        if (!componentMountedRef.current) {
          // Component unmounted during loading, clean up
          await sound.unloadAsync();
          return;
        }

        soundRef.current = sound;
        setIsLoading(false);

        // Wait a moment before trying to play
        setTimeout(() => {
          if (componentMountedRef.current) {
            playSound();
          }
        }, 1000);

        console.log(`Audio for quest ${questId} loaded successfully`);
      } catch (error) {
        console.error(`Error loading audio for quest ${questId}:`, error);
        if (componentMountedRef.current) {
          setLoadError(`Failed to load audio: ${error.message}`);
          setIsLoading(false);
        }
      }
    };

    loadAudio();

    return () => {
      // Clean up on unmount
      if (soundRef.current) {
        soundRef.current
          .unloadAsync()
          .catch((e) => console.log('Unload error:', e));
      }
    };
  }, [questId, audioFile]);

  // Function to play the audio narration
  async function playSound() {
    if (!componentMountedRef.current) return;

    if (soundRef.current && isPlaying) {
      console.log('Sound already playing');
      return;
    }

    if (isLoading) {
      console.log('Still loading audio, waiting...');
      return;
    }

    if (loadError || !audioFile) {
      console.log(
        'Audio loading failed or not available, not attempting playback'
      );
      return;
    }

    try {
      if (soundRef.current) {
        console.log('Playing sound for quest:', questId);
        await soundRef.current.playAsync();
        setIsPlaying(true);
        startProgressTracking();
      }
    } catch (error) {
      console.error('Error playing sound:', error);
      setLoadError(`Failed to play audio: ${error.message}`);
    }
  }

  const startProgressTracking = () => {
    if (!componentMountedRef.current) return;

    // Clear any existing interval
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }

    // Update progress every 100ms
    progressIntervalRef.current = setInterval(async () => {
      if (!componentMountedRef.current || !soundRef.current) {
        stopProgressTracking();
        return;
      }

      try {
        const status = await soundRef.current.getStatusAsync();
        if (status.isLoaded && status.durationMillis) {
          const newProgress = status.positionMillis / status.durationMillis;
          setProgress(newProgress);
          progressBarRef.current?.setProgress(newProgress * 100);
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

  async function pauseSound() {
    if (!componentMountedRef.current) return;

    if (soundRef.current && isPlaying) {
      try {
        await soundRef.current.pauseAsync();
        setIsPlaying(false);
        stopProgressTracking();
      } catch (error) {
        console.error('Error pausing sound:', error);
      }
    }
  }

  async function replaySound() {
    if (!componentMountedRef.current) return;

    if (soundRef.current) {
      try {
        await soundRef.current.stopAsync();
        await soundRef.current.playFromPositionAsync(0);
        setIsPlaying(true);
        setProgress(0);
        progressBarRef.current?.setProgress(0);
        startProgressTracking();
      } catch (error) {
        console.error('Error replaying sound:', error);
      }
    } else {
      // If sound was unloaded, reload it
      playSound();
    }
  }

  // Ensure cleanup happens when component unmounts
  useEffect(() => {
    return () => {
      console.log('Unmounting StoryNarration for quest:', questId);
      stopProgressTracking();

      if (soundRef.current) {
        soundRef.current
          .unloadAsync()
          .catch((e) => console.log('Unload error:', e));
        soundRef.current = null;
      }
    };
  }, []);

  // Format milliseconds to MM:SS
  const formatTime = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  // Calculate current position in milliseconds
  const currentPosition = Math.floor(progress * duration);

  // If there's no audio file, don't render the component
  if (!audioFile) {
    return null;
  }

  return (
    <View className="bg-background-light mt-4 w-full rounded-lg p-4">
      {loadError ? (
        <View>
          <Text className="text-error mb-2 text-center">{loadError}</Text>
          <Pressable
            className="mt-2 self-center rounded bg-[#3B7A57] p-2"
            onPress={() => {
              setLoadError(null);
              setIsLoading(true);
              // Try to reload the audio
              if (soundRef.current) {
                soundRef.current
                  .unloadAsync()
                  .catch((e) => console.log('Unload error:', e));
                soundRef.current = null;
              }

              // Wait a moment before trying to reload
              setTimeout(() => {
                if (componentMountedRef.current) {
                  // Create the sound object directly
                  Audio.Sound.createAsync(
                    audioFile,
                    { shouldPlay: true },
                    (status) => {
                      if (!componentMountedRef.current) return;

                      if (status.isLoaded) {
                        setIsPlaying(status.isPlaying);

                        if (status.durationMillis) {
                          setDuration(status.durationMillis);
                        }

                        if (status.didJustFinish) {
                          setIsPlaying(false);
                          setProgress(0);
                          progressBarRef.current?.setProgress(0);
                          stopProgressTracking();
                        }
                      }
                    }
                  )
                    .then(({ sound }) => {
                      soundRef.current = sound;
                      setIsLoading(false);
                      startProgressTracking();
                    })
                    .catch((error) => {
                      console.error('Error reloading audio:', error);
                      setLoadError(`Failed to reload audio: ${error.message}`);
                      setIsLoading(false);
                    });
                }
              }, 500);
            }}
          >
            <Text className="text-cream text-sm">Tap to retry</Text>
          </Pressable>
        </View>
      ) : (
        <>
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
            <Pressable
              className="mx-4 p-2"
              onPress={replaySound}
              disabled={isLoading}
            >
              <Feather name="rotate-ccw" size={24} color="#3B7A57" />
            </Pressable>

            <Pressable
              onPress={isPlaying ? pauseSound : playSound}
              disabled={isLoading}
            >
              <Feather
                name={isPlaying ? 'pause-circle' : 'play-circle'}
                size={32}
                color="#3B7A57"
                style={isLoading ? { opacity: 0.5 } : undefined}
              />
            </Pressable>
          </View>
        </>
      )}
    </View>
  );
}
