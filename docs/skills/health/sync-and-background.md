---
name: sync-and-background
description: Use when tracking HealthKit changes across launches, responding to changes in the background, syncing health data to a server, handling deletions, or using anchored queries, observer queries, and the background-delivery entitlement.
---

# HealthKit Sync and Background Delivery

Anchored queries, observer queries, and sync identifiers are the three APIs you combine so your app handles HealthKit changes correctly without re-reading the whole store on every launch.

## When to Use

Use this skill when you're:
- Reading from HealthKit across app launches without re-reading the entire history every time
- Responding to HealthKit changes in the background without polling
- Syncing HealthKit data to a server without creating duplicates
- Handling sample deletions correctly, not just additions
- Adding the `com.apple.developer.healthkit.background-delivery` entitlement
- Deciding between `HKObserverQuery`, `HKAnchoredObjectQuery`, and their descriptor variants

## Example Prompts

Questions you can ask your assistant that will draw from this skill:

- "How do I stop re-reading every step sample on every app launch?"
- "I need to sync HealthKit to my server without duplicates — what's the pattern?"
- "My app still shows samples the user deleted in the Health app. How do I handle deletions?"
- "How do I wake my app when new heart rate samples arrive?"
- "Why isn't my observer query firing in the Simulator?"

## What This Skill Provides

### The Sync Architecture
- Why re-reading the whole store on every launch is wrong (battery, correctness, duplicates)
- How observer queries, anchored queries, and sync identifiers work together
- The three roles: observer query as the wake-up signal, anchored query as the payload, sync identifiers as the de-duplicator

### HKAnchoredObjectQuery Details
- Persisting `HKQueryAnchor` with `NSKeyedArchiver` (one anchor per type)
- The classic callback signature vs. the modern descriptor (`result(for:)` for one-shot, `results(for:)` for streaming)
- When to use the one-shot or the streaming variant
- A canonical delta-read implementation

### Observer Queries and Background Delivery
- Registering observer queries at app launch, not in a view's `onAppear`
- The three-strikes rule for the `HKObserverQueryCompletionHandler`
- Why you must always call the completion handler, including on error paths
- `HKUpdateFrequency` semantics on iOS vs. watchOS
- Why `HKCorrelationType` isn't supported for background delivery
- Why background delivery can't be tested in the Simulator

### Deletions — The Easy-to-Miss Piece
- `HKDeletedObject` semantics, and why an observer-only design leaves deleted samples in your local copy
- Why Apple's "deleted objects are temporary" warning matters when an app stays offline for weeks
- How to use metadata on deleted objects to clean up sync identifiers on your server

### Sync Identifiers
- `HKMetadataKeySyncIdentifier` and `HKMetadataKeySyncVersion`
- The conflict rule: a newer version replaces an older sample with the same identifier
- How to design identifiers that stay stable across devices and sessions

## Key Pattern

The canonical delta read, run at startup and from inside the observer's handler, replaces the naive "read everything on launch" approach.

```swift
let anchor = loadAnchor()  // nil on first launch

let predicate = HKSamplePredicate<HKQuantitySample>.quantitySample(
    type: HKQuantityType(.stepCount),
    predicate: nil
)

let descriptor = HKAnchoredObjectQueryDescriptor(
    predicates: [predicate],
    anchor: anchor
)

let result = try await descriptor.result(for: store)

apply(additions: result.addedSamples, deletions: result.deletedObjects)
try persist(anchor: result.newAnchor)  // save for next launch
```

It's the same three moves every time: load the anchor, fetch the delta, persist the new anchor. Deletions arrive in the same result as additions.

## Documentation Scope

This page documents the `sync-and-background` skill (in the `axiom-health` suite). The skill also holds a "what goes where" decision map, a pressure scenario that walks through a battery-drain fix, and a common-mistakes table.

## Related

- [Fundamentals](/skills/health/fundamentals) – Read first for `HKHealthStore` setup and the sample-type system
- [Authorization and Privacy](/skills/health/authorization-and-privacy) – Background reads fail without read authorization; read it before building any background workflow
- [Queries](/skills/health/queries) – The companion skill for foreground one-shot reads, which share these predicate patterns
- [Background Tasks and Networking on watchOS](/skills/watchos/background-and-networking) – Watch background task budgets that apply when you run this pattern on Apple Watch
- [Cloud Sync](/skills/persistence/cloud-sync) – Sync for app data that isn't health data; compare the trade-offs when designing a full sync stack

## Resources

**WWDC**: 2020-10184 (Synchronize health data with HealthKit)

**Docs**: /healthkit/executing-anchored-object-queries, /healthkit/executing-observer-queries, /healthkit/hkanchoredobjectquery, /healthkit/hkobserverquery, /healthkit/hkdeletedobject, /healthkit/hkanchoredobjectquerydescriptor, /healthkit/hkqueryanchor, /healthkit/hkupdatefrequency, /healthkit/hkmetadatakeysyncidentifier, /healthkit/hkmetadatakeysyncversion, /healthkit/hkhealthstore/enablebackgrounddelivery(for:frequency:withcompletion:), /bundleresources/entitlements/com.apple.developer.healthkit.background-delivery
