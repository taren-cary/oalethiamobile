# EXC_BAD_ACCESS: DNOC > XTUM > ZTUM >

**Issue ID:** 7443345568
**Project:** oalethia-mobile
**Date:** 4/26/2026, 5:58:30 PM
## Issue Summary
EXC_BAD_ACCESS during Hermes property insertion
**What's wrong:** **EXC_BAD_ACCESS** crash deep inside **Hermes/LLVM** map insertion.
**In the trace:** All recent HTTP requests succeeded (200 OK); no immediate network failure context.
**Possible cause:** The crash occurs during property addition, possibly due to a **null or invalid pointer** being inserted into a **DenseMap** structure within Hermes.

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
**Value:** DNOC > XTUM > ZTUM >
KERN_INVALID_ADDRESS at 0x800000000000.

#### Stacktrace

```
 llvh::DenseMapBase<T>::InsertIntoBucket<T> in unknown file [Line null] (In app)
 llvh::DenseMapBase<T>::try_emplace<T> in unknown file [Line null] (In app)
 hermes::vm::WeakValueMap<T>::insertNew in unknown file [Line null] (In app)
 hermes::vm::HiddenClass::addProperty in unknown file [Line null] (In app)
 hermes::vm::JSObject::addOwnPropertyImpl in unknown file [Line null] (In app)
 hermes::vm::JSObject::addOwnProperty in unknown file [Line null] (In app)
 hermes::vm::JSObject::putComputedWithReceiver_RJS in unknown file [Line null] (In app)
 facebook::hermes::(anonymous namespace)::HermesRuntimeImpl::setPropertyValue in unknown file [Line null] (In app)
 facebook::jsi::Object::setProperty<T> in unknown file [Line null] (In app)
 facebook::jsi::Object::setProperty<T> in unknown file [Line null] (In app)
 facebook::react::TurboModuleConvertUtils::convertNSExceptionToJSError in unknown file [Line null] (In app)
 facebook::react::ObjCTurboModule::performVoidMethodInvocation in unknown file [Line null] (In app)
 std::__1::__function::__func<T>::operator() in unknown file [Line null] (Not in app)
 _dispatch_call_block_and_release in unknown file [Line null] (Not in app)
 _dispatch_client_callout in unknown file [Line null] (Not in app)
 _dispatch_lane_serial_drain in unknown file [Line null] (Not in app)
```

## Thread:  Thread 13 (crashed)

#### Stacktrace

```
 llvh::DenseMapBase<T>::InsertIntoBucket<T> in unknown file [Line null] (In app)
 llvh::DenseMapBase<T>::try_emplace<T> in unknown file [Line null] (In app)
 hermes::vm::WeakValueMap<T>::insertNew in unknown file [Line null] (In app)
 hermes::vm::HiddenClass::addProperty in unknown file [Line null] (In app)
 hermes::vm::JSObject::addOwnPropertyImpl in unknown file [Line null] (In app)
 hermes::vm::JSObject::addOwnProperty in unknown file [Line null] (In app)
 hermes::vm::JSObject::putComputedWithReceiver_RJS in unknown file [Line null] (In app)
 facebook::hermes::(anonymous namespace)::HermesRuntimeImpl::setPropertyValue in unknown file [Line null] (In app)
 facebook::jsi::Object::setProperty<T> in unknown file [Line null] (In app)
 facebook::jsi::Object::setProperty<T> in unknown file [Line null] (In app)
 facebook::react::TurboModuleConvertUtils::convertNSExceptionToJSError in unknown file [Line null] (In app)
 facebook::react::ObjCTurboModule::performVoidMethodInvocation in unknown file [Line null] (In app)
 std::__1::__function::__func<T>::operator() in unknown file [Line null] (Not in app)
 _dispatch_call_block_and_release in unknown file [Line null] (Not in app)
 _dispatch_client_callout in unknown file [Line null] (Not in app)
 _dispatch_lane_serial_drain in unknown file [Line null] (Not in app)
```
