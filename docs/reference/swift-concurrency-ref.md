---
name: swift-concurrency-ref
description: Swift concurrency API reference — actors, Sendable, tasks, structured concurrency, async sequences, isolation, continuations, and migration from GCD
---

# Swift Concurrency Reference

An API reference for Swift's concurrency model: actors, `Sendable`, tasks, async sequences, continuations, and migration from GCD. It is the syntax lookup your assistant reaches for once you know which tool you need.

## When to Use This Reference

Use this reference when:
- Looking up actor definition syntax or reentrancy rules
- Implementing `Sendable` conformance for your types
- Creating task groups for parallel work
- Working with `AsyncStream` or a custom `AsyncSequence`
- Bridging callback-based APIs with continuations
- Migrating from `DispatchQueue` and `DispatchGroup` to actors and task groups
- Replacing `userInfo`-based notifications with typed messages

## Example Prompts

Questions you can ask your assistant that will draw from this reference:

- "How do I create a `TaskGroup` in Swift?"
- "What's the `AsyncStream` continuation API?"
- "How do I make a custom global actor?"
- "How do I convert a completion handler to async/await?"
- "What are the actor reentrancy rules?"
- "How do I make my class `Sendable`?"
- "What's the difference between `Task` and `Task.detached`?"
- "How do I run a block that ignores task cancellation in iOS 27?"
- "Why does my loop never exit inside `withTaskCancellationShield`?"

## What's Covered

Each part ends with a gotcha table of symptoms and fixes.

### Actors
- Actor definition, isolation rules, `nonisolated`, reentrancy
- Global actors, `@MainActor`, actor initializers
- Custom executors (`SerialExecutor`, `unownedExecutor`)

### Sendable
- Automatic conformance, `@Sendable` closures, `@unchecked Sendable`, conditional conformance
- `sending` parameters (SE-0430)
- `SWIFT_STRICT_CONCURRENCY` build settings
- Extracting Sendable snapshots from non-Sendable types

### Task Management
- `Task`, `Task.detached`, cancellation, `Task.sleep`, `Task.yield`, priority
- `withTaskCancellationShield` and `hasActiveCancellationShield` (Swift 6.4, 27 cycle)
- `@TaskLocal`, the timeout pattern, task retain cycles, `Thread.current` in Swift 6

### Structured Concurrency
- `async let`, `withTaskGroup`, `withThrowingTaskGroup`
- `withDiscardingTaskGroup` (iOS 17+)
- Task tree semantics, batching with bounded concurrency

### Async Sequences
- `AsyncStream`, `AsyncThrowingStream`, the continuation API, buffering policies
- Custom `AsyncSequence`, operators, built-in sequences

### Isolation
- `@MainActor` functions, `MainActor.run`, `MainActor.assumeIsolated`
- `nonisolated(unsafe)`, `@preconcurrency`
- `#isolation` and isolation capture in `Task` closures (SE-0420)

### Continuations
- `withCheckedContinuation`, `withCheckedThrowingContinuation`, the resume-exactly-once rule
- Bridging delegates, unsafe continuations
- Single-resume `Continuation` (Swift 6.4), with its 27.0–27.1 limitation

### Migration Patterns
- DispatchQueue to actor, DispatchGroup to TaskGroup, completion handler to async
- `@objc` delegates with `@MainActor`
- NotificationCenter, Timer and DispatchSemaphore to async equivalents
- Typed notifications (`MainActorMessage` / `AsyncMessage`, iOS 26+): replacing `userInfo` casting, observation-token lifetime, per-framework coverage

### Swift 6.4 Changes
- `await` inside `defer`
- The diagnostic for unstructured Tasks that swallow thrown errors

### API Quick Reference
- A table of common tasks and the Swift version each API requires

## Documentation Scope

This page documents the `swift-concurrency-ref` skill (in the `axiom-concurrency` suite), the API reference your assistant uses for Swift concurrency syntax and patterns. For when and why to reach for concurrency — the progressive journey, decision trees, `@concurrent` and isolated conformances — see [swift-concurrency](/skills/concurrency/swift-concurrency).

## Related

- [synchronization](/skills/concurrency/synchronization) – `Mutex`, `OSAllocatedUnfairLock` and atomics, for when you need locks instead of actors
- [assume-isolated](/skills/concurrency/assume-isolated) – synchronous actor access patterns
- [concurrency-profiling](/skills/concurrency/concurrency-profiling) – Instruments workflows for async performance
- [concurrency-auditor](/agents/concurrency-auditor) – scans your code for Sendable violations, missing isolation and other concurrency anti-patterns

## Resources

**WWDC**: 2021-10132, 2021-10134, 2022-110350, 2025-268

**Docs**: /swift/concurrency, /swift/actor, /swift/sendable, /swift/taskgroup
