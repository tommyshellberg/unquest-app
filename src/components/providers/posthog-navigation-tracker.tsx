import { usePathname } from 'expo-router';
import { usePostHog } from 'posthog-react-native';
import { useEffect } from 'react';

export function PostHogNavigationTracker() {
  const pathname = usePathname();
  const posthog = usePostHog();

  useEffect(() => {
    if (pathname && posthog) {
      // Manually track screen views
      posthog.screen(pathname);
    }
  }, [pathname, posthog]);

  return null;
}
