import { Stack } from 'expo-router';
import React from 'react';
import { StatusBar } from 'react-native';

export default function OnboardingLayout() {
  return (
    <>
      <StatusBar hidden />
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      />
    </>
  );
}
