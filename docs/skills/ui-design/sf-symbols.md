---
name: sf-symbols
description: Use when implementing SF Symbols rendering modes, symbol effects, animations, custom symbols, or troubleshooting symbol appearance — covers the full effects system from iOS 17 through SF Symbols 7 Draw animations in iOS 26
version: 1.0.0
apple_platforms: iOS 17+, iOS 18+, iOS 26+
---

# SF Symbols

SF Symbols is Apple's library of configurable icons that scale with text and adapt to appearance. This skill covers choosing a rendering mode, picking the right animation effect, and the Draw animations introduced in SF Symbols 7.

## When to Use

Use this skill when you're:
- Choosing between rendering modes (Monochrome, Hierarchical, Palette, Multicolor)
- Adding animation effects to symbols (Bounce, Pulse, Scale, Wiggle, Rotate, Breathe, Draw)
- Deciding which effect fits a specific UX purpose
- Working with SF Symbols 7 Draw On and Draw Off animations (iOS 26+)
- Creating custom symbols with Draw annotation
- Troubleshooting symbol colors, effects not playing, or weight mismatches
- Handling accessibility for animated symbols (Reduce Motion)

## Example Prompts

Questions you can ask your assistant that will draw from this skill:

- "My SF Symbol shows as a flat color but I want it to have depth. How do I fix this?"
- "I want my download button to animate when tapped, then pulse while downloading."
- "How do I use the new SF Symbols 7 Draw animations?"
- "Which symbol effect should I use for a loading indicator?"
- "My custom symbol's Draw animation looks wrong — paths draw in the wrong order."
- "How do I create a symbol that changes from play to pause with a smooth animation?"
- "I need my symbol effects to work on iOS 17 but I want Wiggle on iOS 18+."
- "Does this symbol support Multicolor, or will it fall back to Monochrome?"

## What This Skill Provides

- **Rendering mode decision tree** – which of the four modes fits your design, and how to check from the command line which modes a symbol supports
- **Effect selection guide** – discrete, indefinite, transition, and content-transition effects mapped to UX purposes (tap feedback, loading, show and hide, symbol swap)
- **SF Symbols 7 Draw animations** (iOS 26+) – Draw On and Draw Off, playback modes, Variable Draw, and gradient rendering
- **Custom symbol authoring** – Draw annotation with guide points in the SF Symbols app
- **Anti-patterns and troubleshooting** – the wrong mode, effects that don't play, weight mismatches, missing version checks, and accessibility gaps
- **Pressure scenarios** – pushing back on "just use PNGs" and "we'll add animations later"

## Key Pattern

### Choosing the Right Effect

```swift
// Tap feedback — one-shot bounce
Image(systemName: "arrow.down.circle")
    .symbolEffect(.bounce, value: downloadCount)

// Loading state — continuous pulse
Image(systemName: "network")
    .symbolEffect(.pulse, isActive: isConnecting)

// Symbol swap — replace transition
Image(systemName: isPlaying ? "pause.fill" : "play.fill")
    .contentTransition(.symbolEffect(.replace))

// Hand-drawn entrance (iOS 26+)
Image(systemName: "checkmark.circle")
    .symbolEffect(.drawOn, isActive: isComplete)
```

## Documentation Scope

This page documents the `sf-symbols` skill (in the `axiom-design` suite), which your assistant draws on when you choose a rendering mode, pick a symbol effect, or troubleshoot a symbol.

- For every modifier, the UIKit equivalents, the platform availability matrix, and the `sfsymbols` command-line tool, see [sf-symbols-ref](/reference/sf-symbols-ref)

## Related

- [swiftui-animation-ref](/reference/swiftui-animation-ref) – General SwiftUI animation, for motion that isn't a symbol effect
- [hig-ref](/reference/hig-ref) – Broader icon design guidelines
- [hig](/skills/ui-design/hig) – When SF Symbols beat custom icons, and how to defend that choice

## Resources

**WWDC**: 2023-10257, 2023-10258, 2024-10188, 2025-337

**Docs**: /symbols, /symbols/symboleffect, /swiftui/image/symbolrenderingmode(_:)
