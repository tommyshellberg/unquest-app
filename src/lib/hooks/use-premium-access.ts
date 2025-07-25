import { useCallback, useEffect, useState } from 'react';

import { revenueCatService } from '@/lib/services/revenuecat-service';

export function usePremiumAccess() {
  const [hasPremiumAccess, setHasPremiumAccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showPaywall, setShowPaywall] = useState(false);

  const checkPremiumAccess = useCallback(async () => {
    try {
      const hasAccess = await revenueCatService.hasPremiumAccess();
      setHasPremiumAccess(hasAccess);
      return hasAccess;
    } catch (error) {
      console.error('Failed to check premium access:', error);
      setHasPremiumAccess(false);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkPremiumAccess();
  }, [checkPremiumAccess]);

  const requirePremium = useCallback(
    (callback?: () => void) => {
      if (hasPremiumAccess) {
        if (callback) {
          callback();
        }
        return true;
      } else {
        setShowPaywall(true);
        return false;
      }
    },
    [hasPremiumAccess]
  );

  const handlePaywallClose = useCallback(() => {
    setShowPaywall(false);
  }, []);

  const handlePaywallSuccess = useCallback(async () => {
    console.log('[usePremiumAccess] Paywall success - updating premium status');
    setShowPaywall(false);
    
    // Immediately check and update premium status
    const hasAccess = await checkPremiumAccess();
    
    // If we now have premium access, update the state immediately
    if (hasAccess) {
      console.log('[usePremiumAccess] Premium access confirmed - updating state');
      setHasPremiumAccess(true);
    }
  }, [checkPremiumAccess]);

  // Force refresh premium status (useful for when app returns from background)
  const refreshPremiumStatus = useCallback(async () => {
    console.log('[usePremiumAccess] Refreshing premium status...');
    return checkPremiumAccess();
  }, [checkPremiumAccess]);

  return {
    hasPremiumAccess,
    isLoading,
    showPaywall,
    requirePremium,
    handlePaywallClose,
    handlePaywallSuccess,
    checkPremiumAccess,
    refreshPremiumStatus,
  };
}
