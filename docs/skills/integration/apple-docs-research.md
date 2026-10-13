---
name: apple-docs-research
description: How your assistant researches Apple APIs beyond the docs bundled in Xcode — the SDK's own declarations, Apple's full documentation through sosumi.ai, and WWDC session transcripts
skill_type: discipline
version: 0.9
---

# Apple Documentation Research

When the guides Xcode bundles don't cover a question, this skill shows your assistant where else to look: the SDK's own declarations, Apple's full documentation as markdown through sosumi.ai, and WWDC session transcripts and code.

## When to Use

Use this skill when you need:
- An API's exact declaration or availability for the SDK you build with
- Apple's documented behavior for an API the bundled Xcode guides don't cover
- The reasoning and recommended patterns behind an API, from a WWDC session
- A WWDC session's transcript or the code shown in it

It isn't for third-party frameworks, or for questions another Axiom skill already answers.

## Example Prompts

Questions you can ask your assistant that will draw from this skill:

- "Is `glassEffect` available on visionOS, and what's its exact signature?"
- "What does Apple's documentation say about `CLMonitor` conditions?"
- "Get me the transcript and code from WWDC 2025 session 278."
- "How did the widget APIs change between iOS 17 and iOS 26?"

## What This Skill Provides

- **Choosing a source** – the SDK's interfaces and headers for declarations and availability, sosumi.ai for documented behavior, a WWDC session for intent, and sample code for complete projects
- **The SDK search** – commands that search every Swift interface, including the standard library's, and every Objective-C header, since a symbol can live in a module other than the one you import, or only in a header
- **sosumi.ai** – the URL pattern that turns any developer.apple.com documentation link into fetchable markdown
- **WWDC transcripts and code** – Xcode's `DocumentationSearch` tool when it's available, how to read a session's Transcript and Code tabs, how to get English captions when a session has no transcript, and what to do when a page can't be opened
- **Research workflows** – answering an API question, researching a new feature, and tracing an API across releases
- **Safeguards** – never writing an API from memory or a transcript, never describing a session from memory, and never driving your own browser window

## Key Pattern

### Confirm every API in the SDK

A transcript or a memory of an API is a lead, not a fact. Before writing code, your assistant confirms the declaration in the SDK you build with:

```bash
SDK=$(xcrun --sdk iphoneos --show-sdk-path)
grep -n 'func glassEffect' "$SDK"/System/Library/Frameworks/*.framework/Modules/*.swiftmodule/*.swiftinterface \
  "$SDK"/usr/lib/swift/*.swiftmodule/*.swiftinterface
grep -n '@interface MKGeocodingRequest' "$SDK"/System/Library/Frameworks/*.framework/Headers/*.h
```

The first match comes from `SwiftUICore`, not `SwiftUI`, which is why the search covers every framework, plus `usr/lib/swift`, where the standard library and Swift overlays live. The second API is declared only in an Objective-C header, so a search of Swift interfaces alone would miss it.

### Read Apple's documentation through sosumi.ai

```
https://developer.apple.com/documentation/widgetkit
https://sosumi.ai/documentation/widgetkit
```

The second URL serves the same page as markdown, which your assistant can fetch and quote. Framework names in the path are lowercase, with spaces and hyphens removed (`appintents`, not `app-intents`).

## Documentation Scope

This page documents the `apple-docs-research` skill (in the `axiom-apple-docs` suite), which your assistant loads when Apple's bundled Xcode guides don't answer a question.

## Related

- [Apple Documentation Access](/skills/integration/apple-docs) – The router this skill belongs to, which reads the guides and compiler diagnostics Apple bundles inside Xcode
- [Xcode MCP Tools](/skills/xcode-mcp/xcode-mcp-tools) – Its `DocumentationSearch` tool searches Apple's documentation and WWDC transcripts when the Xcode MCP bridge is available

## Resources

**WWDC**: All sessions at [developer.apple.com/videos](https://developer.apple.com/videos/)

**Docs**: [sosumi.ai/documentation](https://sosumi.ai/documentation)
