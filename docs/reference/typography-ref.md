---
name: typography-ref
description: Apple platform typography reference with San Francisco fonts, text styles, and Dynamic Type
---

# Typography Reference

Reference for typography on Apple platforms through iOS 26. It covers the San Francisco font system, text styles, Dynamic Type, tracking and leading, and international text.

## When to Use This Reference

Use this reference when you need:
- San Francisco font family details
- Text style sizes and scaling behavior
- Dynamic Type implementation patterns
- Font weight and width options
- Optical size behavior
- Tracking and line-spacing values
- International typography considerations

## Example Prompts

Questions you can ask your assistant that will draw from this reference:

- "What are all the San Francisco font variants?"
- "What's the default size for each text style?"
- "How do optical sizes work in SF Pro?"
- "How do I use SF Mono for code?"
- "What font widths are available in SF Pro?"
- "How do I support Dynamic Type in my app?"
- "Why does the same text style render smaller on the Mac?"
- "Why does Chinese text clip in my fixed-height rows?"

## What's Covered

### San Francisco Font System
- SF Pro and SF Pro Rounded (iOS, iPadOS, macOS, tvOS)
- SF Compact and SF Compact Rounded (watchOS, narrow columns)
- SF Mono (monospaced, code)
- New York (serif)
- SF Arabic (right-to-left)

### Variable Font Axes
- Weight (9 weights, Ultralight to Black)
- Width (Condensed, Compressed, Regular, Expanded)
- Optical sizes (automatic switching between text and display variants)

### Text Styles
- `largeTitle` through `caption2`, with default sizes
- Emphasized (bold) variants
- Tight and loose leading variants
- Scaling with Dynamic Type

### Dynamic Type
- Automatic scaling from the user's Text Size setting
- Text style adoption in SwiftUI and UIKit
- Custom font scaling with `UIFontMetrics`, `relativeTo:`, and `@ScaledMetric`
- Testing at accessibility sizes

### Platform Differences
- Mac typographic density (measured text-style sizes compared with iOS)
- Mac Catalyst scaling
- watchOS and visionOS behavior

### Tracking and Leading
- Tracking (letter spacing) and leading (line spacing) values
- Tracking for third-party fonts
- Font attributes in `AttributedString` and how they interact with the `.font()` modifier

### Internationalization
- Bidirectional text and complex scripts
- Language-aware line breaking
- CJK density in compact widths (line height, per-character wrapping, `typesettingLanguage`, Hangul word priority)
- Preventing text clipping

### Web Typography
- CSS system font families (`system-ui`, `ui-rounded`, `ui-serif`, `ui-monospace`)

## Key Patterns

### Text Styles in SwiftUI

```swift
// System text styles (automatic Dynamic Type)
Text("Large Title").font(.largeTitle)    // 34pt default
Text("Title").font(.title)                // 28pt
Text("Title 2").font(.title2)             // 22pt
Text("Title 3").font(.title3)             // 20pt
Text("Headline").font(.headline)          // 17pt semibold
Text("Body").font(.body)                  // 17pt
Text("Callout").font(.callout)            // 16pt
Text("Subheadline").font(.subheadline)    // 15pt
Text("Footnote").font(.footnote)          // 13pt
Text("Caption").font(.caption)            // 12pt
Text("Caption 2").font(.caption2)         // 11pt
```

### Font Weights

```swift
.fontWeight(.ultraLight)  // Avoid at small sizes
.fontWeight(.thin)        // Avoid at small sizes
.fontWeight(.light)       // Avoid at small sizes
.fontWeight(.regular)     // Default
.fontWeight(.medium)
.fontWeight(.semibold)    // Headlines
.fontWeight(.bold)        // Emphasis
.fontWeight(.heavy)
.fontWeight(.black)
```

### Custom Font with Dynamic Type

```swift
// SwiftUI: scale a custom font with the body text style
Text("Custom")
    .font(.custom("Helvetica", size: 17, relativeTo: .body))

// UIKit: scale with UIFontMetrics
let metrics = UIFontMetrics(forTextStyle: .body)
label.font = metrics.scaledFont(for: UIFont(name: "Helvetica", size: 17)!)
label.adjustsFontForContentSizeCategory = true
```

## Documentation Scope

This page documents the `typography-ref` skill in the `axiom-design` suite. Your assistant draws on it for specific font details, text style sizes, and Dynamic Type patterns.

- For text layout and editing with TextKit 2, see [textkit-ref](/reference/textkit-ref)
- For choosing iPad or Mac metrics in a Mac Catalyst app, see [iOS Apps on Mac](/skills/macos/ios-apps-on-mac)

## Related

- [hig](/skills/ui-design/hig) – Quick design decisions, including which font weight to use
- [hig-ref](/reference/hig-ref) – The full Human Interface Guidelines reference, which places typography alongside color, spacing, and icons
- [accessibility-auditor](/agents/accessibility-auditor) – Scans your code for Dynamic Type and custom-font scaling problems

## Resources

**WWDC**: 2020-10175, 2022-110381, 2023-10058

**Docs**: /uikit/uifontdescriptor, /uikit/uifontmetrics, /swiftui/font
