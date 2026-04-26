# EXC_BAD_ACCESS: _serializableRef > _serializableRefdle/App` >

**Issue ID:** 7443352388
**Project:** oalethia-mobile
**Date:** 4/26/2026, 6:04:56 PM
## Issue Summary
JSI Property Setting Crash due to Invalid Reference
**What's wrong:** **EXC_BAD_ACCESS** crash within **Hermes/JSI** during property setting.
**In the trace:** Multiple successful **HTTP requests** preceded the crash; no immediate network failure correlation.
**Possible cause:** The crash likely stems from accessing an invalid memory address during **JavaScript object property assignment** via JSI, possibly due to a **stale reference** or **deserialization issue** in worklets.

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
**Value:** _serializableRef > _serializableRefdle/App` >
KERN_INVALID_ADDRESS at 0x1.

#### Stacktrace

```
 hermes::vm::IdentifierTable::getSymbolHandleFromPrimitive in unknown file [Line null] (In app)
 hermes::vm::JSObject::putComputedWithReceiver_RJS in unknown file [Line null] (In app)
 facebook::hermes::(anonymous namespace)::HermesRuntimeImpl::setPropertyValue in unknown file [Line null] (In app)
 facebook::jsi::Object::setPropertyValue in jsi.h [Line 1118] (In app)
 facebook::jsi::Object::setProperty<T> in jsi-inl.h [Line 140] (In app)
 facebook::jsi::Object::setProperty<T> in jsi-inl.h [Line 133] (In app)
 worklets::SerializableJSRef::newNativeStateObject in Serializable.h [Line 144] (In app)
 worklets::makeSerializableNumber in Serializable.cpp [Line 123] (Not in app)
 std::__1::function<T>::operator() in unknown file [Line null] (Not in app)
 facebook::hermes::(anonymous namespace)::HermesRuntimeImpl::HFContext::func in unknown file [Line null] (In app)
 hermes::vm::NativeFunction::_nativeCall in unknown file [Line null] (In app)
 hermes::vm::Interpreter::handleCallSlowPath in unknown file [Line null] (In app)
 hermes::vm::Interpreter::interpretFunction<T> in unknown file [Line null] (In app)
 hermes::vm::Runtime::interpretFunctionImpl in unknown file [Line null] (In app)
 hermes::vm::JSFunction::_callImpl in unknown file [Line null] (In app)
 hermes::vm::Callable::executeCall3 in unknown file [Line null] (In app)
```

## Thread: com.facebook.react.runtime.JavaScript (crashed)

#### Stacktrace

```
 hermes::vm::IdentifierTable::getSymbolHandleFromPrimitive in unknown file [Line null] (In app)
 hermes::vm::JSObject::putComputedWithReceiver_RJS in unknown file [Line null] (In app)
 facebook::hermes::(anonymous namespace)::HermesRuntimeImpl::setPropertyValue in unknown file [Line null] (In app)
 facebook::jsi::Object::setPropertyValue in jsi.h [Line 1118] (In app)
 facebook::jsi::Object::setProperty<T> in jsi-inl.h [Line 140] (In app)
 facebook::jsi::Object::setProperty<T> in jsi-inl.h [Line 133] (In app)
 worklets::SerializableJSRef::newNativeStateObject in Serializable.h [Line 144] (In app)
 worklets::makeSerializableNumber in Serializable.cpp [Line 123] (Not in app)
 std::__1::function<T>::operator() in unknown file [Line null] (Not in app)
 facebook::hermes::(anonymous namespace)::HermesRuntimeImpl::HFContext::func in unknown file [Line null] (In app)
 hermes::vm::NativeFunction::_nativeCall in unknown file [Line null] (In app)
 hermes::vm::Interpreter::handleCallSlowPath in unknown file [Line null] (In app)
 hermes::vm::Interpreter::interpretFunction<T> in unknown file [Line null] (In app)
 hermes::vm::Runtime::interpretFunctionImpl in unknown file [Line null] (In app)
 hermes::vm::JSFunction::_callImpl in unknown file [Line null] (In app)
 hermes::vm::Callable::executeCall3 in unknown file [Line null] (In app)
```
