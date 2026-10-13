---
name: background-and-networking
description: Use when scheduling watchOS background refresh, choosing between SwiftUI .backgroundTask and WKApplicationDelegate handle(_:), picking URLSession configurations, hitting ENETDOWN from NWConnection, or debugging EXC_CRASH (SIGKILL) after a background wake.
---

# Background Tasks and Networking on watchOS

Background refresh and `URLSession` on the watch, the rule in Apple's technote TN3135 that blocks low-level networking for most apps, the move to `BGTaskScheduler` in watchOS 27, and the task-completion contract that prevents mystery `SIGKILL` crashes.

## When to Use

Use this skill when you're:
- Picking between SwiftUI `.backgroundTask(_:action:)` and a WatchKit-style `handle(_:)` implementation
- Scheduling app refresh, with `BGTaskScheduler` on the 27 SDK or the legacy `scheduleBackgroundRefresh(withPreferredDate:userInfo:scheduledCompletion:)`
- Migrating WatchKit background scheduling to `BGTaskScheduler` (the WatchKit methods are deprecated in watchOS 27)
- Choosing between default, ephemeral, and background `URLSession` configurations on a Watch target
- Hitting `ENETDOWN` when starting `NWConnection` on watchOS and wondering why it "works in the simulator"
- Handling `WKURLSessionRefreshBackgroundTask` or `WKWatchConnectivityRefreshBackgroundTask` wake-ups
- Debugging `EXC_CRASH (SIGKILL)` crashes shortly after a background wake

## Example Prompts

Questions you can ask your assistant that will draw from this skill:

- "Why does NWConnection return ENETDOWN on my Apple Watch but work in the simulator?"
- "My watch app crashes with SIGKILL a minute after waking in the background. What's the cause?"
- "Should I use .backgroundTask or implement handle(_:) for my refresh?"
- "Which URLSession configuration should I use for a download that might outlive the app?"
- "My scheduled background refresh never fires. What am I missing?"
- "How do I move my watch app's background refresh to BGTaskScheduler?"

## What This Skill Provides

### URLSession Over Everything
- The TN3135 policy: `NWConnection`, `NWPathMonitor`, `URLSessionStreamTask`, `URLSessionWebSocketTask`, `NWBrowser`, `NetService`, and BSD sockets are blocked for normal apps
- The three narrow exceptions (background audio, VoIP with CallKit, tvOS pairing) and their minimum versions
- Why the simulator doesn't enforce the rule, which masks failures you'll only see on a device

### URLSession Configuration Matrix
- Default, ephemeral, and background configurations, and when each fits
- Why `URLSession.shared` is wrong for a transfer that might outlive the app
- Avoiding `Data(contentsOf:)` and other synchronous loaders, which watchOS doesn't support for network URLs

### BGTaskScheduler in watchOS 27
- `BGAppRefreshTaskRequest` with an `earliestBeginDate`, submitted with `submitTaskRequest`
- One identifier and one `.backgroundTask(.appRefresh("identifier"))` hook per refresh flow, each listed in `BGTaskSchedulerPermittedIdentifiers`
- What's deprecated (WatchKit scheduling, `userInfo` dispatch, the bare `.appRefresh`) and what's gone (manually scheduled snapshots)
- Processing, health research, and continued-processing task requests on the watch, and why building requires the Xcode 27 SDK even when you deploy back to watchOS 26

### SwiftUI `.backgroundTask` Before watchOS 27
- The bare `.appRefresh` hook, whose closure receives the scheduled `userInfo` string directly
- Wrapping long work in `withTaskCancellationHandler` so it cancels cleanly before the budget runs out

### The Delegate Path with `handle(_:)`
- Branching on `WKApplicationRefreshBackgroundTask`, `WKSnapshotRefreshBackgroundTask`, `WKURLSessionRefreshBackgroundTask`, and `WKWatchConnectivityRefreshBackgroundTask`
- Completing every task, the contract that prevents `EXC_CRASH (SIGKILL)`
- Using `expirationHandler` to move in-flight work into a background `URLSession` before suspension

### Background URLSession Wake-Up Flow
- The full sequence: the system wakes the app, `handle(_:)` receives the task, the session delegate callbacks fire, and then the task completes
- Moving the downloaded file out of its temporary location inside the delegate before returning

### Budget, Freshness, and Debugging
- What raises background priority (a complication on the active face, the app in the Dock) and what throttles it (workouts, navigation, low battery)
- Designing for missed refreshes, and always refreshing when the app comes to the foreground
- A fresh-data strategy table, from `URLSession` on the watch to widget push updates
- Testing over all three network routes the watch uses: the iPhone over Bluetooth, known Wi-Fi, and cellular
- A debugging checklist and a common-mistakes table

## Key Pattern

Every background task branch must reach `setTaskCompletedWithSnapshot(_:)`, and URLSession and Watch Connectivity tasks must complete **after** the session delegate finishes, not inside `handle(_:)`:

```swift
func handle(_ backgroundTasks: Set<WKRefreshBackgroundTask>) {
    for task in backgroundTasks {
        switch task {
        case let t as WKURLSessionRefreshBackgroundTask:
            savedURLSessionTasks.append(t)  // complete after session delegate fires
        case let t as WKWatchConnectivityRefreshBackgroundTask:
            savedWCTasks.append(t)          // complete after WCSession settles
        default:
            task.setTaskCompletedWithSnapshot(false)
        }
    }
}
```

A branch that never completes its task drains the background-time budget, and the app eventually crashes with `EXC_CRASH (SIGKILL)`.

## Documentation Scope

This page documents the `background-and-networking` skill (in the `axiom-watchos` suite), which your assistant draws on when you ask about `.backgroundTask`, `BGTaskScheduler`, background `URLSession`, TN3135 networking limits, or the task-completion contract.

- For general `URLSession` patterns beyond the watch's constraints, see [networking](/skills/integration/networking)

## Related

- [platform-basics](/skills/watchos/platform-basics) – The SwiftUI `.backgroundTask` hook in the `App` body, and when to adopt a delegate
- [watch-connectivity](/skills/watchos/watch-connectivity) – When the background wake is a Watch Connectivity delivery rather than a finished `URLSession` transfer
- [smart-stack-and-complications](/skills/watchos/smart-stack-and-complications) – Widget push updates, which replace some background-refresh flows
- [background-processing](/skills/integration/background-processing) – iOS-side `BGTaskScheduler` patterns; this skill covers what's specific to watchOS
- [swift-concurrency](/skills/concurrency/swift-concurrency) – `withTaskCancellationHandler` and cancellation semantics inside `.backgroundTask` closures

## Resources

**WWDC**: 2019-716

**Docs**: /technotes/tn3135-low-level-networking-on-watchos, /watchkit/using-background-tasks, /watchos-apps/making-background-requests, /watchos-apps/keeping-your-watchos-app-s-content-up-to-date, /swiftui/scene/backgroundtask(_:action:), /backgroundtasks/bgtaskscheduler, /backgroundtasks/bgapprefreshtaskrequest, /watchkit/wkapplication/schedulebackgroundrefresh(withpreferreddate:userinfo:scheduledcompletion:), /watchkit/wkrefreshbackgroundtask, /watchkit/wkurlsessionrefreshbackgroundtask, /foundation/urlsession, /foundation/urlsessionconfiguration/background(withidentifier:)
