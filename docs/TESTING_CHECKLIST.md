# Oalethia Mobile App - Testing Checklist

**Last Updated:** March 27, 2026  
**Backend:** https://oalethiamobilebackend.onrender.com  
**Purpose:** Comprehensive testing guide for local development and TestFlight builds

---

## 📋 Testing Phases

- **Phase 1:** Pre-TestFlight Testing (Local Development)
- **Phase 2:** Post-TestFlight Testing (Real Device)
- **Phase 3:** Final App Store Validation

---

## 🔧 Setup Prerequisites

### Before Starting Any Tests

- [ ] Backend is deployed and running on Render
- [ ] Backend health check passes: `https://oalethiamobilebackend.onrender.com/api/health`
- [ ] `.env` has production API URL set
- [ ] Supabase project is live and accessible
- [ ] Database tables are created (via migrations or manual setup)
- [ ] Supabase Edge Function `iap-verify-receipt` is deployed
- [ ] `APPLE_SHARED_SECRET` is set in Supabase Edge Function environment variables

### Testing Environment Setup

**For Local Development Testing:**
```bash
# Clear cache and start fresh
npx expo start --clear

# Open Chrome DevTools for debugging
# Press 'j' in terminal after starting
```

**For TestFlight Testing:**
```bash
# Build production iOS app
eas build --profile production --platform ios

# Submit to TestFlight
eas submit --platform ios
```

---

# Phase 1: Pre-TestFlight Testing (Local Development)

## 🚀 Critical Path - First-Time User Journey

### 1. Onboarding Flow
- [ ] **Launch app** - Splash screen displays correctly
- [ ] **Onboarding screens** load (4 image slides)
- [ ] **Swipe between slides** works smoothly
- [ ] **Skip button** functionality (should skip onboarding)
- [ ] **Get Started button** advances to birth date picker
- [ ] **Indicators** show correct slide position

### 2. Birth Data Collection

#### Birth Date Picker
- [ ] **Date picker** displays
- [ ] **Can select past dates** (100+ years ago)
- [ ] **Cannot select future dates**
- [ ] **Default date** is reasonable (e.g., 30 years ago)
- [ ] **Done button** advances to birth time picker
- [ ] **Error state** if no date selected (shouldn't allow progress)

#### Birth Time Picker
- [ ] **Time picker** displays with 12-hour format
- [ ] **Can select hours** (1-12)
- [ ] **Can select minutes** (00-59)
- [ ] **AM/PM toggle** works
- [ ] **Default time** is 12:00 PM
- [ ] **Done button** advances to location picker
- [ ] **Time persists** correctly

#### Birth Location Picker
- [ ] **Search input** is visible and functional
- [ ] **Type city name** (e.g., "New York")
- [ ] **Autocomplete suggestions** appear within 1-2 seconds
- [ ] **Results are cities** (not streets or buildings)
- [ ] **Can select suggestion** from list
- [ ] **Selected location** displays in input field
- [ ] **Coordinates are valid** (latitude/longitude not 0,0)
- [ ] **Done button** is enabled only after selecting suggestion
- [ ] **Cannot proceed** without selecting from suggestions
- [ ] **Error message** displays if trying to proceed with typed text but no selection
- [ ] **Advances to auth screen** after valid selection

### 3. Authentication

#### Sign Up
- [ ] **Auth modal** displays with sign-up form
- [ ] **Email input** accepts valid email format
- [ ] **Password input** accepts 6+ characters
- [ ] **Password visibility toggle** works
- [ ] **Sign Up button** creates account
- [ ] **Loading indicator** shows during sign-up
- [ ] **Success:** User is authenticated
- [ ] **Error handling:**
  - [ ] Invalid email format shows error
  - [ ] Weak password shows error
  - [ ] Duplicate email shows "User already exists"
  - [ ] Network error shows appropriate message

#### Sign In
- [ ] **Switch to Sign In tab** works
- [ ] **Email and password** inputs function
- [ ] **Sign In button** authenticates user
- [ ] **Loading indicator** shows during sign-in
- [ ] **Success:** User proceeds to main app
- [ ] **Error handling:**
  - [ ] Wrong password shows error
  - [ ] Non-existent user shows error
  - [ ] Network error shows appropriate message

#### Password Reset
- [ ] **Forgot Password link** is visible
- [ ] **Click link** triggers password reset flow
- [ ] **Email sent** confirmation appears
- [ ] **Check email** - reset link arrives (check Supabase logs)

### 4. Welcome Badge & First Timeline

#### Welcome Badge Modal
- [ ] **Modal appears** after successful sign-up
- [ ] **Badge image** displays (Level 1 badge)
- [ ] **Welcome message** shows username
- [ ] **Points granted** (e.g., 50 points for joining)
- [ ] **Continue button** advances to timeline creation

#### Create First Timeline Modal
- [ ] **Modal displays** with form fields
- [ ] **Goal/Outcome input** accepts text
- [ ] **Context input** (optional) accepts text
- [ ] **Resources input** (optional) accepts text
- [ ] **Approach selector** (optional) displays options
- [ ] **Timeframe input** accepts number (months)
- [ ] **Generate button** is enabled with valid inputs
- [ ] **Birth data** is pre-filled from onboarding (not re-asked)
- [ ] **Location field** displays birth location (read-only)

#### Timeline Generation
- [ ] **Click Generate button**
- [ ] **Loading modal** appears with "Calculating transits..."
- [ ] **Progress text** updates during generation
- [ ] **Backend API call** to `/api/generate-timeline` succeeds
- [ ] **Generation takes 10-30 seconds** (acceptable)
- [ ] **Success:**
  - [ ] Results modal displays
  - [ ] Timeline actions are listed (8-15 actions)
  - [ ] Each action has: title, description, date, astrological reasoning
  - [ ] Actions are sorted chronologically
  - [ ] Save button is visible
- [ ] **Error handling:**
  - [ ] Network error shows message with retry option
  - [ ] Server error (500) shows user-friendly message
  - [ ] Timeout shows appropriate error
  - [ ] Error state has clear messaging

#### Save Timeline
- [ ] **Click Save button** in results modal
- [ ] **Loading indicator** shows
- [ ] **Timeline saves** to Supabase database
- [ ] **Success message** appears
- [ ] **Modal closes** automatically
- [ ] **Navigates to home screen** with saved timeline
- [ ] **Error handling:** Shows error message if save fails

---

## 🏠 Home Screen (Main App)

### First Load After Onboarding
- [ ] **Home screen loads** successfully
- [ ] **User profile section** displays:
  - [ ] Username
  - [ ] Current level (Level 1 initially)
  - [ ] Total points (50-100 points from sign-up/first timeline)
  - [ ] Level progress bar
- [ ] **Daily Affirmation card** displays:
  - [ ] Today's affirmation text
  - [ ] Affirmation image/poster
  - [ ] "I Affirm This" button is enabled
  - [ ] Affirmation corresponds to one of user's timelines
- [ ] **Next Actions section** displays:
  - [ ] At least 1 upcoming action from saved timeline
  - [ ] Action title, description, date
  - [ ] Action card is tappable
- [ ] **Timeline preview** shows saved timeline:
  - [ ] Timeline goal/outcome
  - [ ] Progress indicator (0% initially)
  - [ ] "View Details" link

### Affirming Daily Affirmation
- [ ] **Tap "I Affirm This" button**
- [ ] **Haptic feedback** triggers
- [ ] **Animation/transition** occurs
- [ ] **Backend API call** to `/api/affirm` succeeds
- [ ] **Points increase** (e.g., +5 points)
- [ ] **Level up modal** appears if threshold reached
- [ ] **Button changes** to "Affirmed ✓" state
- [ ] **Button is disabled** after affirming (can't affirm twice)
- [ ] **Error handling:** Shows error if API fails

### Share Affirmation
- [ ] **Share button** is visible on affirmation card
- [ ] **Tap share button**
- [ ] **ViewShot captures** card as image
- [ ] **Native share dialog** opens
- [ ] **Can share to:**
  - [ ] Messages
  - [ ] Instagram
  - [ ] Twitter/X
  - [ ] Save to Photos
- [ ] **Shared image** includes:
  - [ ] Affirmation text
  - [ ] Oalethia logo/watermark
  - [ ] Visual design from card

### Next Actions Interaction
- [ ] **Tap on next action card**
- [ ] **Navigates to timeline detail** screen
- [ ] **Action is highlighted** in timeline view
- [ ] **Can complete action** from timeline view
- [ ] **Can skip action** from timeline view

### Leaderboard Preview
- [ ] **Leaderboard section** displays on home screen
- [ ] **Shows top 3 users** (may be empty initially)
- [ ] **User's own rank** displays if on leaderboard
- [ ] **"View Full Leaderboard" link** is visible
- [ ] **Tap link** navigates to full leaderboard screen

---

## 📊 Profile Screen

### Profile Data Display
- [ ] **Navigate to Profile tab**
- [ ] **Profile loads** successfully
- [ ] **User info section** displays:
  - [ ] Username
  - [ ] Email
  - [ ] Profile picture placeholder (if no picture uploaded)
- [ ] **Stats section** displays:
  - [ ] Total points
  - [ ] Current level
  - [ ] Timelines created count
  - [ ] Actions completed count
- [ ] **Level progress** shows:
  - [ ] Current level badge
  - [ ] Progress bar to next level
  - [ ] Points needed for next level

### User Level Details
- [ ] **Tap on level badge**
- [ ] **Level details modal/screen** appears
- [ ] **Shows:**
  - [ ] Current level name
  - [ ] Level benefits/description
  - [ ] Progress to next level
  - [ ] Points breakdown

### Subscription Status
- [ ] **Subscription section** displays
- [ ] **Shows current tier:** "Free" initially
- [ ] **Monthly credits:** 3/3 (for free tier)
- [ ] **"Upgrade" button** is visible
- [ ] **Tap Upgrade button**
- [ ] **Subscription modal** opens with IAP options

### Settings & Actions
- [ ] **Settings row** displays options:
  - [ ] Edit Profile
  - [ ] Notifications
  - [ ] Privacy Policy
  - [ ] Terms of Service
  - [ ] Delete Account
  - [ ] Sign Out
- [ ] **Tap each setting** - navigates or performs action:
  - [ ] Edit Profile: Opens edit screen (if implemented)
  - [ ] Notifications: Shows notification settings
  - [ ] Privacy Policy: Opens web view or external link
  - [ ] Terms of Service: Opens web view or external link
  - [ ] Delete Account: Shows confirmation dialog
  - [ ] Sign Out: Signs out and returns to auth screen

### Delete Account Flow
- [ ] **Tap Delete Account**
- [ ] **Confirmation dialog** appears with warning
- [ ] **User must confirm** (two-step process)
- [ ] **API call** to Supabase Edge Function `delete-account`
- [ ] **All user data deleted:**
  - [ ] User profile
  - [ ] Birth chart
  - [ ] Timelines
  - [ ] Points/credits
  - [ ] Action progress
  - [ ] Daily affirmations
  - [ ] Auth user account
- [ ] **Returns to auth screen** after deletion
- [ ] **Cannot sign in** with deleted credentials

---

## 🏆 Leaderboard Screen

### Leaderboard Display
- [ ] **Navigate to Leaderboard tab**
- [ ] **Leaderboard loads** within 2 seconds
- [ ] **API call** to `/api/leaderboard?limit=25` succeeds
- [ ] **Displays users** in order of points:
  - [ ] Rank number
  - [ ] Username
  - [ ] Level
  - [ ] Total points
- [ ] **Current user** is highlighted (if on leaderboard)
- [ ] **Smooth scrolling** through list

### Empty State
- [ ] **If no users on leaderboard:**
  - [ ] Empty state message displays
  - [ ] Encouraging text (e.g., "Be the first!")
  - [ ] No errors shown

### Refresh
- [ ] **Pull to refresh** gesture works
- [ ] **Loading indicator** shows during refresh
- [ ] **Updated data** loads
- [ ] **No duplicate entries** after refresh

### Error Handling
- [ ] **Network error:** Shows error message with retry button
- [ ] **Server error:** Shows user-friendly error
- [ ] **Retry button** works and reloads data

---

## 🎯 Generator Screen (Create New Timeline)

### Timeline Creation Form
- [ ] **Navigate to Generate tab**
- [ ] **Form displays** with all fields:
  - [ ] Goal/Outcome (required)
  - [ ] Context (optional)
  - [ ] Available Resources (optional)
  - [ ] Preferred Approach (optional dropdown)
  - [ ] Timeframe in months (required, default: 3)
- [ ] **Birth data** is pre-populated from profile (hidden from form)
- [ ] **Location** is read from user's stored birth location
- [ ] **Generate button** is disabled until required fields filled

### Input Validation
- [ ] **Goal field:** Must have 10+ characters
- [ ] **Timeframe:** Must be 1-12 months
- [ ] **Empty required field:** Shows validation error
- [ ] **Character counter** displays for goal field

### Generate Timeline
- [ ] **Fill in valid data**
- [ ] **Tap Generate button**
- [ ] **Loading modal** appears
- [ ] **Progress text** updates ("Calculating transits...", "Generating actions...")
- [ ] **Takes 10-30 seconds**
- [ ] **API call** to `/api/generate-timeline` succeeds
- [ ] **Results modal** displays generated timeline
- [ ] **Credit is deducted** (user now has 2/3 monthly credits)
- [ ] **Points awarded** for generating timeline

### Credits System
- [ ] **Credits display** shows remaining count
- [ ] **Free tier:** 3 credits per month
- [ ] **After 3 generations:** "Out of credits" message appears
- [ ] **Upgrade CTA** shows when out of credits
- [ ] **Cannot generate** without credits

### Save Generated Timeline
- [ ] **Review generated actions** in results modal
- [ ] **Actions are relevant** to goal
- [ ] **Astrological reasoning** is included
- [ ] **Dates are in future**
- [ ] **Tap Save button**
- [ ] **Timeline saves** to database
- [ ] **Navigates to timeline detail** screen
- [ ] **Timeline appears** in logs/history

---

## 📅 Timeline Detail Screen

### Display Timeline Data
- [ ] **Navigate to saved timeline** (from home or logs)
- [ ] **Timeline header** displays:
  - [ ] Goal/outcome
  - [ ] Timeframe
  - [ ] Creation date
  - [ ] Progress percentage
- [ ] **Daily affirmation section** shows:
  - [ ] Today's affirmation for this timeline
  - [ ] "I Affirm This" button
- [ ] **Actions list** displays all actions:
  - [ ] Action title
  - [ ] Action description
  - [ ] Target date
  - [ ] Status (pending, completed, skipped)
  - [ ] Astrological reasoning (expandable)
- [ ] **Completed actions** are visually distinct (greyed out, checkmark)

### Affirm from Timeline Detail
- [ ] **Tap "I Affirm This" button**
- [ ] **API call** to `/api/affirm` succeeds
- [ ] **Points increase**
- [ ] **Button state changes** to "Affirmed ✓"
- [ ] **Cannot affirm again** today

### Complete Action
- [ ] **Tap action card**
- [ ] **Action detail modal** opens (or inline expand)
- [ ] **"Mark Complete" button** is visible
- [ ] **Tap Mark Complete**
- [ ] **API call** to `/api/action-progress` (POST) succeeds
- [ ] **Action status changes** to completed
- [ ] **Progress percentage increases**
- [ ] **Points awarded** (+10 points)
- [ ] **Visual feedback** (haptic, animation)

### Skip Action
- [ ] **Long press on action** OR **swipe action**
- [ ] **"Skip" option** appears
- [ ] **Tap Skip**
- [ ] **Confirmation dialog** appears
- [ ] **Confirm skip**
- [ ] **API call** to `/api/action-progress` succeeds
- [ ] **Action marked as skipped**
- [ ] **Progress bar updates** (skipped actions don't count toward 100%)

### Action Progress Persistence
- [ ] **Complete/skip actions**
- [ ] **Close app**
- [ ] **Reopen app**
- [ ] **Progress is saved** and displays correctly
- [ ] **Completed actions** remain completed

---

## 📜 Logs Screen (Timeline History)

### Display Timeline History
- [ ] **Navigate to Logs tab**
- [ ] **All saved timelines** display in list
- [ ] **Each timeline card** shows:
  - [ ] Goal/outcome
  - [ ] Creation date
  - [ ] Progress percentage
  - [ ] Status (active/completed)
- [ ] **Sorted by date** (newest first)
- [ ] **Tap timeline card** navigates to detail screen

### Empty State
- [ ] **If no timelines:**
  - [ ] Empty state message displays
  - [ ] CTA to create first timeline
  - [ ] Tap CTA navigates to Generator tab

### Filtering/Sorting
- [ ] **Filter buttons** (if implemented):
  - [ ] Active timelines
  - [ ] Completed timelines
  - [ ] All timelines
- [ ] **Filters work** correctly

---

## 🔔 Notifications (Local Notifications)

### Notification Permissions
- [ ] **App requests notification permission** on first launch
- [ ] **Permission dialog** appears (iOS system dialog)
- [ ] **User grants permission**
- [ ] **Permission status** is stored

### Scheduled Notifications
- [ ] **Daily affirmation reminder** schedules after affirming
- [ ] **Next action reminder** schedules for upcoming actions
- [ ] **Check Expo Notifications:**
  ```bash
  # In app code, verify:
  - Notifications.getAllScheduledNotificationsAsync()
  ```
- [ ] **Notifications appear** at scheduled time
- [ ] **Tap notification** navigates to home screen

### Notification Content
- [ ] **Notification title** is relevant (e.g., "Time for your affirmation!")
- [ ] **Notification body** includes detail
- [ ] **App icon** displays in notification
- [ ] **Sound plays** (if enabled)

---

## 💳 In-App Purchases (IAP) - Limited Testing

**Note:** Real IAP cannot be tested without TestFlight build on physical device. This section tests UI only.

### Subscription Modal
- [ ] **Tap Upgrade button** from profile
- [ ] **Subscription modal** displays
- [ ] **Shows subscription tiers:**
  - [ ] Free tier (current)
  - [ ] Premium tier (monthly)
  - [ ] Premium tier (annual)
- [ ] **Each tier shows:**
  - [ ] Name
  - [ ] Price
  - [ ] Monthly credits
  - [ ] Features/benefits
- [ ] **Subscribe button** for each tier

### Mock Purchase Flow (UI Only)
- [ ] **Tap Subscribe button**
- [ ] **Loading indicator** shows
- [ ] **Apple IAP sheet** would appear (won't work in Expo Go)
- [ ] **Error message** appears (expected in Expo Go)

### Restore Purchases
- [ ] **"Restore Purchases" button** is visible
- [ ] **Tap button**
- [ ] **Loading indicator** shows
- [ ] **Success/failure message** appears

---

## 🐛 Error Handling & Edge Cases

### Network Errors
- [ ] **Turn off WiFi** mid-operation
- [ ] **Network error message** displays
- [ ] **Retry button** appears
- [ ] **Turn WiFi back on**
- [ ] **Tap retry** - operation resumes
- [ ] **App doesn't crash**

### Backend Errors
- [ ] **Simulate 500 error** (if possible, or note if backend returns one)
- [ ] **User-friendly error message** appears
- [ ] **No stack traces** shown to user
- [ ] **Error logged** to console (for debugging)

### Invalid Data
- [ ] **Empty form submissions** show validation errors
- [ ] **Malformed dates** are rejected
- [ ] **Invalid coordinates** (0,0) are prevented
- [ ] **API returns error for invalid data**

### Session Expiry
- [ ] **Let session expire** (or force expire via Supabase)
- [ ] **Make API call**
- [ ] **401 Unauthorized** error
- [ ] **User redirected to sign-in screen**
- [ ] **After sign-in, returns to previous screen**

### Low Memory / Performance
- [ ] **Open many apps** to reduce available memory
- [ ] **App remains stable**
- [ ] **No crashes or freezes**
- [ ] **UI remains responsive**

### Screen Rotation
- [ ] **Rotate device** (if rotation enabled)
- [ ] **UI adjusts properly**
- [ ] **No content cut off**
- [ ] **Inputs remain accessible**

### Background/Foreground Transitions
- [ ] **App is running**
- [ ] **Press home button** (background app)
- [ ] **Wait 5 minutes**
- [ ] **Reopen app**
- [ ] **App resumes where left off**
- [ ] **Data is still loaded**
- [ ] **No need to re-authenticate** (session valid)

---

## ⚡ Performance Testing

### Load Times
- [ ] **App launch:** < 3 seconds to first screen
- [ ] **API calls:** < 3 seconds for most endpoints
- [ ] **Timeline generation:** 10-30 seconds (acceptable for AI/astrology processing)
- [ ] **Screen transitions:** < 500ms (smooth animations)
- [ ] **Image loading:** Progressive loading with placeholders

### Smooth Scrolling
- [ ] **Home screen** scrolls smoothly
- [ ] **Leaderboard** scrolls without lag
- [ ] **Timeline detail** scrolls smoothly
- [ ] **No dropped frames** during scrolling

### Memory Usage
- [ ] **Check Expo DevTools** for memory usage
- [ ] **Memory stays under 150MB** during normal use
- [ ] **No memory leaks** (memory doesn't keep growing)

### Battery Drain
- [ ] **Use app for 30 minutes**
- [ ] **Battery drain is reasonable** (not excessive)
- [ ] **App doesn't cause device to heat up**

---

## 🔒 Security & Privacy

### Authentication Security
- [ ] **Passwords are not logged** to console
- [ ] **Session tokens** are stored securely (AsyncStorage/SecureStore)
- [ ] **Cannot access app** without authentication
- [ ] **Logout clears** session completely

### Data Privacy
- [ ] **User data** is not exposed in URLs
- [ ] **API calls use HTTPS** only
- [ ] **Birth data** is stored securely in Supabase
- [ ] **No sensitive data** in app logs

### API Security
- [ ] **All protected endpoints** require `Authorization: Bearer <token>` header
- [ ] **Invalid/expired tokens** return 401 error
- [ ] **Cannot access other users' data**

---

## 📱 App Store Preparation (Pre-TestFlight)

### App Metadata
- [ ] **App icon** is set (1024x1024)
- [ ] **App name** is set: "Oalethia"
- [ ] **Bundle identifier** matches: `com.oalethia.oalethia`
- [ ] **Version number** is set (e.g., 1.0.0)
- [ ] **Build number** auto-increments

### Required Screenshots (Take After Testing)
- [ ] iPhone 6.7" (Pro Max): 1290 x 2796 pixels
- [ ] iPhone 6.5" (14 Pro Max): 1242 x 2688 pixels
- [ ] iPad Pro 12.9" (if universal): 2048 x 2732 pixels

### Privacy Policy & Terms
- [ ] **Privacy policy URL** is accessible
- [ ] **Terms of service URL** is accessible
- [ ] **Links work** from app settings

### Demo Account for Apple Review
- [ ] **Create demo account:** `demo@oalethia.com`
- [ ] **Populate with sample data:**
  - [ ] 2-3 saved timelines
  - [ ] Some completed actions
  - [ ] Level 3-5 progress
- [ ] **Document credentials** in App Review Notes

---

# Phase 2: Post-TestFlight Testing (Real Device)

**Prerequisites:**
- [ ] Production build created with `eas build --profile production --platform ios`
- [ ] Build submitted to TestFlight
- [ ] TestFlight approved (usually 24-48 hours)
- [ ] App installed on physical iOS device

---

## 🔁 Repeat Critical Path Tests

### Run Through All Phase 1 Tests
- [ ] **First-time user journey** (onboarding → create timeline)
- [ ] **Home screen** functionality
- [ ] **Profile screen** data and actions
- [ ] **Leaderboard** display
- [ ] **Timeline generation**
- [ ] **Timeline detail** interaction
- [ ] **Logs screen** history
- [ ] **Notifications** (real device only)
- [ ] **All error handling** scenarios

---

## 💳 In-App Purchases (Real Testing)

### IAP Setup Verification
- [ ] **Sandbox tester account** created in App Store Connect
- [ ] **Signed in to sandbox** on device: Settings → App Store → Sandbox Account
- [ ] **IAP products** created in App Store Connect:
  - [ ] Monthly subscription SKU
  - [ ] Annual subscription SKU

### Purchase Flow
- [ ] **Open subscription modal**
- [ ] **Select Premium Monthly**
- [ ] **Apple IAP sheet appears** (real sheet this time)
- [ ] **Shows correct price** (e.g., $4.99/month)
- [ ] **Shows sandbox warning** (yellow banner)
- [ ] **Complete purchase**
- [ ] **Receipt generated**
- [ ] **API call** to `/api/reconcile-subscription` with receipt
- [ ] **Backend verifies receipt** via Supabase Edge Function
- [ ] **Subscription status updates** in profile
- [ ] **Monthly credits increase** (e.g., 3 → 10)

### Purchase Verification
- [ ] **Close app completely**
- [ ] **Reopen app**
- [ ] **Subscription status persists**
- [ ] **Credits remain correct**

### Restore Purchases
- [ ] **Delete app** from device
- [ ] **Reinstall from TestFlight**
- [ ] **Sign in with same account**
- [ ] **Go to subscription modal**
- [ ] **Tap "Restore Purchases"**
- [ ] **Subscription restores successfully**
- [ ] **Credits are correct**

### Subscription Management
- [ ] **Tap "Manage Subscription"** in profile
- [ ] **Opens iOS Subscription Management** screen
- [ ] **Can view subscription details**
- [ ] **Can cancel subscription** (test if safe)

### Edge Cases - IAP
- [ ] **Purchase interrupted:** Start purchase, force quit app
  - [ ] **Reopen app** - purchase state is handled gracefully
  - [ ] **Retry or cancel** works
- [ ] **Receipt validation fails:**
  - [ ] **Error message** displays
  - [ ] **User not charged** (sandbox mode)
  - [ ] **Can retry purchase**
- [ ] **Multiple devices:**
  - [ ] **Purchase on device A**
  - [ ] **Sign in on device B**
  - [ ] **Restore purchases** - works on device B

---

## 🔔 Push Notifications (If Implemented)

**Note:** If you add push notifications later, test these.

- [ ] **Request permission** on first launch
- [ ] **Permission granted**
- [ ] **Device token registered** with Supabase/backend
- [ ] **Send test notification** from backend
- [ ] **Notification appears** on lock screen
- [ ] **Tap notification** opens app
- [ ] **Deep link** navigates to correct screen

---

## 📲 Deep Linking (If Implemented)

**Note:** Test if you implement universal links or deep links.

- [ ] **Email link** (e.g., password reset) opens app
- [ ] **Share link** opens app to specific timeline
- [ ] **Custom URL scheme** works (e.g., `oalethia://timeline/123`)

---

## 🌐 App Store Connect Validation

### Before Submission
- [ ] **All TestFlight tests passed**
- [ ] **No critical bugs**
- [ ] **Performance is acceptable**
- [ ] **IAP works correctly**

### App Store Connect Setup
- [ ] **App metadata complete:**
  - [ ] App name: "Oalethia"
  - [ ] Subtitle (30 chars max)
  - [ ] Description (4000 chars max)
  - [ ] Keywords (100 chars max)
  - [ ] Support URL
  - [ ] Marketing URL (optional)
  - [ ] Privacy Policy URL
- [ ] **Screenshots uploaded** for all required sizes
- [ ] **App preview videos** (optional but recommended)
- [ ] **Age rating** set correctly
- [ ] **Category** selected (e.g., Lifestyle, Health & Fitness)
- [ ] **Pricing** set (Free with IAP)
- [ ] **IAP products** configured and approved

### App Review Information
- [ ] **Demo account credentials** added:
  ```
  Email: demo@oalethia.com
  Password: [secure password]
  ```
- [ ] **Review notes** explain:
  - [ ] How to test timeline generation
  - [ ] Backend is live and operational
  - [ ] IAP is configured for production
- [ ] **Contact information** is accurate

---

# Phase 3: Final Checks Before App Store Submission

## 🎯 Final Critical Path Test
- [ ] **Fresh install from TestFlight**
- [ ] **Complete full user journey** without issues
- [ ] **No crashes**
- [ ] **All features working**

## 📋 App Store Guidelines Compliance
- [ ] **Account deletion** works (Guideline 6)
- [ ] **Privacy policy** accessible (Guideline 5.1.1)
- [ ] **No "Coming Soon" features** (Guideline 2.3)
- [ ] **IAP used for digital goods** (Guideline 3.1.1)
- [ ] **Restore Purchases** button exists (Guideline 3.1.1)
- [ ] **No placeholder content** (Guideline 2.1)
- [ ] **Notifications** have clear purpose strings (Guideline 5.1.1)

## 🚀 Ready to Submit
- [ ] **All tests passed**
- [ ] **Demo account prepared**
- [ ] **Screenshots ready**
- [ ] **Metadata complete**
- [ ] **Team reviewed and approved**

---

## 🐛 Common Issues & Solutions

### Issue: Backend Health Check Fails
**Symptoms:** API calls fail, "Network Error" messages
**Solution:**
1. Check Render dashboard - is service running?
2. Verify environment variables are set
3. Check logs for errors
4. Restart Render service if needed

### Issue: Timeline Generation Hangs
**Symptoms:** Loading spinner never completes
**Solution:**
1. Check backend logs in Render
2. Verify OpenAI API key is valid and has credits
3. Check ephemeris files are present in backend
4. Timeout may need increase (check backend code)

### Issue: Geocoding Returns No Results
**Symptoms:** Location search shows no suggestions
**Solution:**
1. Check `/api/geocode` endpoint in backend
2. Verify Google Places API key is set and valid
3. Check API key has proper permissions
4. Check billing is enabled on Google Cloud

### Issue: IAP Purchase Doesn't Process
**Symptoms:** Purchase completes but subscription doesn't activate
**Solution:**
1. Check receipt reaches backend (`/api/reconcile-subscription`)
2. Verify Supabase Edge Function `iap-verify-receipt` is deployed
3. Check `APPLE_SHARED_SECRET` is set in Edge Function env vars
4. Check backend logs for receipt validation errors
5. Verify sandbox environment is correct

### Issue: Notifications Don't Appear
**Symptoms:** Notifications scheduled but never show
**Solution:**
1. Check notification permissions granted
2. Verify `expo-notifications` plugin in `app.json`
3. Check `NSUserNotificationUsageDescription` in `app.json`
4. Verify notifications are scheduled (check AsyncStorage)
5. Test on real device (not simulator)

### Issue: App Crashes on Launch
**Symptoms:** App opens then immediately closes
**Solution:**
1. Check Expo logs: `npx expo start`
2. Look for JavaScript errors in console
3. Verify `.env` file is present and correct
4. Check Supabase keys are valid
5. Clear cache: `npx expo start --clear`

---

## 📊 Testing Metrics

### Success Criteria
- [ ] **Critical path completion rate:** 100%
- [ ] **Crash-free rate:** 99.9%+
- [ ] **Average load time:** < 3 seconds
- [ ] **Timeline generation success rate:** 95%+
- [ ] **IAP purchase success rate:** 95%+

### Performance Targets
- [ ] **App launch:** < 3 seconds
- [ ] **API response time:** < 3 seconds (excluding timeline generation)
- [ ] **Timeline generation:** < 30 seconds
- [ ] **Memory usage:** < 150MB
- [ ] **Battery drain:** < 5% per 30 minutes active use

---

## ✅ Sign-Off Checklist

Before submitting to App Store:

- [ ] **All Phase 1 tests passed** (local development)
- [ ] **All Phase 2 tests passed** (TestFlight)
- [ ] **IAP tested and working** on real device
- [ ] **No critical bugs** remaining
- [ ] **Performance is acceptable**
- [ ] **App Store metadata complete**
- [ ] **Screenshots ready**
- [ ] **Demo account prepared**
- [ ] **Privacy policy & terms accessible**
- [ ] **Team sign-off obtained**

---

## 📝 Notes

### Testing Best Practices
1. **Test on multiple devices** if possible (different iPhones, iOS versions)
2. **Test with poor network** conditions (slow WiFi, cellular)
3. **Test with low battery** - ensure no excessive drain
4. **Test as a new user** - clear all data between tests
5. **Test as a returning user** - data persistence
6. **Document all bugs** with steps to reproduce
7. **Take screenshots** of any errors

### Known Limitations
- **IAP testing:** Cannot test real purchases without TestFlight
- **Push notifications:** Cannot test without real device build
- **Native modules:** Some features may not work in Expo Go

### Resources
- **Backend:** https://oalethiamobilebackend.onrender.com
- **Supabase:** https://shzqirexfiqftoygbned.supabase.co
- **App Store Connect:** https://appstoreconnect.apple.com
- **Expo Dashboard:** https://expo.dev
- **Testing Guide:** `docs/LIVE_TEST_TODO.md`

---

**Last Updated:** March 27, 2026  
**Version:** 1.0.0  
**Author:** Development Team
