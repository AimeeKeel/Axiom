---
name: platform-basics
description: Use when starting a new watchOS app, choosing between watch-only/companion/independent models, setting up the @main entry point, adopting WKApplicationDelegate, or meeting the watchOS 26 SDK and ARM64 submission requirements in effect since April 2026.
---

# watchOS Platform Basics

Foundations of a modern watchOS app: project templates, the entry point, when you need an app delegate, and the submission requirements in effect since April 2026. Also covers adding Foundation Models to a watch app in watchOS 27.

## When to Use

Use this skill when you're:
- Starting a new watchOS app and choosing between watch-only, companion, and independent configurations
- Setting up the SwiftUI `@main` entry point with `App`, `WindowGroup`, and `NavigationStack`
- Meeting the watchOS 26 SDK and ARM64 submission rules in effect since April 2026
- Debugging types that behave differently on arm64 (`Float`, `Int`, pointer math)
- Adopting `WKApplicationDelegate` to handle workouts, Now Playing, extended runtime, or remote notifications
- Wiring a custom notification long-look with `WKNotificationScene` and `WKUserNotificationHostingController`
- Auditing `Info.plist` keys like `WKRunsIndependentlyOfCompanionApp` and `WKWatchOnly`
- Adding a Foundation Models feature, which runs on Private Cloud Compute, to a watch app (watchOS 27)

## Example Prompts

Questions you can ask your assistant that will draw from this skill:

- "Should my new watch app be independent, companion, or both?"
- "What do I need to fix to meet the watchOS 26 SDK and ARM64 submission requirements?"
- "Do I need a WKApplicationDelegate in a SwiftUI watchOS app?"
- "How do I add a custom long-look notification view on watchOS?"
- "Why is my watch app being rejected for architecture reasons?"
- "Can I use Foundation Models in my watch app?"

## What This Skill Provides

### Project Models and Templates
- The three valid target configurations (watch-only, paired companion, independent plus companion) and when to pick each
- Why independent plus companion is the recommended default for new work, and what an independent app must handle itself (sign-in, permission prompts, network data, push registration)
- The `Info.plist` keys that matter, and the two (`WKRunsIndependentlyOfCompanionApp`, `WKWatchOnly`) that distinguish the models

### Submission Requirements (April 2026)
- ARM64 (64-bit) support, required since April 2026
- Building with the watchOS 26 SDK or later, required since April 28, 2026
- What to verify before submission: build settings, device testing on Apple Watch Series 9, Series 10, or Ultra 2, and an arm64 audit of `Float`, `Int`, and pointer math

### App Entry Point and Scenes
- The canonical SwiftUI `@main` shape with `WindowGroup` and `NavigationStack`
- Adding `WKNotificationScene` for custom long-look notifications
- Why `NavigationView` is deprecated and what replaces it
- The SwiftUI hooks that replace delegate callbacks (`scenePhase`, `onContinueUserActivity`, `backgroundTask`)

### When You Still Need a Delegate
- The events SwiftUI doesn't expose: remote notification registration, workout configuration and recovery, extended runtime sessions, remote Now Playing activity, and `userInfo` from handoff or complications
- Wiring `WKApplicationDelegate` with `@WKApplicationDelegateAdaptor`
- Why an empty delegate added "just in case" is an anti-pattern

### Apple Intelligence on watchOS (watchOS 27)
- Foundation Models through Private Cloud Compute only, with no on-device text model on the watch
- The entitlement, availability gating, quota usage, async context size, and a non-AI fallback
- Beta caveats: Private Cloud Compute may not work in the simulator, `@Generable` enums fail to compile for watchOS, and decoding is greedy only

### Common Mistakes
- A table of mistakes, from a target left on `armv7k` to building a Watch app for an action an iPhone-side control already covers

## Key Pattern

The canonical SwiftUI-first watchOS entry point, with no storyboard and no WatchKit Extension:

```swift
import SwiftUI

@main
struct MyWatch_Watch_App: App {
    var body: some Scene {
        WindowGroup {
            NavigationStack {
                ContentView()
            }
        }
    }
}
```

Add `WKNotificationScene` only when a category needs a custom long-look. Add `@WKApplicationDelegateAdaptor` only when a specific event (workouts, APNs registration, Now Playing, extended runtime) requires it.

## Documentation Scope

This page documents the `platform-basics` skill (in the `axiom-watchos` suite), which your assistant draws on when you ask about watch project structure, entry points, and submission requirements.

- For Foundation Models depth (sessions, `@Generable`, tools, Private Cloud Compute), see [foundation-models-ref](/reference/foundation-models-ref)
- For App Store Connect submission specifics beyond the watchOS SDK requirement, see [app-store-submission](/skills/shipping/app-store-submission)

## Related

- [design-for-watchos](/skills/watchos/design-for-watchos) – Once the project builds, choosing the navigation primitive and designing for Always On
- [watch-connectivity](/skills/watchos/watch-connectivity) – Coordinating state with a companion iPhone app
- [background-and-networking](/skills/watchos/background-and-networking) – `.backgroundTask(_:action:)`, background `URLSession`, and the networking limits in technote TN3135
- [controls-and-live-activities](/skills/watchos/controls-and-live-activities) – Controls from iPhone apps that appear on the watch without a Watch app
- [modernization](/skills/watchos/modernization) – Migrating an existing WatchKit and ClockKit app to SwiftUI and WidgetKit
- [axiom-health](/skills/health/) – Recording workouts with HealthKit

## Resources

**WWDC**: 2022-10133, 2023-10138, 2024-10205, 2025-219, 2025-334, 2026-241

**Docs**: /watchos-apps/building_a_watchos_app, /watchos-apps/setting-up-a-watchos-project, /watchos-apps/creating-independent-watchos-apps, /swiftui/app, /swiftui/scene, /swiftui/windowgroup, /watchkit/wkapplicationdelegate, /swiftui/wkapplicationdelegateadaptor, /swiftui/wknotificationscene, /foundationmodels/privatecloudcomputelanguagemodel
