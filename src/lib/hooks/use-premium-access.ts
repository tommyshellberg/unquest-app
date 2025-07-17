import { useState, useEffect, useCallback } from 'react';
import { revenueCatService } from '@/lib/services/revenuecat-service';

export function usePremiumAccess() {
  const [hasPremiumAccess, setHasPremiumAccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showPaywall, setShowPaywall] = useState(false);

  const checkPremiumAccess = useCallback(async () => {
    try {
      // Wait for RevenueCat to be initialized
      await revenueCatService.waitForInitialization();
      
      const hasAccess = await revenueCatService.hasPremiumAccess();
      setHasPremiumAccess(hasAccess);
    } catch (error) {
      console.error('Failed to check premium access:', error);
      setHasPremiumAccess(false);
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

  const handlePaywallSuccess = useCallback(() => {
    setShowPaywall(false);
    checkPremiumAccess(); // Refresh premium status
  }, [checkPremiumAccess]);

  return {
    hasPremiumAccess,
    isLoading,
    showPaywall,
    requirePremium,
    handlePaywallClose,
    handlePaywallSuccess,
    checkPremiumAccess,
  };
}