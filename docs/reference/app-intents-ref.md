---
name: app-intents-ref
description: App Intents for Siri, Apple Intelligence, Shortcuts, Spotlight integration
---

# App Intents Reference

Complete API reference for App Intents framework. Covers AppIntent protocol, AppEntity, parameter handling, entity queries, and integration with Siri, Apple Intelligence, Shortcuts, and Spotlight.

## When to Use This Reference

Use this reference when you need:
- AppIntent and AppEntity protocol implementation
- Parameter types and validation patterns
- Entity queries for Siri disambiguation
- Siri voice command integration
- Shortcuts app action creation
- Spotlight search indexing
- Apple Intelligence integration
- Automated tests that run your intents through the system (iOS 27)

**For quick start:** Define an AppIntent, add parameters, implement perform().

## Example Prompts

Questions you can ask Claude that will draw from this reference:

- "How do I create an AppIntent for Siri?"
- "How do I implement an AppEntity with queries?"
- "How do I add dynamic options for Siri disambiguation?"
- "Why isn't my intent showing up in Shortcuts?"
- "How do I handle authentication in App Intents?"
- "How do I index my intents for Spotlight search?"
- "How do I adopt an app schema so Siri can drive my app? (iOS 27)"
- "How do I write automated tests for my App Intents? (iOS 27)"
- "Why does my App Intents test say the intent doesn't exist?"

## What's Covered

### Core Protocols
- AppIntent definition and perform()
- AppEntity with display representations
- EntityQuery for finding entities
- Parameter types and validation

### Siri Integration
- Voice command handling
- Disambiguation prompts
- Confirmation dialogs
- Error messages for voice

### Authentication & Security
- IntentAuthenticationPolicy (iOS 16+)
- Schema-inherited policies and risk-based confirmations (OS 27)
- App Schemas — `@AppEntity`/`@AppIntent`/`@AppEnum(schema:)` macros + system schema domains (debuted iOS 18; domains expanded iOS 27: Calendar, Maps, Phone, Reminders, Notes, ImageGeneration, AppStore, Audio, Clock)
- Xcode schema-completeness build errors with fix-its (iOS 27)

### Apple Intelligence
- Smart suggestions
- Contextual actions
- Proactive recommendations
- System integration

### Shortcuts App
- Action discovery
- Parameter customization
- Multi-step workflows
- Background execution

### Spotlight Search
- Intent indexing
- Search result actions
- Deep linking patterns

### Visual Intelligence
- Visual Intelligence integration (IntentValueQuery, SemanticContentDescriptor)
- Computed and deferred properties (@ComputedProperty, @DeferredProperty)
- Intent modes and background-to-foreground transitions
- Interactive snippets (SnippetIntent)

### Testing (iOS 27)
- AppIntentsTesting — `IntentDefinitions`, `makeIntent`, `run()`, `ResolvedIntentResult`
- Passing strings, enums, entities, transient entities, and your own wrapper types as parameters
- Which entity properties a test can read
- Spotlight (`spotlightQuery`), on-screen annotations (`viewAnnotations`), and Transferable round trips
- Error reference: wrong bundle type, stale intent metadata, misspelled parameters, the 30-second timeout
- Running the tests with Swift Testing instead of XCTest

### Debugging
- Shortcuts app debugging
- Siri transcript logging

## Key Pattern

### Simple AppIntent

```swift
struct OrderCoffeeIntent: AppIntent {
    static var title: LocalizedStringResource = "Order Coffee"

    @Parameter(title: "Coffee Type")
    var coffeeType: CoffeeType

    func perform() async throws -> some IntentResult {
        // Order coffee
        return .result()
    }
}
```

### AppEntity with Query

```swift
struct SongEntity: AppEntity {
    var id: String
    var title: String

    static var typeDisplayRepresentation: TypeDisplayRepresentation = "Song"

    var displayRepresentation: DisplayRepresentation {
        DisplayRepresentation(title: "\(title)")
    }

    static var defaultQuery = SongEntityQuery()
}

struct SongEntityQuery: EntityQuery {
    func entities(for identifiers: [String]) async throws -> [SongEntity] {
        // Fetch songs by ID
    }

    func suggestedEntities() async throws -> [SongEntity] {
        // Return popular songs for Siri
    }
}
```

## Documentation Scope

This page documents the `app-intents-ref` reference skill in the `axiom-integration` suite — complete API coverage Claude uses when you need specific App Intents APIs, integration patterns, or automated intent tests.

**For troubleshooting:** If an intent doesn't show up, first check that it isn't marked `isDiscoverable = false`. Then launch the app once after installing the new build. The intent list is compiled into the app bundle (not Info.plist), and in testing on the iOS 27 simulator the system kept serving the previous build's intents after a reinstall until the app launched — a minute of retries didn't refresh it.

## Related

- [app-shortcuts-ref](/reference/app-shortcuts-ref) – Wraps the intents defined here in App Shortcuts so they work in Siri and Spotlight with no user setup
- [core-spotlight-ref](/reference/core-spotlight-ref) – Indexes the entities your intents operate on, so they appear in Spotlight search
- [ui-testing](/skills/ui-design/ui-testing) – Where AppIntentsTesting tests live: they must run from a UI test target
- [extensions-widgets](/skills/integration/extensions-widgets) – Interactive widgets and Control Center controls run App Intents for their buttons and toggles

## Resources

**WWDC**: 2026-295 (App Intents testing), 2025-260 (App Intents), 2023-10103 (Dive into App Intents), 2022-10170 (App Shortcuts)

**Docs**: /appintents, /appintents/appintent, /appintents/appentity, /appintentstesting
