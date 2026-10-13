---
name: extensions-widgets-ref
description: API reference for WidgetKit widgets, Control Center controls, and App Groups data sharing
skill_type: reference
version: 0.9
apple_platforms: iOS 14+, iPadOS 14+, watchOS 9+, macOS 11+, visionOS 26+
---

# Extensions & Widgets API Reference

API reference for WidgetKit widgets, Control Center controls, and the App Groups data sharing that connects them to your app. Use it when you need exact signatures, refresh rules, or platform limits.

## When to Use This Reference

Use this reference when you need:
- Complete API signatures for WidgetKit or Control Center controls
- Timeline configuration options and refresh policies
- The widget reload budget and what is exempt from it
- Interactive and configurable widget setup
- App Groups entitlement and data sharing specifics
- Platform differences for watchOS, visionOS, and the iPhone extra-large widget

## Example Prompts

Questions you can ask your assistant that will draw from this reference:

- "What are all the `TimelineReloadPolicy` options, and when should I use each?"
- "Why do 60 one-minute timeline entries still show the same data?"
- "How do I give a Control Center control async state with a `ControlValueProvider`?"
- "Which widget families does each platform support?"
- "How do I set up App Groups correctly for both targets?"
- "How do I update my widget from my server with a push notification?"
- "How do I bring an extra-large widget to the iPhone Home Screen in iOS 27?"

## What's Covered

### Standard Widgets (iOS 14+)
- Configuration types: `StaticConfiguration`, `AppIntentConfiguration`, `ActivityConfiguration`
- `TimelineProvider`: `placeholder`, `getSnapshot`, `getTimeline`
- `TimelineReloadPolicy`: `.atEnd`, `.after(date)`, `.never`
- Entries vs. reloads
- System and accessory (Lock Screen) widget families
- `systemExtraLargePortrait`, which brings the extra-large widget to the iPhone Home Screen (iOS 27, macOS 27)
- `WidgetCenter` reloads
- Reload budget (40–70 a day), budget-exempt cases, memory limits, images

### Interactive Widgets (iOS 17+)
- Interactivity is independent of configuration type
- `Button` and `Toggle` with App Intents
- `invalidatableContent`
- Animations: `contentTransition`, view transitions

### Configurable Widgets (iOS 17+)
- `WidgetConfigurationIntent`
- Entity and `EntityQuery` for dynamic options

### Control Center Controls (iOS 18+)
- `ControlWidget`, `StaticControlConfiguration`, `AppIntentControlConfiguration`
- `ControlWidgetButton` and `ControlWidgetToggle`
- `ControlValueProvider` for async state
- Configurable controls and refinements
- watchOS controls (watchOS 26+)

### Rendering and Platforms
- Accented rendering: `widgetAccentable()`, `WidgetAccentedRenderingMode`, container backgrounds
- Liquid Glass in widgets (iOS 26+)
- visionOS widgets (visionOS 26+): mounting styles, textures, proximity awareness
- Relevance widgets for the Smart Stack (iOS 18+)
- Push notification updates with `WidgetPushHandler` (iOS 26+)

### App Groups & Data Sharing
- Entitlement configuration
- Shared containers, `UserDefaults(suiteName:)`, Core Data
- Cross-process signals: background URL sessions, Darwin notifications
- SwiftData and GRDB in widgets

### Troubleshooting
- Widget not refreshing, data not shared, interactive button not working, performance
- Simulator vs. device, WidgetKit developer mode, `currentConfigurations()`

### Expert Review Checklist
- About 40 items covering architecture, performance, data and state, user experience, Liquid Glass, visionOS, controls, and testing

## Key Pattern

### Complete Widget Implementation

```swift
// Widget Configuration
@main
struct MyWidget: Widget {
    let kind = "MyWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
            MyWidgetView(entry: entry)
        }
        .configurationDisplayName("My Widget")
        .description("Shows app data.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

// Timeline Provider
struct Provider: TimelineProvider {
    func placeholder(in context: Context) -> SimpleEntry {
        SimpleEntry(date: Date(), data: "Placeholder")
    }

    func getSnapshot(in context: Context, completion: @escaping (SimpleEntry) -> Void) {
        completion(SimpleEntry(date: Date(), data: fetchFromCache()))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<SimpleEntry>) -> Void) {
        let data = fetchFromSharedDefaults()
        let entry = SimpleEntry(date: Date(), data: data)
        let timeline = Timeline(entries: [entry], policy: .after(Date().addingTimeInterval(3600)))
        completion(timeline)
    }
}
```

## Documentation Scope

This page documents the `extensions-widgets-ref` skill (in the `axiom-integration` suite), the API detail your assistant draws on for widgets, controls, and extensions. Live Activities and the Dynamic Island have their own reference, covered on the [live-activities](/skills/integration/live-activities) page.

## Related

- [extensions-widgets](/skills/integration/extensions-widgets) – Discipline skill with anti-patterns, decision trees, and debugging
- [app-intents-ref](/reference/app-intents-ref) – App Intents behind interactive and configurable widgets
- [swift-concurrency](/skills/concurrency/swift-concurrency) – Async patterns for loading widget data

## Resources

**WWDC**: 2026-277, 2025-278, 2024-10157, 2024-10098, 2023-10028, 2022-10184, 2022-10185

**Docs**: /widgetkit, /widgetkit/widgetfamily/systemextralargeportrait, /appintents
