# State Management Architecture

## Overview

emberglow uses Zustand for state management with MMKV persistence for optimal performance and developer experience.

## Store Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Application State                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Quest Store  │  │Character Store│ │ User Store   │     │
│  │              │  │              │  │              │     │
│  │ - activeQuest│  │ - level      │  │ - profile    │     │
│  │ - pendingQuest│ │ - xp         │  │ - friends    │     │
│  │ - completed  │  │ - streak     │  │ - settings   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │Onboarding    │  │ POI Store    │  │Cooperative   │     │
│  │    Store     │  │              │  │Lobby Store   │     │
│  │              │  │ - markers    │  │              │     │
│  │ - steps      │  │ - visited    │  │ - lobbyData  │     │
│  │ - progress   │  │ - unlocked   │  │ - participants│    │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                              │
│                         ▼                                    │
│              ┌──────────────────┐                          │
│              │  MMKV Storage    │                          │
│              │  (Persistence)   │                          │
│              └──────────────────┘                          │
└─────────────────────────────────────────────────────────────┘
```

## Store Patterns

### 1. Quest Store

```typescript
interface QuestStore {
  // State
  activeQuest: Quest | null;
  pendingQuest: Quest | null;
  completedQuests: Quest[];
  
  // Actions
  prepareQuest: (quest: Quest) => void;
  startQuest: () => void;
  completeQuest: (result: QuestResult) => void;
  failQuest: (reason: string) => void;
  
  // Computed
  getQuestProgress: () => number;
  canStartNewQuest: () => boolean;
}
```

**Key Features:**
- Manages quest lifecycle
- Tracks quest history
- Handles background timer state
- Coordinates with native modules

### 2. Character Store

```typescript
interface CharacterStore {
  // State
  character: Character | null;
  level: number;
  experience: number;
  streak: number;
  
  // Actions
  selectCharacter: (character: Character) => void;
  addExperience: (xp: number) => void;
  updateStreak: (days: number) => void;
  levelUp: () => void;
  
  // Computed
  getNextLevelProgress: () => number;
  getStreakBonus: () => number;
}
```

**Key Features:**
- Tracks player progression
- Manages character customization
- Calculates level progression
- Maintains streak data

### 3. User Store

```typescript
interface UserStore {
  // State
  user: User | null;
  isProvisional: boolean;
  friends: Friend[];
  
  // Actions
  setUser: (user: User) => void;
  convertFromProvisional: () => void;
  addFriend: (friend: Friend) => void;
  updateProfile: (updates: Partial<User>) => void;
  
  // Computed
  isAuthenticated: () => boolean;
  getFriendCount: () => number;
}
```

## State Synchronization

### Local-First Architecture

```
User Action
     │
     ▼
Optimistic Update ──────► UI Updates Immediately
     │
     ▼
API Request ────────────► Backend Processing
     │
     ▼
Response Handling
     │
     ├─── Success ──────► Confirm State
     │
     └─── Failure ──────► Rollback + Error UI
```

### Cross-Store Communication

```typescript
// Example: Quest completion affects multiple stores
const completeQuest = (result: QuestResult) => {
  // Update quest store
  questStore.completeQuest(result);
  
  // Update character store
  characterStore.addExperience(result.xpEarned);
  
  // Update user stats
  userStore.updateStats({
    questsCompleted: userStore.stats.questsCompleted + 1
  });
  
  // Check for level up
  if (characterStore.shouldLevelUp()) {
    characterStore.levelUp();
  }
};
```

## Persistence Strategy

### MMKV Configuration

```typescript
const storage: StateStorage = {
  getItem: (name) => {
    const value = mmkvStorage.getString(name);
    return value ?? null;
  },
  setItem: (name, value) => {
    mmkvStorage.set(name, value);
  },
  removeItem: (name) => {
    mmkvStorage.delete(name);
  },
};
```

### Selective Persistence

Not all state needs persistence:

**Persisted:**
- User profile
- Quest history
- Character data
- Settings
- Onboarding progress

**Not Persisted:**
- UI state (modals, loading)
- Temporary form data
- Navigation state
- WebSocket connections

## Performance Optimizations

### 1. Subscription Optimization

```typescript
// Subscribe to specific state slices
const questTitle = useQuestStore(state => state.activeQuest?.title);

// Avoid subscribing to entire store
// ❌ Bad
const store = useQuestStore();

// ✅ Good
const activeQuest = useQuestStore(state => state.activeQuest);
```

### 2. Direct Store Access

```typescript
// For non-reactive operations, use getState()
const checkQuestStatus = () => {
  const { activeQuest } = questStore.getState();
  return activeQuest?.status === 'active';
};
```

### 3. Batched Updates

```typescript
// Batch multiple state updates
const resetAllStores = () => {
  batch(() => {
    questStore.reset();
    characterStore.reset();
    userStore.reset();
  });
};
```

## Testing Strategies

### Mock Store Creation

```typescript
const createMockQuestStore = (initialState?: Partial<QuestState>) => {
  return create<QuestStore>()((set) => ({
    activeQuest: null,
    pendingQuest: null,
    completedQuests: [],
    ...initialState,
    
    startQuest: jest.fn(),
    completeQuest: jest.fn(),
    // ... other mocked actions
  }));
};
```

### Testing Store Interactions

```typescript
describe('Quest Store', () => {
  it('should complete quest and update character XP', () => {
    const { result } = renderHook(() => useQuestStore());
    
    act(() => {
      result.current.completeQuest({
        questId: '123',
        xpEarned: 100,
      });
    });
    
    expect(result.current.completedQuests).toHaveLength(1);
    expect(characterStore.getState().experience).toBe(100);
  });
});
```

## Best Practices

### 1. Store Organization
- One store per domain/feature
- Keep stores focused and cohesive
- Avoid circular dependencies

### 2. Action Naming
- Use clear, descriptive names
- Follow consistent patterns (verb + noun)
- Group related actions

### 3. State Shape
- Keep state normalized
- Avoid deeply nested objects
- Use IDs for relationships

### 4. Error Handling
- Store error states when needed
- Provide rollback mechanisms
- Clear errors on retry

### 5. DevTools Integration

```typescript
// Enable Redux DevTools in development
const useStore = create(
  devtools(
    (set) => ({
      // store implementation
    }),
    { name: 'QuestStore' }
  )
);
```

## Migration and Versioning

### Schema Migrations

```typescript
const migrate = (persistedState: any): QuestState => {
  const version = persistedState?.version || 0;
  
  if (version < 1) {
    // Migrate from v0 to v1
    persistedState = migrateV0ToV1(persistedState);
  }
  
  if (version < 2) {
    // Migrate from v1 to v2
    persistedState = migrateV1ToV2(persistedState);
  }
  
  return persistedState;
};
```

## Anti-Patterns to Avoid

### ❌ Don't mutate state directly
```typescript
// Bad
store.activeQuest.title = 'New Title';

// Good
store.updateQuest({ title: 'New Title' });
```

### ❌ Don't create unnecessary stores
```typescript
// Bad - Too granular
const useModalStore = create(...);
const useLoadingStore = create(...);

// Good - Combine related UI state
const useUIStore = create(...);
```

### ❌ Don't sync stores manually
```typescript
// Bad
useEffect(() => {
  if (questCompleted) {
    characterStore.addXP(100);
  }
}, [questCompleted]);

// Good - Handle in action
const completeQuest = () => {
  // Update both stores in one action
};
```