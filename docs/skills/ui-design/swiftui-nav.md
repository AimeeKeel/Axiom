---
name: swiftui-nav
description: Use when implementing navigation patterns, choosing between NavigationStack and NavigationSplitView, handling deep links, adopting coordinator patterns, or requesting code review of navigation implementation — prevents navigation state corruption, deep link failures, and state restoration bugs for iOS 18+
skill_type: discipline
version: 1.0.0
apple_platforms: iOS 18+ (Tab/Sidebar), iOS 26+ (Liquid Glass)
---

# SwiftUI Navigation

Navigation architecture for SwiftUI apps: choosing between `NavigationStack`, `NavigationSplitView`, and `TabView`, then handling programmatic navigation, deep links, state restoration, and coordinators.

## When to Use

Use this skill when you're:
- Choosing a navigation architecture (`NavigationStack`, `NavigationSplitView`, or `TabView`)
- Implementing programmatic navigation with `NavigationPath`
- Setting up deep linking and URL routing
- Implementing state restoration for navigation
- Adopting the tab and sidebar patterns from iOS 18
- Implementing coordinator or router patterns
- Reviewing navigation code before shipping

## Example Prompts

Questions you can ask your assistant that will draw from this skill:

- "Should I use NavigationStack or NavigationSplitView for my app?"
- "How do I navigate programmatically in SwiftUI?"
- "My deep links aren't working. The app opens but shows the wrong screen."
- "Navigation state is lost when my app goes to the background."
- "How do I implement a coordinator pattern in SwiftUI?"
- "How do I pop to root in NavigationStack?"
- "Why does my navigation reset when I switch tabs?"

## What This Skill Provides

### Decisions and First Steps
- A decision tree across `NavigationStack`, `NavigationSplitView`, and `TabView`, based on device targets, content depth, and multiplatform needs
- Mandatory first steps before writing code: the structure, the container, `Hashable` and `Codable` route values, deep link URLs, and restoration
- Eight red flags, such as `NavigationView`, view-based `NavigationLink`, and `navigationDestination` inside a lazy container

### Navigation Patterns
- `NavigationStack` with a typed array or a `NavigationPath`, including push, pop, and pop-to-root
- `NavigationSplitView` with two or three columns, placeholder views, and a stack inside the detail column
- `TabView` with its own `NavigationStack` per tab, so each tab keeps its state
- The iOS 18 sidebar-adaptable `TabView`, with `TabSection` groups and the search tab role

### Deep Linking and Restoration
- Handling URLs in `onOpenURL`: pop to root first, then build the path from parent to child
- Restoring navigation with `SceneStorage` and a `Codable` model that stores IDs, not objects, and survives decode failures

### Coordinators
- When a router or coordinator adds value, and when it only adds complexity
- A router implementation that keeps navigation logic testable

### Review and Pressure
- Anti-patterns, such as pushing onto the presenting stack from inside a sheet
- A code review checklist and a troubleshooting table
- Pressure scenarios: pushing back on an over-engineered "make it like Instagram" design, and on keeping `NavigationView` for backward compatibility

## Key Pattern

### Programmatic Navigation

```swift
struct ContentView: View {
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
    }

    // Programmatic navigation
    func navigateTo(_ item: Item) {
        path.append(item)
    }

    func popToRoot() {
        path.removeLast(path.count)
    }
}
```

## Documentation Scope

This page documents the `nav` skill (in the `axiom-swiftui` suite), which your assistant draws on when you design, implement, or review SwiftUI navigation.

- For the full API reference, including tab customization and iOS 26 features, see [swiftui-nav-ref](/reference/swiftui-nav-ref)
- For automated scanning, use [swiftui-nav-auditor](/agents/swiftui-nav-auditor), or run [/axiom:audit-swiftui-nav](/commands/ui-design/audit-swiftui-nav)

## Related

- [swiftui-nav-diag](/diagnostic/swiftui-nav-diag) – Systematic troubleshooting when navigation already misbehaves
- [swiftui-architecture](/skills/ui-design/swiftui-architecture) – Where a coordinator fits alongside MVVM, TCA, or Apple's native patterns
- [app-composition](/skills/ui-design/app-composition) – App-level state and scene lifecycle above the navigation layer
- [deep-link-debugging](/skills/debugging/deep-link-debugging) – Debug-only deep links for jumping straight to a screen while testing

## Resources

**WWDC**: 2022-10054, 2024-10147, 2025-256, 2025-323

**Docs**: /swiftui/navigation, /swiftui/navigationstack, /swiftui/navigationsplitview
