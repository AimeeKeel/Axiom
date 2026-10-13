---
name: swiftui-animation-ref
description: Comprehensive SwiftUI animation API reference from iOS 13 through iOS 26
skill_type: reference
version: 1.1
---

# SwiftUI Animation Reference

API reference for SwiftUI animation, from the `VectorArithmetic` foundation through the `@Animatable` macro, springs, multi-step animations, zoom transitions, and UIKit/AppKit bridging.

## When to Use This Reference

Use this reference when you:
- Need to know why a property won't animate, or how `VectorArithmetic` and `Animatable` fit together
- Want the `@Animatable` macro to replace a hand-written `animatableData`
- Are choosing between spring presets and timing curves
- Are building a multi-step animation with `PhaseAnimator` or `KeyframeAnimator`
- Are implementing a zoom navigation transition
- Want SwiftUI animations to drive UIKit or AppKit views
- Are writing a custom animation algorithm with `CustomAnimation`

## Example Prompts

Questions you can ask your assistant that will draw from this reference:

- "Why can't I animate an `Int` property?"
- "How do I use the `@Animatable` macro?"
- "What's the difference between `Animation.spring` and `Animation.bouncy`?"
- "How do I implement a zoom navigation transition?"
- "How do I animate a `UIView` with a SwiftUI animation?"
- "What is `VectorArithmetic` and why does it matter?"
- "When should I use `KeyframeAnimator` instead of `PhaseAnimator`?"

## What's Covered

### Animation Fundamentals
- Interpolation, model values vs presentation values
- `VectorArithmetic` and its conforming types (`CGFloat`, `Double`, `Float`, `AnimatablePair`, `EmptyAnimatableData`)
- Geometry types (`CGPoint`, `CGSize`, `Angle`) as `Animatable`, with a `VectorArithmetic` projection
- Why `Int` can't animate; `.contentTransition(.numericText(value:))` for counters

### Animatable Protocol (iOS 13+)
- The `animatableData` requirement, and why it must be `nonisolated` on a `View`
- `AnimatablePair` for multiple values
- Built-in animatable modifiers and shapes
- The per-frame `body` cost of custom conformance

### @Animatable Macro (Xcode 26 SDK+)
- Automatic `animatableData` synthesis (`AnimatableValues` on iOS 26+, `AnimatablePair` below)
- `@AnimatableIgnored` for excluded properties
- Availability: declared for iOS 13, so your deployment target doesn't gate it

### Animation Types
- Timing curves: `linear`, `easeIn`, `easeOut`, `easeInOut`, custom `UnitCurve`
- Springs: `smooth`, `snappy`, `bouncy`, `spring(duration:bounce:)`
- Higher-order: `delay`, `repeatCount`, `repeatForever`, `speed`
- `Animation.default` becomes a spring in iOS 17

### Transaction System
- `withAnimation` and the `.animation(_:value:)` modifier
- Scoped animations (iOS 17+)
- Custom `TransactionKey` values with `withTransaction`

### Advanced Animation
- The `CustomAnimation` protocol (`animate`, `shouldMerge`, `velocity`)
- Merging: timing curves combine, springs retarget and keep velocity

### Multi-Step Animations and Transitions (iOS 17+)
- `PhaseAnimator`, `KeyframeAnimator` and its keyframe types
- `.transition()`, `matchedGeometryEffect`, `contentTransition`

### Zoom Transitions (iOS 18+)
- `.navigationTransition(.zoom(sourceID:in:))` and `matchedTransitionSource`
- Zoom with `fullScreenCover` and `sheet`
- UIKit `preferredTransition`

### UIKit/AppKit Bridging (iOS 18+)
- `UIView.animate(_:)` with SwiftUI `Animation` values
- `context.animate()` in `UIViewRepresentable`
- Gesture-driven animations that keep velocity

### Troubleshooting
- Property not animating, stuttering custom animations, unexpected merging

## Key Patterns

### Custom Animatable Type

```swift
// Without the macro: manual conformance
struct GradientPosition: Animatable {
    var startX: CGFloat
    var startY: CGFloat

    var animatableData: AnimatablePair<CGFloat, CGFloat> {
        get { AnimatablePair(startX, startY) }
        set {
            startX = newValue.first
            startY = newValue.second
        }
    }
}

// Xcode 26 SDK+: the macro synthesizes animatableData
@Animatable
struct GradientPosition {
    var startX: CGFloat
    var startY: CGFloat
    @AnimatableIgnored var name: String  // Not animated
}
```

### Animation Types

```swift
.animation(.smooth, value: isExpanded)                              // Spring, no bounce
.animation(.snappy, value: isExpanded)                              // Spring, small bounce
.animation(.bouncy, value: isExpanded)                              // Spring, larger bounce
.animation(.spring(duration: 0.6, bounce: 0.3), value: isExpanded)  // Custom spring
.animation(.easeInOut(duration: 0.3), value: isExpanded)            // Timing curve
```

### Zoom Transition

```swift
NavigationLink {
    DetailView(item: item)
        .navigationTransition(.zoom(sourceID: item.id, in: namespace))  // Destination
} label: {
    ItemPreview(item: item)
}
.matchedTransitionSource(id: item.id, in: namespace)                     // Source
```

## Documentation Scope

This page documents the `animation-ref` skill (in the `axiom-swiftui` suite), the animation API reference your assistant uses for implementation details.

## Related

- [swiftui-debugging](/skills/ui-design/swiftui-debugging) – Diagnoses views and animations that don't update
- [swiftui-performance](/skills/ui-design/swiftui-performance) – Profiles animations that drop frames
- [swiftui-nav-ref](/reference/swiftui-nav-ref) – Navigation APIs that zoom transitions plug into
- [swiftui-26-ref](/reference/swiftui-26-ref) – Other SwiftUI APIs new in iOS 26
- [sf-symbols-ref](/reference/sf-symbols-ref) – Symbol effects, including `.contentTransition(.symbolEffect(.replace))`

## Resources

**WWDC**: 2023-10156 (Explore SwiftUI animation), 2023-10157 (Wind your way through advanced animations in SwiftUI), 2023-10158 (Animate with springs), 2024-10145 (Enhance your UI animations and transitions), 2025-256 (What's new in SwiftUI)

**Docs**: /swiftui/animation, /swiftui/animatable, /swiftui/vectorarithmetic, /swiftui/transaction
