# emberglow - Digital Detox Through Gamified Real-World Adventures

<div align="center">
  <img src="./assets/icon.png" width="200" style="border-radius:20px" alt="emberglow Logo"/>
  
  <p align="center">
    <strong>Transform your screen time into real-world adventures</strong>
  </p>
  
  <p align="center">
    <a href="#features">Features</a> •
    <a href="#getting-started">Getting Started</a> •
    <a href="#architecture">Architecture</a> •
    <a href="#development">Development</a> •
    <a href="#testing">Testing</a> •
    <a href="#contributing">Contributing</a>
  </p>

  <p align="center">
    <img src="https://img.shields.io/badge/React_Native-0.75-blue.svg" alt="React Native" />
    <img src="https://img.shields.io/badge/Expo-SDK_52-000020.svg" alt="Expo SDK" />
    <img src="https://img.shields.io/badge/TypeScript-5.0-blue.svg" alt="TypeScript" />
    <img src="https://img.shields.io/badge/License-MIT-green.svg" alt="License" />
  </p>
</div>

## About emberglow

emberglow is a gamified mobile application that encourages users to disconnect from their phones and engage with the real world through story-driven quests, challenges, and social adventures. By transforming daily activities into epic quests, emberglow makes digital detox fun and rewarding.

### 🎯 Key Features

- **📖 Story Quests**: Immersive narrative-driven adventures with branching paths, audio narration, and location-based challenges
- **✨ Custom Quests**: Create personalized challenges tailored to your goals and lifestyle
- **👥 Cooperative Quests**: Team up with friends for multiplayer challenges with real-time coordination
- **🏆 Character Progression**: Earn XP, level up, maintain streaks, and unlock achievements
- **🗺️ Interactive Map**: Discover points of interest and track your quest journey
- **📊 Leaderboards**: Compete with friends and the community
- **🔔 Smart Reminders**: Customizable notifications to help you stay on track
- **💎 Premium Features**: Enhanced quest options, advanced statistics, and exclusive content

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [pnpm](https://pnpm.io/) (v8 or higher)
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- [React Native development environment](https://reactnative.dev/docs/environment-setup)
- iOS Simulator (Mac only) or Android Emulator

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/unquest.git
   cd unquest
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.development
   # Edit .env.development with your configuration
   ```

4. **iOS Setup (Mac only)**
   ```bash
   cd ios && pod install
   cd ..
   ```

5. **Start the development server**
   ```bash
   pnpm start
   ```

6. **Run the app**
   ```bash
   # iOS
   pnpm ios
   
   # Android
   pnpm android
   ```

## 🏗️ Architecture

### Tech Stack

- **Framework**: React Native 0.75 + Expo SDK 52
- **Language**: TypeScript
- **Navigation**: Expo Router (file-based routing)
- **State Management**: Zustand with MMKV persistence
- **API Layer**: Axios + TanStack Query
- **Styling**: NativeWind (Tailwind for React Native)
- **Testing**: Jest + React Native Testing Library + Maestro
- **CI/CD**: GitHub Actions + EAS Build

### Project Structure

```
unquest/
├── src/
│   ├── api/              # API clients and hooks
│   ├── app/              # Expo Router screens and navigation
│   │   ├── (app)/        # Main app tab navigation
│   │   ├── auth/         # Authentication flows
│   │   └── onboarding/   # Onboarding screens
│   ├── components/       # Reusable UI components
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utilities and services
│   │   ├── auth/         # Authentication logic
│   │   ├── navigation/   # Navigation resolver
│   │   └── services/     # Business logic services
│   ├── store/            # Zustand state stores
│   └── types/            # TypeScript type definitions
├── assets/               # Images, fonts, and static files
├── .github/              # GitHub Actions workflows
└── docs/                 # Additional documentation
```

### Key Architectural Patterns

#### 🔐 Provisional Authentication
Users can experience the app and complete quests before creating an account, reducing friction and improving conversion.

#### 📱 Background Quest Timer
Quests continue running when the app is backgrounded, using native background task APIs for accurate time tracking.

#### 🔄 State Synchronization
Zustand stores with MMKV persistence provide fast, synchronous state access with automatic persistence.

#### 🚦 Navigation State Resolver
Complex routing logic centralized in `navigation-state-resolver.ts` ensures users are always on the correct screen based on auth status, onboarding progress, and active quests.

## 💻 Development

### Available Scripts

```bash
# Development
pnpm start                 # Start Expo dev server
pnpm ios                   # Run on iOS simulator
pnpm android               # Run on Android emulator

# Environment-specific builds
pnpm ios:staging           # iOS with staging environment
pnpm android:production    # Android with production environment

# Code Quality
pnpm lint                  # Run ESLint
pnpm type-check            # TypeScript type checking
pnpm test                  # Run Jest tests
pnpm test:watch            # Run tests in watch mode
pnpm check-all             # Run all checks (lint, type-check, tests)

# Building
pnpm build:production:ios      # Production iOS build
pnpm build:production:android  # Production Android build
```

### Code Style Guidelines

- **File naming**: Use kebab-case (e.g., `quest-timer.ts`)
- **Component structure**: Functional components with hooks
- **Imports**: Use absolute imports via `@/` alias
- **State management**: Prefer direct Zustand actions over hooks when possible
- **Testing**: Co-locate test files with components (`.test.tsx`)
- **Styling**: Use NativeWind classes, avoid inline styles

### Git Workflow

1. Create a feature branch from `main`
2. Make your changes following the code style guidelines
3. Run `pnpm check-all` before committing
4. Write clear, descriptive commit messages
5. Open a pull request with a detailed description

## 🧪 Testing

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:ci

# Run specific test file
pnpm test src/app/index.test.tsx

# E2E tests with Maestro
pnpm e2e-test
```

### Testing Strategy

- **Unit Tests**: Business logic and utilities
- **Component Tests**: UI components with React Native Testing Library
- **Integration Tests**: API interactions and state management
- **E2E Tests**: Critical user flows with Maestro

Current test coverage: ~40% (improving to 60%+ for critical paths)

## 📊 Performance

### Optimization Strategies

- **Lazy Loading**: Components and screens loaded on demand
- **Image Optimization**: Cached and compressed images
- **State Management**: Direct Zustand subscriptions for real-time updates
- **List Virtualization**: FlatList for long scrollable content
- **Memoization**: React.memo and useMemo for expensive computations

## 🔒 Security

- Environment variables properly managed and excluded from version control
- JWT-based authentication with secure token storage
- API request/response validation
- No hardcoded credentials or sensitive data
- Regular dependency updates and security audits

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details on:

- Code of Conduct
- Development setup
- Submitting pull requests
- Reporting issues
- Feature requests

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Expo](https://expo.dev/) and [React Native](https://reactnative.dev/)
- UI components inspired by [NativeWind](https://www.nativewind.dev/)
- State management powered by [Zustand](https://github.com/pmndrs/zustand)
- API layer built with [TanStack Query](https://tanstack.com/query)

## 📧 Contact

For questions, suggestions, or support, please open an issue on GitHub or contact the maintainers.

---

<div align="center">
  <p>Built with ❤️ for digital wellness</p>
  <p>
    <a href="https://unquestapp.com">Website</a> •
  </p>
</div>