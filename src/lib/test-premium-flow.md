# Premium Purchase Flow Test Guide

## Testing the Optimistic Premium Update Flow

### 1. Initial State Check
- Open the app and navigate to a premium feature
- Verify the paywall appears when trying to access premium content
- Check console logs for `[usePremiumAccess]` and `[PremiumPaywall]` entries

### 2. Purchase Flow
When you tap to purchase:
1. **Purchase Started**: 
   - Log: `[PremiumPaywall] Purchase started`
   - The purchase UI should show loading state

2. **Purchase Completed**:
   - Log: `[PremiumPaywall] Purchase completed`
   - Log: `[PremiumPaywall] Premium access after purchase: true`
   - Success toast: "Welcome to the emberglow Circle!"
   - Paywall closes automatically
   - Premium features immediately accessible

3. **Client-Side Verification**:
   - `revenueCatService.hasPremiumAccess()` returns true immediately
   - No waiting for server webhook
   - Premium UI elements update instantly

### 3. Server-Side Verification
When attempting premium actions (e.g., starting a premium quest):
- Server checks RevenueCat directly via API
- Uses 24-hour cache to reduce API calls
- Validates premium access before allowing action

### 4. App Restart Verification
- Close and reopen the app
- Premium status should persist (RevenueCat SDK caches locally)
- `/users/me` endpoint includes `hasPremiumAccess: true`

### 5. Edge Cases to Test

#### A. Purchase Cancellation
- Start purchase then cancel
- Log: `[PremiumPaywall] Purchase cancelled`
- Paywall should remain open or close based on user action

#### B. Purchase Error
- If purchase fails (network issue, payment declined)
- Log: `[PremiumPaywall] Purchase error:`
- Error alert shown to user
- User can retry

#### C. Restore Purchases
- Use restore option in paywall
- If previous purchase found: Success toast and premium access granted
- If no purchase found: Info toast "No previous purchases found"

#### D. Development Mode
- In dev with no RevenueCat config:
- "Simulate Purchase" option appears
- Test mode enables premium features for development

### 6. Key Implementation Details

1. **Optimistic Updates**: Premium access granted immediately on successful purchase
2. **No Webhook Dependency**: Works without webhooks for instant access
3. **Server Validation**: Premium actions validated server-side when requested
4. **Cache Strategy**: 24-hour server cache prevents excessive RevenueCat API calls
5. **Offline Support**: RevenueCat SDK handles offline scenarios

### Console Log Pattern for Successful Purchase:
```
[PremiumPaywall] Component rendered with isVisible: true
[PremiumPaywall] Attempting to present paywall with event listeners...
[PremiumPaywall] Purchase started
[PremiumPaywall] Purchase completed {customerInfo: {...}}
[RevenueCat] Premium access after purchase: true
[PremiumPaywall] Premium access after purchase: true
[usePremiumAccess] Paywall success - updating premium status
[usePremiumAccess] Premium access confirmed - updating state
```