# Navigation Flow Architecture

## Navigation Structure

emberglow uses Expo Router for file-based navigation with a complex state resolver to handle routing logic.

## Navigation Hierarchy

```
App Root
│
├── Authentication Flow
│   ├── /login
│   └── /auth/magiclink/verify
│
├── Onboarding Flow
│   ├── /onboarding/welcome
│   ├── /onboarding/app-introduction
│   ├── /onboarding/choose-character
│   └── /onboarding/first-quest
│
├── Main App (Tab Navigation)
│   ├── /(app)/index (Home)
│   ├── /(app)/journal
│   ├── /(app)/map
│   ├── /(app)/profile
│   └── /(app)/settings
│
├── Quest Flows
│   ├── /pending-quest
│   ├── /cooperative-pending-quest
│   ├── /first-quest-result
│   ├── /streak-celebration
│   └── /quest-completed-signup
│
└── Cooperative Quest Flows
    ├── /cooperative-quest-menu
    ├── /create-cooperative-quest
    ├── /join-cooperative-quest
    ├── /cooperative-quest-lobby/[lobbyId]
    └── /cooperative-quest-ready
```

## Navigation State Resolver

The navigation state resolver (`navigation-state-resolver.ts`) determines the appropriate screen based on multiple factors:

```typescript
interface NavigationState {
  authStatus: 'hydrating' | 'signOut' | 'signIn';
  isProvisional: boolean;
  hasCompletedOnboarding: boolean;
  hasActiveQuest: boolean;
  hasPendingQuest: boolean;
  hasCompletedFirstQuest: boolean;
  needsSignup: boolean;
  hasStreak: boolean;
}
```

## Navigation Decision Flow

```
Start
  │
  ├─ Is Hydrating? ────────────────► Show Loading
  │
  ├─ Not Authenticated? ───────────► /login
  │
  ├─ Not Onboarded? ───────────────► /onboarding/welcome
  │
  ├─ Has Pending Quest? ───────────► /pending-quest
  │
  ├─ Has Active Quest? ────────────► /(app)/index (locked)
  │
  ├─ Just Completed First Quest? ──► /first-quest-result
  │
  ├─ Needs Signup? ────────────────► /quest-completed-signup
  │
  ├─ Has Streak to Celebrate? ─────► /streak-celebration
  │
  └─ Default ───────────────────────► /(app)/index
```

## Screen Flow Diagrams

### Onboarding Flow

```
/onboarding/welcome
        │
        ▼
/onboarding/app-introduction
        │
        ▼
/onboarding/choose-character
        │
        ▼
/onboarding/first-quest ──────► /pending-quest
                                      │
                                      ▼
                                 Quest Active
                                      │
                                      ▼
                               /first-quest-result
                                      │
                                      ▼
                            /quest-completed-signup
                                      │
                                      ▼
                                /(app)/index
```

### Quest Flow

```
Select Quest (Home)
        │
        ▼
Prepare Quest ──────► Set as Pending
        │                    │
        ▼                    ▼
Navigate to ─────► /pending-quest
                         │
                    Countdown
                         │
                         ▼
                   Start Quest
                         │
                         ▼
                 Phone Locked/Away
                         │
                         ▼
                   Timer Runs
                         │
                    ┌────┴────┐
                    ▼         ▼
               Complete    Failed
                    │         │
                    ▼         ▼
              Quest Result Screen
```

### Cooperative Quest Flow

```
/cooperative-quest-menu
        │
        ├──► /create-cooperative-quest
        │            │
        │            ▼
        │     Create Invitation
        │            │
        │            ▼
        └──► /join-cooperative-quest
                     │
                Accept Invitation
                     │
                     ▼
        /cooperative-quest-lobby/[lobbyId]
                     │
                All Ready
                     │
                     ▼
        /cooperative-quest-ready
                     │
                     ▼
        /cooperative-pending-quest
                     │
                     ▼
              Quest Active
```

## Navigation Guards

### Authentication Guard

```typescript
const AuthGuard = ({ children }) => {
  const { status } = useAuth();
  
  if (status === 'hydrating') {
    return <LoadingScreen />;
  }
  
  if (status === 'signOut') {
    return <Redirect href="/login" />;
  }
  
  return children;
};
```

### Quest State Guard

```typescript
const QuestGuard = ({ children }) => {
  const { activeQuest } = useQuestStore();
  
  if (activeQuest) {
    // Prevent navigation during active quest
    return <QuestActiveScreen />;
  }
  
  return children;
};
```

## Deep Linking

### URL Scheme Structure

```
unquest://
├── quest/[questId]
├── cooperative-quest/[lobbyId]
├── profile/[userId]
├── leaderboard
└── settings/[section]
```

### Deep Link Handling

```typescript
const linking = {
  prefixes: ['unquest://', 'https://unquestapp.com'],
  config: {
    screens: {
      Quest: 'quest/:id',
      CooperativeQuest: 'cooperative-quest/:lobbyId',
      Profile: 'profile/:userId',
      Leaderboard: 'leaderboard',
      Settings: 'settings/:section',
    },
  },
};
```

## Navigation Context

### Screen Locking During Quests

```typescript
const useQuestLock = () => {
  const { activeQuest } = useQuestStore();
  const navigation = useNavigation();
  
  useEffect(() => {
    if (activeQuest) {
      // Disable gesture and header back
      navigation.setOptions({
        gestureEnabled: false,
        headerLeft: null,
      });
    }
  }, [activeQuest]);
};
```

### Navigation Persistence

```typescript
const persistNavigationState = async (state) => {
  try {
    await AsyncStorage.setItem(
      'NAVIGATION_STATE',
      JSON.stringify(state)
    );
  } catch (error) {
    console.error('Failed to persist navigation state');
  }
};
```

## Tab Navigation Configuration

```typescript
export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.gray,
        tabBarStyle: {
          backgroundColor: colors.background,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Home color={color} />,
        }}
      />
      <Tabs.Screen
        name="journal"
        options={{
          title: 'Journal',
          tabBarIcon: ({ color }) => <Book color={color} />,
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'Map',
          tabBarIcon: ({ color }) => <Map color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <User color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => <Settings color={color} />,
        }}
      />
    </Tabs>
  );
}
```

## Modal Navigation

### Modal Presentation

```typescript
// Present as modal
router.push({
  pathname: '/create-cooperative-quest',
  params: { presentation: 'modal' },
});

// Configuration in layout
<Stack.Screen
  name="create-cooperative-quest"
  options={{
    presentation: 'modal',
    animation: 'slide_from_bottom',
  }}
/>
```

## Navigation Performance

### Screen Preloading

```typescript
const preloadScreens = [
  '/(app)/index',
  '/pending-quest',
  '/quest-result',
];

preloadScreens.forEach(screen => {
  navigation.preload(screen);
});
```

### Lazy Loading

```typescript
const LazyMapScreen = lazy(() => import('./map'));

<Suspense fallback={<LoadingScreen />}>
  <LazyMapScreen />
</Suspense>
```

## Error Boundaries

```typescript
class NavigationErrorBoundary extends Component {
  componentDidCatch(error, errorInfo) {
    // Log navigation errors
    console.error('Navigation error:', error);
    
    // Reset to safe state
    this.props.navigation.reset({
      index: 0,
      routes: [{ name: 'Home' }],
    });
  }
  
  render() {
    return this.props.children;
  }
}
```

## Testing Navigation

### Navigation Testing Utils

```typescript
const renderWithNavigation = (component, initialRoute = '/') => {
  return render(
    <NavigationContainer initialState={initialRoute}>
      {component}
    </NavigationContainer>
  );
};

// Test example
it('navigates to quest screen on selection', () => {
  const { getByText } = renderWithNavigation(<HomeScreen />);
  
  fireEvent.press(getByText('Start Quest'));
  
  expect(mockRouter.push).toHaveBeenCalledWith('/pending-quest');
});
```

## Best Practices

1. **Always use typed navigation** to prevent runtime errors
2. **Handle back navigation** explicitly in quest flows
3. **Preserve navigation state** during app suspension
4. **Test navigation flows** end-to-end
5. **Use navigation guards** for protected routes
6. **Implement proper deep linking** for all major features
7. **Optimize screen transitions** for smooth UX
8. **Handle navigation errors** gracefully