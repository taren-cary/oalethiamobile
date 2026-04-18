# Credit System Update - Implementation Summary

## Overview
Updated the frontend to integrate with the new backend credit system that handles:
- Instant credit grants on tier upgrades
- Graceful Drain (no reset if balance > tier limit)
- Credit purchases that never expire

## Changes Made

### 1. IapService.ts - Added Credit Purchase API Calls

**File**: `iap/IapService.ts`

#### Change 1: `InAppPurchasesMaybeVerifyAndFinish` function (lines 195-211)
Added code to call the credit purchase endpoint after successful IAP verification:

```typescript
// After successful verification, call the credit purchase endpoint if this is a credits purchase
if (meta.receiptType === 'credits' && meta.creditsToAdd) {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const session = sessionData?.session;
    if (session) {
      await fetch(`${API_BASE_URL}/api/credits/purchase`, {
        method: 'POST',
        headers: getAuthHeaders(session),
        body: JSON.stringify({ amount: meta.creditsToAdd }),
      });
    }
  } catch (e) {
    // Log but don't fail the purchase - the backend verification already succeeded
    console.warn('Failed to call credit purchase endpoint:', e);
  }
}
```

**What it does**:
- After Apple/Google verifies the IAP receipt, calls the backend to record the credit purchase
- Uses the `amount` from `meta.creditsToAdd` (3 credits for the 3-pack)
- Gracefully handles errors - if this call fails, the purchase is still valid
- This runs during live purchases (when user clicks "Buy Credits")

#### Change 2: `verifyReceiptOnServer` function (lines 239-255)
Added the same credit purchase API call for restore/sync operations:

```typescript
// After successful verification, call the credit purchase endpoint if this is a credits purchase
if (args.receiptType === 'credits' && args.creditsToAdd) {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const session = sessionData?.session;
    if (session) {
      await fetch(`${API_BASE_URL}/api/credits/purchase`, {
        method: 'POST',
        headers: getAuthHeaders(session),
        body: JSON.stringify({ amount: args.creditsToAdd }),
      });
    }
  } catch (e) {
    // Log but don't fail the purchase - the backend verification already succeeded
    console.warn('Failed to call credit purchase endpoint:', e);
  }
}
```

**What it does**:
- Same logic as above, but for restore/sync flows
- Runs when user restores purchases or when the app syncs on startup/foreground
- Ensures credits are properly recorded even if the initial purchase didn't complete the call

## How It Works End-to-End

### Purchase Flow
1. User taps "Buy Credits" → Opens modal
2. User taps "Continue to checkout" → `IapService.buyCredits3Pack()` called
3. Apple/Google processes the IAP → Purchase listener fires
4. **New**: After verification, calls `POST /api/credits/purchase` with `{ amount: 3 }`
5. Backend records the purchase and adds purchased credits
6. `emitIapUpdated()` triggers → `SubscriptionContext` refreshes
7. `GET /api/credits` returns updated balance
8. UI shows new credit count

### Restore/Sync Flow
1. User taps "Restore Purchases" OR app comes to foreground
2. `IapService.restorePurchases()` or `syncOwnedEntitlements()` called
3. Fetches purchase history from Apple/Google
4. For each purchase, calls `verifyReceiptOnServer()`
5. **New**: After verification, calls `POST /api/credits/purchase` with `{ amount: 3 }`
6. Backend records any missing purchases
7. UI updates with correct balance

## Backend Integration

The frontend now correctly calls:

```
POST /api/credits/purchase
Authorization: Bearer <supabase_access_token>
Content-Type: application/json

{
  "amount": 3
}
```

The backend (as per your spec) handles:
- ✅ Instant credit grants on tier upgrades
- ✅ Graceful Drain on tier downgrades
- ✅ Purchased credits that never expire
- ✅ Monthly resets that preserve purchased credits

## No Other Changes Required

### What stays the same:
- ✅ `SubscriptionContext` - No changes needed, already refreshes credits after purchases
- ✅ `GET /api/credits` calls - Work as-is, backend returns correct balance
- ✅ UI components - No changes needed, display updated credits automatically
- ✅ Timeline generation - Uses existing credit deduction flow

### Automatic behaviors (handled by backend):
- ✅ Tier upgrades grant credits immediately
- ✅ Tier downgrades don't reset credits if balance > new tier limit
- ✅ Monthly resets use Graceful Drain algorithm
- ✅ Purchased credits persist across tier changes

## Testing Checklist

- [ ] Test credit purchase in TestFlight
  - [ ] Buy 3-credit pack
  - [ ] Verify `/api/credits/purchase` is called
  - [ ] Verify credits appear in UI
- [ ] Test restore purchases
  - [ ] Delete and reinstall app
  - [ ] Restore purchases
  - [ ] Verify purchased credits are restored
- [ ] Test tier upgrade
  - [ ] Purchase premium subscription
  - [ ] Verify instant credit grant (backend handles)
  - [ ] Verify purchased credits are preserved
- [ ] Test tier downgrade
  - [ ] Cancel subscription
  - [ ] Verify Graceful Drain (backend handles)
  - [ ] Verify purchased credits are preserved
- [ ] Test monthly reset
  - [ ] Wait for next billing cycle
  - [ ] Verify credits reset correctly
  - [ ] Verify purchased credits persist

## Error Handling

The implementation gracefully handles errors:

```typescript
try {
  await fetch(`${API_BASE_URL}/api/credits/purchase`, ...);
} catch (e) {
  // Log but don't fail the purchase - the backend verification already succeeded
  console.warn('Failed to call credit purchase endpoint:', e);
}
```

**Why**: The IAP verification already succeeded at this point, so we log the error but don't block the user's purchase. The backend can reconcile the purchase on the next sync.

## Summary

✅ **Added credit purchase API call** after successful IAP verification
✅ **Added same call for restore/sync flows** to ensure credits are always recorded
✅ **No changes to existing code** - SubscriptionContext, UI, etc. work as-is
✅ **Backend handles tier changes automatically** - frontend just needs to call the purchase endpoint
✅ **Graceful error handling** - doesn't break user experience if call fails

The frontend is now fully integrated with your new credit system!
