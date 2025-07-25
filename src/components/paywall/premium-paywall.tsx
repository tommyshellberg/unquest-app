import React, { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { showMessage } from 'react-native-flash-message';
import RevenueCatUI from 'react-native-purchases-ui';
import type { CustomerInfo } from 'react-native-purchases';

import { revenueCatService } from '@/lib/services/revenuecat-service';
import { refreshPremiumStatus } from '@/lib/services/user';

interface PremiumPaywallProps {
  isVisible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  featureName?: string;
}

export function PremiumPaywall({
  isVisible,
  onClose,
  onSuccess,
  featureName = 'this feature',
}: PremiumPaywallProps) {
  console.log('[PremiumPaywall] Component rendered with isVisible:', isVisible);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [hasPresented, setHasPresented] = useState(false);

  // Handle purchase started
  const handlePurchaseStarted = useCallback(() => {
    console.log('[PremiumPaywall] Purchase started');
    setIsPurchasing(true);
  }, []);

  // Handle successful purchase
  const handlePurchaseCompleted = useCallback(async (customerInfo: { customerInfo: CustomerInfo }) => {
    console.log('[PremiumPaywall] Purchase completed', customerInfo);
    setIsPurchasing(false);
    
    // Immediately refresh premium access from RevenueCat SDK
    try {
      const hasAccess = await revenueCatService.hasPremiumAccess();
      console.log('[PremiumPaywall] Premium access after purchase:', hasAccess);
      
      if (hasAccess) {
        showMessage({
          message: 'Welcome to the unQuest Circle!',
          description: 'You now have access to all premium features.',
          type: 'success',
          duration: 3000,
        });
        
        // Call success callback to trigger any parent updates
        if (onSuccess) {
          onSuccess();
        }
      }
    } catch (error) {
      console.error('[PremiumPaywall] Error checking premium access:', error);
    }
    
    onClose();
  }, [onSuccess, onClose]);

  // Handle purchase error
  const handlePurchaseError = useCallback((error: { error: any }) => {
    console.error('[PremiumPaywall] Purchase error:', error);
    setIsPurchasing(false);
    
    Alert.alert(
      'Purchase Error',
      'Unable to complete purchase. Please try again.',
      [{ text: 'OK' }]
    );
  }, []);

  // Handle purchase cancelled
  const handlePurchaseCancelled = useCallback(() => {
    console.log('[PremiumPaywall] Purchase cancelled');
    setIsPurchasing(false);
  }, []);

  // Handle restore completed
  const handleRestoreCompleted = useCallback(async (customerInfo: { customerInfo: CustomerInfo }) => {
    console.log('[PremiumPaywall] Restore completed', customerInfo);
    
    // Check if user now has premium access
    try {
      const hasAccess = await revenueCatService.hasPremiumAccess();
      if (hasAccess) {
        showMessage({
          message: 'Premium Access Restored!',
          description: 'Your premium features have been restored.',
          type: 'success',
          duration: 3000,
        });
        
        if (onSuccess) {
          onSuccess();
        }
      } else {
        showMessage({
          message: 'No Purchases Found',
          description: 'No previous purchases were found to restore.',
          type: 'info',
          duration: 3000,
        });
      }
    } catch (error) {
      console.error('[PremiumPaywall] Error checking premium access:', error);
    }
    
    onClose();
  }, [onSuccess, onClose]);

  // Handle restore error
  const handleRestoreError = useCallback((error: { error: any }) => {
    console.error('[PremiumPaywall] Restore error:', error);
    
    Alert.alert(
      'Restore Error',
      'Unable to restore purchases. Please try again.',
      [{ text: 'OK' }]
    );
  }, []);

  // Handle paywall dismiss
  const handleDismiss = useCallback(() => {
    console.log('[PremiumPaywall] Paywall dismissed');
    if (!isPurchasing) {
      onClose();
    }
  }, [isPurchasing, onClose]);

  // Reset hasPresented when isVisible changes from true to false
  useEffect(() => {
    if (!isVisible) {
      console.log('[PremiumPaywall] Resetting hasPresented flag');
      setHasPresented(false);
    }
  }, [isVisible]);

  useEffect(() => {
    if (isVisible && !hasPresented) {
      console.log('[PremiumPaywall] Attempting to present paywall with event listeners...');
      setHasPresented(true);

      // Present the paywall immediately when visible
      const presentPaywall = async () => {
        try {
          const paywallResult = await RevenueCatUI.presentPaywall();
          console.log('[PremiumPaywall] Paywall presentation result:', paywallResult);
          
          // Handle any immediate presentation errors
          if (paywallResult === RevenueCatUI.PAYWALL_RESULT.ERROR) {
            Alert.alert(
              'Error',
              'Unable to show subscription options. Please try again later.',
              [{ text: 'OK', onPress: onClose }]
            );
          } else if (paywallResult === RevenueCatUI.PAYWALL_RESULT.NOT_PRESENTED) {
            Alert.alert(
              'Configuration Error',
              'Unable to show paywall. Please ensure you have an active internet connection.',
              [{ text: 'OK', onPress: onClose }]
            );
          } else if (paywallResult === RevenueCatUI.PAYWALL_RESULT.CANCELLED) {
            console.log('[PremiumPaywall] User cancelled the paywall');
            onClose();
          } else if (paywallResult === RevenueCatUI.PAYWALL_RESULT.PURCHASED || 
                     paywallResult === RevenueCatUI.PAYWALL_RESULT.RESTORED) {
            console.log('[PremiumPaywall] Purchase/Restore successful:', paywallResult);
            
            // Refresh customer info to ensure we have the latest data
            try {
              await revenueCatService.refreshCustomerInfo();
              const hasAccess = await revenueCatService.hasPremiumAccess();
              console.log('[PremiumPaywall] Premium access after purchase:', hasAccess);
              
              if (hasAccess) {
                showMessage({
                  message: paywallResult === RevenueCatUI.PAYWALL_RESULT.RESTORED 
                    ? 'Premium Access Restored!' 
                    : 'Welcome to the unQuest Circle!',
                  description: paywallResult === RevenueCatUI.PAYWALL_RESULT.RESTORED
                    ? 'Your premium features have been restored.'
                    : 'You now have access to all premium features.',
                  type: 'success',
                  duration: 3000,
                });
                
                // Sync premium status with server
                console.log('[PremiumPaywall] Syncing premium status with server...');
                try {
                  const serverResponse = await refreshPremiumStatus();
                  console.log('[PremiumPaywall] Server sync response:', serverResponse);
                } catch (serverError) {
                  // Don't fail the purchase flow if server sync fails
                  console.error('[PremiumPaywall] Failed to sync with server:', serverError);
                  // The server will eventually sync via webhooks or next API call
                }
              }
            } catch (error) {
              console.error('[PremiumPaywall] Error checking premium access after purchase:', error);
            }
            
            // Call success callback
            if (onSuccess) {
              onSuccess();
            }
            onClose();
          }
        } catch (error: any) {
          console.error('[PremiumPaywall] Error presenting paywall:', error);

          // In development, check for common issues
          if (__DEV__) {
            if (
              error.message?.includes('No offerings found') ||
              error.message?.includes('Bundle ID')
            ) {
              Alert.alert(
                'Development Configuration',
                'RevenueCat is not configured for this bundle ID. Using test mode.',
                [
                  {
                    text: 'Simulate Purchase',
                    onPress: async () => {
                      // Enable test mode
                      revenueCatService.enableTestMode();
                      
                      showMessage({
                        message: 'Test Purchase Successful!',
                        description: 'Premium features unlocked (test mode).',
                        type: 'success',
                        duration: 3000,
                      });
                      
                      if (onSuccess) {
                        onSuccess();
                      }
                      onClose();
                    },
                  },
                  { text: 'Cancel', onPress: onClose },
                ]
              );
              return;
            }
          }

          Alert.alert(
            'Error',
            'Unable to show subscription options. Please try again later.',
            [{ text: 'OK', onPress: onClose }]
          );
        }
      };

      presentPaywall();
    }
  }, [isVisible, hasPresented, onClose, onSuccess]);

  // This component doesn't render anything visible
  return null;
}
