---
name: menus-and-commands
description: Use when adding custom menus or menu items, wiring keyboard shortcuts, building context menus, connecting menu commands to the focused window via focusedSceneValue, extending system command groups, or debugging menu items that appear disabled.
---

# macOS Menus and Commands

How one menu bar serves many windows: `CommandMenu`, `CommandGroup`, `focusedSceneValue`, and `@FocusedBinding` route each command to the right window.

## When to Use

Use this skill when you're:
- Adding custom menus or menu items to the macOS menu bar
- Implementing keyboard shortcuts on menu commands
- Building context menus for macOS views (secondary click)
- Connecting menu commands to the focused window via `focusedSceneValue`
- Extending or replacing system command groups (`.newItem`, `.pasteboard`, etc.)
- Debugging menu items that appear disabled or don't affect the right window

## Example Prompts

Questions you can ask your assistant that will draw from this skill:

- "Why is my menu item always disabled even when a window is focused?"
- "How do I add 'New Plant' before the standard 'New' group in the File menu?"
- "When should I use `focusedValue` vs `focusedSceneValue`?"
- "I'm putting `.commands` on a `View` and getting a compiler error. What's wrong?"
- "How do I add a custom context menu with a destructive Delete action?"

## What This Skill Provides

### Menu Architecture
- The "one menu bar, many windows" routing model
- Why commands belong on the scene, not on views
- The `Commands` flow: menu bar → `Commands` struct → `@FocusedValue` → `focusedSceneValue` → focused window

### Command Patterns
- `CommandMenu` for new top-level menus (placed between View and Window)
- `CommandGroup(before: .newItem)`, `.after(...)`, and `.replacing(...)` for extending system menus
- System-provided groups: `SidebarCommands`, `InspectorCommands`, `ToolbarCommands`, `TextEditingCommands`, `TextFormattingCommands`
- Standard `CommandGroupPlacement` values (`.newItem`, `.saveItem`, `.pasteboard`, `.undoRedo`, `.sidebar`, `.toolbar`, `.appSettings`, etc.)

### Focus-Based Routing
- Defining focused-value keys with the `@Entry` macro (iOS 17+ / macOS 14+)
- Publishing values with `.focusedSceneValue` from the view
- Reading values with `@FocusedValue` (read-only) or `@FocusedBinding` (read-write)
- The critical difference: `focusedSceneValue` works across the whole window; `focusedValue` only when a specific view has keyboard focus

### Keyboard Shortcuts and Context Menus
- `.keyboardShortcut(_, modifiers:)` syntax, and shortcut choices that follow the HIG
- `.contextMenu { ... }` for secondary-click menus tied to a specific item
- `.commandsRemoved()` to suppress unwanted defaults
- `NSMenuItem.preferredImageVisibility` for menu-item images in AppKit-built menus (macOS 27)

## Key Pattern

`@FocusedValue` is silently `nil` until something publishes the value. The most common bug is forgetting `.focusedSceneValue` on the view side:

```swift
// View side — publishes
struct GardenDetail: View {
    @Binding var garden: Garden
    var body: some View {
        Content()
            .focusedSceneValue(\.garden, $garden)
    }
}

// Commands side — reads
struct GardenCommands: Commands {
    @FocusedBinding(\.garden) var garden
    var body: some Commands {
        CommandMenu("Garden") {
            Button("Water All") { garden?.waterAll() }
                .disabled(garden == nil)
        }
    }
}
```

Default to `focusedSceneValue`, not `focusedValue`. The scene-level variant publishes no matter which view inside the window has focus, which is exactly what menu commands need.

## Documentation Scope

This page documents the `menus-and-commands` skill (in the `axiom-macos` suite), which your assistant uses when you build menus, route commands to the focused window, or extend system command groups.

## Related

- [windows](/skills/macos/windows) – Commands modify scenes; this covers `WindowGroup`, `Window`, `UtilityWindow`, `MenuBarExtra`, `Settings`
- [swiftui-differences](/skills/macos/swiftui-differences) – Where `focusedSceneValue` fits into the broader macOS focus model, including Table, Inspector, and toolbar commands
- [settings](/skills/macos/settings) – Settings menu item placement and the ⌘, shortcut wiring
- [appkit-interop](/skills/macos/appkit-interop) – Building menu content in SwiftUI and attaching it to an AppKit main menu with `NSHostingMenu`
- [appkit-modernization](/skills/macos/appkit-modernization) – Status items that show custom windows (expanded interface sessions)
- [swiftui-toolbars](/skills/ui-design/toolbars) – Cross-platform `.toolbar`, `ToolbarItem`, and `ToolbarSpacer` placement

## Resources

**WWDC**: 2021-10062

**Docs**: /swiftui/commandmenu, /swiftui/commandgroup, /swiftui/commandgroupplacement, /swiftui/focusedvalues, /swiftui/building-and-customizing-the-menu-bar-with-swiftui, /appkit/nsmenuitem

**HIG**: The Menu Bar, Menus, Context Menus
