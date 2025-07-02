import React from 'react';
import { PostHogProvider } from 'posthog-react-native';

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
      options={options}
      // Disable autocapture to prevent navigation errors
      autocapture={false}
    >
      {children}
    </PostHogProvider>
  );
}