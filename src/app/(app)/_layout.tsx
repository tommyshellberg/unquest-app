import { Feather } from '@expo/vector-icons';
import { router, Tabs, useRootNavigationState } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { View } from 'react-native';

import { white } from '@/components/ui/colors';
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
      <View className="bg-secondary-300 size-14 items-center justify-center rounded-full">
        <Feather name="compass" size={28} color={white} />
      </View>
    </View>
  );
}

export default function TabLayout() {
  const status = useAuth.use.status();
  const [isFirstTime] = useIsFirstTime();
  const navigationState = useRootNavigationState();
  const hasRedirectedToCompletedRef = useRef(false);

  // Quest state from store
  const failedQuest = useQuestStore((state) => state.failedQuest);
  const recentCompletedQuest = useQuestStore(
    (state) => state.recentCompletedQuest
  );

  // Activate lock detection for the whole main app.
  useLockStateDetection();

  // Handle completed quest redirect
  useEffect(() => {
    if (!navigationState?.key) return;

    if (recentCompletedQuest && !hasRedirectedToCompletedRef.current) {
      console.log('Redirecting to quest-complete');
      hasRedirectedToCompletedRef.current = true;
      router.replace('/quest-complete');
    }
  }, [recentCompletedQuest, navigationState?.key]);

  // Reset completed quest flag
  useEffect(() => {
    console.log('recentCompletedQuest changed:', recentCompletedQuest);
    if (!recentCompletedQuest) {
      console.log('Resetting completed quest redirect flag to false');
      hasRedirectedToCompletedRef.current = false;
    }
  }, [recentCompletedQuest]);

  // Handle auth and onboarding redirects
  useEffect(() => {
    if (!navigationState?.key) return;

    if (isFirstTime) {
      console.log('routing to onboarding');
      router.replace('/onboarding');
      return;
    }
    if (status === 'signOut') {
      console.log('routing to login');
      router.replace('/login');
      return;
    }
    if (failedQuest) {
      console.log('Redirecting to failed-quest');
      router.replace('/failed-quest');
      return;
    }
  }, [isFirstTime, status, failedQuest, navigationState?.key]);

  // Check if navigation is ready
  if (!navigationState?.key) {
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
          marginBottom: 6,
          paddingTop: 2,
        },
        tabBarStyle: {
          height: 68,
          paddingBottom: 6,
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
          title: 'Fast Quest',
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
