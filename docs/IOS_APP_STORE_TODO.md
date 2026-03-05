# iOS App Store Submission – To-Do List

Editable checklist before submitting OalethiaMobile for iOS review. Add items as needed.

---

## Critical (must fix before submission)

- [x] **Account deletion** – Implement in-app account deletion (Profile → Delete account). Must initiate deletion in-app; cannot require emailing support only.
- [ ] **Privacy Policy in app** – Profile → Privacy Policy should open real privacy policy URL (e.g. `Linking.openURL`) or in-app viewer. Remove "Dev view – not implemented" stub.
- [ ] **Terms of Service in app** – Profile → Terms of Service should open real terms URL or in-app viewer. Remove stub.
- [ ] **Contact support** – Profile → Contact support should open support URL (e.g. mailto or support page). Remove stub.
- [ ] **Restore Purchases / subscription sync** – Either implement real Restore (e.g. StoreKit if using IAP) or a "Sync subscription status" that calls your backend; remove "not implemented" stub.
- [ ] **Remove all "Dev view" stubs** – Notifications, Privacy, Terms, Contact support, Delete account, Restore Purchases must either work or be removed for v1. No "not implemented yet" in submitted build.
- [ ] **Demo account for App Review** – In App Store Connect → App Review Information → Notes, provide demo account (email + password) with birth data and at least one timeline so reviewers can test full flow.
- [ ] **Hide "Skip auth" in production** – In AuthScreen, show "Skip auth and continue (dev only)" only when `__DEV__` is true so production builds don’t expose dev-only entry.
- [ ] **Credits logic** - Implement the credits logic for generating timelines, how much extra credits cost etc. 

---

## Important (metadata & compliance)

- [x] **Fix onboarding typo** – Updated first onboarding headline to "Reaching Your Goals Just Got A Lot Easier".
- [ ] **IAP vs Stripe** – Decide strategy: add Apple IAP for subscriptions/credits and implement Restore, or document US storefront exception if applicable. Resolve 3.1.1 risk.
- [ ] **Permission strings** – Confirm all used capabilities (e.g. notifications if you add them) have purpose strings in app config.
- [ ] **Test on clean install** – Run full flow with demo account on clean install; ensure backend/API and Supabase are production and stable.

---

## Optional / polish

- [ ] **Notifications** – Implement notification settings or remove the row for v1.
- [ ] **Subscription modal** – Add subscription/auto-renewal terms and links to Privacy/Terms (or one combined link) before "Continue to checkout."
- [ ] **Accessibility** – Review Profile and modals so every interactive element has `accessibilityLabel` (and hint where helpful).
- [ ] **Welcome modal** – Make a welcome modal for first time users who sign up and reward them with the Level 1 badge and then walk them through creating their first timeline.
- [ ] **Onboarding & birth data flow** – Refactor onboarding and birth data collection so every real account is timeline-ready and users don’t get stuck without required data:
  - **Onboarding slides (marketing intro):**
    - Show only once per device, regardless of signup status (persist a flag like `@oalethia/onboarding_complete = 'true'` in AsyncStorage).
    - After the user taps Skip or Get started on the last slide, set the flag and never show slides again on that device.
  - **Birth data as prerequisite (Option A – recommended):**
    - After onboarding is complete/seen, always route new users into the birth wizard: Birth Date → Birth Time → Birth Location.
    - Make **birth date required** (no Skip) so every new account has at least a valid date.
    - For **birth time**, allow an “I don’t know my time” action that:
      - Sets a default like 12:00, and
      - Shows copy explaining that timelines may be less precise.
    - Make **birth location required** (or provide a clear “Approximate location” path if you support city/country-only) so generation always has usable coordinates.
    - Do **not** allow a path where all three birth steps are skipped and the user still creates a “full” account.
  - **Auth ordering:**
    - Only show the AuthScreen (Sign up / Log in) after birth data is collected and stored in `OnboardingContext`.
    - On successful signup, immediately upsert the `birth_charts` row in Supabase using the collected date/time/location (as you already do), so every new account is “timeline-ready.”
  - **Returning users & legacy accounts:**
    - If the user is logged in and has a `birth_charts` row, skip onboarding and birth wizard completely → go straight to the tabs.
    - If the user is logged in but missing birth data (legacy accounts), gate Generator/Home behind a blocking card or modal:
      - Explain that you now require birth details to compute timelines and provide a single CTA: “Add birth data” that launches the birth wizard.
  - **Generator safeguards:**
    - Keep the existing validation that prevents calling `/api/generate-timeline` when birth data is incomplete, but it should only be hit for edge/legacy cases.
    - The primary path for new users should never let them reach Generator without valid birth data.
  - **Copy & privacy alignment:**
    - Ensure the birth data screens clearly explain why date/time/place are needed (to compute transits and personalize timelines), matching the privacy policy language.
    - Verify that any error/empty states related to missing birth data use friendly, actionable copy (e.g. “Add your birth details to unlock your first timeline” with a button to the wizard).


---

## Your additions

<!-- Add more items below as needed -->

- [ ] 
- [ ] 
- [ ] 
