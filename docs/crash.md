# WatchdogTermination: The OS watchdog terminated your app, possibly because it overused RAM.

**Issue ID:** 7443266882
**Project:** oalethia-mobile
**Date:** 4/26/2026, 4:43:20 PM
## Issue Summary
Watchdog Termination from Suspected RAM Overuse Linked to Hooks Error
**What's wrong:** App terminated by **OS watchdog** due to **excessive RAM usage**.
**In the trace:** Multiple user **touch events** occurred just before termination, possibly triggering the memory issue.
**Possible cause:** The **React Hooks rule violation** (early return) might be causing components to re-render improperly, leading to an **uncontrolled memory leak**.

## Tags

- **device:** iPhone14,2
- **device.class:** high
- **device.family:** iOS
- **dist:** 54
- **environment:** production
- **event.environment:** native
- **event.origin:** ios
- **handled:** no
- **level:** fatal
- **mechanism:** watchdog_termination
- **os:** iOS 18.7.7
- **os.build:** 22H340
- **os.name:** iOS
- **os.rooted:** no
- **release:** com.oalethia.oalethia@1.0.0+54
- **user:** id:CA66672F-2F9A-426D-B6EA-8D5CBFF3FB9F

## Exception

### Exception 1
**Type:** WatchdogTermination
**Value:** The OS watchdog terminated your app, possibly because it overused RAM.

