import { Feather } from '@expo/vector-icons';
import {
  Redirect,
  Tabs,
  usePathname,
  useRootNavigationState,
} from 'expo-router';
import React from 'react';
import { View } from 'react-native';

import { white } from '@/components/ui/colors';
import { useAuth } from '@/lib/auth';
import useLockStateDetection from '@/lib/hooks/useLockStateDetection';
import { useQuestStore } from '@/store/quest-store';

// Tab icon component
function TabBarIcon({
  name,
  color,
  size = 24,
  focused = false,
}: {
  name: React.ComponentProps<typeof Feather>['name'];
  color: string;
  size?: number;
  focused?: boolean;
}) {
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
function CenterButton({
  focused,
}: {
  focused: boolean;
  color?: string; // Unused but required by the tab bar API
}) {
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

  // Activate lock detection for the whole main app.
  useLockStateDetection();

  const authStatus = useAuth((state) => state.status);

  // Get quest states for app-level redirects
  const failedQuest = useQuestStore((s) => s.failedQuest);
  const pendingQuest = useQuestStore((s) => s.pendingQuest);

  // Auth protection
  if (authStatus === 'signOut') {
    console.log('[AppLayout] Redirecting to login - not authenticated');
    return <Redirect href="/login" />;
  }

  // Check if navigation is ready
  if (!navigationState?.key) {
    return null;
  }

  // App-level quest redirects (within the protected app area)

  if (pendingQuest && !pathname.includes('pending-quest')) {
    console.log('[AppLayout] Redirecting to pending quest', pendingQuest.id);
    return <Redirect href="/pending-quest" />;
  }

  // Redirect to failed quest details if one exists and we're not already in quest route
  if (failedQuest && !pathname.includes('quest')) {
    console.log('[AppLayout] Redirecting to failed quest', failedQuest.id);
    return <Redirect href={`/(app)/quest/${failedQuest.id}`} />;
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

      <Tabs.Screen
        name="custom-quest"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="reminder-setup"
        options={{
          href: null,
        }}
      />
      {/* Screen for viewing quest details within the (app) group */}
      <Tabs.Screen
        name="quest/[id]"
        options={{
          href: null, // Doesn't show in the tab bar
          // Optional: if you want a specific title for this screen in a stack header (if applicable)
          // title: "Quest Details",
        }}
      />
    </Tabs>
  );
}
