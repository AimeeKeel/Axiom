---
name: swiftui-nav-ref
description: Comprehensive SwiftUI navigation API reference with NavigationStack, NavigationSplitView, and NavigationPath
version: 1.0.0
skill_type: reference
apple_platforms: iOS 16+, iOS 18+ (Tab/Sidebar), iOS 26+ (Liquid Glass), iOS 27 (prominent tab, crossFade transition)
---

# SwiftUI Navigation API Reference

The API reference for SwiftUI navigation: `NavigationStack`, `NavigationSplitView`, `NavigationPath`, deep linking, state restoration, tabs and sidebars, and Liquid Glass navigation.

## When to Use This Reference

Use this reference when you need:
- API signatures for `NavigationStack` or `NavigationSplitView`
- `NavigationPath` push, pop, and pop-to-root patterns
- Deep linking with URL routing
- State restoration with a Codable path and `SceneStorage`
- Tab and sidebar integration (iOS 18+)
- Liquid Glass navigation APIs (iOS 26+) or the iOS 27 additions
- A router or coordinator that keeps navigation testable

## Example Prompts

Questions you can ask your assistant that will draw from this reference:

- "What are all the `NavigationPath` methods for manipulating the stack?"
- "How do I register `navigationDestination(for:)` for multiple types?"
- "What's the complete pattern for a Codable `NavigationPath` with `SceneStorage`?"
- "How do I use `Tab` with a sidebar on iPad?"
- "How do I hide a tab without losing its navigation state?"
- "What Liquid Glass APIs are available for navigation bars?"
- "How do I use the iOS 27 prominent tab role or the cross-fade navigation transition?"

## What's Covered

### NavigationStack (iOS 16+)
- Initialization with and without a path binding
- Value-based `NavigationLink`
- `navigationDestination(for:)` for one or several types, and where to place it
- Anti-patterns: mixing `NavigationLink(destination:)` with `navigationDestination(for:)`, duplicate registrations

### NavigationPath
- Typed array vs type-erased `NavigationPath`
- `append`, `removeLast`, `count`, pop to root
- `CodableRepresentation` for persistence

### NavigationSplitView (iOS 16+)
- Two-column and three-column layouts
- A `NavigationStack` inside the detail column
- Column visibility control
- Automatic adaptation: selection becomes push and pop on iPhone

### Deep Linking
- `onOpenURL` and `URLComponents` parsing
- Popping to root before building a multi-step path

### State Restoration
- `SceneStorage` with a Codable path or navigation model
- Storing IDs rather than objects, so deleted items drop out on restore
- Making a `@MainActor` model Codable

### Tabs and Sidebars (iOS 18+)
- `Tab` syntax, per-tab `NavigationStack`, `TabSection`
- `sidebarAdaptable` style
- The search tab role, and where `.searchable` can go
- Tab customization: `customizationID`, `customizationBehavior`, `defaultVisibility`, `TabViewCustomization`
- Tab context menus
- Programmatic visibility with `.hidden(_:)`, which keeps a tab's state

### Liquid Glass (iOS 26+)
- Automatic glass navigation bars, sidebars, and tab bars
- `backgroundExtensionEffect`
- `tabBarMinimizeBehavior`
- Bottom-aligned search, and `tabViewSearchActivation`
- `tabViewBottomAccessory` (dynamic `isEnabled:` form from iOS 26.1) and `tabViewBottomAccessoryPlacement`
- Scroll edge effect
- Sheets that zoom out of the button that presents them
- Toolbar morphing transitions

### iOS 27 Additions
- Prominent tab role (`Tab(role: .prominent)`)
- Cross-fade navigation transition (`.navigationTransition(.crossFade)`, not macOS)
- Why custom navigation transitions can't be authored

### Router and Coordinator Patterns
- When a coordinator earns its keep, and when built-in navigation is enough
- A simple `Router`, a `Coordinator` protocol, and unit-testing navigation

### API Evolution
- `NavigationView` (soft-deprecated, with no compiler warning)
- `NavigationStack` and `NavigationSplitView` (iOS 16+)
- Tab and sidebar unification (iOS 18+)
- Liquid Glass design (iOS 26+)

## Key Patterns

### NavigationPath with State Restoration

```swift
struct ContentView: View {
    @SceneStorage("navigationPath") private var pathData: Data?
    @State private var path = NavigationPath()

    var body: some View {
        NavigationStack(path: $path) {
            List(items) { item in
                NavigationLink(value: item) {
                    Text(item.title)
                }
            }
            .navigationDestination(for: Item.self) { item in
                DetailView(item: item)
            }
        }
        .onAppear { restorePath() }
        .onChange(of: path) { savePath() }
    }

    private func savePath() {
        pathData = try? JSONEncoder().encode(path.codable)
    }

    private func restorePath() {
        guard let data = pathData,
              let codable = try? JSONDecoder().decode(
                  NavigationPath.CodableRepresentation.self, from: data
              ) else { return }
        path = NavigationPath(codable)
    }
}
```

### NavigationPath Manipulation

```swift
// Push
path.append(item)

// Pop one
path.removeLast()

// Pop to root
path.removeLast(path.count)

// Pop to specific depth
path.removeLast(path.count - 2)  // Keep first 2 items
```

## Documentation Scope

This page documents the `nav-ref` skill (in the `axiom-swiftui` suite), the navigation API reference your assistant uses for implementation details.

## Related

- [swiftui-nav](/skills/ui-design/swiftui-nav) – Decision trees and anti-patterns for choosing a navigation architecture
- [swiftui-nav-diag](/diagnostic/swiftui-nav-diag) – Systematic diagnosis when navigation, deep links, or the search tab misbehave
- [swiftui-nav-auditor](/agents/swiftui-nav-auditor) – Scans your navigation code for these anti-patterns
- [swiftui-26-ref](/reference/swiftui-26-ref) – The full toolbar morphing API, including `DefaultToolbarItem` and `ToolbarSpacer`
- [swiftui-search-ref](/reference/swiftui-search-ref) – Foundational `.searchable` APIs: suggestions, scopes, tokens, and programmatic control
- [swiftui-animation-ref](/reference/swiftui-animation-ref) – Zoom transitions and `matchedTransitionSource`
- [liquid-glass](/skills/ui-design/liquid-glass) – Liquid Glass design beyond navigation chrome

## Resources

**WWDC**: 2022-10054, 2024-10147, 2025-256, 2025-323, 2026-269

**Docs**: /swiftui/navigationstack, /swiftui/navigationsplitview, /swiftui/navigationpath, /swiftui/tabrole/search, /swiftui/tabrole/prominent, /swiftui/navigationtransition/crossfade
