# Modern Swift Idioms

Corrects the outdated Swift that AI assistants tend to write: legacy APIs, older syntax, and Foundation calls that now have modern replacements.

## When to Use

Use this skill when:
- Reviewing generated Swift code for modern idioms
- You notice your assistant using `Date()`, `CGFloat`, `DateFormatter()`, or other legacy patterns
- Asking "is there a more modern way to do this?"
- Reviewing code for newer Swift APIs, from Swift 5.5 through Swift 6.4

## Example Prompts

Questions you can ask your assistant that will draw from this skill:

- "Review my Swift code for outdated patterns."
- "Is there a more modern way to write this?"
- "Should I use FormatStyle instead of DateFormatter?"
- "Check whether my Foundation usage is current."
- "How do I write availability for all Apple platforms with anyAppleOS?" (Swift 6.4)
- "How do I silence a deprecation warning in just one function?" (Swift 6.4)
- "When should I use isTriviallyIdentical(to:) instead of ==?" (Swift 6.4)

## What This Skill Provides

- **Modern API replacements** – 11 common outdated patterns, each with its modern equivalent and the Swift version that introduced it
- **Modern syntax** – Shorthand optional binding, static member lookup, `if` and `switch` expressions, and why a SwiftUI file doesn't need `import UIKit`
- **Foundation modernization** – URL APIs, `Comparable` sorting, and the `"y"` date format
- **SwiftUI conveniences** – `ContentUnavailableView.search`, `LabeledContent`, and where to attach `confirmationDialog()`
- **Swift 6.4 language features (Xcode 27)** – `anyAppleOS` availability, `weak let`, `~Sendable`, the second memberwise initializer, `@diagnose` for one declaration's warnings, and the `isTriviallyIdentical(to:)` O(1) equality fast path (SE-0494), with guidance on when it helps and when it backfires
- **Swift 6.4 concurrency defaults** – The posture new code should start from: main actor isolation by default, handled `Task` errors, structured concurrency, and escape hatches only as temporary bridges
- **Common AI mistakes** – 14 patterns AI assistants get wrong, such as inline `DateFormatter` instances, `DispatchQueue.main.async`, and `Task.detached` used to reach a background thread

## Philosophy

The skill follows Paul Hudson's principle: "Don't repeat what LLMs already know — focus on edge cases, surprises, soft deprecations."

It is intentionally small, covering only the patterns AI assistants consistently get wrong. General Swift knowledge doesn't need a skill.

## Documentation Scope

This page documents the `swift-modern` skill in the `axiom-swift` suite. It sits in this section because its concurrency defaults overlap with the concurrency skills.

## Related

- [Swift Concurrency](/skills/concurrency/swift-concurrency) – The full async/await, actor, and `Sendable` guidance behind this skill's concurrency defaults
- [Swift Performance](/skills/concurrency/swift-performance) – Low-level optimization (copy-on-write, ARC, generics), as opposed to idiom correctness
- [Modernization Helper](/agents/modernization-helper) – An agent that scans for legacy SwiftUI patterns, such as `ObservableObject` where `@Observable` would do
