---
name: isolation-inheritance-diag
description: Diagnostic for warning-free Swift 6 builds that crash in production with _dispatch_assert_queue_fail or _swift_task_checkIsolatedSwift
skill_type: diagnostic
version: 1.0
---

# Runtime Isolation Crash Diagnostics

Systematic diagnostic for production crashes in a Swift 6 build with zero strict-concurrency warnings. Closures and methods silently inherit actor isolation from where they're defined, and when an SDK calls them on a different thread, a runtime isolation check traps.

## Symptoms This Diagnoses

Use when you're experiencing:

- Crash signature `_dispatch_assert_queue_fail` in `.ips`, MetricKit, or `xcsym crash` output
- Crash signature `_swift_task_checkIsolatedSwift` or `swift_task_checkIsolated`
- A warning-free Swift 6 build that ships clean but crashes in production
- A build silenced with `nonisolated(unsafe)` or blanket `@MainActor` that now crashes on device
- PhotoKit `PHPhotoLibrary.performChanges` blocks crashing when called from a `@MainActor` type
- Combine `.map` / `.filter` / `.sink` operators crashing when the publisher emits off-main
- `NotificationCenter.default.publisher(...).sink` crashing when notifications are posted from background threads
- Delegate methods on `@MainActor` classes (`AVAudioPlayerDelegate`, `WKNavigationDelegate`, `URLSessionDelegate`) crashing on a framework callback
- `PHPhotoLibraryChangeObserver` or `CLLocationManagerDelegate` conformance errors where the compiler's `@preconcurrency` fix-it produces a clean build that still crashes
- `MainActor.assumeIsolated` crashing when the caller turns out not to be on main
- Stale state or precondition failures after `await` inside actors (reentrancy)

## Example Prompts

- "Why does my warning-free Swift 6 build crash with `_dispatch_assert_queue_fail`?"
- "My Combine pipeline crashes when the publisher emits on a background thread"
- "Should I use `@Sendable in` or `.receive(on:)` to fix this isolation crash?"
- "`MainActor.assumeIsolated` is crashing — but my class is `@MainActor`, what's wrong?"
- "My PhotoKit `performChanges` block crashes but the build has zero warnings"
- "Xcode offers three fix-its for my `PHPhotoLibraryChangeObserver` error — which one is correct?"
- "Is `@preconcurrency` on a conformance a real fix or does it just hide the crash?"
- "I silenced my concurrency errors with `nonisolated(unsafe)` and now it crashes in production"

## Diagnostic Workflow

Your assistant walks through three steps.

### Step 1: Identify the Crash Signature

| Symbol | Meaning |
|--------|---------|
| `_dispatch_assert_queue_fail` | Code expected a specific dispatch queue, ran on a different one |
| `_swift_task_checkIsolatedSwift` | Code expected actor isolation, such as `@MainActor`, ran outside it |
| `swift_task_checkIsolated` | Runtime isolation guard tripped (same family) |

All three come from the same root cause: a closure or method inherited actor isolation from its enclosing context, then an SDK called it on a different thread. Static checking can't see through framework callbacks, so where isolation is ambiguous the compiler inserts a runtime check instead of an error. Zero warnings means the type system is satisfied, not that the runtime invariants hold.

### Step 2: Categorize the Pattern

| Symptom | Pattern |
|---------|---------|
| Closure passed to an SDK API or Combine operator crashes (`performChanges`, `.map`, `.sink`) | Pattern 1 — Closure isolation inheritance |
| Delegate method on a `@MainActor` class crashes when the framework calls it | Pattern 2 — Delegate isolation inheritance |
| `MainActor.assumeIsolated { ... }` line in the crash trace | Pattern 3 — `assumeIsolated` misuse |
| Precondition failure after `await` inside an actor | Pattern 4 — Actor reentrancy staleness |

### Step 3: Apply the Canonical Fix

Your assistant prescribes the specific fix for the pattern: an `@Sendable in` annotation, `.receive(on:)` placement, `nonisolated` plus `Task { @MainActor in }`, or re-checking state after `await`.

## Key Diagnostic Patterns

### Pattern 1 — Closure Isolation Inheritance

A closure defined inside a `@MainActor` context inherits that isolation, and the compiler injects a runtime assertion. When the SDK calls the closure on its own queue, the assertion fires.

```swift
// ❌ CRASHES — compiles with zero diagnostics
@MainActor
final class Deleter {
    var log: [String] = []
    func delete(_ assets: [PHAsset]) async throws {
        try await PHPhotoLibrary.shared().performChanges {
            // Inherits @MainActor; PhotoKit runs it on its own serial queue
            PHAssetChangeRequest.deleteAssets(assets as NSArray)
            self.log.append("deleted")
        }
    }
}

// ✅ FIX — @Sendable opts the block out of isolation inheritance;
// mutate isolated state after the await
try await PHPhotoLibrary.shared().performChanges { @Sendable in
    PHAssetChangeRequest.deleteAssets(assets as NSArray)
}
log.append("deleted")
```

For Combine, the position of `.receive(on:)` matters: it must come *before* any isolated operator, or those operators run on the upstream thread first.

### Pattern 2 — Delegate Methods Inherit Isolation Too

When a class is `@MainActor`, every method inherits that isolation, including delegate methods. SDKs that deliver callbacks on their own queues then trip the runtime check.

For nonisolated `@objc` protocols such as `PHPhotoLibraryChangeObserver` and `CLLocationManagerDelegate`, Swift 6 rejects the `@MainActor` conformance at compile time, and the trap is the fix-it menu. Two of its three options, `@preconcurrency` and an isolated conformance, build clean and still crash on device, because the compiler can't see the SDK's call site. Only `nonisolated` on the method is correct:

```swift
// ✅ nonisolated matches the protocol's real signature, then hop to the main actor
@MainActor
final class GalleryModel: NSObject, PHPhotoLibraryChangeObserver {
    nonisolated func photoLibraryDidChange(_ changeInstance: PHChange) {
        Task { @MainActor in self.apply(changeInstance) }
    }
}
```

The same applies to `AVAudioPlayerDelegate`, `WKNavigationDelegate`, `URLSessionDelegate`, and any SDK delegate that doesn't document main-thread delivery.

To move work *off* the main actor, use `Task { @concurrent in }` (Swift 6.2 and later) rather than `Task.detached`, which drops the task's priority and `@TaskLocal` values such as trace IDs.

### Pattern 3 — `MainActor.assumeIsolated` Misuse

`assumeIsolated` is a runtime assertion, not a thread hop. Using it as a synchronous alternative to `await MainActor.run` from arbitrary contexts crashes whenever the caller turns out not to be on main.

Use it only for legacy delegates documented to deliver on the main thread. For uncertain contexts, use `await MainActor.run { ... }`. Better still, reach first for escape hatches the compiler verifies, such as isolated conformances on Swift-native protocols, `sending` parameters, and `#isolation`.

### Pattern 4 — Actor Reentrancy State Staleness

After every `await` inside an actor method, other tasks can mutate the actor's state, so state read before the suspension may be stale. Re-check it after the `await`, or restructure to avoid the gap.

## Quick Reference

| Symptom | Fix | Time |
|---------|-----|------|
| Combine `.map` crashes before `.receive(on:)` | Move `.receive(on: .main)` before `.map`, or mark the `.map` closure `@Sendable` | 1 min |
| `NotificationCenter` `.sink` crashes when posted off-main | Add `.receive(on: DispatchQueue.main)` before `.sink` | 1 min |
| PhotoKit `performChanges { ... }` crashes from `@MainActor` | `performChanges { @Sendable in ... }`, then mutate state after the `await` | 2 min |
| Delegate method on a `@MainActor` class crashes | `nonisolated` method + `Task { @MainActor in }` | 3 min |
| `PHPhotoLibraryChangeObserver` conformance error | Take the `nonisolated` fix-it, never `@preconcurrency` | 3 min |
| `assumeIsolated` crashes | Replace with `await MainActor.run { }` | 2 min |
| Stale state after `await` in an actor | Re-check after suspension | 5 min |

Silencing errors with `nonisolated(unsafe)` or blanket `@MainActor` doesn't belong in this table: it deletes the compiler's evidence and moves the failure to a production crash.

## Testing Implication

These crashes surface only with **real SDK callbacks and background-thread publishers**. Unit tests that drive code synchronously on the main thread won't trigger them.

Add to your test plan:

- Post notifications from `DispatchQueue.global().async { NotificationCenter.default.post(...) }`
- Exercise location, audio, and network delegates on real devices, not just mocks
- Send Combine values on non-main schedulers

## Documentation Scope

This page documents the `isolation-inheritance-diag` diagnostic skill (in the `axiom-concurrency` suite) — systematic diagnostics for crashes that escape Swift 6's compile-time checks. The skill file holds the full decision tree, worked fixes for each SDK, and the anti-rationalizations your assistant uses to push back on shortcuts.

## Related

- [swift-concurrency](/skills/concurrency/swift-concurrency) – Core Swift 6 concurrency patterns (isolation rules, `@concurrent`)
- [swift-concurrency-ref](/reference/swift-concurrency-ref) – `nonisolated`, `@Sendable`, and isolation syntax reference
- [assume-isolated](/skills/concurrency/assume-isolated) – When `MainActor.assumeIsolated` is the right tool
- [combine-patterns](/skills/concurrency/combine-patterns) – Combine schedulers and `.receive(on:)` placement
- [photo-library](/skills/integration/photo-library) – PhotoKit patterns, including re-fetching stale assets inside `performChanges`
- [core-data](/skills/persistence/core-data) – Core Data threading model and `context.perform` patterns
- [crash-analyzer](/agents/crash-analyzer) – Automated symbolication that recognizes these crash signatures

## Resources

**WWDC**: 2024-10169 (What's new in Swift), 2025-268 (Embracing Swift concurrency)

**Docs**: /swift/sendable, /swift/mainactor, /coredata/nsmanagedobjectcontext/perform

**External**: Khoa Pham — "How to avoid Swift 6 concurrency crashes" (onmyway133.com)
