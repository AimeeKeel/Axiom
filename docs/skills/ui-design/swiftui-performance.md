---
name: swiftui-performance
description: SwiftUI performance optimization with the new SwiftUI Instrument in Instruments 26
skill_type: discipline
version: 1.1.0
apple_platforms: iOS 26+, iPadOS 26+, macOS Tahoe+
---

# SwiftUI Performance Optimization

Finding and fixing slow SwiftUI with the SwiftUI Instrument in Instruments 26. Covers long view body updates, unnecessary view updates, and the Cause & Effect Graph that shows which state change triggered them.

## When to Use

Use this skill when:
- Your app feels less responsive (hitches, hangs, delayed scrolling)
- Animations pause or jump
- Scrolling performance is poor
- Profiling shows SwiftUI is the bottleneck
- Views update more often than expected
- You need to understand which change caused a SwiftUI update

**Core principle:** Make sure your view bodies update quickly, and only when needed.

## Example Prompts

Questions you can ask your assistant that will draw from this skill:

- "My app has janky scrolling and animations are stuttering. How do I figure out if SwiftUI is the cause?"
- "I see orange and red bars in the SwiftUI Instrument showing long updates. How do I know what's causing them?"
- "Some views are updating way too often even though their data hasn't changed."
- "I have large data structures and complex view hierarchies. How do I optimize them?"
- "We have a performance deadline and I need to understand what's slow in SwiftUI."
- "My list's memory keeps climbing as I scroll on iOS 26. Is that a leak?"

## What This Skill Provides

### The SwiftUI Instrument (Instruments 26)
- Four track lanes: Update Groups, Long View Body Updates, Long Representable Updates, and Other Long Updates
- Color coding by duration: orange past 500 µs, red past 1,000 µs, and gray below both; start with the longest red bars
- The Cause & Effect Graph for tracing data flow
- Time Profiler integration for CPU analysis
- What an empty Update Groups lane during a slowdown tells you: the problem is outside SwiftUI

### Problem 1: Long View Body Updates
- Finding them in the Long View Body Updates lane, then in Time Profiler
- Common expensive work in a body: formatters, calculations, I/O, and image processing
- Caching and formatter reuse

### Problem 2: Unnecessary View Updates
- Counting updates and comparing against what you expect
- Tracing data flow with the Cause & Effect Graph
- Dependencies on a whole array or collection, and per-row view models that fix them
- `@Observable` dependency tracking and view identity
- Why the environment should hold only stable values

### Lazy Container Memory (iOS 26 vs iOS 27)
- Why a footprint that grows while scrolling on iOS 26 is not a leak, and why iOS 27 hides its cost from the resting figure
- Profiling the peak, not the memory gauge, when rows rebuild on scroll-back

### iOS 26 Framework Improvements
- Lists that load 6× faster (macOS, 100,000+ items) and update 16× faster
- Fewer dropped frames during fast scrolling
- Lazy loading inside nested `ScrollView`s

### Production Pressure
- When to profile instead of guessing
- A 25-minute diagnostic protocol built on one SwiftUI Instrument recording
- The time cost of guessing versus diagnosing, and verification before shipping

## Documentation Scope

This page documents the `swiftui-performance` skill (in the `axiom-swiftui` suite), which your assistant draws on when you diagnose hitches, long view body updates, or unnecessary re-renders.

- For automated scanning, use [swiftui-performance-analyzer](/agents/swiftui-performance-analyzer), or run [/axiom:audit-swiftui-performance](/commands/ui-design/audit-swiftui-performance)
- For the lazy container measurements and the fix that covers both cycles, see [swiftui-layout-ref](/reference/swiftui-layout-ref)

## Related

- [swiftui-debugging](/skills/ui-design/swiftui-debugging) – Views that don't update at all, preview crashes, and layout issues
- [performance-profiling](/skills/debugging/performance-profiling) – Time Profiler, Allocations, and general profiling workflows
- [memory-debugging](/skills/debugging/memory-debugging) – Reading peak memory and headroom when lazy rows rebuild
- [swiftui-26-ref](/reference/swiftui-26-ref) – Every iOS 26 SwiftUI change, including the performance improvements

## Resources

**WWDC**: 2025-256, 2025-306

**Docs**: /xcode/understanding-hitches-in-your-app, /xcode/understanding-hangs-in-your-app, /xcode/improving-your-app-s-performance, /xcode/understanding-and-improving-swiftui-performance
