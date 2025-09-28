# Timezone Detection Implementation

This document describes the client-side timezone detection feature implemented in the emberglow React Native app.

## Overview

The app now automatically detects and syncs the user's device timezone with the server to ensure accurate streak calculations and notification scheduling.

## Implementation Details

### 1. Timezone Service (`src/lib/services/timezone-service.ts`)

The timezone service provides the following functionality:

- **Device Timezone Detection**: Uses `expo-localization` to get the current device timezone
- **Automatic Sync**: Syncs timezone with server when:
  - App initializes
  - User logs in
  - App returns to foreground (useful when user travels)
- **Smart Updates**: Only updates server timezone if:
  - No timezone is set on server, OR
  - The server timezone hasn't been manually changed by the user
- **Supported Timezones**: Validates against the app's list of supported timezones

### 2. Integration Points

- **App Initialization**: The timezone sync is initialized in `src/app/_layout.tsx` when the app starts
- **API Integration**: Uses existing `/v1/users/notification-settings` endpoint
- **Settings Screen**: Works seamlessly with manual timezone selection in settings

### 3. Key Features

- **Non-intrusive**: Won't overwrite manually selected timezones
- **Automatic**: No user action required
- **Travel-friendly**: Updates when app comes to foreground
- **Error resilient**: Handles API failures gracefully

## Testing

The implementation includes comprehensive tests:

- Unit tests for timezone service logic
- Integration tests for expo-localization
- Mock implementations for all external dependencies

## Usage

The timezone detection runs automatically. No additional configuration or user action is required.

When a user:

1. Opens the app for the first time → timezone is detected and sent to server
2. Travels to a new timezone → timezone updates when app returns to foreground
3. Manually selects a timezone in settings → automatic detection respects this choice
