---
name: swift-concurrency
description: Swift 6 strict concurrency patterns — progressive journey from single-threaded to concurrent code with @concurrent attribute (WWDC 2025), actor isolation, Sendable, async/await, and data race prevention
---

# Swift 6 Concurrency

A step-by-step path from single-threaded to concurrent Swift code. It covers Swift 6 strict concurrency, the `@concurrent` attribute (Swift 6.2+), actor isolation, and data race prevention.

## When to Use

Use this skill when you're:
- Starting a new project and choosing a concurrency strategy
- Debugging Swift 6 concurrency errors (actor isolation, data races, `Sendable`)
- Deciding when to introduce async/await and when to go fully concurrent
- Implementing `@MainActor` classes or async functions
- Choosing between `@MainActor`, `nonisolated`, `@concurrent`, and an actor
- Converting delegate callbacks to async-safe patterns
- Resolving "Sending 'self' risks causing data races" errors
- Moving CPU-intensive work off the main thread

> "Your apps should start by running all of their code on the main thread, and you can get really far with single-threaded code." — Apple

## Example Prompts

Questions you can ask your assistant that will draw from this skill:

- "I'm getting 'Sending self risks causing data races'. How do I fix this?"
- "When should I use @MainActor, nonisolated, or @concurrent?"
- "My UI freezes during image processing. How do I move it off the main thread?"
- "How do I make my type conform to Sendable?"
- "What's the difference between async/await and actual concurrency?"
- "How do I convert a delegate callback to async/await?"
- "When do I need an actor instead of just @MainActor?"
- "How do I report progress from a long async operation with ProgressManager?"

## What This Skill Provides

### The Progressive Journey
```
Single-Threaded → Asynchronous → Concurrent → Actors
     ↓                ↓             ↓           ↓
   Start here    Hide latency   Background   Move data
                 (network)      CPU work     off main
```

### Core Concepts
- `@MainActor` – Isolates code to the main thread (UI code)
- `nonisolated` – Opts out of actor isolation, so the caller decides where the work runs
- `nonisolated(nonsending)` (Swift 6.2+) – Keeps an async function on the caller's actor instead of switching to the global executor; it's the default once Approachable Concurrency is on, which new Xcode projects enable but Swift packages don't
- `@concurrent` (Swift 6.2+) – Forces an async function onto a background thread, the explicit spelling of the pre-6.2 default
- `Sendable` – Marks a type as safe to pass between threads
- **Actors** – Own isolated mutable state
- `ProgressManager` and `ProgressReporter` (OS 27) – `Sendable`, `@Observable` progress reporting for async work, with `~Copyable` `Subprogress` tokens for child operations

### Common Patterns
- 12 copy-paste patterns, including delegate value capture, weak self in stored tasks, task timeouts, and isolated protocol conformances
- Background access patterns for SwiftData, Core Data, and GRDB
- `Task { }`, `Task { @concurrent in }`, and `Task.detached`: what each inherits
- Default isolation for an app target (main actor) compared with a library (`nonisolated`)

### Error Resolution
A decision tree for the most common compiler errors, including:
- "Main actor-isolated property accessed from nonisolated context"
- "Capture of non-sendable type in @Sendable closure"
- "Value of non-Sendable type accessed after being transferred"
- "Reference to captured var in concurrently-executing code"
- "Type does not conform to Sendable"

### Xcode 26 and Later
- Main actor mode (Default Actor Isolation build setting)
- Approachable Concurrency defaults
- Isolated conformances
- A five-step migration from Swift 5 to Swift 6

## Key Pattern

### The Progressive Decision

```swift
// Step 1: Start single-threaded (default)
@MainActor
class ImageLoader {
    func loadImage() -> UIImage { ... }  // ✅ Start here
}

// Step 2: Add async when I/O blocks UI
@MainActor
class ImageLoader {
    func loadImage() async -> UIImage {
        let data = await network.fetch(url)  // ✅ Hides latency
        return UIImage(data: data)!
    }
}

// Step 3: Add @concurrent when CPU work freezes UI
@MainActor
class ImageLoader {
    @concurrent  // Swift 6.2+; requires an async function
    func processImage(_ data: Data) async -> UIImage {
        // ✅ Runs on a background thread
        return expensiveProcessing(data)
    }
}
```

## Documentation Scope

This page documents the `swift-concurrency` skill in the `axiom-concurrency` suite. The skill holds the full progressive journey, the copy-paste patterns, the error decision trees, and the migration steps your assistant uses to answer your questions.

- For exact API syntax (`TaskGroup`, `AsyncStream`, continuations, cancellation), see [Swift Concurrency Reference](/reference/swift-concurrency-ref)

## Related

- [concurrency-auditor](/agents/concurrency-auditor) – An agent that scans your code for concurrency violations
- [/axiom:audit concurrency](/commands/concurrency/audit-concurrency) – A quick scan for unsafe patterns
- [Runtime Isolation Crash Diagnostics](/diagnostic/isolation-inheritance-diag) – For a warning-free Swift 6 build that still crashes at runtime
- [concurrency-profiling](/skills/concurrency/concurrency-profiling) – Measure async performance and actor contention in Instruments
- [swift-performance](/skills/concurrency/swift-performance) – Language-level optimization once profiling points at your Swift code
- [swiftdata](/skills/persistence/swiftdata) – SwiftData's isolation rules for `ModelContext` and models

## Resources

**WWDC**: 2025-268, 2025-245, 2022-110351, 2021-10133, 2026-262

**Docs**: /swift/adoptingswift6, /swift/sendable, /foundation/progressmanager, /foundation/subprogress
