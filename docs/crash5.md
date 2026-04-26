# EXC_BAD_ACCESS: natural >

**Issue ID:** 7443358544
**Project:** oalethia-mobile
**Date:** 4/26/2026, 6:11:11 PM
## Issue Summary
EXC_BAD_ACCESS in Hermes GC during String Creation
**What's wrong:** Fatal **EXC_BAD_ACCESS** crash during **Hermes GC** operations.
**In the trace:** Concurrent **console error** noted regarding **Invalid JSON data: Data too long**.
**Possible cause:** The crash likely stems from an invalid memory access within the **Hermes Garbage Collector** during string allocation or young generation sizing.

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
**Value:** natural >
KERN_INVALID_ADDRESS at 0x50.

#### Stacktrace

```
 hermes::vm::HadesGC::updateYoungGenSizeFactor in unknown file [Line null] (In app)
 hermes::vm::HadesGC::youngGenCollection in unknown file [Line null] (In app)
 hermes::vm::HadesGC::allocSlow in unknown file [Line null] (In app)
 hermes::vm::GCBase::makeAVariable<T> in unknown file [Line null] (In app)
 hermes::vm::StringPrimitive::createEfficientImpl<T> in unknown file [Line null] (In app)
 facebook::hermes::(anonymous namespace)::HermesRuntimeImpl::createStringFromAscii in unknown file [Line null] (In app)
 facebook::jsi::Object::setProperty<T> in unknown file [Line null] (In app)
 facebook::jsi::Object::setProperty<T> in unknown file [Line null] (In app)
 facebook::react::TurboModuleConvertUtils::convertNSExceptionToJSError in unknown file [Line null] (In app)
 facebook::react::ObjCTurboModule::performVoidMethodInvocation in unknown file [Line null] (In app)
 std::__1::__function::__func<T>::operator() in unknown file [Line null] (Not in app)
 _dispatch_call_block_and_release in unknown file [Line null] (Not in app)
 _dispatch_client_callout in unknown file [Line null] (Not in app)
 _dispatch_lane_serial_drain in unknown file [Line null] (Not in app)
 _dispatch_lane_invoke in unknown file [Line null] (Not in app)
 _dispatch_root_queue_drain_deferred_wlh in unknown file [Line null] (Not in app)
```

## Thread:  Thread 1 (crashed)

#### Stacktrace

```
 hermes::vm::HadesGC::updateYoungGenSizeFactor in unknown file [Line null] (In app)
 hermes::vm::HadesGC::youngGenCollection in unknown file [Line null] (In app)
 hermes::vm::HadesGC::allocSlow in unknown file [Line null] (In app)
 hermes::vm::GCBase::makeAVariable<T> in unknown file [Line null] (In app)
 hermes::vm::StringPrimitive::createEfficientImpl<T> in unknown file [Line null] (In app)
 facebook::hermes::(anonymous namespace)::HermesRuntimeImpl::createStringFromAscii in unknown file [Line null] (In app)
 facebook::jsi::Object::setProperty<T> in unknown file [Line null] (In app)
 facebook::jsi::Object::setProperty<T> in unknown file [Line null] (In app)
 facebook::react::TurboModuleConvertUtils::convertNSExceptionToJSError in unknown file [Line null] (In app)
 facebook::react::ObjCTurboModule::performVoidMethodInvocation in unknown file [Line null] (In app)
 std::__1::__function::__func<T>::operator() in unknown file [Line null] (Not in app)
 _dispatch_call_block_and_release in unknown file [Line null] (Not in app)
 _dispatch_client_callout in unknown file [Line null] (Not in app)
 _dispatch_lane_serial_drain in unknown file [Line null] (Not in app)
 _dispatch_lane_invoke in unknown file [Line null] (Not in app)
 _dispatch_root_queue_drain_deferred_wlh in unknown file [Line null] (Not in app)
```
