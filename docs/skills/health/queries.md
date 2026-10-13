---
name: queries
description: Use when reading or writing HealthKit data — choosing between sample, statistics, and statistics-collection queries; computing rollups; writing quantity and category samples; and modernizing callback code to async descriptors.
---

# HealthKit Queries and Sample Writes

Covers one-shot reads, rollups for charts, and writing new samples, plus the descriptor-based Swift Concurrency APIs that replace the old callback-based query classes.

## When to Use

Use this skill when you're:
- Reading data from HealthKit for a one-shot display (today's steps, most recent heart rate)
- Computing daily, hourly, or weekly rollups for charts
- Writing new `HKQuantitySample`, `HKCategorySample`, or `HKWorkout` samples to the store
- Choosing between `HKSampleQuery`, `HKStatisticsQuery`, `HKStatisticsCollectionQuery`, and their descriptor variants
- Modernizing callback-based query code to Swift Concurrency descriptors

## Example Prompts

Questions you can ask your assistant that will draw from this skill:

- "How do I fetch today's total step count with Swift Concurrency?"
- "I need daily calorie rollups for the last 30 days — which query should I use?"
- "Why is `stats.sumQuantity()` returning nil when I asked for an average?"
- "How do I save a weight measurement and make sure it's marked as user-entered?"
- "My `HKStatisticsCollectionQuery` doesn't work with workouts — what's the alternative?"

## What This Skill Provides

### Query Selection
- A decision tree for `HKSampleQuery` vs. `HKStatisticsQuery` vs. `HKStatisticsCollectionQuery`
- When to switch to Sync and Background instead (change tracking, background delivery)
- Why descriptors (iOS 15.4+) are preferred over the classic callback classes

### Canonical Patterns
- Reading raw samples with a predicate, sort, and limit
- A single aggregate over a window (total steps today)
- Rollups over intervals for a chart (daily steps, last 30 days)
- Writing quantity samples with metadata

### HKStatisticsOptions Rules
- Which accessor goes with which option (`.cumulativeSum` → `sumQuantity()`, `.discreteAverage` → `averageQuantity()`, and so on)
- Why cumulative and discrete options can't be combined
- Why `HKStatisticsCollectionQuery` accepts only quantity samples, and what to do for workouts or correlations

### Writes and Performance
- Batch save rules and sample-granularity recommendations
- Why samples are immutable, and how to "update" one by deleting and replacing it
- Memory-safe query practices (always narrow by date, and set a `limit:`)
- When to fall back to `HKAnchoredObjectQueryDescriptor` with pagination

## Key Pattern

Prefer async descriptors. They replace the callback-based query classes with typed, `Sendable` variants that inherit the caller's actor context.

```swift
let predicate = HKSamplePredicate<HKQuantitySample>.quantitySample(
    type: HKQuantityType(.stepCount),
    predicate: HKQuery.predicateForSamples(withStart: startOfDay, end: nil)
)

let descriptor = HKStatisticsQueryDescriptor(
    predicate: predicate,
    options: .cumulativeSum
)

let statistics = try await descriptor.result(for: store)
let steps = statistics?.sumQuantity()?.doubleValue(for: .count()) ?? 0
```

There's no completion handler and no manual `stop(query)` cleanup, and generic typing catches wrong-sample-type bugs at compile time.

## Documentation Scope

This page documents the `queries` skill (in the `axiom-health` suite). The skill also holds the full decision tree, an `HKStatisticsOptions` reference table, which accessors return nil for each option, and common mistakes.

- For the `HKWorkoutSession` and `HKLiveWorkoutBuilder` lifecycle, see [Workouts](/skills/health/workouts)

## Related

- [Fundamentals](/skills/health/fundamentals) – Read first for the `HKObjectType` hierarchy and the quantity-versus-category distinction
- [Authorization and Privacy](/skills/health/authorization-and-privacy) – Why an empty result can mean a denied read, and how authorization affects error handling
- [Sync and Background](/skills/health/sync-and-background) – The next step when one-shot reads aren't enough and you need to track changes
- [Swift 6 Concurrency](/skills/concurrency/swift-concurrency) – Actor isolation patterns that affect how you handle descriptor results
- [SwiftUI Architecture](/skills/ui-design/swiftui-architecture) – `@Observable` view models for rendering `HKStatisticsCollection` results in charts

## Resources

**WWDC**: 2020-10664 (Getting started with HealthKit), 2022-10005 (What's new in HealthKit)

**Docs**: /healthkit/reading-data-from-healthkit, /healthkit/queries, /healthkit/running-queries-with-swift-concurrency, /healthkit/hksamplequerydescriptor, /healthkit/hkstatisticsquerydescriptor, /healthkit/hkstatisticscollectionquerydescriptor, /healthkit/hkstatisticsoptions, /healthkit/hkstatistics, /healthkit/hkstatisticscollection, /healthkit/hksamplepredicate, /healthkit/saving-data-to-healthkit
