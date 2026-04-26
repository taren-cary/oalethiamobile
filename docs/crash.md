# EXC_BAD_ACCESS: Exception 1, Code 1, Subcode 5267567624 >

**Issue ID:** 7443305226
**Project:** oalethia-mobile
**Date:** 4/26/2026, 5:18:24 PM
## Issue Summary
EXC_BAD_ACCESS in Hermes VM during GC/Object Access
**What's wrong:** **EXC_BAD_ACCESS** crash during **Hermes GC** operation.
**In the trace:** User interaction (touches) preceded the crash, potentially triggering the faulty state.
**Possible cause:** The crash likely stems from accessing an invalid memory address (**KERN_INVALID_ADDRESS**) within the **Hermes VM** during garbage collection or object property lookup.

## Tags

- **app.device:** 635efaf5de5c9fb31785b8e882eb3342eaf4d731
- **device:** iPhone14,2
- **device.class:** high
- **device.family:** iOS
- **dist:** 55
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
- **release:** com.oalethia.oalethia@1.0.0+55
- **user:** id:CA66672F-2F9A-426D-B6EA-8D5CBFF3FB9F

## Exception

### Exception 1
**Type:** EXC_BAD_ACCESS
**Value:** Exception 1, Code 1, Subcode 5267567624 >
KERN_INVALID_ADDRESS at 0x139f8b408.

#### Stacktrace

```
 hermes::vm::GCScope::_newChunkAndPHV in unknown file [Line null] (In app)
 hermes::vm::objectPrototypeHasOwnProperty in unknown file [Line null] (In app)
 hermes::vm::objectPrototypeHasOwnProperty in unknown file [Line null] (In app)
 hermes::vm::NativeFunction::_nativeCall in unknown file [Line null] (In app)
 hermes::vm::functionPrototypeCall in unknown file [Line null] (In app)
 hermes::vm::NativeFunction::_nativeCall in unknown file [Line null] (In app)
 hermes::vm::Interpreter::handleCallSlowPath in unknown file [Line null] (In app)
 hermes::vm::Interpreter::interpretFunction<T> in unknown file [Line null] (In app)
 hermes::vm::Runtime::interpretFunctionImpl in unknown file [Line null] (In app)
 hermes::vm::JSFunction::_callImpl in unknown file [Line null] (In app)
 hermes::vm::Callable::executeCall3 in unknown file [Line null] (In app)
 hermes::vm::arrayPrototypeMap in unknown file [Line null] (In app)
 hermes::vm::NativeFunction::_nativeCall in unknown file [Line null] (In app)
 hermes::vm::Interpreter::handleCallSlowPath in unknown file [Line null] (In app)
 hermes::vm::Interpreter::interpretFunction<T> in unknown file [Line null] (In app)
 hermes::vm::Runtime::interpretFunctionImpl in unknown file [Line null] (In app)
```

## Thread: com.facebook.react.runtime.JavaScript (crashed)

#### Stacktrace

```
 hermes::vm::GCScope::_newChunkAndPHV in unknown file [Line null] (In app)
 hermes::vm::objectPrototypeHasOwnProperty in unknown file [Line null] (In app)
 hermes::vm::objectPrototypeHasOwnProperty in unknown file [Line null] (In app)
 hermes::vm::NativeFunction::_nativeCall in unknown file [Line null] (In app)
 hermes::vm::functionPrototypeCall in unknown file [Line null] (In app)
 hermes::vm::NativeFunction::_nativeCall in unknown file [Line null] (In app)
 hermes::vm::Interpreter::handleCallSlowPath in unknown file [Line null] (In app)
 hermes::vm::Interpreter::interpretFunction<T> in unknown file [Line null] (In app)
 hermes::vm::Runtime::interpretFunctionImpl in unknown file [Line null] (In app)
 hermes::vm::JSFunction::_callImpl in unknown file [Line null] (In app)
 hermes::vm::Callable::executeCall3 in unknown file [Line null] (In app)
 hermes::vm::arrayPrototypeMap in unknown file [Line null] (In app)
 hermes::vm::NativeFunction::_nativeCall in unknown file [Line null] (In app)
 hermes::vm::Interpreter::handleCallSlowPath in unknown file [Line null] (In app)
 hermes::vm::Interpreter::interpretFunction<T> in unknown file [Line null] (In app)
 hermes::vm::Runtime::interpretFunctionImpl in unknown file [Line null] (In app)
```
