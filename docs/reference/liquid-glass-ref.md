---
name: liquid-glass-ref
description: Liquid Glass adoption reference — app icons, controls, navigation, menus, windows, search, platform considerations
---

# Liquid Glass Reference

App-wide adoption reference for Liquid Glass, the material design system Apple introduced at WWDC 2025 for the 26 releases. It covers what changes automatically when you build with the new SDK, what to remove or update, and how each platform differs.

## When to Use This Reference

Use this reference when:
- Planning Liquid Glass adoption across your entire app
- Auditing existing interfaces for Liquid Glass compatibility
- Updating your app icon with Icon Composer
- Migrating from `UIBlurEffect`, `UIVisualEffectView`, or custom blurs
- Checking how Liquid Glass behaves on iPadOS, macOS, watchOS, tvOS, and visionOS
- Keeping Liquid Glass interfaces accessible
- Reviewing search, navigation, or layout components after the update

## Example Prompts

Questions you can ask your assistant that will draw from this reference:

- "What do I need to change to adopt Liquid Glass across my whole app?"
- "Which `UIBlurEffect` styles map to Regular glass, and which to Clear?"
- "How do I make my tab bar adapt to a sidebar on iPad?"
- "How does Liquid Glass differ on watchOS, tvOS, and visionOS?"
- "Can I keep the old look with `UIDesignRequiresCompatibility` after I move to the iOS 27 SDK?"

## What's Covered

### Visual Refresh
- What standard components adopt automatically
- Leaning on system frameworks instead of custom backgrounds
- Testing with accessibility settings
- Avoiding overuse of Liquid Glass

### App Icons
- Platform support and design principles
- Designing in layers with Icon Composer
- Previewing against the updated grids

### Controls
- Updated appearance, color, and crowding
- Scroll edge effects for legibility
- Aligning control shapes with containers
- New button styles (`.glass`, `.glassProminent`)

### Navigation
- Navigation layer vs. content layer
- Tab bar adapting to a sidebar, and minimizing on scroll
- Split views for sidebar and inspector layouts
- Content safe areas and the background extension effect

### Menus and Toolbars
- Cross-platform menu consistency and automatic menu icons
- Matching contextual menu actions to swipe actions
- Toolbar grouping, `ToolbarSpacer`, and morphing
- Accessibility labels for icons

### Windows and Modals
- Arbitrary window sizes on iPadOS
- Sheet corner radius, `presentationBackground` removal, inline action sheets

### Organization, Layout, and Search
- Row height, padding, and section header capitalization
- `.formStyle(.grouped)`
- Search keyboard layout and semantic search tabs

### Platform Considerations
- watchOS and tvOS adoption
- visionOS `glassBackgroundEffect()`
- Glass over a `ScrollView`

### Migration
- `UIBlurEffect` to Liquid Glass mapping
- Configuring the `Glass` material: `.regular`, `.clear`, `.identity`, tint, interactive
- `GlassEffectContainer`, `glassEffectID`, `glassEffectUnion`, and glass transitions
- Performance testing
- Backward compatibility with the `UIDesignRequiresCompatibility` opt-out, which the 27 SDK ignores on OS 27

### Checklists
- API checklist by area
- Audit checklist with 30 high-impact items

## Key APIs

```swift
// Glass effect (iOS, iPadOS, macOS, tvOS, watchOS 26; visionOS uses glassBackgroundEffect())
.glassEffect()
.glassEffect(.clear, in: .rect(cornerRadius: 16))

// Toolbar spacer between ToolbarItems (iOS 26+)
ToolbarSpacer(.fixed)

// Search field
.searchable(text: $query)

// Search tab
TabView {
    Tab("Inbox", systemImage: "tray") { InboxView() }
    Tab(role: .search) { NavigationStack { SearchView() } }
}
```

## Documentation Scope

This page documents the `liquid-glass-ref` skill (in the `axiom-design` suite), a reference without mandatory workflows. For implementing the material itself, design review guidance, and the full `UIDesignRequiresCompatibility` behavior across SDK and OS versions, use the [liquid-glass](/skills/ui-design/liquid-glass) skill.

## Related

- [swiftui-26-ref](/reference/swiftui-26-ref) – Every iOS 26 SwiftUI feature, including the Liquid Glass APIs
- [hig-ref](/reference/hig-ref) – Materials, shapes, and sheet button placement from the Human Interface Guidelines
- [audit-liquid-glass](/commands/ui-design/audit-liquid-glass) – Scans your code for Liquid Glass adoption opportunities

## Resources

**WWDC**: 2025-219, 2025-323

**Docs**: /TechnologyOverviews/liquid-glass, /TechnologyOverviews/adopting-liquid-glass, /design/Human-Interface-Guidelines/materials, /bundleresources/information-property-list/uidesignrequirescompatibility

**Sample Code**: /SwiftUI/Landmarks-Building-an-app-with-Liquid-Glass
