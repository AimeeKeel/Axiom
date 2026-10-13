# AlarmKit Reference

AlarmKit API reference for scheduling alarms and countdown timers that behave like the built-in Clock app's: they override Do Not Disturb and appear on the Lock Screen and in the Dynamic Island. AlarmKit ships in iOS 26; the skill's examples use iOS 26.1 APIs.

## When to Use This Reference

Use this reference when:
- Scheduling one-time, fixed-date, or repeating alarms with AlarmKit
- Building countdown timers with snooze, pause, and resume
- Requesting and observing alarm authorization
- Customizing the alert, countdown, and paused presentations
- Showing alarms in a Live Activity and the Dynamic Island
- Building alarm management UI in SwiftUI

## Example Prompts

Questions you can ask your assistant that will draw from this reference:

- "How do I schedule an alarm with AlarmKit?"
- "How does AlarmKit authorization work?"
- "How do I add a snooze button to my alarm?"
- "How do I show a countdown in the Dynamic Island for my timer?"
- "Why does scheduling throw `maximumLimitReached`?"
- "How can Siri act on alarms my app creates?"

## What's Covered

### Key Types
- `AlarmManager`, `Alarm` (`Schedule`, `CountdownDuration`, `State`)
- `AlarmButton`, `AlarmPresentation`, `AlarmAttributes`, `AlarmMetadata`

### Authorization
- `NSAlarmKitUsageDescription`
- `requestAuthorization()`, `authorizationState`, `authorizationUpdates`

### Scheduling
- `AlarmManager.AlarmConfiguration` with the `.alarm(...)` and `.timer(...)` factories
- One-time, fixed-date, and repeating alarms
- Countdown timers (`Alarm.CountdownDuration`) and snooze
- Custom stop and secondary actions (`stopIntent`, `secondaryIntent`)
- `appEntityIdentifier` for Siri and Apple Intelligence (iOS 27)

### Presentation
- Alert, countdown, and paused states
- Full three-state presentation

### Managing Alarms
- Countdown, pause, resume, stop, and cancel
- `maximumLimitReached`
- `alarmUpdates`

### Live Activities and SwiftUI
- `ActivityConfiguration` with `AlarmAttributes` and `AlarmPresentationState`
- An `@Observable` view model and alarm list view

### Best Practices
- Persisting alarm IDs, testing on a physical device, and detecting a fired one-time alarm

## Documentation Scope

This page documents the `alarmkit-ref` skill (in the `axiom-integration` suite), the API reference your assistant uses for AlarmKit. The skill holds the full API detail and code examples.

## Related

- [Extensions & Widgets Reference](/reference/extensions-widgets-ref) – the widget extension and ActivityKit setup that AlarmKit's Live Activity needs
- [Live Activities](/skills/integration/live-activities) – AlarmKit alarms render as Live Activities on the Lock Screen and in the Dynamic Island
- [App Intents Reference](/reference/app-intents-ref) – the intents behind custom stop and secondary actions, and the `AppEntity` an alarm can bind to

## Resources

**WWDC**: 2025-230

**Docs**: /alarmkit

**Skills**: axiom-integration
