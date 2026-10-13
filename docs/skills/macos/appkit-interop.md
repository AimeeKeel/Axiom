---
name: appkit-interop
description: Use when embedding AppKit views inside SwiftUI (NSViewRepresentable, NSViewControllerRepresentable), hosting SwiftUI inside an AppKit app (NSHostingController/NSHostingView), bridging NSToolbar or NSOpenPanel, or debugging responder-chain or focus issues across the boundary.
---

# macOS AppKit Interoperability

Bridges SwiftUI and AppKit in both directions: `NSViewRepresentable` and `NSViewControllerRepresentable` embed AppKit in SwiftUI, and `NSHostingController` and `NSHostingView` host SwiftUI in AppKit. Also covers the responder chain, `NSToolbar`, `NSOpenPanel`, and drag and drop across the boundary.

## When to Use

Use this skill when you're:
- Embedding an AppKit view or view controller inside SwiftUI
- Hosting SwiftUI views inside an AppKit app
- Working around SwiftUI gaps — `NSToolbar` customization, `NSOpenPanel` options, `NSTextView` rich text
- Debugging menu commands, copy/paste, or keyboard shortcuts that don't cross the SwiftUI/AppKit boundary
- Bridging drag-and-drop between SwiftUI's `Transferable` model and AppKit's `NSDraggingDestination`
- Diagnosing responder chain or focus behavior that breaks when mixing frameworks
- Optimizing SwiftUI cells inside `NSCollectionView` or `NSTableView` for scroll performance
- Updating `NSView`s automatically from `@Observable` models (observation tracking, no SwiftUI required)
- Reusing an existing `NSGestureRecognizer` in a SwiftUI view (`NSGestureRecognizerRepresentable`, macOS 26)
- Building main-menu items in SwiftUI (`NSHostingMenu`) or adding SwiftUI scenes like `MenuBarExtra` and `Settings` to an AppKit app delegate (`NSHostingSceneRepresentation`, macOS 26)

## Example Prompts

Questions you can ask your assistant that will draw from this skill:

- "How do I host an `NSTextView` inside SwiftUI and keep bindings synced?"
- "My SwiftUI cells inside `NSCollectionView` cause scroll jank. What's wrong?"
- "When should I drop from `.fileImporter` to `NSOpenPanel`?"
- "My `.onCommand` modifier is silently ignored. What did I miss?"
- "Why are my writes from the AppKit delegate not reaching the SwiftUI binding?"
- "Can my NSView redraw automatically when my @Observable model changes?"
- "How do I add a SwiftUI MenuBarExtra to my existing AppKit app?"

## What This Skill Provides

### Direction Decision
- SwiftUI host + AppKit guest → `NSViewRepresentable` (raw view) or `NSViewControllerRepresentable` (controller with lifecycle)
- AppKit host + SwiftUI guest → `NSHostingController` (controller contexts) or `NSHostingView` (raw view contexts)
- When to bridge at all — start with SwiftUI; cross only when SwiftUI lacks the capability

### NSViewRepresentable Lifecycle
- `makeCoordinator()` → `makeNSView(context:)` → `updateNSView(_:context:)` → `dismantleNSView(_:coordinator:)`
- The coordinator pattern for delegate callbacks writing back to bindings
- Refreshing `context.coordinator.parent = self` in `updateNSView`; a stale reference silently swallows writes back to SwiftUI state
- Guarding redundant property sets, which otherwise reset the text caret and selection while the user types
- Reading `context.environment` (for example, `isEnabled`) and applying it to the AppKit view
- Wrapping `NSTextView` in the scroll view from `NSTextView.scrollableTextView()`
- The never-set-frame rule — SwiftUI owns layout; use `.frame()` on the SwiftUI side

### NSHostingController vs NSHostingView
- `NSHostingController` for view-controller contexts (`NSSplitViewItem`, sheets, popovers, modal windows, tabs)
- `NSHostingView` for raw view contexts (collection cells, sidebars, table cells)
- `sizingOptions` on the controller for Auto Layout constraint generation
- The reuse rule: create the hosting view once, then update `rootView` on reuse, never a new hosting view per cell

### Responder Chain and Focus
- The "they don't live in separate worlds" mental model — SwiftUI views participate in the AppKit responder chain
- SwiftUI command modifiers — `.copyable`, `.cuttable`, `.pasteDestination`, `.onMoveCommand`, `.onExitCommand`, `.onCommand(#selector(...))`
- The `.focusable()` requirement for command receivers
- Full Keyboard Navigation testing (System Settings toggle on and off)

### Incremental SwiftUI Adoption
- Automatic observation tracking: AppKit redraws an `NSView` when `@Observable` properties read in its draw or layout methods change; on by default with the 2026 SDKs, and back-deployable to macOS 15 with the `NSObservationTrackingEnabled` Info.plist key
- `NSGestureRecognizerRepresentable` (macOS 26) for existing gesture recognizers, and `NSHostingMenu` (macOS 14.4) for SwiftUI-built menus
- `NSHostingSceneRepresentation` and `addSceneRepresentation` for `MenuBarExtra` and `Settings` scenes in an app-delegate app (macOS 26)

### Bridging Other AppKit APIs
- `NSToolbar` for capabilities `.toolbar` doesn't cover (item validation, user customization, centered groups)
- `NSOpenPanel` for capabilities `.fileImporter` doesn't cover (directories, accessory views, ubiquitous content)
- Drag and drop: `Transferable` with `.draggable` and `.dropDestination` when SwiftUI can handle it, `NSDraggingDestination` on the AppKit view inside a representable, and `.onDrop(of:delegate:)` for legacy pasteboard types
- Shared state via `@Observable` (or `ObservableObject`) accessible to both sides

## Key Pattern

The most common performance bug is creating a new `NSHostingView` on every cell reuse instead of updating `rootView`:

```swift
class ShortcutItemView: NSCollectionViewItem {
    private var hostingView: NSHostingView<ShortcutView>?

    func displayShortcut(_ shortcut: Shortcut) {
        let view = ShortcutView(shortcut: shortcut)
        if let hostingView {
            hostingView.rootView = view  // reuse — SwiftUI diffs internally
        } else {
            let newHosting = NSHostingView(rootView: view)
            self.view.addSubview(newHosting)
            setupConstraints(for: newHosting)
            hostingView = newHosting
        }
    }
}
```

## Documentation Scope

This page documents the `appkit-interop` skill (in the `axiom-macos` suite), which your assistant uses when you bridge SwiftUI and AppKit.

## Related

- [appkit-modernization](/skills/macos/appkit-modernization) – Modernizing the AppKit side itself (input, restoration, macOS 27 look)
- [swiftui-differences](/skills/macos/swiftui-differences) – Drop to AppKit only when these macOS SwiftUI primitives don't cover the need
- [windows](/skills/macos/windows) – `NSHostingController` is the right way to host SwiftUI inside an AppKit-managed window or sheet
- [sandbox-and-file-access](/skills/macos/sandbox-and-file-access) – Reasons to drop from `.fileImporter` to `NSOpenPanel`
- [menus-and-commands](/skills/macos/menus-and-commands) – Where SwiftUI's command modifiers meet AppKit's responder chain
- [uikit-bridging](/skills/ui-design/uikit-bridging) – Same representable pattern, UIKit edition

## Resources

**WWDC**: 2022-10075, 2026-272

**Docs**: /swiftui/nsviewrepresentable, /swiftui/nsviewcontrollerrepresentable, /swiftui/nshostingcontroller, /swiftui/nshostingview, /swiftui/nshostingmenu, /swiftui/nsgesturerecognizerrepresentable, /swiftui/nshostingscenerepresentation, /appkit/nstoolbar, /appkit/nsopenpanel
