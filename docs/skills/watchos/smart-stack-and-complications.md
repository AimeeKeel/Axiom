---
name: smart-stack-and-complications
description: Use when building watch complications, adopting RelevanceKit for Smart Stack placement, choosing between timeline and relevant widgets, making widgets configurable, or adding APNs push updates on watchOS 26.
---

# Smart Stack and Complications

Watch complications, Smart Stack widgets, and the RelevanceKit signals that surface them at the right moment on Apple Watch.

## When to Use

Use this skill when you're:
- Building a watch complication in `accessoryCircular`, `accessoryRectangular`, `accessoryInline`, `accessoryCorner`, or `AccessoryWidgetGroup`
- Deciding between a timeline widget and a watchOS 26 relevant widget for Smart Stack placement
- Adopting RelevanceKit's `RelevantContext` together with WidgetKit's `WidgetRelevance` and `WidgetRelevanceAttribute`
- Making a widget or control configurable from the watch face or Smart Stack
- Sending APNs push updates to watch widgets on watchOS 26
- Deduplicating Smart Stack cards when a timeline widget and a relevant widget cover the same event
- Planning a ClockKit-to-WidgetKit complication migration

## Example Prompts

Questions you can ask your assistant that will draw from this skill:

- "How do I make my complication show up in the Smart Stack only when the user is near a beach?"
- "Should I use a timeline widget or a relevant widget for a calendar of upcoming surf sessions?"
- "My Smart Stack shows two cards for the same event — how do I deduplicate them?"
- "How do I make my watchOS 26 widget user-configurable?"
- "My ClockKit complication stopped updating after I added a WidgetKit complication. Why?"

## What This Skill Provides

### Surface Selection
- Decision table mapping primary purpose (action, info, bounded event) to control, widget, or Live Activity
- The four watchOS complication families plus `AccessoryWidgetGroup`, with placement and content guidance
- Why `accessoryCorner` appears only on the Infograph face, so you offer the other three families too

### RelevanceKit and Relevant Widgets on watchOS 26
- `RelevantContext` types, including the watchOS 26 date and MapKit point-of-interest contexts
- Which parts are RelevanceKit (`RelevantContext`) and which are WidgetKit (`WidgetRelevance`, `WidgetRelevanceAttribute`)
- The roles of `RelevanceEntry`, `RelevanceEntriesProvider`, and `RelevanceConfiguration`, compared with their timeline-widget equivalents
- Worked example building a beach-events relevant widget end to end
- Three-level preview pattern (view-only, provider + relevance, full provider)

### Timeline vs Relevant Widgets
- When each type fits (steady content vs multiple simultaneous cards)
- `associatedKind(_:)` for deduplicating overlapping timeline and relevant widgets in the Smart Stack
- Configurable widgets and controls on watchOS 26 — an empty recommendations array opts a widget in, and `AppIntentControlConfiguration` makes a control configurable

### Watch-Aware Integrations
- Free Smart Stack suggestions for HealthKit-recording workout apps (activity type, accurate times, `HKWorkoutRouteBuilder`)
- APNs widget push updates on watchOS 26 and when to prefer them over Watch Connectivity's 50/day complication budget
- A summary of the ClockKit-to-WidgetKit partial-migration trap (the full workflow is in the modernization skill)

## Key Pattern

Guard `RelevantContext.location(category:)`. It returns `nil` on devices that don't support the category, so force-unwrapping it crashes on those devices:

```swift
func relevance() async -> WidgetRelevance<Void> {
    guard let context = RelevantContext.location(category: .beach) else {
        return WidgetRelevance<Void>([])
    }
    return WidgetRelevance([WidgetRelevanceAttribute(context: context)])
}
```

## Documentation Scope

This page documents the `smart-stack-and-complications` skill in the `axiom-watchos` suite. The skill file contains comprehensive guidance your assistant uses when answering your questions, including the full RelevanceKit worked example and the common-mistakes table.

## Related

- [controls-and-live-activities](/skills/watchos/controls-and-live-activities) – Controls and Live Activities share Smart Stack real estate with widgets; the decision table helps pick the right surface
- [watch-connectivity](/skills/watchos/watch-connectivity) – `transferCurrentComplicationUserInfo` as a wake-on-change signal, and the 50/day transfer budget that makes APNs preferable for high-frequency updates
- [background-and-networking](/skills/watchos/background-and-networking) – Widget timeline refresh strategies within watchOS's networking and background constraints
- [modernization](/skills/watchos/modernization) – The full ClockKit-to-WidgetKit migration checklist, including the partial-migration trap
- [platform-basics](/skills/watchos/platform-basics) – Overall watchOS app structure and Info.plist keys
- [extensions-widgets](/skills/integration/extensions-widgets) – iOS-side widgets and general WidgetKit patterns shared with the watch
- [workouts](/skills/health/workouts) – Recording HealthKit workouts with the accurate activity type and times that earn Smart Stack suggestions

## Resources

**WWDC**: 2025-334, 2025-278, 2023-10029, 2023-10309, 2023-10027, 2022-10050, 2022-10051

**Docs**: /widgetkit/creating-accessory-widgets-and-watch-complications, /widgetkit/converting-a-clockkit-app, /widgetkit/relevanceconfiguration, /relevancekit, /relevancekit/relevantcontext

**Skills**: axiom-watchos, axiom-integration, axiom-health
