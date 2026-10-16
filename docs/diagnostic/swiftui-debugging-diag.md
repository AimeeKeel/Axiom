---
name: swiftui-debugging-diag
description: Systematic diagnostics for view update failures, intermittent UI issues, and Instruments workflows
skill_type: diagnostic
version: 1.0.0
---

# SwiftUI Debugging Diagnostics

Advanced diagnostic workflows for SwiftUI issues that persist after basic troubleshooting. It gathers evidence with `Self._printChanges()` and the SwiftUI instrument instead of guessing.

## Symptoms This Diagnoses

Use when you're experiencing:
- View not updating, even after basic troubleshooting
- `Self._printChanges()` showing unexpected update patterns
- Intermittent issues ("works sometimes")
- Complex dependency chains causing cascading updates
- Views updating too often, or body updates taking too long
- Preview crashes without a clear cause
- State that resets unexpectedly

## Example Prompts

- "My view isn't updating even though state changed"
- "Self._printChanges() shows @self changed but I don't know why"
- "View updates intermittently — works sometimes, fails others"
- "Too many views updating when I change one value"
- "Preview crashes without clear error message"
- "State resets when navigating back"

## Diagnostic Workflow

Your assistant guides you through evidence-based diagnosis, and won't guess with random `@State` or `@Observable` changes or force updates with `.id(UUID())`, which destroys state and hides the root cause.

### Pattern D1: Self._printChanges() Analysis

```swift
var body: some View {
    let _ = Self._printChanges()  // Add temporarily
    // Output tells you exactly what triggered the update
}
```

Read the output, one line per body call:
- `@self changed` → The parent passed a new instance of the view; check what made the parent recreate it
- `_count changed` → That dynamic property changed, reported by its stored name (`@State var count` prints `_count`)
- An environment property's name → An environment value changed; continue with D4
- `@identity` for a view that is already on screen → The view's state was recycled for a new instance; continue with D3 (a view's first appearance prints `@identity` too, so it means nothing there)
- Nothing logged → The body isn't being called; continue with D3

Remove the call before committing.

### Pattern D2: SwiftUI Instrument

For cases `Self._printChanges()` can't explain, use the SwiftUI instrument. It needs Xcode 26 or later, a device on iOS 26 or macOS Tahoe or later, and a Release build.
1. In Xcode, press Command-I and choose the SwiftUI template
2. Record while reproducing the issue
3. Check the Long View Body Updates lane for expensive views
4. Use the Cause & Effect Graph to trace the data flow

### Pattern D3: View Identity Investigation

For state that resets unexpectedly:
- Check for views inside `if`/`else` conditionals
- Search for `.id()` modifiers with changing values
- Verify that `ForEach` uses unique, stable identifiers

### Pattern D4: Environment Dependency Check

For cascading updates:
- Search for `.environment()` modifiers
- Check whether frequently changing values live in the environment
- Consider passing them as direct parameters instead

### Pattern D5: Preview Diagnostics

For a preview that won't load or crashes with an unclear error:
- Open Editor → Canvas → Diagnostics for detailed errors, missing dependencies, and initialization problems
- Check `~/Library/Logs/DiagnosticReports/` for recent preview crash logs
- Isolate the failing view with minimal previews

## Quick Diagnostic Table

| Symptom | First Check | Pattern | Fix Time |
|---------|-------------|---------|----------|
| View doesn't update | `Self._printChanges()` | D1 | 10 min |
| View updates too often | `Self._printChanges()`, then Instruments | D1 → D2 | 30 min |
| Long body updates (performance) | Instruments (SwiftUI and Time Profiler) | D2 | 30 min |
| State resets | `.id()` modifiers and conditionals | D3 | 15 min |
| Intermittent issues | Reproduce 30 or more times | D3 | 30 min |
| Cascade updates | Environment modifiers | D4 | 20 min |
| Preview crashes | Diagnostics in the Canvas menu | D5 | 10 min |

## Documentation Scope

This page documents the `debugging-diag` diagnostic skill (in the `axiom-swiftui` suite) — advanced troubleshooting your assistant uses when basic SwiftUI debugging doesn't resolve the issue. The skill file also covers a production crisis scenario, with a protocol for diagnosing a freeze under deadline pressure, and a checklist to pass before shipping any fix.

## Related

- [swiftui-debugging](/skills/ui-design/swiftui-debugging) – Basic view update troubleshooting; start here before this diagnostic
- [swiftui-nav-diag](/diagnostic/swiftui-nav-diag) – Navigation-specific diagnosis, including an iOS 26 integration that works only on its second activation
- [swiftui-performance](/skills/ui-design/swiftui-performance) – Performance optimization with Instruments
- [swiftui-performance-analyzer](/agents/swiftui-performance-analyzer) – Scans your views for expensive bodies and broad dependencies
- [xcode-debugging](/skills/debugging/xcode-debugging) – Environment-first Xcode diagnostics

## Resources

**WWDC**: 2025-306 (SwiftUI Instruments), 2023-10160 (Performance), 2023-10149 (Observation), 2021-10022 (View identity)

**Docs**: /xcode/understanding-hitches-in-your-app, /swiftui/managing-model-data-in-your-app
