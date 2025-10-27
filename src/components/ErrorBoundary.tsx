import { Env } from '@env';
import * as Sentry from '@sentry/react-native';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface Props {
  error: Error;
  retry: () => void;
}

export function ErrorBoundary({ error, retry }: Props) {
  const router = useRouter();

  React.useEffect(() => {
    // Log error to Sentry in production
    if (Env.APP_ENV === 'production') {
      Sentry.captureException(error);
    }
  }, [error]);

  // In development, show the full error
  if (Env.APP_ENV !== 'production') {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Something went wrong</Text>
        <Text style={styles.errorText}>Error: {error.message}</Text>
        {error.stack && (
          <Text style={styles.stackText} numberOfLines={10}>
            {error.stack}
          </Text>
        )}
        <TouchableOpacity style={styles.button} onPress={retry}>
          <Text style={styles.buttonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // In production, show a user-friendly message
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Oops!</Text>
      <Text style={styles.subtitle}>Something unexpected happened</Text>
      <Text style={styles.description}>
        We've been notified and are working on fixing this. Please try again.
      </Text>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={retry}
        >
          <Text style={styles.buttonText}>Try Again</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={() => router.replace('/')}
        >
          <Text style={[styles.buttonText, styles.secondaryButtonText]}>
            Go Home
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF1DC',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1f0f0c',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 20,
    color: '#1f0f0c',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#817164',
    textAlign: 'center',
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#813327',
    marginBottom: 16,
    textAlign: 'center',
  },
  stackText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 16,
    fontFamily: 'monospace',
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  buttonContainer: {
    gap: 12,
    width: '100%',
    maxWidth: 300,
  },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
  },
  primaryButton: {
    backgroundColor: '#3B7A57',
    borderColor: '#3B7A57',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderColor: '#3B7A57',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  secondaryButtonText: {
    color: '#3B7A57',
  },
});
