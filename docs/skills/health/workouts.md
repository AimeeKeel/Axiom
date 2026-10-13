---
name: workouts
description: Use when building live workout tracking with HKWorkoutSession and HKLiveWorkoutBuilder — session state machine, end sequence, recovery after termination, multi-device mirroring, multi-activity workouts, iOS 26 iPhone origination, Always On, and workout zones (iOS 27, watchOS 27).
---

# HealthKit Workouts

Live workout tracking with `HKWorkoutSession` and `HKLiveWorkoutBuilder`: collecting sensor data in your own app, saving a finished `HKWorkout`, and coordinating across Apple Watch and iPhone.

## When to Use

Use this skill when you're:
- Building a workout tracking app on watchOS, iOS, or iPadOS
- Deciding between a live session (`HKWorkoutSession`) and logging a finished workout after the fact
- Implementing pause and resume, multi-activity triathlons, or watch-to-iPhone mirroring
- Recovering an active workout after an app or process termination
- Adopting iOS 26's ability to start sessions on iPhone (previously watch-only)
- Supporting Always On display while a workout is running
- Querying historical `HKWorkout` and `HKWorkoutActivity` data
- Reading or tracking workout zones, the heart-rate and cycling-power effort bands, live or after the workout (OS 27)

## Example Prompts

Questions you can ask your assistant that will draw from this skill:

- "My workout isn't saving when the user taps Done — what's wrong?"
- "How do I recover an active workout session after my app is killed?"
- "What's the right way to transition from swim to bike in a triathlon workout?"
- "How do I mirror a watch workout to the iPhone companion app?"
- "How do I keep the workout view updating during Always On without draining the battery?"
- "How do I show time in each heart-rate zone after a run?" (OS 27)

## What This Skill Provides

### Session Lifecycle
- The six `HKWorkoutSessionState` values and what each means
- Why `.stopped` is not `.ended` — the most common bug
- The canonical end sequence: `stopActivity` → `.stopped` → `endCollection` → `finishWorkout` → `end`
- `prepare()` vs. `startActivity(with:)` for a fast start with warm sensors

### Setup and Data Collection
- Canonical `HKWorkoutSession` and `HKLiveWorkoutBuilder` setup for watchOS and iOS 26+
- Configuring `HKLiveWorkoutDataSource` (default types per activity, `enableCollection`, `disableCollection`)
- Delegate isolation: mark methods `nonisolated` and hop to `@MainActor` inside them
- Logging a past workout (from a server or manual entry) with a non-live `HKWorkoutBuilder`, not the deprecated `HKWorkout` initializers

### Recovery and Multi-Device
- `recoverActiveWorkoutSession` on watchOS and iOS 26+, each with its own entry point
- Watch-to-iPhone mirroring with `startMirroringToCompanionDevice`
- The 10-second iPhone wake budget, and why you register `workoutSessionMirroringStartHandler` at app launch
- Multi-activity workouts (triathlons) with `beginNewActivity` and `.transition` segments
- Reading per-activity statistics with `HKWorkoutActivity.statistics(for:)`

### Always On and Background
- The 1 Hz maximum refresh rate when the watch is locked
- Branching on `TimelineView`'s `mode == .lowFrequency` to show a simpler view
- The `workout-processing` background mode required on watchOS

### Workout Zones (OS 27)
- Zone breakdowns attached to every finished workout (`HKWorkoutZoneGroup`, `HKWorkout.zoneGroupsByType`), readable on every platform
- Live zone-change callbacks (`didUpdateWorkoutZone`, delivering an `HKLiveWorkoutZoneUpdate`) on iOS and watchOS
- Preferred vs. custom zone configuration with `HKWorkoutZoneConfiguration`
- Custom-zone gotchas: set them before `beginCollection`, and save them yourself, because HealthKit doesn't persist them

## Key Pattern

The end sequence is the single most load-bearing pattern in this skill. Calling `session.end()` too early loses the workout:

```swift
// 1. UI event finishes the workout:
session.stopActivity(with: .now)

// 2. Session delegate reacts to .stopped:
func workoutSession(_ session: HKWorkoutSession,
                    didChangeTo toState: HKWorkoutSessionState,
                    from fromState: HKWorkoutSessionState,
                    date: Date) {
    guard toState == .stopped, let builder = self.builder else { return }
    Task {
        try await builder.endCollection(at: date)
        let finishedWorkout = try await builder.finishWorkout()
        session.end()
    }
}
```

`.stopped` means "activity halted, builder still needs to finish". `.ended` is the terminal state.

## Documentation Scope

This page documents the `workouts` skill (in the `axiom-health` suite). The skill also holds the platform availability table, the full setup and recovery code, and a common-mistakes table.

## Related

- [Fundamentals](/skills/health/fundamentals) – `HKHealthStore` setup and the HealthKit type hierarchy
- [WorkoutKit](/skills/health/workoutkit) – The complementary API for planned and scheduled workouts that run in the Workout app instead of your own
- [Authorization and Privacy](/skills/health/authorization-and-privacy) – The read and write permissions workouts require, and their `Info.plist` purpose strings
- [Queries](/skills/health/queries) – Reading completed `HKWorkout` samples after the session ends
- [watchOS Platform Basics](/skills/watchos/platform-basics) – Watch-specific presentation (Always On, Smart Stack, background modes)
- [Swift 6 Concurrency](/skills/concurrency/swift-concurrency) – Actor isolation rules for session and builder delegate callbacks

## Resources

**WWDC**: 2021-10009 (Build a workout app for Apple Watch), 2022-10005 (What's new in HealthKit), 2023-10023 (Build a multi-device workout app), 2025-322 (Track workouts with HealthKit on iOS and iPadOS), 2026-207 (Deliver workout insights with HealthKit workout zones)

**Docs**: /healthkit/workouts-and-activity-rings, /healthkit/running-workout-sessions, /healthkit/hkworkoutsession, /healthkit/hkliveworkoutbuilder, /healthkit/hkliveworkoutbuilderdelegate, /healthkit/hkliveworkoutdatasource, /healthkit/hkworkoutconfiguration, /healthkit/hkworkout, /healthkit/hkworkoutactivity, /healthkit/hkhealthstore/recoveractiveworkoutsession(completion:), /healthkit/build-a-workout-app-for-apple-watch, /healthkit/building-a-workout-app-for-iphone-and-ipad, /healthkit/accessing-workout-zone-data, /healthkit/hkworkoutzonegroup, /healthkit/hkworkoutzoneconfiguration
