import { useCallback, useState } from 'react';

import { getUserDetails } from '@/lib/services/user';

export function useProfileData() {
  const [userEmail, setUserEmail] = useState('');

  const fetchUserDetails = useCallback(async () => {
    try {
      const details = await getUserDetails();
      setUserEmail(details.email.toLowerCase());
    } catch (error) {
      console.error('Failed to fetch user details:', error);
    }
  }, []);

  return {
    userEmail,
    fetchUserDetails,
  };
}
