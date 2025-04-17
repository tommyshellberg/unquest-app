import { Feather } from '@expo/vector-icons';
import { router, Tabs, usePathname, useRootNavigationState } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { AppState, Platform, View } from 'react-native';

import { getAccessToken } from '@/api/token';
import { white } from '@/components/ui/colors';
import useLockStateDetection from '@/lib/hooks/useLockStateDetection';
import QuestTimer from '@/lib/services/quest-timer';
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
      <View className="size-14 items-center justify-center rounded-full bg-secondary-300">
        <Feather name="compass" size={28} color={white} />
      </View>
    </View>
  );
}

export default function TabLayout() {
  const navigationState = useRootNavigationState();
  const hasRedirectedToCompletedRef = useRef(false);
  const pathname = usePathname();
  const appState = useRef(AppState.currentState);
  const { currentStep } = useOnboardingStore((s) => ({
    currentStep: s.currentStep,
  }));

  // Quest state from store
  const failedQuest = useQuestStore((state) => state.failedQuest);
  const recentCompletedQuest = useQuestStore(
    (state) => state.recentCompletedQuest
  );
  const pendingQuest = useQuestStore((state) => state.pendingQuest);
  const activeQuest = useQuestStore((state) => state.activeQuest);

  // Activate lock detection for the whole main app.
  useLockStateDetection();

  // Handle completed quest redirect
  useEffect(() => {
    if (!navigationState?.key) return;

    if (recentCompletedQuest && !hasRedirectedToCompletedRef.current) {
      console.log('Redirecting to quest-complete');
      hasRedirectedToCompletedRef.current = true;
      router.replace('/(app)/quest-complete');
    }
  }, [recentCompletedQuest, navigationState?.key]);

  // Reset completed quest flag
  useEffect(() => {
    if (!navigationState?.key) return;
    console.log('recentCompletedQuest changed:', recentCompletedQuest);
    if (!recentCompletedQuest) {
      console.log('Resetting completed quest redirect flag to false');
      hasRedirectedToCompletedRef.current = false;
    }
  }, [navigationState?.key, recentCompletedQuest]);

  useEffect(() => {
    if (!navigationState?.key) return;
    if (pathname.includes('failed-quest')) {
      console.log('skipping redirect for failed-quest');
      return;
    }
    if (failedQuest) {
      console.log('Redirecting to failed-quest');
      router.replace('/failed-quest');
      return;
    }
  }, [failedQuest, navigationState?.key, pathname]);

  // AppState listener to handle live activity cleanup
  useEffect(() => {
    // Skip for non-iOS devices
    if (Platform.OS !== 'ios') return;

    const subscription = AppState.addEventListener('change', (nextAppState) => {
      // Check if app is coming from background to active (foreground)
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // Only clean up live activities if there's no pending or active quest
        // This prevents showing outdated live activities when returning to the app
        // but doesn't interfere with pending quest setup
        if (!pendingQuest && !activeQuest) {
          console.log(
            'App became active: cleaning up live activities (no pending or active quest)'
          );
          QuestTimer.endLiveActivity();
        }
      }
      appState.current = nextAppState;
    });

    return () => subscription.remove();
  }, [pendingQuest, activeQuest]);

  // Handle auth check and redirects.
  useEffect(() => {
    console.log('checking auth');
    if (!navigationState?.key) return;

    async function checkAuth() {
      // Check for the presence of an access token
      const accessToken = await getAccessToken();
      if (!accessToken) {
        console.log('routing to login - no access token found');
        router.replace('/login');
        return;
      }
      // Use the onboarding store to check completion status
      const isOnboardingComplete = useOnboardingStore
        .getState()
        .isOnboardingComplete();

      if (currentStep !== OnboardingStep.NOT_STARTED && !isOnboardingComplete) {
        console.log('routing to onboarding - onboarding not complete');
        router.replace('/onboarding');
        return;
      }
    }
    checkAuth();
  }, [failedQuest, navigationState?.key, pathname]);

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
          // Hide the tab bar for specific screens
          display: ['quest-complete', 'active-quest', 'failed-quest'].includes(
            route.name
          )
            ? 'none'
            : 'flex',
        },
        tabBarLabelStyle: {
          fontSize: 12,
          marginBottom: 6,
          paddingTop: 2,
        },
      })}
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
