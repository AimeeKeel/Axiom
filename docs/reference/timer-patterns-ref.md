---
name: timer-patterns-ref
description: Timer API reference — Timer, DispatchSourceTimer, Combine Timer.publish, AsyncTimerSequence, Task.sleep, LLDB debugging, and platform availability
---

# Timer Patterns Reference

An API reference for iOS timer mechanisms: `Timer`, `DispatchSourceTimer`, Combine's `Timer.publish`, `AsyncTimerSequence` from the swift-async-algorithms package, and `Task.sleep`.

## When to Use This Reference

Use this reference when:
- Looking up specific timer API syntax or parameters
- Understanding the `DispatchSourceTimer` lifecycle state machine
- Deciding between `Task.sleep` and a repeating timer
- Checking platform availability for timer APIs
- Debugging timer behavior with LLDB commands

## Example Prompts

Questions you can ask your assistant that will draw from this reference:

- "What's the API for `Timer.publish` in Combine?"
- "How do I schedule a `DispatchSourceTimer` with leeway?"
- "What RunLoop modes are available for `Timer`?"
- "How do I run a repeating async timer with `AsyncTimerSequence`?"
- "What's the platform availability for `AsyncTimerSequence`?"
- "Why won't my selector-based `Timer` compile inside an `async` function?"

## What's Covered

### Timer
- `scheduledTimer` (block and selector forms), `Timer.init` with `RunLoop.main.add(_:forMode:)`
- Which variants are unavailable from `async` contexts
- `tolerance`, RunLoop modes (`.default`, `.tracking`, `.common`)
- `invalidate()` and `isValid`

### DispatchSourceTimer
- `makeTimerSource`, the `.strict` flag
- `schedule` with `deadline` vs `wallDeadline`
- Event handlers and breaking retain cycles before `cancel()`
- `activate`, `suspend`, `resume`, `cancel` and the state machine's crash rules
- Leeway, and how it is clamped after the first fire

### Combine Timer
- `Timer.publish`, `autoconnect()`, manual `connect()`
- Cancellation through `AnyCancellable`
- `ObservableObject` integration

### AsyncTimerSequence
- The swift-async-algorithms package requirement
- `ContinuousClock` vs `SuspendingClock`
- Stopping with task cancellation; background polling

### Task.sleep
- One-shot delays vs repeating timers
- Retry with exponential backoff

### Debugging and Availability
- LLDB commands for `Timer`, `DispatchSourceTimer` and the run loop
- Platform availability matrix

## Documentation Scope

This page documents the `timer-patterns-ref` skill (in the `axiom-integration` suite), the API reference your assistant uses for timer syntax and lifecycle details. For decision trees, crash patterns and the `SafeDispatchTimer` wrapper — the "which timer should I use?" questions — see [timer-patterns](/skills/debugging/timer-patterns).

## Related

- [energy](/skills/debugging/energy) – timer tolerance and coalescing as an energy optimization
- [energy-ref](/reference/energy-ref) – timer efficiency APIs with WWDC code examples
- [memory-debugging](/skills/debugging/memory-debugging) – the timer retain cycle as a memory leak pattern

## Resources

**Docs**: /foundation/timer, /dispatch/dispatchsourcetimer, github.com/apple/swift-async-algorithms
