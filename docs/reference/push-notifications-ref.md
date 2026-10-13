---
name: push-notifications-ref
description: APNs HTTP/2 transport, JWT authentication, payload format, UNUserNotificationCenter API, service extensions, Live Activity push headers, broadcast push
---

# Push Notifications Reference

API reference for Apple Push Notification service (APNs) transport, notification payloads, and the UserNotifications framework. It covers authentication, payload structure, service extensions, local notifications, Live Activity push, and broadcast push.

## When to Use This Reference

Use this reference when you need:
- APNs HTTP/2 endpoint URLs, header fields, and response codes
- JWT (ES256) authentication setup and token refresh rules
- Payload structure details (`aps` dictionary, alert keys, interruption levels)
- `UNUserNotificationCenter` delegate method signatures
- `UNNotificationCategory` and `UNNotificationAction` configuration
- Service extension attachment types and size limits
- Local notification trigger types (time, calendar, location)
- Live Activity push header values for start, update, and end events
- Broadcast push channel setup (iOS 18+)
- Command-line testing with curl, JWT generation, and `simctl`

## Example Prompts

Questions you can ask your assistant that will draw from this reference:

- "What headers does APNs require for HTTP/2 requests?"
- "How do I generate a JWT for APNs authentication?"
- "What are the `aps` payload keys for interruption levels?"
- "What file types can I attach in a service extension?"
- "What are the size limits for notification attachments?"
- "How do I structure a Live Activity push update payload?"
- "What's the broadcast push channel API?"
- "How do I test push with curl from the command line?"

## What's Covered

- APNs HTTP/2 transport (endpoints, request format, headers, response codes)
- JWT authentication (ES256 signing, claims, token lifetime and refresh interval)
- Payload reference (`aps` dictionary, alert keys, critical alert sounds, interruption levels) with example payloads
- `UNUserNotificationCenter` API (authorization options and status, settings, delegate methods)
- Categories and actions (`UNNotificationCategory`, `UNNotificationAction`, action icons)
- Service extension API (`UNNotificationServiceExtension` lifecycle, attachment types and limits, `mutable-content`)
- Local notifications (time, calendar, and location triggers, and their limitations)
- Live Activity push (headers, event types, update, start, and end payloads, push-to-start and activity push tokens)
- Broadcast push API (iOS 18+ channel model, channel storage policies)
- Command-line testing (JWT generation, curl, Simulator push and payload files)

## Documentation Scope

This page documents the `push-notifications-ref` skill (in the `axiom-integration` suite), the API reference your assistant draws from when answering detailed push notification questions.

## Related

- [push-notifications](/skills/integration/push-notifications) – Implementation patterns, permission flow, and token management
- [push-notifications-diag](/diagnostic/push-notifications-diag) – Delivery failures, token mismatches, and sandbox vs. production issues
- [live-activities](/skills/integration/live-activities) – Live Activity lifecycle, Dynamic Island, and the update mechanisms these push headers drive
- [extensions-widgets-ref](/reference/extensions-widgets-ref) – WidgetKit reference, including widget updates by push notification

## Resources

**WWDC**: 2021-10091, 2023-10025, 2023-10185, 2024-10069

**Docs**: /usernotifications, /usernotifications/sending-notification-requests-to-apns, /usernotifications/generating-a-remote-notification, /activitykit
