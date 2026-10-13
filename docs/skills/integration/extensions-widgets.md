---
name: extensions-widgets
description: Widgets and Control Center controls with correct timeline and data sharing patterns
skill_type: discipline
version: 0.9
apple_platforms: iOS 14+, iPadOS 14+, watchOS 9+
---

# Extensions & Widgets

Patterns for Home Screen, Lock Screen, and StandBy widgets and Control Center controls. Covers timeline management, data sharing between your app and its extensions, and the limits extensions run under.

> **Live Activities** (Dynamic Island, ActivityKit, push and broadcast updates) have their own page: [live-activities](/skills/integration/live-activities).

## When to Use

Use this skill when:
- You're implementing any widget (Home Screen, Lock Screen, StandBy, Control Center)
- A widget shows stale data or doesn't update
- A widget doesn't appear in the widget gallery
- Interactive widget buttons don't respond
- A Control Center control is unresponsive
- You need to share data between your app and a widget

**Mental model** Widgets are archived snapshots on a timeline, not live views. A widget renders, the system archives the result, and it displays that snapshot.

## Example Prompts

Questions you can ask your assistant that will draw from this skill:

- "My widget isn't updating even after I change data in the main app."
- "How do I share data between my app and widget?"
- "Widget shows old data even after I update the app."
- "Control Center control takes forever to respond."
- "Interactive widget button does nothing when tapped."
- "Widget gallery doesn't show my widget."

## What This Skill Provides

### Timeline Management
- `TimelineProvider` patterns (`getTimeline`, `getSnapshot`, `placeholder`)
- Reload budgets and timeline policies
- Manual reloads with `WidgetCenter`
- When widgets actually update

### Data Sharing
- App Groups entitlement setup
- Shared `UserDefaults` with a suite name
- Shared container URLs for files
- Why widgets can't see the main app's data directly

### Control Center Controls (iOS 18+)
- `ControlValueProvider` for async state
- A `previewValue` for instant fallback
- Control action handling

### Interactive Widgets (iOS 17+)
- App Intent integration
- `Button` and `Toggle` in widget views
- `perform()` implementation
- When the system reloads the tapped widget for you, and when you reload manually

### Common Anti-Patterns
- Network calls in the widget view (prefetch in the app, or fetch in `TimelineProvider`)
- Missing App Groups entitlement, or a different group ID in each target
- `UserDefaults.standard` instead of the shared suite
- Over-refreshing until the reload budget runs out
- Blocking calls in Control Center controls
- Missing `supportedFamilies()`, which keeps a widget out of the gallery

## Key Pattern

### Data Sharing Between App and Widget

```swift
// 1. Add App Groups entitlement to BOTH targets
// Capabilities → App Groups → group.com.yourapp.shared

// 2. Use shared UserDefaults (NOT .standard)
let sharedDefaults = UserDefaults(suiteName: "group.com.yourapp.shared")
sharedDefaults?.set(value, forKey: "myKey")

// 3. Reload widget after data changes
WidgetCenter.shared.reloadAllTimelines()

// ❌ WRONG — Widget can't see this
UserDefaults.standard.set(value, forKey: "key")
```

### Timeline Provider Pattern

```swift
struct Provider: TimelineProvider {
    func getTimeline(in context: Context, completion: @escaping (Timeline<Entry>) -> Void) {
        // ✅ Fetch data here (TimelineProvider has network access)
        let data = fetchFromSharedDefaults()

        let entry = SimpleEntry(date: Date(), data: data)
        let timeline = Timeline(entries: [entry], policy: .after(Date().addingTimeInterval(3600)))
        completion(timeline)
    }
}

// ❌ WRONG — Widget view has no network access
struct WidgetView: View {
    var body: some View {
        Text("").onAppear {
            URLSession.shared.data(from: url) // Won't work!
        }
    }
}
```

## Documentation Scope

This page documents the `extensions-widgets` skill (in the `axiom-integration` suite), which your assistant uses when you build widgets or Control Center controls.

## Related

- [live-activities](/skills/integration/live-activities) – Live Activities and the Dynamic Island, which share the widget extension and its App Groups setup
- [extensions-widgets-ref](/reference/extensions-widgets-ref) – Complete API reference, troubleshooting, and expert checklist
- [app-intents-ref](/reference/app-intents-ref) – App Intents for interactive widgets and controls
- [swift-concurrency](/skills/concurrency/swift-concurrency) – Async patterns for data fetching
- [swiftdata](/skills/persistence/swiftdata) – Using SwiftData with App Groups

## Resources

**WWDC**: 2025-278, 2024-10157, 2023-10028

**Docs**: /widgetkit, /widgetkit/adding-interactivity-to-widgets-and-live-activities
