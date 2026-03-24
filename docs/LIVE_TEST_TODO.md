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
- [ ] **File:** `app/_layout.tsx` — there is no `Notifications.addNotificationResponseReceivedListener`.
- Tapping a scheduled reminder does nothing. Users who tap "Daily affirmation" or "Next action" notifications land on the home screen with no navigation to the relevant screen.
- Add listener in `_layout.tsx` that routes to `/(tabs)/` (affirmation) or `timeline/[id]` (next action) based on notification data payload.

---

## 🟠 High Priority — Functionality Is Broken or Missing

### 6. `onShare={() => {}}` No-Ops on Home Screen
- [ ] **File:** `app/(tabs)/index.tsx` lines 662 and 684 — both `SwipeableAffirmationCard` and `AffirmationCard` receive an empty arrow function as `onShare`.
- Tapping Share does nothing. Wire up native `Share.share()` (or the `ShareButton.performShare` logic) with the affirmation text as the message.

### 7. Save Timeline — Error Is Silently Swallowed
- [ ] **File:** `components/modals/ResultsModalContent.tsx` lines 140–144 — the `catch` block sets `setSaving(false)` but shows no user-facing error message.
- Users will see the button become re-enabled with no feedback if the save fails (e.g. network error or DB error).
- Add an `error` state and display an error message below the save button.

### 8. Welcome Modal Saves `latitude: 0, longitude: 0`
- [ ] **File:** `components/modals/WelcomeModalContent.tsx` lines 60–61 — `latitude: 0` and `longitude: 0` are hardcoded.
- This modal only accepts a text `location` field with no geocoding. All birth charts created through this path will have incorrect coordinates, breaking any coordinate-dependent astrology features.
- Either integrate the `BirthLocationPickerScreen` geocoding logic here, or replace this modal entirely with the picker.

### 9. Birth Location Picker — "Done" Saves `0,0` if User Doesn't Select a Suggestion
- [ ] **File:** `components/birth-location-picker/BirthLocationPickerScreen.tsx` lines 103–104 — `handleDone` uses `selectedCoords ?? 0` so if the user types a location but doesn't tap a suggestion, lat/lon will be `0, 0`.
- Block the "Done" button (or show an error) unless a suggestion has been selected, so coordinates are always valid.

### 10. Profile Screen — "Coming soon" Alert for Unimplemented Settings Rows
- [ ] **File:** `app/(tabs)/profile.tsx` line 455 — any settings label not explicitly handled falls through to `Alert.alert('Coming soon', ...)`.
- Identify which label(s) still hit this fallback and either implement them or remove them from the UI before TestFlight submission (App Store guideline 2.1 — no placeholder/incomplete features).

### 11. Duplicate "No daily affirmation yet" Branch
- [ ] **File:** `app/(tabs)/index.tsx` lines 686–712 — the condition `todayAffirmations?.length === 0` and the final `else` branch (line 703+) both render the same "No daily affirmation yet" card.
- The second branch (`else`) is dead code; the `null`/undefined case for `todayAffirmations` after it has been loaded should be handled gracefully, not silently repeat the empty state.
- Consolidate into a single empty-state branch.

---

## 🟡 Medium Priority — Correctness and Polish

### 12. `handleAffirm` Called with `'temp_unsaved'` Timeline ID
- [ ] **File:** `app/(tabs)/index.tsx` — anywhere `handleAffirmForTimeline` is called on an affirmation whose `timelineId` is `'temp_unsaved'` will POST to the API with an invalid ID.
- Guard the affirm API call: if `timelineId === 'temp_unsaved'`, skip the API call or surface a "Please save your timeline first" prompt.

### 13. `WelcomeModalContent` Is a Dead Code Path
- [ ] **File:** `components/modals/WelcomeModalContent.tsx` — the birth data collection is now handled entirely by the onboarding wizard (`BirthDatePickerScreen` → `BirthTimePickerScreen` → `BirthLocationPickerScreen`). The modal route (`app/modal`) still renders this content.
- Verify whether this modal is still reachable. If not, remove it to avoid confusion. If it is, fix the `0,0` coordinates issue (item 8 above).

### 14. `SubscriptionContext` Does Not Surface Loading Errors to UI
- [ ] **File:** `contexts/SubscriptionContext.tsx` — `refreshSubscription` and `refreshCredits` swallow network errors silently (`catch { // Keep previous state }`).
- While keeping previous state is fine, the `generator.tsx` and `profile.tsx` screens have no way to know a refresh failed. Add an optional `error` field to `SubscriptionContextType` so screens can show a retry prompt if credits fail to load.

### 15. Leaderboard and Profile Preview Show Empty List on API Failure
- [ ] **Files:** `app/leaderboard.tsx` and `app/(tabs)/profile.tsx` — on API error, both set the leaderboard to `[]`, which renders the empty state with no indication of a network problem.
- Add an `error` state and show a "Could not load leaderboard – tap to retry" message instead of a blank list.

### 16. `iap-verify-receipt` Edge Function — `APPLE_SHARED_SECRET` Is Blank
- [ ] **File:** `.env` line 8 — `APPLE_SHARED_SECRET=` is empty.
- The Supabase Edge Function reads this value from environment variables. Without it, receipt validation with Apple will fail for all subscription verifications in production.
- Add the shared secret from App Store Connect → App Information → App-Specific Shared Secret.

### 17. IAP Entitlement Sync Only Triggered After Foreground, Not Cold Start
- [ ] **File:** `contexts/SubscriptionContext.tsx` — `IapService.syncOwnedEntitlements()` is only called when the app transitions from background to foreground. A cold-start after an offline subscription change will use stale credits until the user backgrounds and re-opens.
- Call `IapService.syncOwnedEntitlements()` once on initial mount (inside `fetchAll`) in addition to the foreground listener.

### 18. `app.json` Missing `ios.infoPlist` Notification Usage String for Alerts
- [ ] **File:** `app.json` — `NSUserNotificationUsageDescription` is set but this key is deprecated. For iOS 14+, notification permissions are requested via `expo-notifications`; the correct key is handled automatically when the plugin is added (item 4). Verify the string is surfaced correctly once the plugin is added.

---

## 🔵 Configuration / App Store Submission

### 19. App Store Metadata — `oalethia.com/terms` and `oalethia.com/privacy` Must Be Live
- [ ] **File:** `app/(tabs)/profile.tsx` lines 426 and 436 — the app links to `https://oalethia.com/terms` and `https://oalethia.com/privacy`.
- Both URLs must return a 200 response with real content before App Store submission (reviewers check). Verify they are deployed.

### 20. Privacy Policy Must Be Accessible In-App
- [ ] Apple guideline 5.1.1 requires a privacy policy link accessible within the app itself.
- Currently it's reachable via the Profile → Privacy Policy row. **Verify it also appears on the auth/onboarding screen** before a user signs in (required for first-run users who haven't reached the Profile tab yet).

### 21. App Version / Build Number Strategy
- [ ] **File:** `app.json` line 5 — `"version": "1.0.0"` and no `buildNumber`/`versionCode`.
- For TestFlight and App Store submission, you need an incrementing build number. Add `"buildNumber": "1"` under `ios` and `"versionCode": 1` under `android`, or enable `autoIncrement` in `eas.json` (item 3).

### 22. `app.json` — `experiments.reactCompiler: true` May Cause Runtime Issues
- [ ] **File:** `app.json` line 56 — `reactCompiler` is experimental. Verify the build passes and all screens work correctly with it enabled before TestFlight. If any screen breaks, disable it.

### 23. `app.json` — `newArchEnabled: true` Requires Testing
- [ ] **File:** `app.json` line 10 — New Architecture is enabled. All third-party libraries (`expo-blur`, `react-native-reanimated`, `react-native-gesture-handler`, etc.) must support the New Architecture. Run a device build and test all gestures, blur effects, and animations before submission.

### 24. App Store Connect — Demo Account Credentials in Review Notes
- [ ] Per guideline section 2.1, App Review requires a fully-functional demo account with credentials in the App Review Notes field.
- Before submitting, add to App Store Connect → App Review Information:
  - Demo email and password
  - Any special instructions (e.g. "Go to Generate tab to create a timeline")
  - Confirm all backend services are live

### 25. `scheme` in `app.json` Should Match Bundle ID Convention
- [ ] **File:** `app.json` line 8 — `"scheme": "oalethiamobile"`. Ensure this is consistent with your deep-link setup and that no other app could conflict with this scheme. Consider `"oalethia"` if you want cleaner URLs.

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
