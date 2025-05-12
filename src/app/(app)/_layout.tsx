import { Feather } from '@expo/vector-icons';
import { router, Tabs, usePathname, useRootNavigationState } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { View } from 'react-native';

import { getAccessToken } from '@/api/token';
import { white } from '@/components/ui/colors';
import useLockStateDetection from '@/lib/hooks/useLockStateDetection';
import { OnboardingStep, useOnboardingStore } from '@/store/onboarding-store';
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
      <View
        className={`size-14 items-center justify-center rounded-full ${
          focused ? 'bg-secondary-400' : 'bg-secondary-300'
        }`}
      >
        <Feather name="compass" size={28} color={white} />
      </View>
    </View>
  );
}

export default function TabLayout() {
  const navigationState = useRootNavigationState();
  const pathname = usePathname();
  const { currentStep } = useOnboardingStore((s) => ({
    currentStep: s.currentStep,
  }));
  const hasRedirectedToCompletedRef = useRef(false);

  // Quest state from store
  const failedQuest = useQuestStore((state) => state.failedQuest);
  const recentCompletedQuest = useQuestStore(
    (state) => state.recentCompletedQuest
  );
  const pendingQuest = useQuestStore((state) => state.pendingQuest);

  // Activate lock detection for the whole main app.
  useLockStateDetection();

  useEffect(() => {
    if (!navigationState?.key) return;

    if (recentCompletedQuest && !hasRedirectedToCompletedRef.current) {
      hasRedirectedToCompletedRef.current = true;

      // Redirect to quest/[id] instead of quest-complete
      router.replace({
        pathname: '/(app)/quest/[id]',
        params: {
          id: recentCompletedQuest.id,
          timestamp: recentCompletedQuest.stopTime?.toString(),
        },
      });
    }
  }, [recentCompletedQuest, navigationState?.key]);

  // Don't forget to reset the redirect flag when recentCompletedQuest is cleared
  useEffect(() => {
    if (!navigationState?.key) return;
    if (!recentCompletedQuest) {
      hasRedirectedToCompletedRef.current = false;
    }
  }, [navigationState?.key, recentCompletedQuest]);

  // Handle auth check and redirects.
  useEffect(() => {
    if (!navigationState?.key) return;

    async function checkAuth() {
      // Check for the presence of an access token
      const accessToken = await getAccessToken();
      if (!accessToken) {
        router.replace('/login');
        return;
      }

      // *** NEW: Skip onboarding redirect if there's a pending quest ***
      // This gives priority to quest flow over onboarding flow
      if (pendingQuest) {
        return;
      }

      // Use the onboarding store to check completion status
      const isOnboardingComplete = useOnboardingStore
        .getState()
        .isOnboardingComplete();

      if (currentStep !== OnboardingStep.NOT_STARTED && !isOnboardingComplete) {
        router.replace('/onboarding');
        return;
      }
    }
    checkAuth();
  }, [currentStep, failedQuest, navigationState?.key, pathname, pendingQuest]);

  useEffect(() => {
    if (!navigationState?.key) return;

    // Clear failed quest when switching tabs
    if (failedQuest) {
      const currentPath = pathname || '';
      const isQuestDetailScreen = currentPath.includes('/quest/');

      // Only clear failedQuest if we're not on the quest detail screen
      if (!isQuestDetailScreen) {
        console.log('Clearing failed quest - tab navigation');
        useQuestStore.getState().resetFailedQuest();
      }
    }
  }, [navigationState?.key, pathname, failedQuest]);

  // Check if navigation is ready
  if (!navigationState?.key) {
    return null;
  }

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: '#334738', // Forest color
        tabBarInactiveTintColor: '#666666',
        tabBarStyle: {
          height: 68,
          paddingBottom: 6,
          backgroundColor: white,
          borderTopWidth: 1,
          borderTopColor: '#E5E5E5',
          // Only hide tab bar for pending-quest and failed-quest
          display: ['pending-quest'].includes(route.name) ? 'none' : 'flex',
        },
        tabBarLabelStyle: {
          fontSize: 12,
          marginBottom: 6,
          paddingTop: 2,
        },
      })}
    >
      <Tabs.Screen
        name="journal"
        options={{
          title: 'Journal',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="book" color={color} focused={focused} />
          ),
          tabBarButtonTestID: 'journal-tab',
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
        name="index"
        options={{
          title: 'Play',
          tabBarIcon: ({ focused, color }) => (
            <CenterButton focused={focused} color={color} />
          ),
          tabBarButtonTestID: 'new-quest-tab',
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
        name="pending-quest"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="custom-quest"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="quest/[id]"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
