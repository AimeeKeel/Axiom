---
name: controls-and-live-activities
description: Use when building watch controls for Control Center, Smart Stack, or the Ultra Action button, surfacing iOS Live Activities on Apple Watch, wiring Double Tap to primary actions, or choosing between static and App Intent control configurations.
---

# Controls and Live Activities on Apple Watch

Controls (buttons and toggles) and Live Activities on watchOS 26: where they appear, how to wire them, and how the watch relays an action to the iPhone when needed.

## When to Use

Use this skill when you're:
- Building a control that lands in Control Center, the Smart Stack, or the Apple Watch Ultra Action button
- Deciding whether an iPhone-only control covers your case or the Watch app needs its own `ControlWidget`
- Choosing between `StaticControlConfiguration` and `AppIntentControlConfiguration`
- Surfacing an existing iOS Live Activity on a paired Apple Watch
- Wiring Double Tap to the primary action on watchOS 11 and later
- Debugging a control that shows up in the gallery but fails to fire on the watch

## Example Prompts

Questions you can ask your assistant that will draw from this skill:

- "Why doesn't my iPhone control show up on Apple Watch?"
- "How do I build a configurable control that lets the user pick which timer to run?"
- "My Live Activity looks fine on iPhone but is illegible on the watch. What's wrong?"
- "Do I need a separate Watch app to put a control on Apple Watch?"
- "How do I make my control respond to Double Tap without extra wiring?"

## What This Skill Provides

### Surface Selection
- A decision table that matches what the user wants (toggle a setting, trigger an action, open the app, glance at information, follow a bounded event) to a control, widget, or Live Activity
- The two ways a control reaches the watch: shipped in the iPhone app (the action runs on the iPhone, and no Watch app is needed) or shipped in the Watch app
- Why controls whose action brings the iPhone app to the foreground are filtered out of watch placement, and the `OpenIntent` rule that follows

### Control Anatomy
- `ControlWidget`, plus `StaticControlConfiguration` or `AppIntentControlConfiguration`, plus an `AppIntent` or `SetValueIntent`
- Worked examples for a static toggle (with a system-managed `value`), a fire-and-forget button, and a watchOS 26 configurable control with `.promptsForUserConfiguration()`
- `WidgetBundle` order as gallery order, and why every control belongs in the one `@main` bundle
- Keeping control state in an App Group and calling `ControlCenter.shared.reloadControls(ofKind:)`, because the control runs in the widget extension's process, not the app's
- Intent files that need both the app and the extension in their target membership

### Double Tap
- Why `ControlWidgetToggle` and `ControlWidgetButton` get Double Tap for free
- `handGestureShortcut(.primaryAction)` for surfaces that aren't controls
- Keeping a tappable equivalent, because users can turn Double Tap off

### Live Activities on Watch
- The iPhone creates, updates, and ends Live Activities, and the watch displays them; the watch can't start its own
- Designing and testing the minimal presentation first, because the watch uses it most often
- `ActivityAttributes` structure, the `ActivityConfiguration` view layer, and the `NSSupportsLiveActivities` Info.plist key
- Constraints that apply on the watch too: an 8-hour active limit, a 4 KB payload cap, no network or location access inside the view, and image size limits
- Push updates through APNs, which reach the watch without any Watch Connectivity code

## Key Pattern

For a stateful control, treat `value` as read-only system input and update your model to match. Never set `value` yourself:

```swift
struct ToggleTimerIntent: SetValueIntent {
    static var title: LocalizedStringResource = "Productivity Timer"

    @Parameter(title: "Timer is running")
    var value: Bool

    func perform() async throws -> some IntentResult {
        TimerService.shared.setRunning(value)
        return .result()
    }
}
```

## Documentation Scope

This page documents the `controls-and-live-activities` skill (in the `axiom-watchos` suite), which your assistant draws on when you build watch controls or bring Live Activities to the watch. The skill includes a worked example for each control style, the full `ActivityConfiguration` pattern with Dynamic Island regions, and a common-mistakes table.

- For the App Intent protocols behind controls, see [app-intents-ref](/reference/app-intents-ref)

## Related

- [smart-stack-and-complications](/skills/watchos/smart-stack-and-complications) – Choosing between a widget, a control, and a Live Activity, and RelevanceKit
- [watch-connectivity](/skills/watchos/watch-connectivity) – Syncing control state with the paired iPhone when the watch holds the source of truth
- [watchos-a11y](/skills/watchos/watchos-a11y) – Double Tap as an accessibility interaction, alongside VoiceOver and AssistiveTouch
- [live-activities](/skills/integration/live-activities) – iOS-side ActivityKit setup, lifecycle, and the Dynamic Island presentations the watch reuses
- [extensions-widgets](/skills/integration/extensions-widgets) – The widget extension that hosts controls, and general App Intent patterns
- [push-notifications](/skills/integration/push-notifications) – The APNs token flow for pushing Live Activity updates that propagate to the watch

## Resources

**WWDC**: 2023-10027, 2023-10194, 2024-10098, 2024-10157, 2024-10205, 2025-334

**Docs**: /widgetkit/creating-controls-to-perform-actions-across-the-system, /widgetkit/staticcontrolconfiguration, /widgetkit/appintentcontrolconfiguration, /widgetkit/controlwidgetbutton, /widgetkit/controlwidgettoggle, /widgetkit/controlvalueprovider, /widgetkit/appintentcontrolvalueprovider, /appintents/appintent, /appintents/openintent, /appintents/setvalueintent, /activitykit, /activitykit/activityattributes, /activitykit/activity, /activitykit/starting-and-updating-live-activities-with-activitykit-push-notifications
