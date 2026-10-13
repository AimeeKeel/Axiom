# Apple Documentation Access

Points your assistant to Apple's own for-LLM markdown documentation, which ships inside Xcode: 20 framework guides and 46 Swift compiler diagnostic explanations, written by Apple engineers.

## When to Use

Use this skill when:
- You need the exact API signature or behavior from Apple
- A Swift compiler diagnostic needs an explanation with examples
- An Axiom skill references an Apple framework and you want the official source
- You want Apple's own code examples for Liquid Glass, Foundation Models, SwiftData, or Swift concurrency

**Priority**: Axiom skills provide opinionated guidance (decision trees, anti-patterns, pressure scenarios). Apple's docs provide authoritative API details. Use both together.

## Example Prompts

- "What does the Swift compiler error 'actor-isolated call from nonisolated context' mean?"
- "Show me Apple's official guide for implementing Liquid Glass in SwiftUI"
- "How does Apple recommend using Foundation Models on-device?"
- "What's the official pattern for SwiftData class inheritance?"

## What This Skill Provides

### Guide Topics (20)

- **UI & Design** – Liquid Glass (SwiftUI, UIKit, AppKit, WidgetKit), toolbar features, styled text editing, WebKit integration, AlarmKit integration, Swift Charts 3D, Foundation `AttributedString`
- **Data & Persistence** – SwiftData class inheritance
- **Concurrency & Performance** – Swift concurrency updates, `InlineArray` and `Span`
- **Apple Intelligence** – Foundation Models (the on-device LLM)
- **System Integration** – App Intents updates, StoreKit updates, MapKit GeoToolbox place descriptors, widgets for visionOS
- **Accessibility** – Assistive Access in iOS
- **Computer Vision** – Visual Intelligence in iOS

### Swift Compiler Diagnostics (46)

Official explanations with code examples for concurrency errors (actor isolation, `Sendable`, data races), type system diagnostics (existential `any`, opaque types, protocol conformance), build and migration diagnostics (deprecated declarations, strict language features, module visibility), and Swift language diagnostics (property wrappers, result builders, temporary pointers), plus an index of diagnostic groups.

## How It Works

Apple bundles for-LLM markdown documentation inside Xcode in two places:
- **AdditionalDocumentation** – Framework guides with implementation patterns
- **Swift diagnostics** – Compiler error and warning explanations with before-and-after code

Your assistant reads these files directly from the Xcode you've selected, so they stay current when Xcode updates. MCP clients can also fetch the same files through Axiom's MCP server. If no Xcode with these docs is installed, the skill falls back to sosumi.ai and tells you which source it used.

### Configuration

| Variable | Default | Purpose |
|----------|---------|---------|
| `AXIOM_XCODE_PATH` | The Xcode `xcode-select` points to (honoring `DEVELOPER_DIR`) | Read a different Xcode's docs than the one you've switched to |
| `AXIOM_APPLE_DOCS` | `true` | MCP server only: set to `false` to leave Apple's docs out of the server's catalog |

## Documentation Scope

This page documents the `axiom-apple-docs` router skill. The router maps your question to a specific Apple guide or diagnostic file; MCP clients address the same files by legacy IDs that start with `apple-guide-` or `apple-diag-`.

- For every MCP server setting, see the [MCP setup guide](/start/mcp-install)

## Related

- [Apple Documentation Research](/skills/integration/apple-docs-research) – This router's companion skill for researching WWDC transcripts and sosumi.ai
- [Foundation Models](/skills/integration/foundation-models) – Axiom's opinionated Foundation Models guidance
- [Swift 6 Concurrency](/skills/concurrency/swift-concurrency) – Axiom's Swift 6 concurrency patterns
- [Liquid Glass](/skills/ui-design/liquid-glass) – Axiom's Liquid Glass implementation guidance
