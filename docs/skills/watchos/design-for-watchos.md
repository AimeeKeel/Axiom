---
name: design-for-watchos
description: Use when picking top-level navigation on watchOS (TabView verticalPage, NavigationSplitView, NavigationStack), placing toolbar buttons, adding full-color container backgrounds, designing for Always On, or auditing a watchOS 10+ app for Liquid Glass material consistency.
---

# Designing for watchOS

Design patterns for watchOS 10 and later: vertical scrolling with the Digital Crown, glanceable screens, toolbar placement, full-color backgrounds, and designing for the two brightness levels of Always On.

## When to Use

Use this skill when you're:
- Picking the right top-level navigation for a watchOS screen
- Placing toolbar buttons on the leading, trailing, or bottom bar
- Adding full-color or gradient backgrounds that flow through navigation bars and toolbars
- Designing screens for Always On without exposing sensitive data
- Reviewing a screen for glanceability and vertical scrolling
- Auditing a watchOS 10+ app for consistency with the watchOS 26 Liquid Glass materials

**Core principle:** Glanceable first, vertical by default, and the fewest taps to the destination. Design for two seconds of attention; anything that needs a third tap probably belongs on the iPhone.

## Example Prompts

Questions you can ask your assistant that will draw from this skill:

- "Should this watch screen use TabView or NavigationSplitView?"
- "How do I make the navigation bar and safe area share a background color?"
- "My gradient background cuts off at the nav bar. What's the fix?"
- "What do I need to change so my app looks right in Always On?"
- "Why does tab selection stop working when my detail view is a TabView?"

## What This Skill Provides

### Navigation Primitives
- A decision tree between `TabView(.verticalPage)`, `NavigationSplitView`, and `NavigationStack`, with when to avoid each
- Page-indicator behavior beside the Digital Crown
- The `Optional` tag gotcha when a `TabView` sits inside a `NavigationSplitView` detail
- `matchedGeometryEffect` for shared elements that move between pages

### Toolbar Placement Rules
- Capacity and behavior of `.topBarLeading`, `.topBarTrailing`, `.bottomBar` (up to three buttons), and `.primaryAction`
- Making a center button prominent with `.controlSize(.large)` and a capsule tint

### Full-Color Backgrounds
- When to use `containerBackground(_:for:)` instead of `.background(_:)`
- Gradient shorthand (`.blue.gradient`), and using color to communicate state, emotion, and a sense of place

### Materials and Liquid Glass
- Letting system materials supply vibrancy and blur instead of hand-rolled effects
- The four-step text hierarchy (`.primary` through `.quaternary`) and `.buttonStyle(.borderedProminent)` for prominent buttons
- What watchOS 26's refreshed toolbar and control styles change by default, and which custom styles need an audit

### Always On
- How the display behaves when your app is frontmost, inactive, running a background session, or suspended
- The two environment values that matter: `\.isLuminanceReduced` and `\.redactionReasons`
- `privacySensitive()` for blurring balances, health readings, and account numbers automatically
- Matching update cadence with `TimelineView` and `scenePhase`
- Previewing both appearances in Xcode, and why opting out with `WKSupportsAlwaysOnDisplay` is rare and usually wrong

### Common Mistakes
- A table of mistakes and fixes, from more than five vertical-page tabs to custom button styles that assume the watchOS 9 material

## Key Pattern

Use `containerBackground(_:for:)`, not `.background(_:)`, for colors that flow through navigation and toolbars inside a container:

```swift
.containerBackground(.blue.gradient, for: .tabView)
.containerBackground(.green.gradient, for: .navigation)
```

Without it, color stops at the content bounds and the navigation bar falls back to the system default.

## Documentation Scope

This page documents the `design-for-watchos` skill (in the `axiom-watchos` suite), which your assistant draws on when you ask about watchOS navigation, toolbars, backgrounds, materials, and Always On.

## Related

- [platform-basics](/skills/watchos/platform-basics) – App structure, the `@main` entry point, and delegate adoption
- [smart-stack-and-complications](/skills/watchos/smart-stack-and-complications) – Widget layouts on the watch face and in the Smart Stack
- [modernization](/skills/watchos/modernization) – Migrating custom styles and WatchKit screens to the current design
- [watchos-a11y](/skills/watchos/watchos-a11y) – watchOS-specific accessibility: the VoiceOver rotor, AssistiveTouch, and Double Tap
- [accessibility-diag](/diagnostic/accessibility-diag) – General VoiceOver, Dynamic Type, and contrast audits
- [swiftui-nav](/skills/ui-design/swiftui-nav) – Cross-platform `NavigationStack` and `NavigationSplitView` fundamentals the watchOS versions build on
- [swiftui-layout](/skills/ui-design/swiftui-layout) – Adaptive layout primitives used inside watchOS views

## Resources

**WWDC**: 2022-10051, 2022-10133, 2023-10031, 2023-10138

**Docs**: /watchos-apps/creating-an-intuitive-and-effective-ui-in-watchos-10, /watchos-apps/designing-your-app-for-the-always-on-state, /swiftui/tabview, /swiftui/navigationsplitview, /swiftui/navigationstack, /swiftui/timelineview, /swiftui/scenephase, /design/human-interface-guidelines/designing-for-watchos
