---
name: swiftui-differences
description: Use when bringing an iOS SwiftUI app to macOS, choosing between List and Table, building three-column NavigationSplitView layouts, adding Inspector panels, wiring focus-driven commands, or configuring macOS toolbar styles.
---

# macOS SwiftUI Differences

The three mental-model shifts iOS developers must make on macOS (multi-window, focus-driven, and keyboard-first), plus `Table`, `NavigationSplitView`, the inspector, and toolbar styles.

## When to Use

Use this skill when you're:
- Bringing an iOS SwiftUI app to macOS
- Building a macOS-first SwiftUI app
- Choosing between `List` and `Table` for structured data
- Implementing a three-column `NavigationSplitView` with sidebar, content, and detail
- Adding an inspector panel for selection-dependent detail
- Wiring keyboard commands, menu bar actions, and focus-driven interactions
- Choosing a window toolbar style (`.unified`, `.unifiedCompact`, `.expanded`)
- Debugging macOS-specific SwiftUI layout or behavior

## Example Prompts

Questions you can ask your assistant that will draw from this skill:

- "My iPad-style sheet for showing detail feels wrong on Mac. What should I use?"
- "My table headers show sort indicators but the rows don't reorder. What's missing?"
- "How do I make each window remember its own sidebar visibility and column widths?"
- "Should this be a `List` or a `Table`?"
- "How do I make Control-Command-I toggle my Inspector?"
- "Why does my menu command only fire when a specific text field has focus?"

## What This Skill Provides

### The Three Mental-Model Shifts
- **Multi-window** – Users open many windows, and each has independent state. Use `@SceneStorage` for per-window persistence, not global singletons.
- **Focus-driven** – Menu commands target the focused window. Use `focusedSceneValue` so commands work whenever the window is frontmost.
- **Keyboard-first** – Every action must appear in the menu bar with a shortcut. Toolbar-only actions strand keyboard users.

### Table
- When `Table` beats `List`: multiple sortable columns, headers, column reordering, and column resizing
- Sortable tables with `KeyPathComparator` and the `onChange(of: sortOrder)` sorting step you must implement yourself
- `TableColumnCustomization` with `@SceneStorage` for persisting column order and visibility per window
- `DisclosureTableRow` for hierarchical rows (Finder-style)
- Cross-platform behavior: macOS shows every column, while iPhone and compact iPad layouts collapse to the first

### NavigationSplitView on macOS
- True multi-column layouts with resizable dividers
- `.navigationSplitViewColumnWidth(min:ideal:max:)` for sidebar sizing
- `NavigationSplitViewVisibility` and the macOS rule that the content column is always shown

### Inspector
- When an inspector beats a sheet, a popover, or `openWindow`
- `.inspector(isPresented:)` and `.inspectorColumnWidth(...)`
- `InspectorCommands()` for the Control-Command-I toggle

### Focus and Toolbars
- `.onDeleteCommand`, `.onExitCommand`, `.onCommand(#selector(...))`, and the focus requirement (`.focusable()`)
- `@FocusedBinding` and `focusedSceneValue` for data flow from the menu bar to the active window
- `.windowToolbarStyle` on the scene or `.presentedWindowToolbarStyle` on a view, with `.unified`, `.unifiedCompact`, or `.expanded`, and when each fits
- Toolbar item placements: `.navigation`, `.primaryAction`, `.secondaryAction`

### Known Gaps and AppKit Escape Hatches
- Interactions pure SwiftUI on macOS can't express yet, each with its AppKit workaround: unfocused selection styling, context-menu-open state, drag-session visibility, arrow-key navigation alongside a focused search field, and precise toolbar placement

## Key Pattern

Always pair toolbar buttons with menu bar commands, because keyboard-only users can't reach toolbar-only actions:

```swift
@main
struct MyApp: App {
    var body: some Scene {
        WindowGroup { ContentView() }
            .commands {
                SidebarCommands()
                InspectorCommands()
                PlantCommands()  // Your domain commands, mirroring toolbar
            }
    }
}
```

For per-window state (sidebar visibility, selection, column widths), use `@SceneStorage`. A global singleton makes every window share the same state.

## Documentation Scope

This page documents the `swiftui-differences` skill (in the `axiom-macos` suite), which your assistant uses for Mac-specific SwiftUI patterns.

For the SwiftUI fundamentals shared by iOS, iPadOS, and macOS (`NavigationSplitView` and `NavigationStack` basics, layout primitives, and state management), see [swiftui-nav](/skills/ui-design/swiftui-nav) and [swiftui-layout](/skills/ui-design/swiftui-layout).

## Related

- [windows](/skills/macos/windows) – Per-window state and `@SceneStorage` make sense once you're running multiple windows
- [menus-and-commands](/skills/macos/menus-and-commands) – The focus model used here is the foundation for command routing
- [settings](/skills/macos/settings) – The macOS Settings scene, covered in depth
- [appkit-interop](/skills/macos/appkit-interop) – The bridging patterns for when SwiftUI lacks a capability (`NSToolbar` customization, `NSOpenPanel` options, the gaps above)

## Resources

**WWDC**: 2021-10062, 2023-10148

**Docs**: /swiftui/table, /swiftui/navigationsplitview, /swiftui/inspectorcommands, /swiftui/focusedvalues
