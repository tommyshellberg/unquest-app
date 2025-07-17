import React, { useState } from 'react';
import { View, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { showMessage } from 'react-native-flash-message';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { Modal } from '@/components/ui/modal';
import { revenueCatService } from '@/lib/services/revenuecat-service';

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
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  
  console.log('[PremiumPaywall] Rendered with isVisible:', isVisible);

  const handleShowPaywall = async () => {
    setIsLoading(true);
    
    try {
      // Present the RevenueCat paywall
      const didPurchase = await revenueCatService.presentPaywall();
      
      if (didPurchase) {
        showMessage({
          message: 'Welcome to the unQuest Circle!',
          description: 'You now have access to all premium features.',
          type: 'success',
          duration: 3000,
        });
        
        onClose();
        
        // Call success callback if provided
        if (onSuccess) {
          onSuccess();
        }
      }
    } catch (error: any) {
      console.error('Failed to present paywall:', error);
      
      // In development, show a test purchase success for bundle ID mismatch
      if (__DEV__ && (error.message?.includes('Bundle ID') || error.message?.includes('Test Mode'))) {
        Alert.alert(
          'Test Mode Active',
          'In development, purchases are simulated. Tap OK to simulate a successful purchase.',
          [
            { 
              text: 'Cancel',
              style: 'cancel'
            },
            { 
              text: 'OK',
              onPress: () => {
                showMessage({
                  message: 'Test Purchase Successful!',
                  description: 'Premium features are now unlocked (test mode).',
                  type: 'success',
                  duration: 3000,
                });
                
                onClose();
                if (onSuccess) {
                  onSuccess();
                }
              }
            }
          ]
        );
      } else if (error.message?.includes('offerings') || error.code === 'NoOfferingsFound') {
        Alert.alert(
          'Products Not Available',
          'Premium subscriptions are being set up. Please check back soon!',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Unable to Show Subscription Options',
          'Please try again later or contact support if the issue persists.',
          [{ text: 'OK' }]
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestorePurchases = async () => {
    setIsLoading(true);
    
    try {
      await revenueCatService.restorePurchases();
      
      // Check if user now has premium access
      const hasPremium = await revenueCatService.hasPremiumAccess();
      
      if (hasPremium) {
        showMessage({
          message: 'Purchases Restored!',
          description: 'Your premium access has been restored.',
          type: 'success',
          duration: 3000,
        });
        
        onClose();
        
        // Call success callback if provided
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
      console.error('Failed to restore purchases:', error);
      Alert.alert(
        'Restore Failed',
        'Unable to restore purchases. Please try again later.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isVisible={isVisible}
      onClose={onClose}
      title="Join the unQuest Circle"
    >
      <View className="space-y-4">
        <Text className="text-center text-lg text-gray-700 dark:text-gray-300">
          Unlock {featureName} and all premium features by joining the unQuest Circle!
        </Text>
        
        <View className="space-y-3">
          <Text className="font-semibold text-lg text-gray-900 dark:text-white">
            Premium Benefits:
          </Text>
          
          <View className="space-y-2">
            <Text className="text-gray-700 dark:text-gray-300">
              • Cooperative Quests - Team up with friends
            </Text>
            <Text className="text-gray-700 dark:text-gray-300">
              • Vaedros Storyline - Continue the epic adventure
            </Text>
            <Text className="text-gray-700 dark:text-gray-300">
              • Exclusive Characters & Customization
            </Text>
            <Text className="text-gray-700 dark:text-gray-300">
              • Advanced Statistics & Insights
            </Text>
            <Text className="text-gray-700 dark:text-gray-300">
              • Priority Support
            </Text>
          </View>
        </View>
        
        <View className="space-y-3 pt-4">
          <Button
            label="View Subscription Options"
            onPress={handleShowPaywall}
            loading={isLoading}
            variant="primary"
          />
          
          <Button
            label="Restore Purchases"
            onPress={handleRestorePurchases}
            loading={isLoading}
            variant="secondary"
          />
          
          <Button
            label="Maybe Later"
            onPress={onClose}
            disabled={isLoading}
            variant="ghost"
          />
        </View>
      </View>
    </Modal>
  );
}