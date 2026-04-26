# EXC_BAD_ACCESS: Exception 1, Code 1, Subcode 721 >

**Issue ID:** 7443362717
**Project:** oalethia-mobile
**Date:** 4/26/2026, 6:15:54 PM
## Issue Summary
Hermes EXC_BAD_ACCESS during TurboModule Obj-C to JSI Conversion
**What's wrong:** **EXC_BAD_ACCESS** crash in **Hermes VM** during computed property access/setting.
**In the trace:** Successful network calls preceded the crash; no immediate HTTP errors noted.
**Possible cause:** The crash likely stems from **invalid memory access** within Hermes when converting **Objective-C types** (like NSArray) to JSI arrays.

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
- **mechanism:** mach
- **os:** iOS 18.7.7
- **os.build:** 22H340
- **os.name:** iOS
- **os.rooted:** no
- **release:** com.oalethia.oalethia@1.0.0+56
- **user:** id:CA66672F-2F9A-426D-B6EA-8D5CBFF3FB9F

## Exception

### Exception 1
**Type:** EXC_BAD_ACCESS
**Value:** Exception 1, Code 1, Subcode 721 >
KERN_INVALID_ADDRESS at 0x2d1.

#### Stacktrace

```
 hermes::vm::JSObject::getComputedPrimitiveDescriptor in unknown file [Line null] (In app)
 hermes::vm::JSObject::putComputedWithReceiver_RJS in unknown file [Line null] (In app)
 facebook::hermes::(anonymous namespace)::HermesRuntimeImpl::setValueAtIndexImpl in unknown file [Line null] (In app)
 facebook::react::TurboModuleConvertUtils::convertNSArrayToJSIArray in unknown file [Line null] (In app)
 facebook::react::TurboModuleConvertUtils::convertNSExceptionToJSError in unknown file [Line null] (In app)
 facebook::react::ObjCTurboModule::performVoidMethodInvocation in unknown file [Line null] (In app)
 std::__1::__function::__func<T>::operator() in unknown file [Line null] (Not in app)
 _dispatch_call_block_and_release in unknown file [Line null] (Not in app)
 _dispatch_client_callout in unknown file [Line null] (Not in app)
 _dispatch_lane_serial_drain in unknown file [Line null] (Not in app)
 _dispatch_lane_invoke in unknown file [Line null] (Not in app)
 _dispatch_root_queue_drain_deferred_wlh in unknown file [Line null] (Not in app)
 _dispatch_workloop_worker_thread in unknown file [Line null] (Not in app)
 _pthread_wqthread in unknown file [Line null] (Not in app)
```

## Thread:  Thread 1 (crashed)

#### Stacktrace

```
 hermes::vm::JSObject::getComputedPrimitiveDescriptor in unknown file [Line null] (In app)
 hermes::vm::JSObject::putComputedWithReceiver_RJS in unknown file [Line null] (In app)
 facebook::hermes::(anonymous namespace)::HermesRuntimeImpl::setValueAtIndexImpl in unknown file [Line null] (In app)
 facebook::react::TurboModuleConvertUtils::convertNSArrayToJSIArray in unknown file [Line null] (In app)
 facebook::react::TurboModuleConvertUtils::convertNSExceptionToJSError in unknown file [Line null] (In app)
 facebook::react::ObjCTurboModule::performVoidMethodInvocation in unknown file [Line null] (In app)
 std::__1::__function::__func<T>::operator() in unknown file [Line null] (Not in app)
 _dispatch_call_block_and_release in unknown file [Line null] (Not in app)
 _dispatch_client_callout in unknown file [Line null] (Not in app)
 _dispatch_lane_serial_drain in unknown file [Line null] (Not in app)
 _dispatch_lane_invoke in unknown file [Line null] (Not in app)
 _dispatch_root_queue_drain_deferred_wlh in unknown file [Line null] (Not in app)
 _dispatch_workloop_worker_thread in unknown file [Line null] (Not in app)
 _pthread_wqthread in unknown file [Line null] (Not in app)
```
