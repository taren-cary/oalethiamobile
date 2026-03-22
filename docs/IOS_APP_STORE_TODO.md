# iOS App Store Submission – To-Do List

Editable checklist before submitting OalethiaMobile for iOS review. Add items as needed.

---

## Critical (must fix before submission)

- [x] **Account deletion** – Implement in-app account deletion (Profile → Delete account). Must initiate deletion in-app; cannot require emailing support only.
- [x] **Privacy Policy in app** – Profile → Privacy Policy now opens `https://oalethia.com/privacy` using `Linking.openURL`, with basic error handling if the browser cannot be opened.
- [x] **Terms of Service in app** – Profile → Terms of Service now opens `https://oalethia.com/terms` using `Linking.openURL`, with basic error handling if the browser cannot be opened.
- [x] **Contact support** – Profile → Contact support now opens the default mail app with `mailto:support@oalethia.com?subject=Oalethia%20Support`, and falls back to showing the email address if the mail app cannot be opened.
- [x] **Restore Purchases / subscription sync** – Implemented Restore Purchases via StoreKit/IAP receipt verification and best-effort entitlement sync.
- [x] **Remove all "Dev view" stubs** – Notifications, Privacy, Terms, Contact support, Delete account, Restore Purchases now work (with dev-only mode gating).
- [ ] **Demo account for App Review** – In App Store Connect → App Review Information → Notes, provide demo account (email + password) with birth data and at least one timeline so reviewers can test full flow.
- [ ] **Hide "Skip auth" in production** – In AuthScreen, show "Skip auth and continue (dev only)" only when `__DEV__` is true so production builds don't expose dev-only entry.
- [x] **Credits logic** – `ensureUserCreditsReadyForUserId` helper creates `user_credits` if missing, applies calendar-month reset, and is called before every generation and `GET /api/credits`. No generation can fail due to a missing credits row.

---

## Important (metadata & compliance)

- [x] **Fix onboarding typo** – Updated first onboarding headline to "Reaching Your Goals Just Got A Lot Easier".
- [x] **IAP vs Stripe** – Apple IAP fully implemented for subscriptions and credit packs. `iap-verify-receipt` Edge Function (v3) verifies receipts with Apple, sets `tier_id` correctly (premium only while active, free when expired), updates `user_credits`, and handles idempotency for consumables. `Restore Purchases` re-verifies all receipts on demand.
- [x] **Permission strings** – Confirm all used capabilities (e.g. notifications if you add them) have purpose strings in app config.
- [ ] **Test on clean install** – Run full flow with demo account on clean install; ensure backend/API and Supabase are production and stable.

---

## Optional / polish

- [x] **Notifications** – Implement notification settings and reminders (daily affirmation + next actions) so v1 has a working system.
- [x] **Subscription modal** – Added auto-renewal disclosure ("renews monthly at $9.99 unless cancelled 24h before renewal") and tappable Privacy Policy · Terms of Service links before "Continue to checkout." Both shown for credits type too. Subscription-only renewal text is conditionally shown for the subscription flow only.
- [x] **Accessibility** – Review Profile and modals so every interactive element has `accessibilityLabel` (and hint where helpful).
- [x] **Welcome modal** – Make a welcome modal for first time users who sign up and reward them with the Level 1 badge just for signing up and then walk them through creating their first timeline.
- [x] **Onboarding & birth data flow** – Refactor onboarding and birth data collection so every real account is timeline-ready and users don't get stuck without required data:
  - **Onboarding slides (marketing intro):**
    - Show only once per device, regardless of signup status (persist a flag like `@oalethia/onboarding_complete = 'true'` in AsyncStorage).
    - After the user taps Skip or Get started on the last slide, set the flag and never show slides again on that device.
  - **Birth data as prerequisite (Option A – recommended):**
    - After onboarding is complete/seen, always route new users into the birth wizard: Birth Date → Birth Time → Birth Location.
    - Make **birth date required** (no Skip) so every new account has at least a valid date.
    - For **birth time**, allow an "I don't know my time" action that:
      - Sets a default like 12:00, and
      - Shows copy explaining that timelines may be less precise.
    - Make **birth location required** (or provide a clear "Approximate location" path if you support city/country-only) so generation always has usable coordinates.
    - Do **not** allow a path where all three birth steps are skipped and the user still creates a "full" account.
  - **Auth ordering:**
    - Only show the AuthScreen (Sign up / Log in) after birth data is collected and stored in `OnboardingContext`.
    - On successful signup, immediately upsert the `birth_charts` row in Supabase using the collected date/time/location (as you already do), so every new account is "timeline-ready."
  - **Returning users & legacy accounts:**
    - If the user is logged in and has a `birth_charts` row, skip onboarding and birth wizard completely → go straight to the tabs.
    - If the user is logged in but missing birth data (legacy accounts), gate Generator/Home behind a blocking card or modal:
      - Explain that you now require birth details to compute timelines and provide a single CTA: "Add birth data" that launches the birth wizard.
  - **Generator safeguards:**
    - Keep the existing validation that prevents calling `/api/generate-timeline` when birth data is incomplete, but it should only be hit for edge/legacy cases.
    - The primary path for new users should never let them reach Generator without valid birth data.
  - **Copy & privacy alignment:**
    - Ensure the birth data screens clearly explain why date/time/place are needed (to compute transits and personalize timelines), matching the privacy policy language.
    - Verify that any error/empty states related to missing birth data use friendly, actionable copy (e.g. "Add your birth details to unlock your first timeline" with a button to the wizard).

---

## IAP / Credits correctness (completed this session)

- [x] **No failed generation when `user_credits` row is missing** – `ensureUserCreditsReadyForUserId` called on every `POST /api/generate-timeline` and `GET /api/credits`; creates the row if absent and applies monthly reset in one pass.
- [x] **Monthly refill applied on generation** – Same helper runs the calendar-month reset before the credit check, so users always see their correct balance even if they haven't opened the app since the month rolled over.
- [x] **Foreground refresh** – `SubscriptionContext` listens to `AppState` changes; on every `active` event it calls `IapService.syncOwnedEntitlements()` → `refreshSubscription()` → `refreshCredits()` so the UI stays in sync after backgrounding.
- [x] **Expired subscriptions not left on premium `tier_id`** – `iap-verify-receipt` Edge Function (v3, deployed) computes `const tierId = isActive ? premiumTier.id : freeTier.id` and uses it for both insert and update on `user_subscriptions`. The previous deployed version always wrote `premiumTier.id`.
- [x] **Structured logging for expired receipt** – Edge function emits a `subscription_receipt_expired` WARN log (visible in Supabase → Edge Functions → Logs) whenever Apple confirms a receipt but the subscription has lapsed.
- [x] **Reconciliation when StoreKit returns no subscription receipt** – `IapService.syncOwnedEntitlements` tracks `foundSubscriptionReceipt`; if Apple returns nothing for the subscription product, calls `POST /api/reconcile-subscription` to downgrade the DB to free tier. Covers the edge case where a lapsed subscription is silently absent from `getPurchaseHistoryAsync`.
- [x] **`POST /api/reconcile-subscription` server endpoint** – Safely downgrades `user_subscriptions` to free tier using a `neq('tier_id', freeTier.id)` guard (no-op if already free); logs a warning when it actually performs a downgrade.

---

## Your additions

<!-- Add more items below as needed -->

- [ ] 
- [ ] 
- [ ] 
