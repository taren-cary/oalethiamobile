# EXC_BAD_ACCESS: Exception 1, Code 2, Subcode 4415438224 >

**Issue ID:** 7443334672
**Project:** oalethia-mobile
**Date:** 4/26/2026, 5:46:54 PM
## Issue Summary
Hermes EXC_BAD_ACCESS during JS Object Property Modification
**What's wrong:** Fatal **EXC_BAD_ACCESS** crash within **Hermes VM** during JavaScript object property addition.
**In the trace:** Crash occurred during **React Native event loop tick** processing microtasks.
**Possible cause:** The crash likely stems from attempting to modify an object property (**addOwnPropertyImpl**) on an object that has become **invalid or deallocated** in memory.

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
**Value:** Exception 1, Code 2, Subcode 4415438224 >
KERN_PROTECTION_FAILURE at 0x1072e3d90.

#### Stacktrace

```
 hermes::vm::JSObject::addOwnPropertyImpl in unknown file [Line null] (In app)
 hermes::vm::JSObject::addOwnProperty in unknown file [Line null] (In app)
 hermes::vm::JSObject::addOwnProperty in unknown file [Line null] (In app)
 hermes::vm::JSObject::defineOwnPropertyInternal in unknown file [Line null] (In app)
 hermes::vm::BoundFunction::initializeLengthAndName_RJS in unknown file [Line null] (In app)
 hermes::vm::BoundFunction::create in unknown file [Line null] (In app)
 hermes::vm::functionPrototypeBind in unknown file [Line null] (In app)
 hermes::vm::NativeFunction::_nativeCall in unknown file [Line null] (In app)
 hermes::vm::Interpreter::handleCallSlowPath in unknown file [Line null] (In app)
 hermes::vm::Interpreter::interpretFunction<T> in unknown file [Line null] (In app)
 hermes::vm::Runtime::interpretFunctionImpl in unknown file [Line null] (In app)
 hermes::vm::JSFunction::_callImpl in unknown file [Line null] (In app)
 hermes::vm::Callable::executeCall0 in unknown file [Line null] (In app)
 hermes::vm::Runtime::drainJobs in unknown file [Line null] (In app)
 facebook::hermes::(anonymous namespace)::HermesRuntimeImpl::drainMicrotasks in unknown file [Line null] (In app)
 facebook::react::RuntimeScheduler_Modern::performMicrotaskCheckpoint in unknown file [Line null] (In app)
```

## Thread: com.facebook.react.runtime.JavaScript (crashed)

#### Stacktrace

```
 hermes::vm::JSObject::addOwnPropertyImpl in unknown file [Line null] (In app)
 hermes::vm::JSObject::addOwnProperty in unknown file [Line null] (In app)
 hermes::vm::JSObject::addOwnProperty in unknown file [Line null] (In app)
 hermes::vm::JSObject::defineOwnPropertyInternal in unknown file [Line null] (In app)
 hermes::vm::BoundFunction::initializeLengthAndName_RJS in unknown file [Line null] (In app)
 hermes::vm::BoundFunction::create in unknown file [Line null] (In app)
 hermes::vm::functionPrototypeBind in unknown file [Line null] (In app)
 hermes::vm::NativeFunction::_nativeCall in unknown file [Line null] (In app)
 hermes::vm::Interpreter::handleCallSlowPath in unknown file [Line null] (In app)
 hermes::vm::Interpreter::interpretFunction<T> in unknown file [Line null] (In app)
 hermes::vm::Runtime::interpretFunctionImpl in unknown file [Line null] (In app)
 hermes::vm::JSFunction::_callImpl in unknown file [Line null] (In app)
 hermes::vm::Callable::executeCall0 in unknown file [Line null] (In app)
 hermes::vm::Runtime::drainJobs in unknown file [Line null] (In app)
 facebook::hermes::(anonymous namespace)::HermesRuntimeImpl::drainMicrotasks in unknown file [Line null] (In app)
 facebook::react::RuntimeScheduler_Modern::performMicrotaskCheckpoint in unknown file [Line null] (In app)
```
