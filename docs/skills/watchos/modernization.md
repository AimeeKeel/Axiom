---
name: modernization
description: Use when migrating WatchKit storyboards to SwiftUI, consolidating dual-target projects to single-target, replacing ClockKit complications with WidgetKit, adding an iOS companion, or preparing a legacy watchOS app for the April 2026 submission gate.
---

# Modernizing a watchOS Project

Incremental migration of a legacy watchOS app along four axes (independence, a single target, SwiftUI, and WidgetKit complications) on the way to watchOS 26.

## When to Use

Use this skill when you're:
- Migrating a WatchKit storyboard and `WKExtensionDelegate` project to SwiftUI and `WKApplicationDelegate`
- Consolidating a Watch App plus WatchKit Extension dual-target project into a single target
- Replacing ClockKit complications with WidgetKit accessory widgets
- Adding an iOS companion to a watch-only project
- Planning an incremental migration because a full rewrite isn't viable
- Getting a legacy watchOS 6-era app ready for the April 2026 watchOS 26 SDK submission gate

## Example Prompts

Questions you can ask your assistant that will draw from this skill:

- "What's the safest order to modernize a watchOS 7 app that still uses storyboards and ClockKit?"
- "My ClockKit complications stopped updating after I shipped one WidgetKit complication. How do I fix this?"
- "Can I consolidate my HealthKit dual-target app into a single target?"
- "How do I keep my users' watch-face customization when migrating from ClockKit to WidgetKit?"
- "How do I add an iOS companion to my existing watch-only app?"

## What This Skill Provides

### The Four Modernization Axes
- Dependent to independent, because users expect the watch app to work without the iPhone
- Dual-target to single-target, with Xcode's Validate Settings consolidation tool
- WatchKit storyboards to SwiftUI: a full rewrite, or an incremental move through `WKHostingController`
- ClockKit to WidgetKit complications, and the partial-migration trap
- A recommended order and why it matters: build architecture first, then project shape, then UI, then independence and complications

### Dual-Target Consolidation
- The step-by-step Xcode workflow (Validate Settings, upgrade to a single target, reassign interface controller classes)
- What Xcode rewrites for you (`WKExtension` to `WKApplication`, the delegate rename, Info.plist merging), and why it matters now: the 27 SDK deprecates `WKExtension` and `WKExtensionDelegate` for deployment targets of watchOS 9.2 and later
- The watchOS 9.2 minimum for inheriting HealthKit authorization, and why a HealthKit app that supports watchOS 9.1 or earlier must stay dual-target

### ClockKit to WidgetKit
- The partial-migration trap: once WidgetKit provides any complication, the system stops calling every ClockKit callback
- The single-release migration rule, and the `CLKComplicationWidgetMigrator` setup that preserves watch-face customization
- The required `TimelineProvider` methods (`placeholder`, `getSnapshot`, `getTimeline`) and `WidgetBundle` packaging
- The budget change from ClockKit's per-data-source negotiation to WidgetKit's limit of up to 75 timeline reloads per day per complication

### Watch-Only to Watch Plus iOS Companion
- The one-way workflow: add an iOS target, follow the bundle ID prefix rule, embed the watchOS app, and set `WKCompanionAppBundleIdentifier`
- Flipping `WKWatchOnly` to `NO` on the Watch App target

### Submission and Common Mistakes
- The watchOS SDK and 64-bit (ARM64) requirements behind the April 2026 App Store gate
- A common-mistakes table, from a half-finished ClockKit migration to a companion bundle ID that isn't a prefix of the watch app's

## Key Pattern

The single most important rule, which Apple emphasizes: the moment your WidgetKit extension provides any complication, the system stops calling ClockKit callbacks on every user's device. Migrate every complication in one release, and ship `CLKComplicationWidgetMigrator` alongside it so watch-face customization survives the update.

## Documentation Scope

This page documents the `modernization` skill (in the `axiom-watchos` suite), which your assistant draws on when you migrate a legacy watchOS project. The skill includes the full consolidation checklist, a `CLKComplicationWidgetMigrator` example, and the migration-sequencing diagram.

- To catch leftover deprecated code after each axis (`WKExtensionDelegate`, `NavigationView`, an unmigrated `CLKComplicationDataSource`, leftover `WKHostingController` wrappers), use [modernization-helper](/agents/modernization-helper), or run [/axiom:modernize](/commands/debugging/modernize)

## Related

- [platform-basics](/skills/watchos/platform-basics) – The target shape after migration: a SwiftUI `App` with `WKApplicationDelegate` where needed
- [smart-stack-and-complications](/skills/watchos/smart-stack-and-complications) – The destination architecture for ClockKit migration, and RelevanceKit
- [design-for-watchos](/skills/watchos/design-for-watchos) – The watchOS 10 navigation model to aim for when you rebuild storyboard scenes
- [background-and-networking](/skills/watchos/background-and-networking) – The `BGTaskScheduler` migration for background refresh, also deprecated in the 27 SDK
- [controls-and-live-activities](/skills/watchos/controls-and-live-activities) – watchOS 26 control surfaces that legacy projects lack and are worth adopting after migration
- [swiftui-nav](/skills/ui-design/swiftui-nav) – `NavigationStack`, which replaces `NavigationView` once storyboards are gone
- [app-store-submission](/skills/shipping/app-store-submission) – SDK minimums and the rest of the App Store submission checklist

## Resources

**WWDC**: 2020-10177, 2022-10050, 2022-10051, 2023-10029

**Docs**: /technotes/tn3157-updating-your-watchos-project-for-swiftui-and-widgetkit, /widgetkit/converting-a-clockkit-app, /widgetkit/creating-accessory-widgets-and-watch-complications, /watchkit/wkapplication, /watchkit/wkapplicationdelegate, /swiftui/wkapplicationdelegateadaptor, /clockkit/clkcomplicationwidgetmigrator, /clockkit/clkcomplicationwidgetmigrationconfiguration, /clockkit/clkcomplicationstaticwidgetmigrationconfiguration, /clockkit/clkcomplicationintentwidgetmigrationconfiguration, /watchos-apps/creating-independent-watchos-apps
