import { PostHogProvider } from 'posthog-react-native';
import React from 'react';

interface PostHogProviderWrapperProps {
  apiKey: string;
  options: {
    host: string;
  };
  children: React.ReactNode;
}

export function PostHogProviderWrapper({
  apiKey,
  options,
  children,
}: PostHogProviderWrapperProps) {
  return (
    <PostHogProvider
      apiKey={apiKey}
      options={{
        ...options,
        // Disable PostHog in development to prevent annoying error messages
        disabled: __DEV__,
      }}
      // Disable autocapture to prevent navigation errors
      autocapture={false}
    >
      {children}
    </PostHogProvider>
  );
}
