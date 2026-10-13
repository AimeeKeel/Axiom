---
name: swiftui-previews
description: Discipline for building good SwiftUI previews — five performance rules, environment-object setup patterns, variant matrix discipline, when not to preview
skill_type: discipline
version: 1.0.0
---

# SwiftUI Previews

Discipline for building fast, useful SwiftUI previews. Covers the previewability principle, five rules that turn slow previews fast, environment setup patterns, variant matrices for design-system components, and when a preview is the wrong tool.

## When to Use

Use this skill when:

- Building, organizing, or speeding up previews for a SwiftUI app
- Previews take 20 seconds or more to load and you don't know why
- Designing a design-system component that needs a variant matrix
- Setting up environment objects, model containers, or mock data for previews
- Deciding whether a complex view is worth previewing at all

**Core principle:** If a view is hard to preview, the view is wrong, not the preview. A view that needs a network client, an auth session, an analytics SDK, and three environment objects before it renders has revealed a design problem the simulator was hiding.

## Example Prompts

Questions you can ask your assistant that will draw from this skill:

- "My SwiftUI previews take 30 seconds to load. How do I speed them up?"
- "How do I preview a view that takes an `@Environment(AppModel.self)`?"
- "I want to preview every variant of my button (light, dark, largest Dynamic Type, RTL, disabled). What's the right pattern?"
- "How do I use `@State` in a preview without writing a wrapper view?"
- "Should I even bother previewing this view, or just use the simulator?"
- "Why is my preview hitting production analytics?"
- "How do I share expensive setup across multiple previews?"
- "Can I resize the preview canvas freely to test my adaptive layout?" (Xcode 27)

## What This Skill Provides

### The Previewability Principle

A view you can't preview in five lines is over-coupled, and the fix is to refactor the view, not to write a 50-line preview. Apple frames it this way in WWDC 2023-10252: "Previews are kind of like the scenes that you define at the top level of your app."

### The Five Performance Rules

A 20-second preview compile hit 40 times a day costs about 55 hours a year per developer.

1. **Isolate UI in a Swift package** – The single biggest win. Move views into a local Swift package that depends only on `SwiftUI` and `Foundation`, and preview builds drop from 20+ seconds to 2–3.
2. **Use `PreviewModifier` for shared expensive setup** – Apple's answer (Xcode 16+, iOS 18+) for sharing expensive state across previews through `makeSharedContext()`.
3. **Pin the parent preview** – The canvas pin keeps a meaningful preview visible while you edit child views in other files.
4. **Turn off auto-refresh for large views** – Editor → Canvas → Automatically Refresh Canvas, then refresh by hand with ⌥⌘P.
5. **Skip SDK setup in previews** – Guard `FirebaseApp.configure()` and similar calls with `ProcessInfo.processInfo.environment["XCODE_RUNNING_FOR_PREVIEWS"]`.

### Environment Setup Patterns

Six patterns, each matched to a situation:

- **Pattern A** – Plain `.sample` data on the model, for leaf views
- **Pattern B** – `@Previewable @State` for inline state (Xcode 16+)
- **Pattern C** – `.environment()` injection in a single preview
- **Pattern D** – `PreviewModifier` for repeated expensive setup
- **Pattern E** – An in-memory SwiftData `ModelContainer`
- **Pattern F** – Side-by-side composition with `Group` or `HStack` for comparing states

### Variant Matrix Discipline

Design-system components need light and dark, every Dynamic Type size, left-to-right and right-to-left layout, and every semantic state (default, hover, selected, disabled, loading, error). The canvas's Variant Mode covers color scheme, Dynamic Type, and orientation automatically. Right-to-left needs `.environment(\.layoutDirection, .rightToLeft)`, and semantic states need a single preview with a `VStack` of each state.

### Beyond the Mac Canvas

- On-device previews, for real sensors, color, ProMotion, and touch on a connected iPhone
- Xcode 27's resize mode, which lets you drag the preview device's edges to test adaptive layout live

### When Not to Use Previews

A boundary table covering `NavigationStack` roots, real network responses, `CALayer`, Metal, and camera content, real permissions, real animation timing, and the app's root scene. For these, the simulator (with debug deep links) is the better tool.

### Pressure Scenarios and Checklists

- Pushing back on "previews are slow, I'll just use the simulator", copy-pasted preview setup, and force-unwrapping in previews
- An anti-pattern table and a checklist to run before shipping a new component

## Documentation Scope

This page documents the `previews` skill (in the `axiom-swiftui` suite), which your assistant draws on when you build, organize, or speed up previews.

- For the API surface (`#Preview`, `@Previewable`, `PreviewModifier`, traits, and canvas modes), see [swiftui-previews-ref](/reference/swiftui-previews-ref)
- For what to look for in Dynamic Type and right-to-left variants, see [accessibility-diag](/diagnostic/accessibility-diag)

## Related

- [swiftui-debugging](/skills/ui-design/swiftui-debugging) – The decision tree for previews that crash, a different problem from slow previews
- [swiftui-hot-reload](/skills/ui-design/swiftui-hot-reload) – Iterating inside the running app; a complement to previews, not a substitute
- [swiftui-performance](/skills/ui-design/swiftui-performance) – Runtime performance with the SwiftUI Instrument, not preview speed
- [swiftui-architecture](/skills/ui-design/swiftui-architecture) – The same discipline behind the previewability principle: views render, models coordinate

## Resources

**WWDC**: 2020-10185, 2023-10252, 2024-10144

**Docs**: /swiftui/preview(_:body:), /swiftui/preview(_:traits:_:body:), /swiftui/previewable(), /swiftui/previewmodifier
