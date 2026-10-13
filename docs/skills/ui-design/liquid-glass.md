---
name: liquid-glass
description: Use when implementing Liquid Glass effects, reviewing UI for Liquid Glass adoption, debugging visual artifacts, optimizing performance, or requesting expert review of Liquid Glass implementation — provides comprehensive design principles, API patterns, and troubleshooting guidance from WWDC 2025
version: 1.2.0
apple_platforms: iOS 26+, iPadOS 26+, macOS Tahoe+, tvOS 26+, watchOS 26+
---

# Liquid Glass

Liquid Glass is the material design system Apple introduced at WWDC 2025. It bends light (lensing) instead of scattering it, so controls feel light and transparent while staying distinct from the content beneath them.

## When to Use

Use this skill when you're:
- Implementing Liquid Glass effects in your app
- Reviewing existing UI for Liquid Glass adoption opportunities
- Requesting an expert review of a Liquid Glass implementation
- Deciding between the Regular and Clear variants
- Debugging visual artifacts or performance problems with glass
- Troubleshooting tinting, legibility, or adaptive behavior
- Handling design review pressure about material choices
- Planning what happens to the `UIDesignRequiresCompatibility` opt-out when you move to Xcode 27

**Automatic adoption:** Building with Xcode 26 brings Liquid Glass to standard controls with no code changes.

## Example Prompts

Questions you can ask your assistant that will draw from this skill:

- "How is Liquid Glass different from blur effects I've used before? Should I adopt it?"
- "I'm implementing Liquid Glass but the lensing effect looks like a regular blur. What am I missing?"
- "Liquid Glass works great on iPhone but looks odd on iPad. Should I adjust for different screen sizes?"
- "How do I ensure text contrast while using Liquid Glass?"
- "We want to do a design review of our Liquid Glass implementation. What are the expert criteria?"
- "When should I use the Clear variant instead of Regular?"
- "My designer wants the Clear variant everywhere. How do I push back professionally?"
- "Does `UIDesignRequiresCompatibility` still work after I update to Xcode 27?"

## What This Skill Provides

### Visual Properties
- Lensing, the primary characteristic: bending light rather than scattering it
- Motion and fluidity: gel-like flexing in response to touch
- Adaptive behavior: content-aware shadows and tint, with no fixed light or dark appearance

### Variants
- **Regular** (the default, for 95% of cases) – full adaptive behavior and automatic legibility
- **Clear** (special cases only) – requires all three conditions: media-rich content behind it, an acceptable dimming layer, and bold, bright content on top

### Implementation
- `glassEffect()` basics for custom views on iOS, iPadOS, macOS, tvOS, and watchOS (visionOS has its own glass material and uses `glassBackgroundEffect()`)
- The `.glass` and `.glassProminent` button styles, and tinting through `Glass.tint(_:)`
- `scrollEdgeEffectStyle(_:for:)` for extra separation under pinned headers
- Migrating from `UIBlurEffect` and `NSVisualEffectView`, and mixing UIKit and SwiftUI glass
- The `UIDesignRequiresCompatibility` opt-out, and why building with the 27 SDK ends it on iOS 27

### Design Principles
- Reserve glass for the navigation layer, not content
- Never stack glass on glass
- Avoid content intersections in steady states
- Tint primary actions only

### Review and Troubleshooting
- A seven-part expert review checklist, from material choice to performance
- The accessibility settings glass adapts to automatically (Reduce Transparency, Increase Contrast, Reduce Motion) and the configurations to test
- Visual artifacts (too transparent, opaque, harsh edges), dark mode issues, and janky scrolling or animation
- A known iOS 26 limitation: a tab bar or navigation bar pill stuck in the wrong glass variant, and why no modifier fixes it

### Pressure Scenarios
- A four-step way to push back in design reviews
- When to accept a design decision instead of defending the guidelines
- A template for documenting an overruled decision

## Key Pattern

### Regular vs Clear Decision

```swift
// ✅ Regular (default) — use for 95% of cases
Button("Action") { }
    .glassEffect()

// ⚠️ Clear — ONLY when ALL THREE conditions met:
// 1. Over media-rich content
// 2. Dimming layer acceptable
// 3. Bold, bright content above
ZStack {
    VideoPlayer(player: player)
        .overlay(.black.opacity(0.4))  // Dimming layer required

    PlayButton()
        .glassEffect(.clear)
}
```

## Documentation Scope

This page documents the `liquid-glass` skill (in the `axiom-design` suite), which your assistant draws on when you adopt, review, or debug Liquid Glass.

- For the full API (`GlassEffectContainer`, morphing with `glassEffectID`, toolbar and search placement, the UIKit migration table) and app-wide adoption, see [liquid-glass-ref](/reference/liquid-glass-ref)

## Related

- [liquid-glass-auditor](/agents/liquid-glass-auditor) – Agent that scans your code for adoption opportunities and gaps; run it with [/axiom:audit-liquid-glass](/commands/ui-design/audit-liquid-glass)
- [swiftui-26-ref](/reference/swiftui-26-ref) – The rest of the iOS 26 SwiftUI API, including where `.toolbarBackground` must go for tab bars
- [swiftui-performance](/skills/ui-design/swiftui-performance) – Profiling when scrolling or animation stutters under glass
- [hig](/skills/ui-design/hig) – The broader Human Interface Guidelines behind these design decisions

## Resources

**WWDC**: 2025-219, 2025-256, 2025-323

**Docs**: /technologyoverviews/adopting-liquid-glass, /swiftui/landmarks-building-an-app-with-liquid-glass, /swiftui/applying-liquid-glass-to-custom-views, /bundleresources/information-property-list/uidesignrequirescompatibility
