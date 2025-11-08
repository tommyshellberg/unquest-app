# emberglow Architecture Overview

## System Architecture

emberglow follows a modern mobile application architecture with clear separation of concerns and modular design principles.

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                             │
│                    React Native + Expo                       │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Screens    │  │  Components  │  │    Stores    │     │
│  │ (Expo Router)│  │   (UI/UX)    │  │  (Zustand)   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                           │                                  │
│  ┌────────────────────────┴─────────────────────────┐      │
│  │              API Layer (Axios + TanStack)         │      │
│  └───────────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                         Backend                              │
│                    Node.js + Express                         │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │     API      │  │   Services   │  │   Database   │     │
│  │  Endpoints   │  │   (Logic)    │  │  (MongoDB)   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  WebSocket   │  │     Push     │  │   Storage    │     │
│  │  (Socket.io) │  │  (OneSignal) │  │    (S3)      │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. Frontend Layer

#### Screens (Expo Router)
- **File-based routing** for intuitive navigation structure
- **Tab navigation** for main app sections
- **Stack navigation** for detailed views
- **Modal screens** for overlays and forms

#### UI Components
- **Atomic design** principles
- **Reusable components** with consistent styling
- **NativeWind** for utility-first CSS
- **Accessibility** built into all components

#### State Management (Zustand)
- **Global stores** for app-wide state
- **MMKV persistence** for fast storage
- **Direct subscriptions** for real-time updates
- **Computed values** for derived state

### 2. API Layer

#### Request Management
- **Axios interceptors** for auth token injection
- **TanStack Query** for caching and synchronization
- **Optimistic updates** for better UX
- **Retry logic** for network failures

#### Authentication
- **JWT tokens** for secure authentication
- **Provisional auth** for frictionless onboarding
- **Magic links** for passwordless login
- **Token refresh** mechanism

### 3. Backend Services

#### Core Services
- **Quest Engine**: Manages quest lifecycle and validation
- **Timer Service**: Handles background timers and notifications
- **User Service**: Profile management and progression
- **Social Service**: Friends, invitations, and cooperative quests

#### Real-time Features
- **WebSocket connections** for live updates
- **Push notifications** for engagement
- **Activity feeds** for social features
- **Live cooperative quest coordination**

## Data Flow

### Quest Completion Flow

```
User Action → UI Component → Store Action → API Call → Backend Service
     ↓            ↓              ↓            ↓              ↓
   Event      Update UI    Update Cache   Validate     Update DB
     ↓            ↓              ↓            ↓              ↓
Analytics    Optimistic    Persist      Response    Broadcast
              Update       State                     (WebSocket)
```

### State Synchronization

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   UI Layer   │────▶│ Zustand Store│────▶│     MMKV     │
└──────────────┘     └──────────────┘     └──────────────┘
       ▲                     │                      │
       │                     ▼                      ▼
       │            ┌──────────────┐     ┌──────────────┐
       └────────────│  API Layer   │────▶│   Backend    │
                    └──────────────┘     └──────────────┘
```

## Key Design Patterns

### 1. Repository Pattern
Abstracts data access logic and provides a clean API for data operations.

### 2. Observer Pattern
Used in state management for reactive updates across the application.

### 3. Strategy Pattern
Quest types (story, custom, cooperative) implement common interfaces with different behaviors.

### 4. Factory Pattern
Creates different quest instances based on type and configuration.

### 5. Singleton Pattern
Ensures single instances of critical services (Timer, WebSocket, etc.).

## Security Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Security Layers                           │
├─────────────────────────────────────────────────────────────┤
│  Application Layer                                           │
│  - Input validation                                          │
│  - XSS prevention                                           │
│  - SQL injection protection                                 │
├─────────────────────────────────────────────────────────────┤
│  Authentication Layer                                        │
│  - JWT token validation                                     │
│  - Token refresh mechanism                                  │
│  - Session management                                       │
├─────────────────────────────────────────────────────────────┤
│  Network Layer                                              │
│  - HTTPS only                                              │
│  - Certificate pinning                                     │
│  - Request signing                                         │
├─────────────────────────────────────────────────────────────┤
│  Storage Layer                                              │
│  - Encrypted storage (MMKV)                                │
│  - Secure key management                                   │
│  - No sensitive data in plain text                        │
└─────────────────────────────────────────────────────────────┘
```

## Performance Optimization

### Mobile App
- **Code splitting** with lazy loading
- **Image optimization** and caching
- **List virtualization** for long lists
- **Memoization** for expensive computations
- **Background task optimization**

### Backend
- **Database indexing** for query optimization
- **Redis caching** for frequently accessed data
- **CDN** for static assets
- **Load balancing** for horizontal scaling
- **Connection pooling** for database efficiency

## Monitoring and Analytics

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   PostHog    │     │    Sentry    │     │   Custom     │
│  Analytics   │     │Error Tracking│     │   Metrics    │
└──────────────┘     └──────────────┘     └──────────────┘
       │                     │                      │
       └─────────────────────┴──────────────────────┘
                             │
                    ┌──────────────┐
                    │  Dashboard   │
                    │(Observability)│
                    └──────────────┘
```

## Deployment Architecture

### Mobile App
- **EAS Build** for CI/CD
- **Over-the-air updates** for quick fixes
- **Staged rollouts** for risk mitigation
- **A/B testing** infrastructure

### Backend
- **Docker containers** for consistency
- **AWS ECS** for orchestration
- **Auto-scaling** based on load
- **Blue-green deployments** for zero downtime

## Future Considerations

### Scalability
- Microservices architecture for backend
- GraphQL for flexible data fetching
- Event-driven architecture for decoupling

### Features
- Offline-first architecture
- Machine learning for personalized quests
- AR integration for immersive experiences
- Cross-platform expansion (web, wearables)