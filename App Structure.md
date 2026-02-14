## **Core screens (5 main pages)**

### **1. Home / Today**

- Purpose: Daily entry point
- Content:
- Today's affirmation (large, shareable)
- Active timeline preview (if any)
- Streak counter
- Points/level badge
- Navigation: Bottom tab (first icon)

### **2. Generate**

- Purpose: Create new timeline
- Content:
- Form: outcome, context, timeframe, approach
- Birth chart input (if not saved)
- Generate button
- Results preview
- Navigation: Bottom tab (center, prominent)

### **3. Logs/My Timelines**

- Purpose: View all saved timelines
- Content:
- Grid/list of timeline cards
- Each card: goal, date created, progress
- Tap to open timeline detail
- Navigation: Bottom tab

### **4. Timeline Detail**

- Purpose: View single timeline
- Content:
- Timeline actions (scrollable)
- Today's affirmation
- Progress indicators
- Share button
- Navigation: Push from "My Timelines" (no tab)

### **5. Profile**

- Purpose: User account & stats
- Content:
- Points, level, badge
- Affirmation streak
- Subscription status
- Settings (notifications, account)
- Sign out
- Navigation: Bottom tab (last icon)

---

## **Navigation structure**

**Bottom navigation circles (4 tabs)┌─────────────┬─────────────┬─────────────┬─────────────┐│   Home      │  Generate   │  Timelines  │   Profile   ││   (Today)   │   (Star)    │   (List)    │   (User)    │└─────────────┴─────────────┴─────────────┴─────────────┘**

Why 4 tabs:

- Standard iOS pattern
- Easy thumb reach
- Clear hierarchy

Tab order:

1. Home (left) — daily engagement
2. Generate (center) — primary action
3. Timelines (right-center) — saved content
4. Profile (right) — account

---

## **Additional screens (modals/overlays)**

### **Modal screens (no tabs)**

1. Timeline Generation Form
- Full-screen modal from Generate tab
- Birth chart input
- Outcome/context form
- Generate button
1. Timeline Results
- Full-screen modal after generation
- Actions list
- Today's affirmation
- Save button
1. Affirmation Share
- Modal sheet from affirmation card
- Generated image preview
- Share options (Instagram, Save, etc.)
1. Auth (Sign In/Sign Up)
- Modal from Profile or when needed
- Email/password
- Social login (optional)
1. Subscription/Credits
- Modal from Profile
- Upgrade options
- Credit purchase

---


### **Main screens (5)**

1. Home Screen
2. Generate Screen
3. Logs/My Timelines Screen
4. Timeline Detail Screen
5. Profile Screen

### **Modals/overlays (5)**

1. Timeline Generation Form Modal
2. Timeline Results Modal
3. Affirmation Share Modal
4. Auth Modal
5. Subscription Modal

### **Components to design**

- Bottom Tab Navigation Circles (reusable)
- Affirmation Card (reusable)
- Timeline Action Card (reusable)
- Points/Level Badge (reusable)
- Share Button (reusable)

---

## **Full implementation checklist**

Use this order; check off as you go. Reference: `_reference/frontend-react` and `_reference/server_phase2.js`.

### **Phase 1: Foundation**

- [x] **Supabase client** – Add `lib/supabase.ts` (or equivalent) with env-based URL and anon key; use same tables as reference (RLS unchanged).
- [x] **API base** – Add `EXPO_PUBLIC_API_URL` (or similar) and ensure all API calls use `Authorization: Bearer <session.access_token>`.
- [x] **Auth context** – Port auth from `contexts/AuthContext.tsx`: `user`, `session`, `loading`, `signIn`, `signUp`, `signOut`; persist session via Supabase.
- [x] **Auth provider** – Wrap app (e.g. in `_layout.tsx`) with AuthProvider so all screens can use auth.
- [x] **Safe area** – Use `useSafeAreaInsets` and/or SafeAreaView for screens and modals (per glassmorphism rules).

### **Phase 2: Reusable components (glass + haptics)**

- [x] **GlassContainer / GlassCard** – If not done: BlurView, gradient border option, press states, haptic on press (per Glassmorphism rules).
- [x] **AffirmationCard** – Reusable card: title ("Today's cosmic affirmation"), date, quote text, Affirm button, optional Share. Props: `text`, `date`, `affirmed`, `onAffirm`, `onShare`. Use GlassCard, Orbitron/Inter, haptic.
- [x] **TimelineActionCard** – One card per action: date badge, action text, transit, optional expand (strategy/links), checkbox (complete), optional skip. Glass card; optional stagger animation.
- [x] **PointsLevelBadge** – Level number + name, optional progress bar (gradient), optional badge asset. Data from `GET /api/user-level`. Glass container.
- [x] **Share button** – Reusable: opens Affirmation Share modal or triggers native share (e.g. `expo-sharing`) with affirmation text/image. Haptic on press.
- [x] **Bottom tab circles** – Already implemented; confirm tab order: Home, Generate, Logs, Profile (per navigation structure).

### **Phase 3: Main screens**

**Home / Today** (`app/(tabs)/index.tsx`)

- [x] Background: keep `oalethiamobilebackground.jpg` full-screen.
- [x] **Streak** – Call `GET /api/profile` (or equivalent); show `stats.currentStreak` in a small glass card (e.g. "X day streak").
- [x] **Points + level** – Call `GET /api/user-points` and `GET /api/user-level`; show PointsLevelBadge (or compact points + level).
- [x] **Today's affirmation** – Determine active timeline (e.g. latest saved); call `GET /api/today-affirmation/:generationId` or use cached affirmations; render large AffirmationCard; on Affirm call `POST /api/affirm`; handle level-up event if returned.
- [x] **Active timeline preview** – If user has timelines: fetch latest (e.g. Supabase `action_timeline_generations`); show one glass card (goal, date, action count) with link to Timeline Detail or Logs.
- [x] **Empty / signed-out** – If not signed in: show reduced content or CTA to sign in; optional default affirmation message.
- [x] **Share** – AffirmationCard's Share opens Affirmation Share modal (or native share).

**Generate** (`app/(tabs)/generator.tsx`)

- [x] **Entry** – Generate tab shows a simple screen with a primary CTA (e.g. "Create timeline") that opens **Timeline Generation Form** modal (full-screen or modal presentation).
- [x] No need to duplicate full form on the tab; form lives in the modal.

**Logs / My Timelines** (`app/(tabs)/logs.tsx`)

- [x] **List** – Fetch from Supabase `action_timeline_generations` for `user_id`, order by `created_at` desc.
- [x] **Cards** – Each card: goal (outcome), date created, progress (if you add it); glass card; tap → push **Timeline Detail** (stack route).
- [x] **Empty state** – No timelines: empty state + CTA to open Generate / form modal.
- [x] **Delete** – Optional: delete timeline (Supabase delete + refresh list); confirm before delete.

**Timeline Detail** (stack screen, e.g. `app/timeline/[id].tsx` or under Logs)

- [x] **Route** – Add stack route so Logs → tap card → Timeline Detail (no tab bar).
- [x] **Fetch** – Load timeline by id (Supabase or API); show loading then content.
- [x] **Content** – Outcome title; scrollable list of TimelineActionCard; today's AffirmationCard; progress (completed/skipped) persisted (e.g. AsyncStorage keyed by timeline id).
- [x] **Affirm** – Same as Home: confirm today's affirmation, `POST /api/affirm`, refresh points/level if needed.
- [x] **Share** – Share button opens Affirmation Share modal or native share.
- [x] **Back** – Back to Logs.

**Profile** (`app/(tabs)/profile.tsx`)

- [x] **Points + level** – Same as Home: user-points + user-level; show PointsLevelBadge (or full LevelDisplay-style block).
- [x] **Streak** – Same as Home: `GET /api/profile` → show affirmation streak.
- [x] **Subscription status** – Call `GET /api/user-subscription`; show status (free/premium, credits if applicable).
- [x] **Settings** – Placeholder or minimal: notifications, account (per App Structure).
- [x] **Sign out** – Button calls auth `signOut`.
- [x] **Modals** – Buttons to open Auth Modal (sign in/up) and Subscription Modal (upgrade / buy credits).

### **Phase 4: Modals / overlays**

**Timeline Generation Form modal**

- [x] **Open from** – Generate tab (e.g. "Create timeline" button).
- [x] **Form fields** – Outcome, context, timeframe, approach (conservative/balanced/aggressive); birth date, birth time, location (geocode or Expo Location); load/save from `birth_charts` if user logged in.
- [x] **Validation** – Same as reference HeroSection; show errors in glass UI.
- [x] **Credits / subscription** – If user: check credits/subscription before generate; optional gating or upsell. If anonymous: optional anonymous-credits flow or require sign-in.
- [x] **Submit** – "Generate" button (GlassButton, haptic) → call `POST /api/generate-timeline` (or anonymous endpoint); on success close form and open **Timeline Results** modal with response data.
- [x] **Styling** – Glass inputs, BlurView, cosmic colors; typography Orbitron/Inter.

**Timeline Results modal**

- [x] **Open after** – Generation form succeeds; receive generation payload (outcome, actions, timeline_affirmations, etc.).
- [x] **Content** – Outcome summary; list of actions (TimelineActionCard); today's AffirmationCard; "Save timeline" button.
- [x] **Save** – Insert into Supabase `action_timeline_generations` (+ optional `daily_affirmations` for next 30 days); then show success and optionally close or go to Logs.
- [x] **Affirm** – Same flow: confirm → `POST /api/affirm`; handle points/level-up (e.g. level-up modal).
- [x] **Close** – Dismiss modal; optional "View in Logs" CTA.

**Affirmation Share modal**

- [x] **Open from** – AffirmationCard Share (Home, Timeline Detail, or Results).
- [x] **Content** – Affirmation text; optional generated image (e.g. view shot or simple card layout).
- [x] **Actions** – Share via `expo-sharing` or React Native Share (Instagram, Save, etc.); optional backend "points per share" call if you add it.
- [x] **Dismiss** – Close modal after share or cancel.

**Auth modal**

- [x] **Port** – From `AuthModal.tsx`: sign in / sign up mode, email, password, username (signup), validation, errors.
- [x] **Open from** – Profile (and when needed, e.g. gated actions).
- [x] **Submit** – Use AuthContext `signIn` / `signUp`; on success close modal.
- [x] **Styling** – Modal + glass inputs; haptic on submit.

**Subscription modal**

- [x] **Port** – From `SubscriptionModal.tsx`: type = subscription | credits; call create-checkout-session or create-credits-checkout; redirect to Stripe (e.g. WebBrowser or in-app browser).
- [x] **Open from** – Profile (Upgrade / Buy credits).
- [x] **Return** – Handle deep link or return URL; refresh subscription/credits (event or refetch).
- [x] **Styling** – Glass modal; error handling per reference.

### **Phase 5: Navigation & routing**

- [ ] **Tabs** – Confirm 4 tabs: Home, Generate, Logs, Profile (order and labels match App Structure).
- [ ] **Timeline Detail** – Add stack route (e.g. `app/timeline/[id].tsx` or `app/(tabs)/logs/timeline/[id].tsx`); open from Logs on card tap; hide tab bar on this screen.
- [ ] **Modals** – Use Expo Router modals or stack with `presentation: 'modal'` for: Timeline Form, Timeline Results, Affirmation Share, Auth, Subscription so tab bar is hidden when modal is open.
- [ ] **Deep links** – Optional: Stripe return URL / success for subscription and credits.

### **Phase 6: Level-up & polish**

- [ ] **Level-up modal** – When `POST /api/affirm` returns `levelUp`, show modal (port idea from `LevelUpModal.tsx`): new level, level name, badge image; "Continue" to dismiss; optional confetti/simple animation.
- [ ] **Points refresh** – After affirm (and level-up), refresh user-points and user-level (e.g. context, event, or refetch) so Home and Profile stay in sync.
- [ ] **Welcome / onboarding** – If first-time user (no or incomplete `birth_charts`): after signup/signin show Welcome modal (birth date, time, location) and save to `birth_charts`; port logic from `WelcomeModal.tsx` and AuthContext `isFirstTimeUser`.
- [ ] **Accessibility** – Accessible labels, min touch targets 44pt, reduced motion (per rules).
- [ ] **Loading & errors** – Skeleton or loading states for async screens; error messages in glass UI where needed.

### **Reference file map (quick lookup)**

| Need | Reference file(s) |
|------|------------------|
| Auth, session, sign in/up | `contexts/AuthContext.tsx`, `lib/supabase.ts` |
| Generation form (fields, validation, birth chart) | `components/HeroSection.tsx` |
| Generate API, results handling | `app/timeline/page.tsx` |
| Results UI (actions, affirmation, save) | `components/ResultsSection.tsx` |
| Timeline list | `app/timelines/page.tsx` |
| Timeline detail (single timeline, affirmation, progress) | `app/timeline/[id]/page.tsx` |
| Points, level, streak in nav | `components/Navigation.tsx`, `components/LevelDisplay.tsx` |
| Level-up popup | `components/LevelUpModal.tsx` |
| Auth modal | `components/AuthModal.tsx` |
| Subscription/credits modal | `components/SubscriptionModal.tsx` |
| First-time user, birth chart | `components/WelcomeModal.tsx`, `components/WelcomeBadgeModal.tsx` |
| Submit slider (replace with button) | `components/DragSubmitSlider.tsx` |
| API endpoints (affirm, profile, user-level, etc.) | `_reference/server_phase2.js` |

---

## **Navigation flow diagram**

┌─────────┐

│  Home   │ ──┐

└─────────┘   │

│

┌─────────┐   │   ┌──────────────┐

│Generate │───┼──▶│Timeline Form │

└─────────┘   │   └──────────────┘

│           │

┌─────────┐   │           ▼

│Logs│───┼──▶┌──────────────┐

└─────────┘   │   │Timeline Detail│

│   └──────────────┘

┌─────────┐   │           │

│ Profile │───┘           │

└─────────┘               │