import { Feather } from '@expo/vector-icons';
import {
  router,
  SplashScreen,
  Tabs,
  useRootNavigationState,
} from 'expo-router';
import React, { useCallback, useEffect, useRef } from 'react';
import { View } from 'react-native';

import { useAuth, useIsFirstTime } from '@/lib';
import useLockStateDetection from '@/lib/hooks/useLockStateDetection';
import { useQuestStore } from '@/store/quest-store';

// Tab icon component
function TabBarIcon({ name, color, size = 24, focused = false }) {
  return (
    <Feather
      name={name}
      size={size}
      color={color}
      style={focused ? { opacity: 1 } : { opacity: 0.8 }}
    />
  );
}

// Custom center button component
function CenterButton({ focused, color }) {
  return (
    <View className="-mt-5 items-center justify-center">
      <View className="size-14 items-center justify-center rounded-full bg-teal-600">
        <Feather name="compass" size={26} color="#E7DBC9" />
      </View>
    </View>
  );
}

export default function TabLayout() {
  const status = useAuth.use.status();
  const [isFirstTime] = useIsFirstTime();
  const navigationState = useRootNavigationState();
  const hasRedirectedToCompletedRef = useRef(false);

  // Activate lock detection for the whole main app.
  useLockStateDetection();

  // Quest state from store
  const failedQuest = useQuestStore((state) => state.failedQuest);
  const recentCompletedQuest = useQuestStore(
    (state) => state.recentCompletedQuest
  );

  const hideSplash = useCallback(async () => {
    await SplashScreen.hideAsync();
  }, []);

  useEffect(() => {
    if (status !== 'idle') {
      setTimeout(() => {
        hideSplash();
      }, 1000);
    }
  }, [hideSplash, status]);

  useEffect(() => {
    if (!navigationState?.key) {
      return;
    }

    if (recentCompletedQuest && !hasRedirectedToCompletedRef.current) {
      console.log('Redirecting to quest-complete');
      hasRedirectedToCompletedRef.current = true;
      router.replace('/quest-complete');
    }
  }, [recentCompletedQuest]);

  useEffect(() => {
    console.log('recentCompletedQuest changed:', recentCompletedQuest);
    if (!recentCompletedQuest) {
      console.log('Resetting completed quest redirect flag to false');
      hasRedirectedToCompletedRef.current = false;
    }
  }, [recentCompletedQuest]);

  // Check if navigation is ready
  const isNavigationReady = navigationState?.key !== undefined;
  if (!isNavigationReady) {
    return null;
  }

  if (isFirstTime) {
    router.replace('/onboarding');
    return null;
  }
  if (status === 'signOut') {
    router.replace('/login');
    return null;
  }
  if (failedQuest) {
    console.log('Redirecting to failed-quest');
    router.replace('/failed-quest');
    return null;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: '#334738', // Forest color
        tabBarInactiveTintColor: '#666666',
        tabBarLabelStyle: {
          fontSize: 12,
          marginBottom: 4,
        },
        tabBarStyle: {
          height: 60,
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E5E5E5',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="home" color={color} focused={focused} />
          ),
          tabBarButtonTestID: 'home-tab',
        }}
      />

      <Tabs.Screen
        name="map"
        options={{
          title: 'Map',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="map" color={color} focused={focused} />
          ),
          tabBarButtonTestID: 'map-tab',
        }}
      />

      <Tabs.Screen
        name="custom-quest"
        options={{
          title: 'Quick Quest',
          tabBarIcon: ({ focused, color }) => (
            <CenterButton focused={focused} color={color} />
          ),
          tabBarButtonTestID: 'quick-quest-tab',
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="user" color={color} focused={focused} />
          ),
          tabBarButtonTestID: 'profile-tab',
        }}
      />

      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="settings" color={color} focused={focused} />
          ),
          tabBarButtonTestID: 'settings-tab',
        }}
      />

      {/* Hide special screens from tabs */}
      <Tabs.Screen
        name="active-quest"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="quest-complete"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="failed-quest"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
