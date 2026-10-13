---
name: sf-symbols-ref
description: Complete SF Symbols API reference — rendering modes, symbol effects, configuration options, UIKit equivalents, custom symbols, and platform availability matrix
---

# SF Symbols Reference

An API reference for SF Symbols rendering modes, symbol effects, configuration options, and their UIKit/AppKit equivalents, from iOS 13 symbol display through iOS 26 Draw animations and gradient rendering.

## When to Use This Reference

Use this reference when:
- You need exact API signatures for rendering modes or symbol effects
- You need UIKit/AppKit equivalents for SwiftUI symbol APIs
- You need platform availability for a specific effect or rendering mode
- You need configuration options (weight, scale, variable values)
- You need custom symbol template structure and Draw annotation details
- You want to verify a symbol name exists, or check one symbol's availability and supported rendering modes, without opening the SF Symbols app

## Example Prompts

Questions you can ask your assistant that will draw from this reference:

- "What's the exact SwiftUI modifier for Hierarchical rendering?"
- "How do I add a Bounce effect in UIKit?"
- "Which symbol effects are available on iOS 17 vs iOS 18?"
- "How do I combine rendering mode with symbol effects?"
- "What's the UIKit equivalent of `.contentTransition(.symbolEffect(.replace))`?"
- "How do I create a custom symbol with Draw animation support?"
- "Is `gauge.with.needle` a real symbol name, and does it exist on iOS 16?"
- "Which rendering modes does this symbol actually support?"
- "How do I export a symbol to SVG or PNG from the command line?"

## What's Covered

- **Symbol display** – SwiftUI, UIKit, and AppKit configuration APIs (weight, scale, variable value)
- **Rendering modes** – monochrome, hierarchical, palette, and multicolor, with SwiftUI and UIKit signatures
- **Symbol effects** – Bounce, Pulse, Variable Color, Scale, Wiggle, Rotate, Breathe, Appear, Disappear, and Replace, with `SymbolEffectOptions` and the effect protocols
- **Draw and gradients (iOS 26)** – Draw On, Draw Off, Variable Draw (`symbolVariableValueMode(.draw)`), gradient rendering (`SymbolColorRenderingMode`)
- **UIKit reference** – `addSymbolEffect()`, `removeSymbolEffect()`, `setSymbolImage()`, completion handlers, `UIBarButtonItem` effects
- **Custom symbols** – template structure, Draw annotation, weight interpolation, importing to Xcode
- **Platform availability matrix** – when each rendering mode and effect arrived on iOS, macOS, watchOS, tvOS, and visionOS
- **The `sfsymbols` CLI** – `search` and `export`; where the binary lives (inside the SF Symbols app, not in Xcode and not on your `PATH`); per-symbol, per-rendering-mode availability via `--json`; `--min-platform` deployment-target filtering; and why a zero-result search still exits 0
- **Accessibility** – labels, Reduce Motion, Bold Text, Dynamic Type
- **Common patterns** – notification badge, Wi-Fi strength, animated play/pause toggle, download progress, multi-state symbol with Draw

## Documentation Scope

This page documents the `sf-symbols-ref` skill (in the `axiom-design` suite), the API lookup half of the SF Symbols pair. Decision trees, anti-patterns, and troubleshooting live in the `sf-symbols` skill listed under Related.

## Related

- [SF Symbols](/skills/ui-design/sf-symbols) – Decision trees, anti-patterns, troubleshooting, and which effect to use when
- [SwiftUI Animation](/reference/swiftui-animation-ref) – General animation reference (`VectorArithmetic`, `@Animatable`, springs)
- [HIG Reference](/reference/hig-ref) – Icon and symbol design guidelines
- [Typography](/reference/typography-ref) – SF Pro font that symbols are designed to match

## Resources

**WWDC**: 2023-10257, 2023-10258, 2024-10188, 2025-337

**Docs**: /symbols, /symbols/symboleffect, /uikit/uiimage/symbolconfiguration
