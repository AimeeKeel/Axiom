---
name: watch-connectivity
description: Use when coordinating state between a paired iPhone and Apple Watch with WCSession — picking between updateApplicationContext, transferUserInfo, transferFile, transferCurrentComplicationUserInfo, and sendMessage, or debugging crashes after background wake-ups.
---

# Watch Connectivity

Coordinating data between an iPhone companion app and a watchOS app with `WCSession` — choosing the right transfer method, completing background tasks correctly, and designing for watches that sometimes have no iPhone at all.

## When to Use

Use this skill when you're:
- Picking between `updateApplicationContext`, `transferUserInfo`, `transferFile`, `transferCurrentComplicationUserInfo`, and `sendMessage`
- Setting up `WCSession` on both sides with a `WCSessionDelegate`
- Completing `WKWatchConnectivityRefreshBackgroundTask` correctly so the app doesn't burn its background budget
- Updating a watch complication from the companion iPhone app
- Handling Family Setup watches, independent apps, or LTE watches where the iPhone isn't always available
- Debugging data that doesn't arrive, arrives late, or crashes the watchOS app on wake

## Example Prompts

Questions you can ask your assistant that will draw from this skill:

- "Should I use `transferUserInfo` or `updateApplicationContext` for syncing messages?"
- "My watch app crashes at random times after a WatchConnectivity wake — what am I missing?"
- "How do I update a complication from the iPhone?"
- "Why does my paired watch show stale data when my iPhone is in a drawer?"
- "Does my independent watch app still need Watch Connectivity at all?"
- "`isReachable` is false — is my watch disconnected?"
- "How do I debug WatchConnectivity when Xcode can't stay attached to the watch?"

## What This Skill Provides

### Choosing a Transfer Method
- Side-by-side comparison of the five `WCSession` methods — queued vs latest-wins, wake-up behavior, rate limits
- Decision tree mapping the kind of data you're sending to the right API
- When `sendMessage` is appropriate (live only) versus when to switch to `transferUserInfo`

### Background Task Completion Contract
- The single most common Watch Connectivity crash pattern — failing to complete every `WKWatchConnectivityRefreshBackgroundTask`
- The retain-and-complete pattern: hold every task, then complete them once the session is activated and `hasContentPending` is `false`, checking in `handle(_:)` and again whenever KVO reports a change to either property

### Complication Updates from iPhone
- The 50-per-day budget for `transferCurrentComplicationUserInfo`, checked with `isComplicationEnabled` and `remainingComplicationUserInfoTransfers`, and the watchOS 27 fix that makes the method work with WidgetKit complications
- Why updating a widget requires an App Group between the watchOS app target and the widget target
- Triggering `WidgetCenter.shared.reloadTimelines(ofKind:)` after receipt

### What `isReachable` Actually Means
- It reports only whether the counterpart is available *right now* for interactive messaging — `false` is the expected value across ordinary lifecycle transitions, not evidence of a disconnected watch
- The two directions are asymmetric: from the iPhone it normally requires the watch app to be running; from the watch the iPhone app can often be woken in the background
- Why durable sync must never be gated on it, and which properties to check instead (`isPaired`/`isWatchAppInstalled` on iOS, `isCompanionAppInstalled` on watchOS)
- `iOSDeviceNeedsUnlockAfterRebootForReachability`, which explains a `false` reading when the iPhone hasn't been unlocked since it restarted
- Why `true` isn't a delivery guarantee either, so every `sendMessage` call needs an error handler

### Instrumenting the Connection
- A diagnostics screen for both apps — session state, reachability, companion-install flags, outstanding transfer counts, last message IDs, last `WCError`
- Four test buttons, one per delivery semantic, so a single tap separates "live channel down" from "durable pipeline broken"
- Payload envelopes (protocol version, message ID, creation time, originating build) and why every handler must be idempotent
- Logging on both sides and transferring the watch's log file to the iPhone for when Xcode can't stay attached
- Why queued user-info and file transfers must be verified on real paired hardware rather than in Simulator

### Designing for the Disconnected Watch
- Family Setup watches have no iPhone companion at all
- LTE watches with the iPhone asleep or out of range
- Fetching primary data over URLSession or CloudKit, with Watch Connectivity as an opportunistic layer on top

## Key Pattern

Watch Connectivity is an opportunistic optimization, never the primary data path:

```swift
// Primary path — always works
Task { try await api.fetchLatest() }

// Opportunistic optimization — queued, so don't gate it on isReachable
if WCSession.default.activationState == .activated {
    try? WCSession.default.updateApplicationContext([
        "lastSync": Date().timeIntervalSince1970
    ])
}
```

Apps that rely on `WCSession` as the primary source of fresh data show empty states on Family Setup watches and stale data when the iPhone is out of range.

## Documentation Scope

This page documents the `watch-connectivity` skill in the `axiom-watchos` suite. The skill file contains comprehensive guidance your assistant uses when answering questions about `WCSession`, transfer methods, and the background-task completion contract.

## Related

- [watch-device-diag](/diagnostic/watch-device-diag) – The other layer: getting Xcode to install, launch, and attach to the watch at all. Rule it out before you redesign `WCSession`
- [platform-basics](/skills/watchos/platform-basics) – Covers `WKRunsIndependentlyOfCompanionApp` and the independent-app configuration that reshapes Watch Connectivity expectations
- [background-and-networking](/skills/watchos/background-and-networking) – URLSession, background sessions, and TN3135 networking limits — the primary data path this skill builds on top of
- [smart-stack-and-complications](/skills/watchos/smart-stack-and-complications) – Where the complication payload ends up after `transferCurrentComplicationUserInfo` arrives
- [push-notifications](/skills/integration/push-notifications) – APNs setup, which widget push updates (watchOS 26+) build on when complication data changes more often than the transfer budget allows

## Resources

**WWDC**: 2021-10003, 2018-218

**Docs**: /watchconnectivity, /watchconnectivity/wcsession, /watchconnectivity/wcsessiondelegate, /watchconnectivity/transferring-data-with-watch-connectivity, /watchos-apps/keeping-your-watchos-app-s-content-up-to-date, /widgetkit/widgetcenter, /watchkit/wkwatchconnectivityrefreshbackgroundtask

**Skills**: axiom-watchos, platform-basics, background-and-networking, smart-stack-and-complications
