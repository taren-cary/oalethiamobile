# EXC_BAD_ACCESS:  p@L_ >

**Issue ID:** 7443229595
**Project:** oalethia-mobile
**Date:** 4/26/2026, 4:12:47 PM
## Issue Summary
Hermes EXC_BAD_ACCESS during JS execution, possibly use-after-free.
**What's wrong:** **EXC_BAD_ACCESS** crash within **Hermes VM** during JavaScript execution.
**In the trace:** Crash occurred during React Native event loop processing after successful **HTTP requests**.
**Possible cause:** The crash points to an invalid memory access (**KERN_INVALID_ADDRESS**) likely due to **use-after-free** or accessing **uninitialized object** in Hermes.

## Tags

- **app.device:** 635efaf5de5c9fb31785b8e882eb3342eaf4d731
- **device:** iPhone14,2
- **device.class:** high
- **device.family:** iOS
- **dist:** 53
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
- **release:** com.oalethia.oalethia@1.0.0+53
- **user:** id:CA66672F-2F9A-426D-B6EA-8D5CBFF3FB9F

## Exception

### Exception 1
**Type:** EXC_BAD_ACCESS
**Value:**  p@L_ >
KERN_INVALID_ADDRESS at 0x61.

#### Stacktrace

```
 hermes::vm::JSObject::getNamedDescriptorUnsafe in unknown file [Line null] (In app)
 hermes::vm::JSObject::putNamedWithReceiver_RJS in unknown file [Line null] (In app)
 hermes::vm::JSObject::putNamedWithReceiver_RJS in unknown file [Line null] (In app)
 hermes::vm::arrayConstructor in unknown file [Line null] (In app)
 hermes::vm::NativeFunction::_nativeCall in unknown file [Line null] (In app)
 hermes::vm::Interpreter::handleCallSlowPath in unknown file [Line null] (In app)
 hermes::vm::Interpreter::interpretFunction<T> in unknown file [Line null] (In app)
 hermes::vm::Runtime::interpretFunctionImpl in unknown file [Line null] (In app)
 hermes::vm::JSFunction::_callImpl in unknown file [Line null] (In app)
 hermes::vm::Callable::executeCall1 in unknown file [Line null] (In app)
 hermes::vm::JSObject::putNamedWithReceiver_RJS in unknown file [Line null] (In app)
 hermes::vm::Interpreter::interpretFunction<T> in unknown file [Line null] (In app)
 hermes::vm::Runtime::interpretFunctionImpl in unknown file [Line null] (In app)
 hermes::vm::JSFunction::_callImpl in unknown file [Line null] (In app)
 facebook::hermes::(anonymous namespace)::HermesRuntimeImpl::call in unknown file [Line null] (In app)
 facebook::react::Task::execute in unknown file [Line null] (In app)
```

## Thread: com.facebook.react.runtime.JavaScript (crashed)

#### Stacktrace

```
 hermes::vm::JSObject::getNamedDescriptorUnsafe in unknown file [Line null] (In app)
 hermes::vm::JSObject::putNamedWithReceiver_RJS in unknown file [Line null] (In app)
 hermes::vm::JSObject::putNamedWithReceiver_RJS in unknown file [Line null] (In app)
 hermes::vm::arrayConstructor in unknown file [Line null] (In app)
 hermes::vm::NativeFunction::_nativeCall in unknown file [Line null] (In app)
 hermes::vm::Interpreter::handleCallSlowPath in unknown file [Line null] (In app)
 hermes::vm::Interpreter::interpretFunction<T> in unknown file [Line null] (In app)
 hermes::vm::Runtime::interpretFunctionImpl in unknown file [Line null] (In app)
 hermes::vm::JSFunction::_callImpl in unknown file [Line null] (In app)
 hermes::vm::Callable::executeCall1 in unknown file [Line null] (In app)
 hermes::vm::JSObject::putNamedWithReceiver_RJS in unknown file [Line null] (In app)
 hermes::vm::Interpreter::interpretFunction<T> in unknown file [Line null] (In app)
 hermes::vm::Runtime::interpretFunctionImpl in unknown file [Line null] (In app)
 hermes::vm::JSFunction::_callImpl in unknown file [Line null] (In app)
 facebook::hermes::(anonymous namespace)::HermesRuntimeImpl::call in unknown file [Line null] (In app)
 facebook::react::Task::execute in unknown file [Line null] (In app)
```
