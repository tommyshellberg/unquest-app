import { Feather } from '@expo/vector-icons';
import { Tabs, useRootNavigationState } from 'expo-router';
import React from 'react';
import { View } from 'react-native';

import { white } from '@/components/ui/colors';
import useLockStateDetection from '@/lib/hooks/useLockStateDetection';
import { useNavigationGuard } from '@/lib/navigation/use-navigation-guard';

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

  // Activate lock detection for the whole main app.
  useLockStateDetection();

  // Use the centralized navigation guard instead of multiple effects
  useNavigationGuard(!!navigationState?.key);

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
