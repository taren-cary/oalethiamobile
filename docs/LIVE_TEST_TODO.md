# Live Test Readiness — Full Task List

> Generated from complete codebase audit against Cursor rules, App Store guidelines, and backend reference.
> Check off each item as it is completed.

---

## 🔴 Critical — Must Fix Before Any Live Testing

### 1. Production API URL Not Set
- [ ] **File:** `.env` line 7 — `EXPO_PUBLIC_API_URL=http://localhost:3000`
- The app currently points to `localhost`, which is unreachable on a real device or TestFlight build.
- Set `EXPO_PUBLIC_API_URL` to the real production server URL (e.g. `https://api.oalethia.com`).
- Also set `APPLE_SHARED_SECRET` (line 8 is blank) — this is required by the `iap-verify-receipt` Edge Function to validate App Store receipts.

### 2. Missing `ios.bundleIdentifier` and `android.package` in `app.json`
- [x] **File:** `app.json` — `ios` block has no `bundleIdentifier`, `android` block has no `package`.
- Without these, EAS Build and TestFlight submission will fail.
- Add `"bundleIdentifier": "com.oalethia.app"` (or your real ID) under `ios`, and `"package": "com.oalethia.app"` under `android`.

### 3. Missing `eas.json`
- [x] No `eas.json` exists in the project root.
- Required for EAS Build (TestFlight). Create it with at minimum a `preview` and `production` profile.
- Example minimum config:
  ```json
  {
    "cli": { "version": ">= 10.0.0" },
    "build": {
      "preview": {
        "distribution": "internal",
        "ios": { "simulator": false }
      },
      "production": {
        "autoIncrement": true
      }
    },
    "submit": {
      "production": {}
    }
  }
  ```

### 4. `expo-notifications` Missing from `app.json` Plugins
- [x] **File:** `app.json` `plugins` array — `expo-notifications` is **not listed**.
- Without this plugin, notification permissions and scheduling will silently fail on device.
- Add to plugins:
  ```json
  ["expo-notifications", {
    "icon": "./assets/images/icon.png",
    "color": "#6366f1",
    "sounds": []
  }]
  ```

### 5. No Notification Tap / Deep-Link Handler
- [x] **File:** `app/_layout.tsx` — there is no `Notifications.addNotificationResponseReceivedListener`.
- Tapping a scheduled reminder does nothing. Users who tap "Daily affirmation" or "Next action" notifications land on the home screen with no navigation to the relevant screen.
- Add listener in `_layout.tsx` that routes to `/(tabs)/` (affirmation) or `timeline/[id]` (next action) based on notification data payload.

---

## 🟠 High Priority — Functionality Is Broken or Missing

### 6. `onShare={() => {}}` No-Ops on Home Screen
- [x] **File:** `app/(tabs)/index.tsx` lines 662 and 684 — both `SwipeableAffirmationCard` and `AffirmationCard` receive an empty arrow function as `onShare`.
- Tapping Share does nothing. Wire up native `Share.share()` (or the `ShareButton.performShare` logic) with the affirmation text as the message.

### 7. Save Timeline — Error Is Silently Swallowed
- [x] **File:** `components/modals/ResultsModalContent.tsx` lines 140–144 — the `catch` block sets `setSaving(false)` but shows no user-facing error message.
- Users will see the button become re-enabled with no feedback if the save fails (e.g. network error or DB error).
- Add an `error` state and display an error message below the save button.

### 8. Welcome Modal Saves `latitude: 0, longitude: 0`
- [x] **Not applicable for live test.** The onboarding flow in `_layout.tsx` enforces `BirthLocationPickerScreen` (with proper geocoding) before auth, so no normally onboarded user can reach this modal. It only exists as a safety net for a broken-data edge case. Left as-is; replace with the full picker in a future update if needed.

### 9. Birth Location Picker — "Done" Saves `0,0` if User Doesn't Select a Suggestion
- [x] **File:** `components/birth-location-picker/BirthLocationPickerScreen.tsx` lines 103–104 — `handleDone` uses `selectedCoords ?? 0` so if the user types a location but doesn't tap a suggestion, lat/lon will be `0, 0`.
- Block the "Done" button (or show an error) unless a suggestion has been selected, so coordinates are always valid.

### 10. Profile Screen — "Coming soon" Alert for Unimplemented Settings Rows
- [x] **File:** `app/(tabs)/profile.tsx` line 455 — any settings label not explicitly handled falls through to `Alert.alert('Coming soon', ...)`.
- Identify which label(s) still hit this fallback and either implement them or remove them from the UI before TestFlight submission (App Store guideline 2.1 — no placeholder/incomplete features).

### 11. Duplicate "No daily affirmation yet" Branch
- [x] **File:** `app/(tabs)/index.tsx` lines 686–712 — the condition `todayAffirmations?.length === 0` and the final `else` branch (line 703+) both render the same "No daily affirmation yet" card.
- The second branch (`else`) is dead code; the `null`/undefined case for `todayAffirmations` after it has been loaded should be handled gracefully, not silently repeat the empty state.
- Consolidate into a single empty-state branch.

---

## 🟡 Medium Priority — Correctness and Polish

### 12. `handleAffirm` Called with `'temp_unsaved'` Timeline ID
- [x] **File:** `app/(tabs)/index.tsx` — anywhere `handleAffirmForTimeline` is called on an affirmation whose `timelineId` is `'temp_unsaved'` will POST to the API with an invalid ID.
- Guard the affirm API call: if `timelineId === 'temp_unsaved'`, skip the API call or surface a "Please save your timeline first" prompt.

### 13. `WelcomeModalContent` Is a Dead Code Path
- [x] **Not applicable for live test.** Confirmed reachable only via "Add birth data" buttons on home/generator screens — a broken-data safety net. Intentionally kept as an escape hatch. Coordinate fix deferred to a future update (see item 8).

### 14. `SubscriptionContext` Does Not Surface Loading Errors to UI
- [x] **File:** `contexts/SubscriptionContext.tsx` — `refreshSubscription` and `refreshCredits` swallow network errors silently (`catch { // Keep previous state }`).
- While keeping previous state is fine, the `generator.tsx` and `profile.tsx` screens have no way to know a refresh failed. Add an optional `error` field to `SubscriptionContextType` so screens can show a retry prompt if credits fail to load.

### 15. Leaderboard and Profile Preview Show Empty List on API Failure
- [x] **Files:** `app/leaderboard.tsx` and `app/(tabs)/profile.tsx` — on API error, both set the leaderboard to `[]`, which renders the empty state with no indication of a network problem.
- Add an `error` state and show a "Could not load leaderboard – tap to retry" message instead of a blank list.

### 16. `iap-verify-receipt` Edge Function — `APPLE_SHARED_SECRET` Is Blank
- [x] **Already set in Supabase Edge Functions secrets.** The `.env` file is for local dev only; production uses Supabase dashboard secrets.

### 17. IAP Entitlement Sync Only Triggered After Foreground, Not Cold Start
- [x] **File:** `contexts/SubscriptionContext.tsx` — `IapService.syncOwnedEntitlements()` is only called when the app transitions from background to foreground. A cold-start after an offline subscription change will use stale credits until the user backgrounds and re-opens.
- Call `IapService.syncOwnedEntitlements()` once on initial mount (inside `fetchAll`) in addition to the foreground listener.

### 18. `app.json` Missing `ios.infoPlist` Notification Usage String for Alerts
- [x] **Resolved by task 4.** The `expo-notifications` plugin handles notification permissions automatically; `NSUserNotificationUsageDescription` is correctly set.

---

## 🔵 Configuration / App Store Submission

### 19. App Store Metadata — `oalethia.com/terms` and `oalethia.com/privacy` Must Be Live
- [ ] **Action required before App Store submission.** Verify both URLs return 200 with real content. App Store reviewers check these links during review.

### 20. Privacy Policy Must Be Accessible In-App
- [x] **Already implemented.** Privacy Policy is accessible via Profile → Privacy Policy row (lines 786-793 in `profile.tsx`). This satisfies App Store guideline 5.1.1.

### 21. App Version / Build Number Strategy
- [x] **Already configured.** `eas.json` production profile has `autoIncrement: true`, which auto-increments build numbers on each EAS build. No manual `buildNumber`/`versionCode` needed in `app.json`.

### 22. `app.json` — `experiments.reactCompiler: true` May Cause Runtime Issues
- [ ] **Requires device testing.** Build with `eas build --profile preview` and test all screens/gestures/animations. If any issues occur, disable `reactCompiler` in `app.json`. Cannot be verified without a device build.

### 23. `app.json` — `newArchEnabled: true` Requires Testing
- [ ] **Requires device testing.** All third-party libraries must support New Architecture. Build and test all blur effects, animations, and gestures on device. If issues occur, set `newArchEnabled: false` in `app.json`.

### 24. App Store Connect — Demo Account Credentials in Review Notes
- [ ] **Required before App Store submission.** Add to App Store Connect → App Review Information → Notes:
  - Demo email and password (create a test account)
  - Instructions: "Go to Generate tab to create a timeline"
  - Confirm backend API is live

### 25. `scheme` in `app.json` Should Match Bundle ID Convention
- [x] **Left as-is.** Current `"scheme": "oalethiamobile"` is valid. Bundle ID is `com.oalethia.oalethia`. Scheme naming is flexible; can be changed to `"oalethia"` later if desired for cleaner deep links.

---

## ✅ Already Completed (for reference)

- [x] Removed "Skip Auth" button from `AuthScreen.tsx`
- [x] Removed all `MOCK_*` constants and mock results section from `generator.tsx`
- [x] Replaced all `generateFakeLeaderboard` fallbacks with empty arrays in `leaderboard.tsx` and `profile.tsx`
- [x] Removed all `HOME_DEV_MODE` / `useDevHomeData` dev branches from `index.tsx`, `profile.tsx`, `logs.tsx`
- [x] Deleted `lib/mockHomeData.ts` and `lib/mockLeaderboardData.ts`
- [x] Extracted shared types/utils to `lib/homeUtils.ts` and `lib/leaderboardTypes.ts`
- [x] Created `contexts/SubscriptionContext.tsx` with foreground refresh and IAP event listener
- [x] Fixed broken `mockHomeData` imports in `app/timeline/[id].tsx`, `lib/scheduleNextActions.ts`, `components/affirmation-card/SwipeableAffirmationCard.tsx`
- [x] Removed all `useDevTimeline` / `HOME_DEV_MODE` logic from `app/timeline/[id].tsx`
- [x] Verified `delete-account` Supabase Edge Function covers all required tables and satisfies App Store account deletion requirement (guideline section 6)
- [x] `SubscriptionContext` subscribes to `IapService` events and AppState foreground changes for fresh data
