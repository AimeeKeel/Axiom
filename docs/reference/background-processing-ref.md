---
name: background-processing-ref
description: Complete background task API reference for BGTaskScheduler, BGAppRefreshTask, BGProcessingTask, BGContinuedProcessingTask (iOS 26), beginBackgroundTask, and background URLSession
---

# Background Processing Reference

API reference for running work while your iOS app is in the background, from `BGTaskScheduler` registration through SwiftUI integration. It's for developers who need exact APIs, Info.plist keys, and limits, with code examples drawn from WWDC sessions.

## When to Use This Reference

Use this reference when you need:
- `BGTaskScheduler` registration and Info.plist configuration
- `BGAppRefreshTask` scheduling and handler patterns
- `BGProcessingTask` with power and network constraints
- `BGContinuedProcessingTask` (iOS 26+) for user-initiated work with progress UI
- `beginBackgroundTask` for finishing critical work as the app moves to the background
- A background `URLSession` for downloads that survive app termination
- Silent push notification handling
- SwiftUI `.backgroundTask` modifier patterns

## Example Prompts

Questions you can ask your assistant that will draw from this reference:

- "How do I register a BGTaskScheduler handler correctly?"
- "What's the difference between BGAppRefreshTask and BGProcessingTask?"
- "How do I use BGContinuedProcessingTask in iOS 26 for photo export?"
- "How do I set up a background URLSession that continues after app termination?"
- "What's the correct AppDelegate handler for background URLSession events?"
- "How do I use the SwiftUI backgroundTask modifier?"
- "How do I handle silent push notifications for background refresh?"
- "What are the LLDB commands to test background tasks?"

## What's Covered

- **`BGTaskScheduler` registration** – Info.plist configuration, handler registration timing, identifier matching
- **`BGAppRefreshTask`** – ~30-second runtime, scheduling with `earliestBeginDate`, `BGTaskScheduler.Error` cases, continuous refresh pattern
- **Async submission (iOS and tvOS 27)** – `submitTaskRequest(_:)`, which replaces the deprecated synchronous `submit(_:)`
- **`BGProcessingTask`** – Multi-minute runtime, `requiresExternalPower` and `requiresNetworkConnectivity`, progress checkpointing, CPU Monitor disabled while on external power
- **`BGContinuedProcessingTask` (iOS 26+, iOS only)** – User-initiated work with system progress UI, dynamic registration, wildcard identifiers, `.fail` and `.queue` strategies, mandatory progress reporting, GPU access
- **`beginBackgroundTask`** – ~30-second finalization window, prompt `endBackgroundTask` cleanup
- **Background `URLSession`** – Discretionary downloads, `sessionSendsLaunchEvents`, the AppDelegate handler, delegate lifecycle
- **Testing** – LLDB commands that simulate launch and expiration, Console filters, `getPendingTaskRequests`
- **System constraints** – The 7 scheduling factors, Low Power Mode, Background App Refresh status, thermal state
- **Silent push notifications** – Payload format, APNs priority, rate limiting, app-usage gating
- **SwiftUI integration** – `.backgroundTask(.appRefresh)` and `.backgroundTask(.urlSession)` modifiers, cancellation with Swift concurrency

## Documentation Scope

This page documents the `background-processing-ref` skill (in the `axiom-integration` suite), the API reference your assistant uses for background task APIs, configuration details, and implementation patterns.

## Related

- [background-processing](/skills/integration/background-processing) – Choosing the right task type, with decision trees and implementation guidance
- [background-processing-diag](/diagnostic/background-processing-diag) – Troubleshooting tasks that never run or get terminated, by symptom
- [energy](/skills/debugging/energy) – Keeping background work from draining the battery
- [swift-concurrency](/skills/concurrency/swift-concurrency) – The async/await and task cancellation patterns the SwiftUI modifier relies on

## Resources

**WWDC**: 2019-707, 2020-10063, 2022-10142, 2023-10170, 2025-227

**Docs**: /backgroundtasks, /backgroundtasks/bgtaskscheduler, /foundation/urlsessionconfiguration
