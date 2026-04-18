# Credit System Test Plan

## Test Environment Setup
- [ ] Ensure backend is deployed with new credit system
- [ ] Ensure app is built with updated IapService.ts
- [ ] Use TestFlight or production build (not Expo Go)

## Test 1: Credit Purchase (New User)
**Steps:**
1. Create fresh account or use test account with 0 purchased credits
2. Note starting credits (should be tier default: 3 for free, 10 for premium)
3. Navigate to Profile → Buy Credits
4. Complete purchase of 3-credit pack ($2.99)
5. Wait for purchase to complete

**Expected:**
- [ ] Purchase completes successfully
- [ ] Credits increase by 3
- [ ] Backend logs show `POST /api/credits/purchase` was called
- [ ] `credit_purchases` table has new row with `credits_purchased: 3`
- [ ] `user_credits.purchased_credits` increased by 3

**Backend Check (via Supabase Dashboard):**
```sql
SELECT credits, purchased_credits, last_reset_date 
FROM user_credits 
WHERE user_id = 'YOUR_TEST_USER_ID';

SELECT * FROM credit_purchases 
WHERE user_id = 'YOUR_TEST_USER_ID' 
ORDER BY created_at DESC 
LIMIT 1;
```

---

## Test 2: Multiple Credit Purchases
**Steps:**
1. Buy another 3-credit pack
2. Note credit balance
3. Buy a third 3-credit pack

**Expected:**
- [ ] Each purchase adds exactly 3 credits
- [ ] Purchased credits accumulate (9 total after 3 purchases)
- [ ] 3 rows in `credit_purchases` table
- [ ] No duplicate entries (idempotency works)

---

## Test 3: Restore Purchases
**Steps:**
1. Note current credit balance
2. Delete app from device
3. Reinstall app from TestFlight
4. Sign in with same account
5. Navigate to Profile → Restore Purchases
6. Wait for restore to complete

**Expected:**
- [ ] Restore completes successfully
- [ ] Credit balance matches pre-delete balance
- [ ] All purchased credits restored
- [ ] Backend logs show `POST /api/credits/purchase` called for each historic purchase

---

## Test 4: Tier Upgrade (Free → Premium)
**Prerequisite:** Start on free tier with some purchased credits

**Steps:**
1. Note starting credits (e.g., 3 monthly + 6 purchased = 9 total)
2. Purchase premium subscription
3. Wait for subscription to activate

**Expected:**
- [ ] Tier changes to "premium"
- [ ] Monthly credits change to 10
- [ ] **Backend grants 10 instant credits** (backend feature)
- [ ] Purchased credits (6) are preserved
- [ ] New balance: 10 (monthly) + 6 (purchased) = 16 total
- [ ] Frontend just needs to fetch credits - backend handles the grant

**Backend Check:**
```sql
-- Should show tier change and instant credit grant
SELECT * FROM user_subscriptions 
WHERE user_id = 'YOUR_TEST_USER_ID';

-- Should show purchased credits preserved
SELECT credits, purchased_credits 
FROM user_credits 
WHERE user_id = 'YOUR_TEST_USER_ID';
```

---

## Test 5: Tier Downgrade with Graceful Drain
**Prerequisite:** Premium user with credits > 3

**Steps:**
1. Cancel premium subscription
2. Wait for subscription to expire (or use backend to simulate)
3. Note credit balance before downgrade (e.g., 12 total)

**Expected:**
- [ ] Tier changes to "free"
- [ ] Monthly credits change to 3
- [ ] **Credits NOT reset** because balance (12) > new limit (3)
- [ ] Graceful Drain applies - keep existing credits
- [ ] Purchased credits preserved
- [ ] Balance remains 12 (backend handles Graceful Drain)

**Backend Check:**
```sql
-- Verify tier is now free
SELECT tier_id FROM user_subscriptions 
WHERE user_id = 'YOUR_TEST_USER_ID';

-- Verify credits NOT reset (should be > 3)
SELECT credits FROM user_credits 
WHERE user_id = 'YOUR_TEST_USER_ID';
```

---

## Test 6: Monthly Reset with Graceful Drain
**Prerequisite:** User with purchased credits + used some monthly credits

**Setup:**
- Start of month: 10 monthly + 5 purchased = 15 total
- Use 7 credits: 8 remaining (3 monthly + 5 purchased)
- Advance to next billing cycle (or use backend to simulate reset)

**Expected:**
- [ ] Monthly credits reset to tier limit (10 for premium, 3 for free)
- [ ] Purchased credits (5) preserved
- [ ] If balance was below limit: refill to limit + purchased
  - Example: 8 total → 10 monthly + 5 purchased = 15 total
- [ ] If balance was above limit: keep existing + purchased
  - Example: 12 total → keep 12 (7 monthly + 5 purchased)

**Backend Check:**
```sql
SELECT 
  credits,
  purchased_credits,
  last_reset_date,
  next_reset_date
FROM user_credits 
WHERE user_id = 'YOUR_TEST_USER_ID';
```

---

## Test 7: Credit Usage After Purchase
**Steps:**
1. Buy 3-credit pack
2. Note new balance
3. Generate a timeline (costs 1 credit)
4. Check credits again

**Expected:**
- [ ] Balance decreases by 1
- [ ] Timeline generates successfully
- [ ] Backend deducts from monthly credits first, then purchased
- [ ] `user_credits.purchased_credits` unchanged if monthly credits still available

**Backend Check:**
```sql
-- Verify credit deduction
SELECT credits, purchased_credits 
FROM user_credits 
WHERE user_id = 'YOUR_TEST_USER_ID';

-- Verify timeline was created
SELECT * FROM timelines 
WHERE user_id = 'YOUR_TEST_USER_ID' 
ORDER BY created_at DESC 
LIMIT 1;
```

---

## Test 8: App Foreground Sync
**Steps:**
1. Purchase credits on device A
2. Background the app
3. Open device B with same account
4. Purchase more credits on device B
5. Foreground device A

**Expected:**
- [ ] Device A syncs on foreground
- [ ] All purchases from device B appear on device A
- [ ] Credit balance is consistent across devices
- [ ] Backend logs show sync triggered `POST /api/credits/purchase` for missing purchases

---

## Test 9: Error Handling - Network Failure
**Steps:**
1. Enable airplane mode
2. Try to buy credits (will fail before IAP)
3. Disable airplane mode
4. Purchase credits
5. Immediately enable airplane mode during purchase flow

**Expected:**
- [ ] First purchase doesn't start (no IAP connection)
- [ ] Second purchase completes IAP verification
- [ ] If `/api/credits/purchase` fails, purchase still succeeds (logged in console)
- [ ] Next sync or foreground will reconcile the purchase
- [ ] User gets credits eventually (idempotency prevents double-credit)

---

## Test 10: Edge Case - Rapid Purchases
**Steps:**
1. Rapidly purchase 3 credit packs in succession
2. Wait for all to complete

**Expected:**
- [ ] All 3 purchases complete
- [ ] Exactly 9 credits added (3 per pack)
- [ ] No duplicate credit entries in backend
- [ ] Idempotency prevents double-crediting same transaction

**Backend Check:**
```sql
-- Should have exactly 3 rows, each with credits_purchased: 3
SELECT COUNT(*), SUM(credits_purchased) 
FROM credit_purchases 
WHERE user_id = 'YOUR_TEST_USER_ID';
```

---

## Backend Verification Queries

After all tests, verify data integrity:

```sql
-- User credits should match sum of monthly + purchased
SELECT 
  uc.user_id,
  uc.credits AS total_credits,
  uc.purchased_credits,
  t.monthly_credits AS tier_monthly_limit,
  (SELECT COUNT(*) FROM credit_purchases cp WHERE cp.user_id = uc.user_id) AS purchase_count,
  (SELECT SUM(credits_purchased) FROM credit_purchases cp WHERE cp.user_id = uc.user_id) AS total_purchased
FROM user_credits uc
JOIN user_subscriptions us ON uc.user_id = us.user_id
JOIN tiers t ON us.tier_id = t.id
WHERE uc.user_id = 'YOUR_TEST_USER_ID';

-- Verify no duplicate credit purchases (same transaction_id)
SELECT 
  stripe_payment_intent_id,
  COUNT(*) as count
FROM credit_purchases
WHERE user_id = 'YOUR_TEST_USER_ID'
GROUP BY stripe_payment_intent_id
HAVING COUNT(*) > 1;
-- Should return 0 rows (no duplicates)
```

---

## Console Logs to Monitor

When testing, watch for these logs:

**Success:**
```
✅ Credit purchase completed: { amount: 3 }
✅ IAP verification succeeded
✅ Credits updated: 12
```

**Expected Warnings (non-blocking):**
```
⚠️ Failed to call credit purchase endpoint: [NetworkError]
   (Purchase still valid, will sync later)
```

**Errors (should not occur):**
```
❌ IAP verification failed: [reason]
❌ Purchase error (errorCode)
```

---

## Success Criteria

All tests pass with:
- ✅ Credits increase correctly after purchases
- ✅ Purchased credits never expire
- ✅ Purchased credits preserved across tier changes
- ✅ Graceful Drain prevents unwanted resets
- ✅ Monthly resets work correctly
- ✅ Restore purchases works
- ✅ Multi-device sync works
- ✅ No duplicate credit entries
- ✅ Error handling is graceful

---

## Rollback Plan

If issues are found:

1. **Frontend only**: Revert `iap/IapService.ts` changes
2. **Backend issues**: Backend team can disable `/api/credits/purchase` endpoint
3. **Data integrity**: Backend team has backups and can revert database changes

**Note**: The new system is backwards compatible - if the purchase endpoint fails, the old flow still works through IAP verification.
