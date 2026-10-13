---
name: swiftui-nav-diag
description: Systematic diagnostics for navigation failures, unexpected pops, deep linking issues, and state loss
skill_type: diagnostic
version: 1.0.0
---

# SwiftUI Navigation Diagnostics

Systematic troubleshooting for SwiftUI navigation problems in `NavigationStack`, `NavigationPath`, `NavigationSplitView`, deep linking, and state restoration. Most come from path state management, view identity, or placement mistakes, not from SwiftUI itself.

## Symptoms This Diagnoses

Use when you're experiencing:
- Navigation tap does nothing (the link is there but doesn't push)
- Back button pops to the wrong screen or to the root
- Deep link opens the app but shows the wrong screen
- Navigation state lost when switching tabs
- Navigation state lost when the app goes to the background
- Same `NavigationLink` pushes twice
- Navigation animation stuck or janky
- Pushing certain types shows a blank screen, with no crash
- Crash with `navigationDestination` in the stack trace, or a crash decoding restored state at launch
- Sidebar missing or a blank detail view on iPad
- Search tab doesn't morph from its tab icon on first activation (iOS 26)

## Example Prompts

- "Why doesn't my NavigationLink respond to taps?"
- "Navigation pushes then immediately pops back"
- "Deep link works in foreground but fails on cold start"
- "Navigation state resets when I switch tabs"
- "How do I preserve navigation state when app backgrounds?"
- "Pushing my Recipe type shows a blank screen"

## Diagnostic Workflow

Your assistant guides you through three steps.

### Step 1: Identify the Problem Category

| Symptom | Likely Cause |
|---------|--------------|
| Link tap does nothing | Link outside the `NavigationStack`, or missing destination |
| Works for some types, not others | Destination registered for the wrong type |
| Push, then immediate pop | Path recreated on every render |
| Deep link fails on cold start | Timing or lifecycle issue |
| State lost on tab switch | One `NavigationStack` shared across tabs |
| State lost on background | No persistence mechanism |
| Blank detail on iPad | No default detail view in a `NavigationSplitView` |

### Step 2: Mandatory First Checks

Before changing code:
1. Log path changes with `onChange(of: path.count)`
2. Add a temporary `print` inside each `navigationDestination` closure to confirm it runs
3. Verify the `NavigationLink` sits inside the `NavigationStack` hierarchy
4. Check where the path's `@State` lives: it must be in a stable view, not recreated
5. Test a minimal reproduction that pushes `String` values

### Step 3: Apply the Targeted Pattern

Your assistant applies the fix pattern for your symptom:
- **Patterns 1a–1c** – Link and destination issues: link outside the stack, destination in a lazy container, type mismatch
- **Patterns 2a and 2d** – Unexpected pops: path recreation, and path changes off the main actor
- **Patterns 3a and 3c** – Deep linking: threading and timing, and path construction order
- **Patterns 4a, 4b, and 4e** – Tabs and state loss: a stack shared across tabs, no persistence, and the iOS 26 search-tab morph
- **Patterns 5b and 5c** – Missing destination registration, and crashes decoding restored state
- **Patterns 6a–6c** – `NavigationSplitView` sidebar, detail, and iPad adaptation issues

## Key Diagnostic Patterns

### Navigation Tap Does Nothing

```swift
// Add logging to see if path changes
.onChange(of: path.count) { old, new in
    print("📍 Path: \(old) → \(new)")
    // If never fires: link outside NavigationStack
    // If fires but no push: missing navigationDestination
}
```

### Path State Recreation

```swift
// ❌ Path recreated every render
var body: some View {
    let path = NavigationPath()  // Reset every time!
    NavigationStack(path: .constant(path)) { ... }
}

// ✅ Persistent path
@State private var path = NavigationPath()
var body: some View {
    NavigationStack(path: $path) { ... }
}
```

### Deep Link Cold Start

```swift
// Queue deep links until NavigationStack ready
@State private var pendingDeepLink: URL?
@State private var isReady = false

.onOpenURL { url in
    if isReady {
        handleDeepLink(url)
    } else {
        pendingDeepLink = url  // Process in onAppear
    }
}
```

## Documentation Scope

This page documents the `nav-diag` diagnostic skill (in the `axiom-swiftui` suite) — systematic troubleshooting your assistant uses when you report SwiftUI navigation problems. The skill file also holds a quick-reference table with fix times, common mistakes, and a production crisis protocol for navigation that breaks after an iOS update.

## Related

- [swiftui-nav](/skills/ui-design/swiftui-nav) – Navigation architecture patterns that prevent these problems
- [swiftui-nav-ref](/reference/swiftui-nav-ref) – Complete navigation API reference
- [swiftui-nav-auditor](/agents/swiftui-nav-auditor) – Automated navigation code review
- [deep-link-debugging](/skills/debugging/deep-link-debugging) – Debug-only deep links for testing navigation
- [swiftui-debugging-diag](/diagnostic/swiftui-debugging-diag) – View update and identity diagnosis when the problem isn't navigation-specific

## Resources

**WWDC**: 2022-10054, 2024-10147, 2025-256

**Docs**: /swiftui/navigationstack, /swiftui/navigationpath
