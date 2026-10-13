---
name: push-notifications
description: Push notification implementation — permission flow, token management, APNs payload design, categories, service extensions, communication notifications, Focus, Live Activity push, broadcast push, FCM gotchas
---

# Push Notifications

Remote and local notification patterns for iOS. Covers APNs setup, permission flow, token management, payload design, actionable and rich notifications, communication notifications, Focus, and push updates for Live Activities, including broadcast push.

## When to Use

Use this skill when you're:
- Setting up push notifications (APNs registration, entitlements)
- Deciding when and how to ask for notification permission
- Designing notification payloads (alert, sound, badge, custom data)
- Adding actionable notifications with categories and actions
- Building rich notifications with images or media (service extensions)
- Implementing communication notifications with avatars (iOS 15+)
- Working with Time Sensitive or Critical alerts
- Sending push updates to Live Activities, including broadcast push to large audiences (iOS 18+)
- Scheduling local notifications
- Integrating Firebase Cloud Messaging (FCM)

## Example Prompts

Questions you can ask your assistant that will draw from this skill:

- "How do I set up push notifications?"
- "When should I ask for notification permission?"
- "My push notifications aren't arriving"
- "How do I add images to push notifications?"
- "How do I handle notification tap actions?"
- "What are communication notifications?"
- "How do I update a Live Activity with push?"
- "How do I make notifications break through Focus mode?"

## What This Skill Provides

- **Permission flow** – Standard vs. provisional authorization, and asking in context rather than at launch
- **Token management** – Device token lifecycle, server sync, sandbox vs. production
- **Notification types** – A decision tree for alert, silent, communication, Time Sensitive, and Critical notifications
- **Payload design** – Content structure, localization, and the 4 KB size limit
- **Rich notifications** – Service extensions for media and end-to-end decryption
- **Categories and actions** – Actionable notification types and delegate handling
- **Foreground handling** – Presenting notifications that arrive while your app is open, which are otherwise dropped
- **Live Activity push** – Push token observation, APNs headers, and start, update, and end events
- **Broadcast push** – Channel-based Live Activity updates for large audiences (iOS 18+)
- **FCM as a provider** – The method-swizzling trap, APNs vs. FCM tokens, and auth key upload
- **Pressure scenarios** – Shipping under a deadline, pushes that work in development but not production, and Time Sensitive overuse

## Documentation Scope

This page documents the `push-notifications` skill (in the `axiom-integration` suite), which your assistant uses when you implement remote and local notifications.

## Related

- [push-notifications-diag](/diagnostic/push-notifications-diag) – Troubleshooting push delivery failures, token issues, and sandbox/production mismatches
- [push-notifications-ref](/reference/push-notifications-ref) – Complete APNs transport, payload format, and notification API reference, including testing with curl and `simctl`
- [live-activities](/skills/integration/live-activities) – Live Activity UI, attributes, and the Dynamic Island; this skill covers only their push transport
- [background-processing](/skills/integration/background-processing) – Background execution from silent push notifications
- [local-push-connectivity](/skills/integration/local-push-connectivity) – Push on networks APNs can't reach (restricted Wi-Fi, Ethernet, MCX slices)

## Resources

**WWDC**: 2021-10091, 2023-10025, 2023-10185, 2024-10069

**Docs**: /usernotifications, /usernotifications/unusernotificationcenter, /activitykit
