import { Redirect, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';

import { LoginForm } from '@/components/login-form';
import { FocusAwareStatusBar } from '@/components/ui';
import { useAuth } from '@/lib';

export default function Login() {
  const params = useLocalSearchParams();
  const [error, setError] = useState<string | null>(null);

  // Extract error from URL parameters
  useEffect(() => {
    if (params.error) {
      setError(decodeURIComponent(params.error as string));
    }
  }, [params]);

  // If we're already logged in, redirect to the home screen
  const { status } = useAuth();
  if (status === 'signIn') {
    return <Redirect href="/" />;
  }

  return (
    <>
      <FocusAwareStatusBar />
      <LoginForm initialError={error} />
    </>
  );
}
