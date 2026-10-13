---
name: realm-migration-ref
description: Migrating from Realm to SwiftData — model and relationship equivalents, threading conversion, data import strategies, CloudKit in place of Realm Device Sync
---

# Realm to SwiftData Migration Reference

Reference for moving an app's Realm database to SwiftData without losing user data: model and relationship equivalents, threading conversion, data import strategies, and CloudKit in place of Realm Device Sync. Realm Device Sync shut down on September 30, 2025, so apps that relied on it no longer have a sync service.

## When to Use This Reference

Use this reference when:
- Planning a move from Realm to SwiftData
- Converting Realm `Object` models to `@Model` classes
- Replacing Realm Device Sync with CloudKit
- Rewriting Realm's per-thread code with actors and `ModelContext`
- Importing an existing Realm database into SwiftData, with progress reporting for large datasets
- Verifying a migration before you remove Realm

## Example Prompts

Questions you can ask your assistant that will draw from this reference:

- "How do I convert my Realm models to SwiftData?"
- "What replaces `@Persisted(primaryKey: true)` in SwiftData?"
- "How do I declare indexes in SwiftData?"
- "Realm Sync is gone. How do I sync with CloudKit instead?"
- "How do I import a million Realm records without running out of memory?"
- "How do I check that every record migrated before I delete the Realm database?"

## What's Covered

### Models
- `Object` → `@Model` `final class`, with an explicit initializer
- `@Persisted(primaryKey: true)` → `@Attribute(.unique)`, which CloudKit sync doesn't support
- `List<T>` → arrays with `@Relationship(deleteRule:inverse:)`
- `@Persisted(indexed: true)` → the `#Index` macro (iOS 18+)

### Threading
- `DispatchQueue` and per-thread `Realm` instances → actors with a shared `ModelContainer` and background `ModelContext`
- `realm.write { }` → `context.insert()` and `context.save()`
- `Thread.isMainThread` checks → `@MainActor`

### Data Import
- Direct conversion for simple schemas (fewer than 5 tables and 10 fields)
- A transformation layer for complex schemas and data cleanup
- Opening Realm isolated to an actor with `Realm(configuration:actor:)`

### CloudKit Sync
- `ModelConfiguration(schema:cloudKitDatabase:)` in place of Realm Sync, whose API Realm 20 removed
- Sync status from `NSPersistentCloudKitContainer` events
- A testing and rollout timeline for the switch to CloudKit

### Migration Scenarios
- Small apps (under 10,000 records): all-at-once import, 1–2 weeks
- Medium apps (100,000–1,000,000 records): chunked import with a progress UI, 3–4 weeks
- Large apps (over 1 million records): gradual batched import with verification and a rollback plan, 6–8 weeks

### Verification and Troubleshooting
- Record counts, spot checks, relationship integrity, CloudKit sync, and query performance
- Common issues: CloudKit's default-value requirement, missing inverses, stuck sync, memory growth during import, and data loss without a backup
- Success criteria, including keeping the Realm database as a backup for two weeks

## Documentation Scope

This page documents the `realm-migration-ref` skill (in the `axiom-data` suite), which your assistant loads when you move a Realm database or Realm Sync code to SwiftData. No agent or command performs the migration; once your models are converted, `/axiom:audit swiftdata` runs the swiftdata-auditor agent to check the new SwiftData code.

## Related

- [swiftdata](/skills/persistence/swiftdata) – SwiftData models, queries, and CloudKit integration for the code you migrate to
- [swiftdata-migration](/skills/persistence/swiftdata-migration) – Versioned schema migrations once your data lives in SwiftData
- [cloudkit-ref](/reference/cloudkit-ref) – CloudKit sync and sharing APIs that take over from Realm Sync
- [swiftdata-auditor](/agents/swiftdata-auditor) – Scans SwiftData code for model, relationship, and migration problems
- [core-data](/skills/persistence/core-data) – Core Data stack and migration patterns, if you move to Core Data instead
- [database-migration](/skills/persistence/database-migration) – Safe schema evolution for SQLite, GRDB, and SQLiteData stores

## Resources

**WWDC**: 2024-10137

**Docs**: /swiftdata
