---
name: swiftui-previews-ref
description: Reference — Complete SwiftUI preview API guide covering #Preview macro, @Previewable, PreviewModifier, PreviewTrait, canvas modes, Variant Mode, and Development Assets
---

# SwiftUI Previews API Reference

The API reference for building SwiftUI previews: the `#Preview` macro forms, `@Previewable`, `PreviewModifier`, preview traits, canvas modes, and the Xcode 26 known issues.

## When to Use This Reference

Use this reference when:

- Looking up the exact signature of `#Preview` (basic, named, traits, widget, Live Activity forms)
- Checking availability: which Xcode and iOS version added `@Previewable` or `PreviewModifier`
- Choosing between `PreviewTrait` values (`.landscapeLeft`, `.sizeThatFitsLayout`, `.fixedLayout`, `.modifier`)
- Working out what Variants mode varies for you and what needs explicit code
- Setting up Development Assets for preview-only resources
- Debugging "Cannot preview in this file. Failed to launch" in Xcode 26.x
- Migrating from `PreviewProvider`, which the iOS 27 SDK deprecates

## Example Prompts

Questions you can ask your assistant that will draw from this reference:

- "What's the full signature of `#Preview(_:traits:_:body:)`?"
- "How do I write a `PreviewModifier` for shared expensive setup?"
- "Where can I use `@Previewable`? Does it work in UIKit previews?"
- "What's the difference between Live mode, Selectable mode, and Variants mode in the canvas?"
- "How do I preview a widget with a `TimelineProvider` versus specific entries?"
- "What's the workaround for 'Cannot preview in this file. Failed to launch' in Xcode 26?"

## What's Covered

### `#Preview` Macro
- Basic, named, and traits forms; full signatures
- Widget forms: `as:` with `timelineProvider:` or `timeline:`
- Live Activity form: `as:`, `using:`, and `contentStates:`
- `Preview.ViewTraits`

### `@Previewable` Macro (Xcode 16+)
- Inline `DynamicProperty` declarations at the root of a `#Preview` body, with no wrapper view
- Root-scope rule; SwiftUI only, not UIKit or AppKit

### `PreviewModifier` Protocol (Xcode 16+, iOS 18+, macOS 15+)
- `makeSharedContext() async throws -> Context` and `body(content:context:)`
- Shared `@Observable` state and SwiftData `ModelContainer` examples
- Applying it with `traits: .modifier(...)`

### `PreviewTrait`
- `.landscapeLeft`, `.landscapeRight`, `.portrait`, `.portraitUpsideDown`
- `.sizeThatFitsLayout`, `.fixedLayout(width:height:)`, `.modifier(_:)`
- Code traits vs canvas settings

### Canvas
- Modes: Live (default, interactive), Selectable (click an element to highlight its code), Variants (fan out one device setting)
- Variants dimensions Apple confirms: Color Scheme and Dynamic Type; others vary by Xcode version
- Device Settings popover, and combining it with Variants to narrow the matrix
- Preview Device selection

### Development Assets
- Preview-only resources, set up under the target's General tab and stripped from App Store builds

### Xcode Tooling
- Coding intelligence's "Generate a Preview"
- `XCPreviewAgent` for framework and package targets

### Known Issues
- Xcode 26.x "Failed to launch" on framework and package targets
- Cache corruption fix sequence
- `@Previewable` outside `#Preview`
- `ENABLE_PREVIEWS` no longer set in Xcode 16+; `XCODE_RUNNING_FOR_PREVIEWS` instead

### Migration from `PreviewProvider`
- `PreviewProvider` and the `preview*` modifiers are deprecated in the iOS 27 SDK
- Mapping: `previewDisplayName` → name argument, `previewLayout` → `.sizeThatFitsLayout` / `.fixedLayout`, `previewDevice` → canvas dropdown

## Availability Matrix

| API | Xcode | iOS |
|---|---|---|
| `#Preview` (no traits) | 15.0+ | 13.0+ |
| `#Preview(_:traits:_:body:)` | 15.0+ | 17.0+ |
| `PreviewTrait.landscapeLeft` | 15.0+ | 17.0+ |
| `PreviewTrait.sizeThatFitsLayout` | 15.0+ | 17.0+ |
| `PreviewTrait.fixedLayout(width:height:)` | 15.0+ | 17.0+ |
| Widget `#Preview(as:)` | 15.0+ | 17.0+ |
| `PreviewModifier` protocol | 16.0+ | 18.0+ (macOS 15+) |
| `PreviewTrait.modifier(_:)` | 16.0+ | 18.0+ |
| `@Previewable` macro | 16.0+ | 17.0+ (back-deployed) |

## Documentation Scope

This page documents the `previews-ref` skill (in the `axiom-swiftui` suite), which covers the SwiftUI preview API surface. The [swiftui-previews](/skills/ui-design/swiftui-previews) page covers the discipline: the five performance rules, environment setup, the variant matrix, and when not to use previews.

## Related

- [swiftui-debugging](/skills/ui-design/swiftui-debugging) – Diagnoses preview crashes, a different problem from API usage
- [swiftui-performance](/skills/ui-design/swiftui-performance) – Runtime performance, as opposed to preview build speed
- [accessibility-diag](/diagnostic/accessibility-diag) – What to look for in Dynamic Type and right-to-left variants
- [swiftdata](/skills/persistence/swiftdata) – `ModelContainer` setup for SwiftData previews

## Resources

**WWDC**: 2020-10185 (Structure your app for SwiftUI previews), 2023-10252 (Build programmatic UI with Xcode Previews), 2024-10144 (What's new in SwiftUI — `@Previewable`)

**Docs**: /swiftui/preview(_:body:), /swiftui/preview(_:traits:_:body:), /swiftui/previewable(), /swiftui/previewmodifier, /swiftui/previewmodifier/makesharedcontext(), /developertoolssupport/previewtrait
