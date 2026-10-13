---
name: swiftdata
description: Use when working with SwiftData — @Model definitions, @Query in SwiftUI, @Relationship macros, ModelContext patterns, CloudKit integration, iOS 26+ and iOS 27 features (sectioned queries, ResultsObserver, HistoryObserver, dynamic compound predicates), and Swift 6 concurrency — Apple's native persistence framework
---

# SwiftData

Apple's native persistence framework using `@Model` classes and declarative queries. Built on Core Data, designed for SwiftUI.

## When to Use

Use this skill when you're:
- Defining `@Model` classes and relationships
- Writing `@Query` in SwiftUI views
- Setting up `ModelContainer` and `ModelContext`
- Integrating CloudKit sync
- Handling Swift 6 concurrency: main-actor contexts, `@ModelActor`, and background contexts
- Migrating from Realm or Core Data

Choose SwiftData for native Apple integration with automatic SwiftUI updates. Use SQLiteData when you want value types or CloudKit record sharing, and GRDB when you need complex raw SQL.

## Example Prompts

Questions you can ask your assistant that will draw from this skill:

- "I have a notes app with folders. How do I filter notes by folder and sort by last modified with `@Query`?"
- "When a user deletes a task list, all its tasks should auto-delete. How do I set up the relationship?"
- "I'm adding CloudKit sync, but I get 'CloudKit integration requires that all attributes be optional, or have a default value set'. What's wrong?"
- "My app loads 100 tasks with relationships slowly. I think it's N+1 queries. How do I fix this?"
- "We're migrating from Realm to SwiftData. What are the biggest code differences?"
- "How do I handle CloudKit sync conflicts in my chat app?"
- "Which properties should I index without slowing down writes?"
- "How do I group `@Query` results into sections by a property?" (iOS 27)
- "I'm using SwiftData in a UIKit controller. How do I observe results outside SwiftUI?" (iOS 27)
- "How do I store a Codable type I don't own as a SwiftData attribute?" (iOS 27)

## What This Skill Provides

### Core Patterns
- `@Model` definitions with `@Attribute` and `@Relationship`
- `@Query` with predicates, sorting, and filtering
- `ModelContainer` setup (SwiftUI app, custom configuration, in-memory for tests)
- `ModelContext` operations (insert, fetch, update, delete, batch)

### CloudKit Integration
- Enabling sync with `ModelConfiguration(cloudKitDatabase:)` and the capabilities it needs
- CloudKit constraints: every property optional or defaulted, and no `@Attribute(.unique)`, plus how to keep uniqueness anyway
- Fixing the "optional or have a default value" error
- Why sync is last-write-wins, with no conflict hooks to write
- Testing CloudKit sync without iCloud

### Performance
- Prefetching relationships to prevent N+1 queries
- Faulting, and when lazy loading helps
- Batch saves and chunked fetches for large datasets
- Indexes with the `#Index` macro (iOS 18+)

### Swift 6 Concurrency
- Why a `@Model` class stays nonisolated — marking it `@MainActor` is a compile error under Swift 6
- Background work through `@ModelActor` or a background `ModelContext`
- Diagnosing "Illegal attempt to establish a relationship between objects in different contexts"

### Class Inheritance
- Base and subclass `@Model` patterns (iOS 26+) and type-based queries with `#Predicate`
- When an enum or a flag is the better choice

### Migration
- Key differences between Realm, Core Data, and SwiftData at a glance
- Pointers to the detailed Realm, schema-migration, and additive-migration guides

### New in the 27 Releases
- `@Query(sectionBy:)` / `SectionedResults` – sectioned queries in SwiftUI
- `ResultsObserver` – observing query results outside SwiftUI
- `HistoryObserver` – push-based history observation
- `@Attribute(.codable)` – a `Codable` escape hatch for class-typed properties SwiftData can't inspect
- `Predicate(all:)` / `Predicate(any:)` – dynamic compound predicates

## Key Pattern

### Preventing N+1 Queries

```swift
// ❌ SLOW: 101 queries (1 + 100 for each album)
let tracks = try modelContext.fetch(FetchDescriptor<Track>())
for track in tracks {
    print(track.album?.title)  // Separate query each time
}

// ✅ FAST: 2 queries total
var descriptor = FetchDescriptor<Track>()
descriptor.relationshipKeyPathsForPrefetching = [\.album]
let prefetched = try modelContext.fetch(descriptor)
for track in prefetched {
    print(track.album?.title)  // Already loaded
}
```

## Documentation Scope

This page documents the `swiftdata` skill (in the `axiom-data` suite) — the SwiftData guidance your assistant uses for models, queries, CloudKit, performance, and concurrency.

## Related

- [swiftdata-migration](/skills/persistence/swiftdata-migration) – custom schema migrations with `VersionedSchema` and `SchemaMigrationPlan`
- [realm-migration-ref](/reference/realm-migration-ref) – moving a Realm app to SwiftData
- [cloud-sync](/skills/persistence/cloud-sync) – sync status, offline handling, and conflict strategies beyond last-write-wins
- [cloudkit-ref](/reference/cloudkit-ref) – CKShare-based record sharing
- [database-migration](/skills/persistence/database-migration) – safe schema evolution for adding or modifying columns
- [sqlitedata](/skills/persistence/sqlitedata) – value-type (struct) alternative with CloudKit record sharing
- [grdb](/skills/persistence/grdb) – raw SQL when you need fine-grained control
- [swift-concurrency](/skills/concurrency/swift-concurrency) – actor isolation patterns for Swift 6

## Resources

**WWDC**: 2023-10187, 2023-10195, 2024-10137, 2026-274, 2026-275

**Docs**: /swiftdata, /swiftdata/model, /swiftdata/query, /swiftdata/adopting-inheritance-in-swiftdata, /swiftdata/sectionedresults
