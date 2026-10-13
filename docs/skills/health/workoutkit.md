---
name: workoutkit
description: Use when composing or scheduling custom workouts for the Apple Watch Workout app — CustomWorkout, intervals, alerts, pacer workouts, pool swimming, scheduling with WorkoutScheduler, and previewing plans.
---

# WorkoutKit

Compose and schedule custom workouts that run in the Apple Watch Workout app. WorkoutKit complements, and is distinct from, the live-tracking `HKWorkoutSession` API.

## When to Use

Use this skill when you're:
- Creating custom or planned workouts for the Apple Watch Workout app
- Scheduling workouts to appear on the user's watch at specific times
- Building intervals, warmups, cooldowns, and pacer workouts
- Authoring pool swimming workouts with distance-and-time goals (iOS 18+)
- Previewing a workout from your app before the user runs it
- Composing a triathlon (`SwimBikeRunWorkout`) with contiguous activities

## Example Prompts

Questions you can ask your assistant that will draw from this skill:

- "How do I schedule a workout to appear on the user's watch tomorrow morning?"
- "What's the difference between WorkoutKit and HKWorkoutSession?"
- "How do I build a 6×400m interval workout with heart-rate alerts?"
- "How do I compose a pool swim workout that enforces a send-off interval?"
- "Why doesn't my scheduled workout appear on the watch?"

## What This Skill Provides

### WorkoutKit vs. HealthKit Workouts
- A side-by-side comparison of WorkoutKit plans and `HKWorkoutSession` live tracking
- When to use each: authoring vs. tracking, and the Workout app vs. your own app
- How they cooperate: author a plan, then query the resulting `HKWorkout` from HealthKit
- Platform reach: an iOS app can compose and schedule watch workouts without a companion watch app

### Composing Workouts
- The `CustomWorkout` structure: warmup, repeatable `IntervalBlock`s, cooldown
- `WorkoutStep` and `IntervalStep` with `.work` and `.recovery` roles
- `WorkoutGoal` types: `.open`, `.time`, `.distance`, `.energy`, `.poolSwimDistanceWithTime`
- Built-in shapes: `SingleGoalWorkout`, `PacerWorkout`, `SwimBikeRunWorkout`
- Nine `WorkoutAlert` types for heart rate, power, cadence, and speed (the shipping API has no "pace" alert)
- Checking alert compatibility with `WorkoutAlert.supports(activity:location:)`
- Which names from early WWDC 2023 sample code (`BlockStep`, `WarmupStep`, `CustomWorkoutComposition`) the shipping API replaced

### Scheduling and Previewing
- `WorkoutScheduler.shared` authorization, which is separate from HealthKit authorization
- Scheduling a `WorkoutPlan` with `schedule(_:at:)`, which takes `DateComponents` rather than a `Date`
- Scheduler limits: at most 15 scheduled plans, within ±7 days of now
- Listing, removing, and marking scheduled workouts complete
- Opening a plan immediately in the Workout app with `plan.openInWorkoutApp()`

### Swimming Workouts (iOS 18+)
- The `.poolSwimDistanceWithTime` goal for send-off-interval semantics
- Pool-length awareness: the watch converts your meters to laps at runtime

## Key Pattern

WorkoutKit plans and live sessions are different APIs with different purposes. You author a plan and hand it to the Workout app; a session runs inside your own app and collects sensor data directly. Conflating the two is the most common mistake.

```swift
// WorkoutKit: author a plan, then schedule it (or open it in the Workout app)
let plan = WorkoutPlan(.custom(workout))
// tomorrowMorning is DateComponents, not a Date; schedule(_:at:) doesn't throw
await WorkoutScheduler.shared.schedule(plan, at: tomorrowMorning)
```

## Documentation Scope

This page documents the `workoutkit` skill (in the `axiom-health` suite). The skill also holds complete composition, alert, scheduling, and swimming code, plus a common-mistakes table.

## Related

- [Workouts](/skills/health/workouts) – The complementary live-tracking API for workouts that run inside your own app
- [Authorization and Privacy](/skills/health/authorization-and-privacy) – The HealthKit permissions that cover WorkoutKit results; scheduler authorization is separate
- [Queries](/skills/health/queries) – Reading the `HKWorkout` the Workout app produces after a plan runs
- [Smart Stack and Complications](/skills/watchos/smart-stack-and-complications) – Smart Stack placement for your workout widgets

## Resources

**WWDC**: 2023-10016 (Build custom workouts with WorkoutKit), 2024-10084 (Build custom swimming workouts with WorkoutKit)

**Docs**: /workoutkit, /workoutkit/customizing-workouts-with-workoutkit, /workoutkit/customworkout, /workoutkit/singlegoalworkout, /workoutkit/pacerworkout, /workoutkit/swimbikerunworkout, /workoutkit/workoutplan, /workoutkit/workoutstep, /workoutkit/intervalblock, /workoutkit/intervalstep, /workoutkit/workoutgoal, /workoutkit/workoutalert, /workoutkit/workoutscheduler
