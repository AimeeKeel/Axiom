---
name: textkit-ref
description: Reference — Complete TextKit 2 guide covering architecture, migration from TextKit 1, Writing Tools integration, and SwiftUI TextEditor with AttributedString through iOS 27
---

# TextKit 2 Reference

Reference for Apple's TextKit 2 framework, covering custom text rendering, rich text editing and Writing Tools integration. It spans the architecture, migration from TextKit 1, and the iOS 26 and 27 additions.

## When to Use This Reference

Use this reference when you're:
- Building custom text views or rich text editors
- Migrating from TextKit 1 to TextKit 2
- Integrating Writing Tools (iOS 18+)
- Working with SwiftUI `TextEditor` and `AttributedString` (iOS 26+)
- Debugging text layout issues or unexpected fallbacks to TextKit 1
- Customizing rendering surfaces or attachment view recycling from inside a `UITextView` subclass (iOS 27+)
- Checking grammar programmatically with `UITextChecker`, styling individual edges of a text block, or hit-testing text drawn through a transform (iOS 27+)

If you're using standard `Text`, `TextField` or `UILabel`, you probably don't need TextKit 2. It is for custom text rendering, syntax highlighting, or rich text editing beyond what the built-in controls provide.

## Example Prompts

Questions you can ask your assistant that will draw from this reference:

- "How do I migrate my text view from TextKit 1 to TextKit 2?"
- "Why is my `UITextView` falling back to TextKit 1?"
- "How do I count lines in TextKit 2 without glyph APIs?"
- "How do I integrate Writing Tools with my custom text editor?"
- "How do I use `AttributedString` with SwiftUI `TextEditor` in iOS 26?"
- "What's the difference between `NSTextRange` and `NSRange`?"
- "How do I customize text fragment rendering inside a `UITextView` without losing input or accessibility?"
- "How do I recycle inline attachment views in my text editor?"
- "How do I run grammar checking on a string with `UITextChecker`?"
- "How do I put a border on only the bottom edge of an `NSTextBlock` on iOS?"
- "My custom text view draws rotated text. How do I make taps select the right characters?"

## What's Covered

### Core Architecture
- Three-layer MVC pattern (Model, Controller, View)
- `NSTextContentManager`, `NSTextLayoutManager`, `NSTextViewportLayoutController`
- Object-based ranges (`NSTextLocation`, `NSTextRange`) vs integer indices
- Design principles: no glyph APIs, value semantics, viewport layout

### Migration from TextKit 1
- Paradigm shift from glyphs to elements, and API naming heuristics
- `NSRange` ↔ `NSTextRange` conversion patterns
- Glyph API replacements, such as counting lines by enumerating layout fragments
- Fallback triggers to avoid (accessing `.layoutManager` causes a one-way fallback), and how to debug a fallback
- `NSTextView` opt-in on macOS, and `UITextView(usingTextLayoutManager:)`

### Delegates and Practical Patterns
- `NSTextContentStorageDelegate`, `NSTextLayoutManagerDelegate`, the viewport layout controller delegate
- Custom layout fragments, rendering attributes, text attachments with a `UIView`
- `NSTextList` (UIKit from iOS 16)
- Hit testing and selection geometry

### Writing Tools (iOS 18+)
- TextKit 2 requirement for the full experience
- Lifecycle delegate methods and `isWritingToolsActive`
- `writingToolsBehavior` and result options
- Protected ranges for code blocks and quotes
- Writing Tools Coordinator for custom text engines (iOS 18.2+)
- `PresentationIntent` results (iOS 26+)

### SwiftUI TextEditor (iOS 26+)
- `AttributedString` binding
- Custom formatting definitions
- Value constraints
- Selection handling and selection affinity
- `AttributedString` text alignment and line height control
- Programmatic selection replacement
- `DiscontiguousAttributedSubstring` for non-contiguous selections
- Custom attributes, `AttributedString` mutations and views

### Viewport Rendering Surfaces and Attachment Reuse (27 Cycle)
- `NSTextViewportRenderingSurface` – render text fragments from a custom view without building a full custom text engine
- Subclassable viewport delegate on framework text views – override `NSTextViewportLayoutControllerDelegate` hooks directly inside a `UITextView` subclass
- `registerTextAttachmentViewProviderReusePolicy(_:forTextAttachmentViewProviderType:)` – recycle inline attachment views instead of rebuilding them
- Collapsible content via `shouldEnumerate` – exclude collapsed paragraphs from layout using the `NSTextContentStorageDelegate`

### Text Blocks, Hit Testing and Grammar Checking (27 Cycle)
- Per-edge `NSTextBlock` borders, padding, and margins – `setBorderColor(_:rectEdge:)`, `borderColor(for:)`, `setWidth(_:type:for:rectEdge:)`, `width(for:rectEdge:)`, `widthValueType(for:rectEdge:)`
- Transformed-text hit testing – `NSTextSelectionDataSource.convertInteractionPoint(_:toContainerAt:)`
- Grammar checking – `UITextChecker.requestGrammarChecking(of:range:waitForAllResults:)`, `ignoreGrammarRange(_:inSentence:)`, and the macOS-only `grammarDetails` keys

## Documentation Scope

This page documents the `textkit-ref` skill (in the `axiom-uikit` suite), the reference your assistant uses when answering TextKit 2 questions. The skill holds the detailed API documentation, code examples and migration patterns that this page only indexes.

## Key Patterns

### Checking for TextKit 2 (Critical)

Check `textLayoutManager` before `layoutManager`, so the check itself never triggers the fallback:

```swift
// ✅ GOOD: Check TextKit 2 first
if let textLayoutManager = textView.textLayoutManager {
    // TextKit 2 code
} else if let layoutManager = textView.layoutManager {
    // TextKit 1 fallback only for old OS
}

// ❌ BAD: Accessing .layoutManager triggers one-way fallback
if let layoutManager = textView.layoutManager {
    // You're now stuck in TextKit 1!
}
```

### Creating a TextKit 2 Text View

```swift
// iOS 16+ / macOS 13+
let textView = UITextView(usingTextLayoutManager: true)
```

### Writing Tools Integration

```swift
// Lifecycle awareness
func textViewWritingToolsWillBegin(_ textView: UITextView) {
    isSyncing = false  // Pause syncing during Writing Tools
}

func textViewWritingToolsDidEnd(_ textView: UITextView) {
    isSyncing = true  // Resume syncing
}
```

## Known Limitations

- **One-way fallback** – Accessing `.layoutManager` permanently switches to TextKit 1
- **No glyph APIs** – Use `NSTextLocation` and layout fragments instead
- **`NSTextTable` unsupported** – Use `NSTextList` or custom layouts
- **Viewport scroll instability** – `usageBoundsForTextContainer` changes during scrolling, a trade-off for viewport performance
- **`AttributedString` index invalidation** – Any mutation invalidates indices; use `.transform(updating:)` to keep them valid

## Related

- [textkit-auditor](/agents/textkit-auditor) – scans your codebase for TextKit 1 fallback triggers, glyph-based APIs and missing Writing Tools configuration
- [typography-ref](/reference/typography-ref) – fonts, text styles and Dynamic Type

## Resources

**WWDC**: 2021-10061, 2022-10090, 2023-10058, 2024-10168, 2025-265, 2025-280, 2026-370

**Docs**: /uikit/nstextlayoutmanager, /uikit/writing-tools, /swiftui/building-rich-swiftui-text-experiences, /uikit/uitextchecker
