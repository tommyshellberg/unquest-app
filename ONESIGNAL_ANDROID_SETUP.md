# OneSignal Android Push Notification Setup Guide

## Issue
You're experiencing "Invalid Google Project Number" error in OneSignal, preventing Android push notifications from working.

## Root Cause
The OneSignal Expo plugin wasn't configured in your app.config.ts, and Firebase configuration needs to be properly linked.

## What I've Done
1. ✅ Installed `onesignal-expo-plugin` package
2. ✅ Added the plugin to your app.config.ts with proper configuration

## What You Need to Do

### 1. Generate and Upload Firebase Credentials to OneSignal

According to OneSignal's documentation, you need to upload your Firebase credentials directly to OneSignal (not in your project). Follow these steps:

1. **Get Firebase Service Account JSON**:
   - Go to Firebase Console (https://console.firebase.google.com)
   - Select your unQuest project
   - Go to Project Settings (gear icon) → Service Accounts tab
   - Click "Generate new private key" button
   - Download the JSON file (this contains your service account credentials)

2. **Upload to OneSignal**:
   - Go to OneSignal Dashboard
   - Navigate to Settings → Platforms → Google Android (FCM)
   - Click "Configure" or "Edit"
   - Upload the service account JSON file you just downloaded
   - Save the configuration

3. **Verify Configuration**:
   - In OneSignal, you should see "FCM Configuration: Valid" or similar
   - The Project Number should show as 122930798648 (matching your Firebase project)

### 4. Rebuild Your App
After making these changes:
```bash
# For development build
pnpm run build:development:android

# For staging build  
pnpm run build:staging:android

# For production build
pnpm run build:production:android
```

### 5. Test Push Notifications
After rebuilding:
1. Install the new build on your Android device/simulator
2. Open the app and grant notification permissions
3. Check the debug logs in the app for OneSignal subscription status
4. In OneSignal Dashboard, verify your device appears as subscribed

## Important Notes
- You do NOT need to add google-services.json to your project - OneSignal handles this through their dashboard
- The OneSignal Expo plugin automatically configures your app during the build process
- You must rebuild the app after adding the plugin configuration
- The Firebase Service Account JSON (uploaded to OneSignal) is different from google-services.json
- If you're using a simulator, ensure it has Google Play Services installed

## Debugging
If issues persist after following these steps:
1. Check EAS build logs for any OneSignal related errors
2. Verify in OneSignal dashboard that FCM configuration shows as "Valid"
3. Use the debug buttons in Settings screen to check OneSignal subscription status
4. Check OneSignal dashboard for any error messages about your app configuration
5. Ensure your Firebase project has Cloud Messaging API enabled