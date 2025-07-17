import Purchases, {
  LOG_LEVEL,
  CustomerInfo,
  PurchasesPackage,
  PurchasesOffering,
} from 'react-native-purchases';
import RevenueCatUI from 'react-native-purchases-ui';
import { Platform } from 'react-native';
import { Env } from '@env';

export class RevenueCatService {
  private static instance: RevenueCatService;
  private isInitialized = false;
  private customerInfo: CustomerInfo | null = null;
  private testModeEnabled = false;
  private initializationPromise: Promise<void> | null = null;

  private constructor() {}

  static getInstance(): RevenueCatService {
    if (!RevenueCatService.instance) {
      RevenueCatService.instance = new RevenueCatService();
    }
    return RevenueCatService.instance;
  }

  // Enable test mode for development - bypasses actual purchases
  enableTestMode(): void {
    if (__DEV__) {
      this.testModeEnabled = true;
      console.log('RevenueCat Test Mode Enabled - Purchases will be simulated');
    }
  }

  async initialize(userId?: string): Promise<void> {
    if (this.isInitialized) {
      console.log('RevenueCat already initialized');
      return;
    }

    // If initialization is already in progress, wait for it
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    // Start initialization
    this.initializationPromise = this.performInitialization(userId);
    return this.initializationPromise;
  }

  private async performInitialization(userId?: string): Promise<void> {
    try {
      // Enable debug logs in development
      if (__DEV__) {
        Purchases.setLogLevel(LOG_LEVEL.VERBOSE);
        
        // Enable debug mode for testing
        // This helps identify sandbox vs production purchases
        await Purchases.setDebugLogsEnabled(true);
        
        // Optional: Set to false to test production-like behavior
        // await Purchases.setSimulatesAskToBuyInSandbox(true);
      }

      // Configure RevenueCat with platform-specific API key
      if (Platform.OS === 'ios') {
        await Purchases.configure({ apiKey: Env.REVENUECAT_APPLE_API_KEY });
      } else if (Platform.OS === 'android') {
        await Purchases.configure({ apiKey: Env.REVENUECAT_GOOGLE_API_KEY });
      }

      // Log in user if userId is provided
      if (userId) {
        await this.loginUser(userId);
      }

      // Get initial customer info
      await this.refreshCustomerInfo();

      this.isInitialized = true;
      console.log('RevenueCat initialized successfully');
    } catch (error) {
      console.error('Failed to initialize RevenueCat:', error);
      this.initializationPromise = null; // Reset on error
      throw error;
    }
  }

  async waitForInitialization(): Promise<void> {
    if (this.isInitialized) {
      return;
    }
    
    if (this.initializationPromise) {
      await this.initializationPromise;
    }
  }

  async loginUser(userId: string): Promise<void> {
    try {
      const { customerInfo } = await Purchases.logIn(userId);
      this.customerInfo = customerInfo;
      console.log('RevenueCat user logged in:', userId);
    } catch (error) {
      console.error('Failed to log in user to RevenueCat:', error);
      throw error;
    }
  }

  async logoutUser(): Promise<void> {
    try {
      const { customerInfo } = await Purchases.logOut();
      this.customerInfo = customerInfo;
      console.log('RevenueCat user logged out');
    } catch (error) {
      console.error('Failed to log out user from RevenueCat:', error);
      throw error;
    }
  }

  async refreshCustomerInfo(): Promise<CustomerInfo> {
    if (!this.isInitialized) {
      throw new Error('RevenueCat not initialized. Call initialize() first.');
    }
    
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      this.customerInfo = customerInfo;
      return customerInfo;
    } catch (error) {
      console.error('Failed to get customer info:', error);
      throw error;
    }
  }

  async hasPremiumAccess(): Promise<boolean> {
    // If not initialized, return false (no premium access)
    if (!this.isInitialized) {
      console.log('RevenueCat not initialized, returning no premium access');
      return false;
    }

    // Test mode - always return true for premium access
    if (this.testModeEnabled && __DEV__) {
      console.log('Test Mode: Premium access granted');
      return true;
    }

    try {
      const customerInfo = await this.refreshCustomerInfo();
      // Check for any active premium entitlement
      const premiumEntitlements = ['premium', 'premium_monthly', 'premium_yearly', 'pro'];
      
      for (const entitlement of premiumEntitlements) {
        if (customerInfo.entitlements.active[entitlement]) {
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('Failed to check premium access:', error);
      return false;
    }
  }

  async getOfferings(): Promise<PurchasesOffering | null> {
    try {
      const offerings = await Purchases.getOfferings();
      return offerings.current;
    } catch (error) {
      console.error('Failed to get offerings:', error);
      return null;
    }
  }

  async purchasePackage(pkg: PurchasesPackage): Promise<CustomerInfo> {
    try {
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      this.customerInfo = customerInfo;
      return customerInfo;
    } catch (error) {
      console.error('Failed to purchase package:', error);
      throw error;
    }
  }

  async restorePurchases(): Promise<CustomerInfo> {
    try {
      const customerInfo = await Purchases.restorePurchases();
      this.customerInfo = customerInfo;
      return customerInfo;
    } catch (error) {
      console.error('Failed to restore purchases:', error);
      throw error;
    }
  }

  async presentPaywall(): Promise<boolean> {
    // Test mode - simulate successful purchase
    if (this.testModeEnabled && __DEV__) {
      console.log('Test Mode: Simulating successful purchase');
      // Simulate a delay for realism
      await new Promise(resolve => setTimeout(resolve, 1500));
      return true;
    }

    try {
      // First check if we have offerings
      const offerings = await Purchases.getOfferings();
      if (!offerings.current) {
        console.warn('No offerings available, this usually means products are not configured properly');
        
        // In development with bundle ID mismatch, fallback to test mode
        if (__DEV__) {
          console.log('Development mode: Bundle ID mismatch detected, using test mode');
          this.testModeEnabled = true;
          return this.presentPaywall(); // Recursive call with test mode enabled
        }
        
        throw new Error('NoOfferingsFound');
      }

      const paywallResult = await RevenueCatUI.presentPaywall();
      
      if (paywallResult === RevenueCatUI.PAYWALL_RESULT.PURCHASED || 
          paywallResult === RevenueCatUI.PAYWALL_RESULT.RESTORED) {
        // Refresh customer info after successful purchase/restore
        await this.refreshCustomerInfo();
        return true;
      }
      
      return false;
    } catch (error: any) {
      console.error('Failed to present paywall:', error);
      
      // If bundle ID mismatch in development, use test mode
      if (__DEV__ && (error.message?.includes('Bundle ID') || error.userInfo?.readable_error_code === 'CONFIGURATION_ERROR')) {
        console.log('Development mode: Configuration error detected, using test mode');
        this.testModeEnabled = true;
        return this.presentPaywall(); // Recursive call with test mode enabled
      }
      
      throw error;
    }
  }

  async presentPaywallIfNeeded(): Promise<boolean> {
    try {
      const paywallResult = await RevenueCatUI.presentPaywallIfNeeded({
        requiredEntitlementIdentifier: 'premium',
      });
      
      if (paywallResult === RevenueCatUI.PAYWALL_RESULT.PURCHASED || 
          paywallResult === RevenueCatUI.PAYWALL_RESULT.RESTORED) {
        // Refresh customer info after successful purchase/restore
        await this.refreshCustomerInfo();
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Failed to present paywall if needed:', error);
      throw error;
    }
  }

  getCustomerInfo(): CustomerInfo | null {
    return this.customerInfo;
  }

  isConfigured(): boolean {
    return this.isInitialized;
  }
}

// Export singleton instance
export const revenueCatService = RevenueCatService.getInstance();