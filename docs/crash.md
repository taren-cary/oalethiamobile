# C++ Exception: N8facebook3jsi7JSErrorE: ExceptionsManager.reportException raised an exception: Unhandled JS Exception: Error: Rendered fewer hooks than expected. This may be caused by an accidental early return statement.

**Issue ID:** 7443334788
**Project:** oalethia-mobile
**Date:** 4/26/2026, 5:47:15 PM
## Issue Summary
React Hook Rule Violation: Fewer Hooks Rendered in ProfileScreen
**What's wrong:** React hook rule violation: **fewer hooks rendered** than expected.
**In the trace:** The error occurred during rendering of **ProfileScreen** component.
**Possible cause:** An **early return** statement likely exists within the functional component logic.

## Tags

- **app.device:** 635efaf5de5c9fb31785b8e882eb3342eaf4d731
- **device:** iPhone14,2
- **device.class:** high
- **device.family:** iOS
- **dist:** 56
- **environment:** production
- **event.environment:** native
- **event.origin:** ios
- **handled:** no
- **level:** fatal
- **mechanism:** cpp_exception
- **os:** iOS 18.7.7
- **os.build:** 22H340
- **os.name:** iOS
- **os.rooted:** no
- **release:** com.oalethia.oalethia@1.0.0+56
- **user:** id:CA66672F-2F9A-426D-B6EA-8D5CBFF3FB9F

## Exception

### Exception 1
**Type:** C++ Exception
**Value:** N8facebook3jsi7JSErrorE: ExceptionsManager.reportException raised an exception: Unhandled JS Exception: Error: Rendered fewer hooks than expected. This may be caused by an accidental early return statement.

This error is located at:
    at ProfileScreen ..., stack:
finishRenderingHooks@1:258772
renderWithHooks@1:258618
updateFunctionComponent@1:277381
beginWork@1:285264
performUnitOfWork@1:303946
workLoopSync@1:302954
renderRootSync@1:302786
performWorkOnRoot@1:300430
performSyncWorkOnRoot@1:254154
flushSyncWorkAcrossRoots_impl@1:253045
processRootScheduleInMicrotask@1:253405
anonymous@1:254249


Error: ExceptionsManager.reportException raised an exception: Unhandled JS Exception: Error: Rendered fewer hooks than expected. This may be caused by an accidental early return statement.

This error is located at:
    at ProfileScreen ..., stack:
finishRenderingHooks@1:258772
renderWithHooks@1:258618
updateFunctionComponent@1:277381
beginWork@1:285264
performUnitOfWork@1:303946
workLoopSync@1:302954
renderRootSync


## Thread:  Thread 0

#### Stacktrace

```
 OUTLINED_FUNCTION_0 in unknown file [Line null] (Not in app)
 _xzm_free in unknown file [Line null] (Not in app)
 std::__1::__hash_table<T>::~__hash_table in __hash_table [Line 1131] (Not in app)
 std::__1::__hash_table<T>::~__hash_table in __hash_table [Line 1125] (Not in app)
 std::__1::unordered_map<T>::~unordered_map[abi:ne200100] in unordered_map [Line 1192] (Not in app)
 std::__1::unordered_map<T>::~unordered_map[abi:ne200100] in unordered_map [Line 1190] (Not in app)
 reanimated::LayoutAnimationsProxy::parseRemoveMutations in LayoutAnimationsProxy.cpp [Line 243] (Not in app)
 reanimated::LayoutAnimationsProxy::pullTransaction in LayoutAnimationsProxy.cpp [Line 45] (Not in app)
 facebook::react::MountingCoordinator::pullTransaction in unknown file [Line null] (In app)
 facebook::react::TelemetryController::pullTransaction in unknown file [Line null] (In app)
 -[RCTMountingManager performTransaction:] in unknown file [Line null] (In app)
 -[RCTMountingManager initiateTransaction:] in unknown file [Line null] (In app)
 _dispatch_call_block_and_release in unknown file [Line null] (Not in app)
 _dispatch_client_callout in unknown file [Line null] (Not in app)
 _dispatch_main_queue_drain.cold.5 in unknown file [Line null] (Not in app)
 _dispatch_main_queue_drain in unknown file [Line null] (Not in app)
```
