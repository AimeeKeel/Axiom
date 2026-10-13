---
name: push-notifications-diag
description: Notifications not arriving, token registration failed, works in dev not production, silent push throttled, rich media missing
---

# Push Notifications Diagnostics

Systematic troubleshooting for push notifications: delivery failures, token registration errors, sandbox and production mismatches, silent push throttling, and notification service extension problems.

## Symptoms This Diagnoses

Use when you're experiencing:
- Notifications not arriving at all
- Push works in development but not in production
- `didFailToRegisterForRemoteNotificationsWithError` fires
- Silent push not waking the app
- Rich notification shows plain text (missing media)
- Live Activity not updating via push
- Notifications stopped after an iOS update
- Notifications arrive without sound, or appear twice
- FCM works on Android but not iOS
- Badge count not clearing or updating
- Notification actions not appearing
- Delivery feels unreliable, and you're tempted to resend or poll

## Example Prompts

Questions you can ask your assistant that will invoke this diagnostic:

- "Why aren't my push notifications arriving?"
- "Push works in the simulator but not on device"
- "My notifications work in dev but not production"
- "Silent push notifications aren't waking my app"
- "Rich notification images aren't showing"
- "Live Activity push updates aren't working"
- "FCM push works on Android but not iOS"
- "How do I debug APNs delivery?"

## Diagnostic Workflow

Configuration, not code, is the usual culprit, so the diagnostic verifies entitlements and token registration before it looks at payloads or delivery. It starts with four mandatory steps:

1. **Verify push entitlements** – The Push Notifications capability, the provisioning profile, and the `aps-environment` value
2. **Check token registration** – Both registration callbacks, which must live in your `AppDelegate` (SwiftUI apps add one with `@UIApplicationDelegateAdaptor`)
3. **Validate the payload with curl** – Send it straight to APNs and read the status code, separating server problems from app problems
4. **Check authorization status** – Whether the user authorized, denied, or provisionally allowed notifications, and the alert, sound, and badge settings

Six decision trees then cover the common failures: no notifications at all, works in development but not production, silent push not waking the app, rich notification missing media, Live Activity not updating, and notifications stopped after an iOS update.

When delivery feels unreliable, the fix is APNs headers, not volume. Resending a push stacks duplicate banners and risks abuse flagging; `apns-expiration` holds a push for an offline device, and `apns-collapse-id` replaces an earlier notification instead of adding another.

The skill also walks through Apple's Push Notification Console, which sends test pushes and looks up delivery status without a server, and through testing in the Simulator with `simctl push`.

## Documentation Scope

This page documents the `push-notifications-diag` diagnostic skill (in the `axiom-integration` suite) — diagnostic workflows your assistant uses when helping you debug push notification issues. The skill file also holds a quick-reference table of APNs error codes, FCM-specific diagnostics, and pressure scenarios such as "the server team says it's an iOS problem".

## Related

- [push-notifications](/skills/integration/push-notifications) – Implementation patterns, the permission flow, and token management
- [push-notifications-ref](/reference/push-notifications-ref) – APNs transport, payload format, and notification API reference
- [extensions-widgets](/skills/integration/extensions-widgets) – Live Activity UI, widget timelines, and the Dynamic Island
- [simulator-tester](/agents/simulator-tester) – Sends test push payloads to the Simulator and captures the result
- [networking-diag](/diagnostic/networking-diag) – Network connectivity issues that can affect push delivery

## Resources

**WWDC**: 2021-10091, 2023-10025, 2023-10185

**Docs**: /usernotifications, /usernotifications/testing-notifications-using-the-push-notification-console
