# Contributing to UnQuest

First off, thank you for considering contributing to UnQuest! It's people like you that make UnQuest such a great tool for promoting digital wellness through gamified real-world adventures.

## Code of Conduct

This project and everyone participating in it is governed by the [UnQuest Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior to the project maintainers.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check existing issues as you might find out that you don't need to create one. When you are creating a bug report, please include as many details as possible:

* **Use a clear and descriptive title** for the issue to identify the problem
* **Describe the exact steps which reproduce the problem** in as many details as possible
* **Provide specific examples to demonstrate the steps**
* **Describe the behavior you observed after following the steps** and point out what exactly is the problem with that behavior
* **Explain which behavior you expected to see instead and why**
* **Include screenshots and animated GIFs** which show you following the described steps and clearly demonstrate the problem
* **Include device information** (iOS/Android version, device model)

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, please include:

* **Use a clear and descriptive title** for the issue to identify the suggestion
* **Provide a step-by-step description of the suggested enhancement** in as many details as possible
* **Provide specific examples to demonstrate the steps** or point out the part of UnQuest where the suggestion is related to
* **Describe the current behavior** and **explain which behavior you expected to see instead** and why
* **Include screenshots and animated GIFs** which help demonstrate the steps or point out the part of UnQuest the suggestion is related to
* **Explain why this enhancement would be useful** to most UnQuest users

### Pull Requests

Please follow these steps to have your contribution considered by the maintainers:

1. **Fork the repository** and create your branch from `main`
2. **Set up your development environment** following the instructions in the README
3. **Make your changes** following our code style guidelines
4. **Add tests** for any new functionality
5. **Ensure all tests pass** by running `pnpm test`
6. **Run the full check suite** with `pnpm check-all`
7. **Update documentation** as needed
8. **Write a clear commit message** following our conventions
9. **Submit a pull request** with a comprehensive description of changes

## Development Setup

1. **Prerequisites**
   ```bash
   # Install Node.js 18+
   # Install pnpm
   npm install -g pnpm
   ```

2. **Clone and install**
   ```bash
   git clone https://github.com/yourusername/unquest.git
   cd unquest
   pnpm install
   ```

3. **Set up environment**
   ```bash
   cp .env.example .env.development
   # Edit .env.development with your configuration
   ```

4. **Run the app**
   ```bash
   # iOS
   pnpm ios
   
   # Android
   pnpm android
   ```

## Code Style Guidelines

### General Principles

- **Clarity over cleverness**: Write code that is easy to understand
- **Consistency**: Follow existing patterns in the codebase
- **Documentation**: Add comments for complex logic
- **Performance**: Consider performance implications of changes
- **Accessibility**: Ensure features are accessible to all users

### TypeScript

- Use TypeScript for all new code
- Define proper types and interfaces
- Avoid using `any` type
- Use type inference where appropriate

### React Native

- Use functional components with hooks
- Keep components focused and single-purpose
- Extract reusable logic into custom hooks
- Use proper prop types and default props

### File Organization

```
src/
├── api/          # API calls and data fetching
├── app/          # Screen components (Expo Router)
├── components/   # Reusable UI components
├── hooks/        # Custom React hooks
├── lib/          # Utilities and services
├── store/        # State management (Zustand)
└── types/        # TypeScript type definitions
```

### Naming Conventions

- **Files**: Use kebab-case (e.g., `quest-timer.ts`)
- **Components**: Use PascalCase (e.g., `QuestCard.tsx`)
- **Functions/Variables**: Use camelCase (e.g., `handleQuestComplete`)
- **Constants**: Use UPPER_SNAKE_CASE (e.g., `MAX_QUEST_DURATION`)
- **Types/Interfaces**: Use PascalCase with descriptive names

### Styling

- Use NativeWind (Tailwind for React Native) for styling
- Avoid inline styles except for dynamic values
- Follow the existing color scheme and design system
- Ensure responsive design for different screen sizes

### State Management

- Use Zustand stores for global state
- Keep component state local when possible
- Use direct store actions over hooks when appropriate
- Ensure state persistence with MMKV where needed

### Testing

- Write tests for new features and bug fixes
- Aim for meaningful test coverage, not just high percentages
- Use React Native Testing Library for component tests
- Mock external dependencies appropriately
- Follow the AAA pattern: Arrange, Act, Assert

Example test:
```typescript
describe('QuestTimer', () => {
  it('should start timer when quest begins', () => {
    // Arrange
    const quest = createMockQuest();
    
    // Act
    const { result } = renderHook(() => useQuestTimer(quest));
    act(() => result.current.start());
    
    // Assert
    expect(result.current.isRunning).toBe(true);
  });
});
```

## Running Quality Checks

Before submitting a PR, ensure all checks pass:

```bash
# Run all checks
pnpm check-all

# Individual checks
pnpm lint           # ESLint
pnpm type-check     # TypeScript
pnpm test           # Jest tests
pnpm test:ci        # Tests with coverage
```

## Documentation

- Update the README if you change functionality
- Add JSDoc comments for complex functions
- Update type definitions as needed
- Include examples for new features
- Keep documentation concise and clear

## Questions?

Feel free to open an issue with your question or reach out to the maintainers. We're here to help!

## Recognition

Contributors will be recognized in our README and release notes. Thank you for helping make UnQuest better!

## License

By contributing to UnQuest, you agree that your contributions will be licensed under the MIT License.