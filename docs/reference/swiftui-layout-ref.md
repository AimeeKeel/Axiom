---
name: swiftui-layout-ref
description: Reference — Complete SwiftUI adaptive layout API guide covering ViewThatFits, AnyLayout, Layout protocol, onGeometryChange, GeometryReader, size classes, and iOS 26 window APIs
---

# SwiftUI Layout API Reference

The API reference for SwiftUI adaptive layout: choosing and building layouts, reading geometry, adapting to size classes and resizable windows, and the lazy container behavior that changed between iOS 26 and iOS 27.

## When to Use This Reference

Use this reference when you're:

- Building a layout that has to adapt across iPhone, iPad, and resizable windows
- Reaching for `GeometryReader` and unsure whether `onGeometryChange` or `containerRelativeFrame` is the better tool
- Deciding between size classes and real geometry for a width breakpoint
- Choosing between `.padding()`, `.safeAreaPadding()`, and `.ignoresSafeArea()`
- Diagnosing a scrolling list whose memory grows the longer the user scrolls, or whose rows forget their state

## Example Prompts

Questions you can ask your assistant that will draw from this reference:

- "How do I switch between a stack and a grid based on available width?"
- "Why is my `GeometryReader` collapsing to zero height inside a `ScrollView`?"
- "Should I use `horizontalSizeClass` or measure the width myself?"
- "When do I use `.safeAreaPadding()` instead of `.padding()`?"
- "My list's memory keeps climbing the further I scroll. What's holding it?"
- "My expanded rows collapse themselves after the user scrolls away and back."

## What's Covered

### Container Selection
- `ViewThatFits` – Automatic variant selection (iOS 16+)
- `AnyLayout` – Type-erased, animated layout switching (iOS 16+)
- `Layout` protocol – Custom layout algorithms, caches, and `LayoutValueKey` (iOS 16+)

### Geometry Reading
- `onGeometryChange` – Geometry reading without layout side effects (iOS 16+, backported)
- `GeometryReader` – Layout-phase geometry access, and why it needs a constraint (iOS 13+)
- Coordinate spaces – `.global`, `.local`, named and typed spaces
- `onScrollGeometryChange` and `ScrollGeometry` (iOS 18+)

### Safe Area
- `.padding()` vs `.safeAreaPadding()` vs `.ignoresSafeArea()`
- `.safeAreaInset(edge:)`
- Replacing manual `GeometryReader` safe area math

### Trait-Based Adaptation
- Size classes – `horizontalSizeClass` and `verticalSizeClass`, a coarse roomy-vs-constrained signal that follows the window
- Why an iPhone window's idiom stays `.phone` while its size classes change, and why injecting `.regular` backfires
- `dynamicTypeSize` and `isAccessibilitySize`
- `@ScaledMetric` – Dimensions that scale with Dynamic Type

### Alignment and Text Under Width Pressure
- `alignmentGuide` – Per-view guide adjustment within a stack (iOS 13+)
- Custom alignments – `AlignmentID` semantic lines that align views across nested containers
- `layoutPriority`, `lineLimit`, `truncationMode`, `allowsTightening`, `minimumScaleFactor` – Which text gives way, and how, when a window narrows

### Lazy Container Behavior
- Off-screen row lifetime – iOS 26 holds a visited row's state until you scroll back over it; iOS 27 releases rows continuously, whatever SDK you built against
- Per-row state loss – What survives a scroll-away on each cycle, and the two-part fix that covers both
- When not to use a lazy container

### Window APIs
- Resizable windows everywhere – iPhone apps resize too (iPhone Mirroring on a Mac, iPhone-only apps on iPad)
- `onInteractiveResizeChange` – Throttle work during a live resize drag (iOS 26+)
- Window size levers – `windowResizability` and `defaultSize`; `windowResizeAnchor(_:)` is a macOS-only view modifier, not a scene control
- Menu bar commands – iPad menu bar via `.commands`
- `NavigationSplitView` – Automatic and manual column visibility
- `scenePhase`

## Documentation Scope

This page documents the `layout-ref` skill (in the `axiom-swiftui` suite).

## Key Patterns

### ViewThatFits
```swift
ViewThatFits {
    HStack { content }  // First choice
    VStack { content }  // Fallback
}
```

### AnyLayout
```swift
let layout = isCompact
    ? AnyLayout(VStackLayout())
    : AnyLayout(HStackLayout())
layout { content }
    .animation(.default, value: isCompact)
```

### onGeometryChange
```swift
.onGeometryChange(for: CGSize.self) { proxy in
    proxy.size
} action: { size in
    self.containerSize = size
}
```

## Size Class Truth Table (iPad)

| Configuration | Horizontal | Vertical |
|--------------|------------|----------|
| Full screen (any) | `.regular` | `.regular` |
| 70% Split View | `.regular` | `.regular` |
| 50% Split View | `.regular` | `.regular` |
| 33% Split View | `.compact` | `.regular` |
| Slide Over | `.compact` | `.regular` |

**Key insight** A native iPad app goes horizontally `.compact` only at about a third of the screen: 33% Split View or Slide Over.

This table covers an app under its **native** iPad idiom. An iPhone app in a resizable window, whether through iPhone Mirroring on a Mac or as an iPhone-only app on iPad, keeps the `.phone` idiom, but its size classes follow the window. A wide window reports `.regular`, and system containers adapt on their own: a popover presents as a popover once there's room, and a sidebar-adaptable tab view set to prefer a sidebar shows one. Use size class for roomy-vs-constrained decisions and geometry (`onGeometryChange`) for finer breakpoints.

## Related

- [swiftui-layout](/skills/ui-design/swiftui-layout) – Adaptive layout patterns, decision guidance, and why injecting `.regular` backfires
- [swiftui-containers-ref](/reference/swiftui-containers-ref) – Choosing a stack, grid, or list in the first place
- [uikit-modernization](/skills/ui-design/uikit-modernization) – The UIKit side of resizable windows: scene geometry, `UIRequiresFullScreen` migration, and iPhone Mirroring
- [memory-debugging](/skills/debugging/memory-debugging) – Measuring peak rather than resting memory when a list's footprint climbs
- [swiftui-layout-auditor](/agents/swiftui-layout-auditor) – Scans your code for layout problems such as unconstrained `GeometryReader`
- [swiftui-performance-analyzer](/agents/swiftui-performance-analyzer) – Flags per-row `@State` under lazy containers

## Resources

**WWDC**: 2022-10056, 2023-10057, 2024-10074, 2025-208, 2026-278

**Docs**: /swiftui/layout, /swiftui/viewthatfits, /swiftui/lazyvstack, /swiftui/view/oninteractiveresizechange(_:), /swiftui/view/alignmentguide(_:computevalue:), /swiftui/alignmentid, /swiftui/view/layoutpriority(_:)
