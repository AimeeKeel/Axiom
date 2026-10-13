---
name: core-data-diag
description: Schema migration crashes, thread-confinement violations, N+1 queries — systematic Core Data diagnostics and safe migration patterns
---

# Core Data Diagnostics

Systematic troubleshooting for Core Data crashes after a schema change, objects used off their context's queue, slow relationship access, and Core Data mixed with SwiftData. Most problems come from thread confinement, schema migration requirements, and relationship query patterns, not from Core Data itself.

## Symptoms This Diagnoses

Use when you're experiencing:
- A launch crash with `NSCocoaErrorDomain 134100` ("The managed object model version used to open the persistent store is incompatible with the one that was used to create the store") after a schema change
- A migration that works in the Simulator but crashes on users' devices
- A migration that fails with `NSCocoaErrorDomain 134110` after you add a required attribute without a default
- An attribute type change, such as `String` to `Date`, that automatic migration can't handle
- Managed objects used off their context's queue, which stays silent until you launch with `-com.apple.CoreData.ConcurrencyDebug 1`
- An app that slowed down after you added a relationship, such as reading `user.posts` in a loop
- High memory use when fetching a large result set
- SwiftData and Core Data opening the same store, with "Store is locked" errors or `EXC_BAD_ACCESS`

## Example Prompts

- "My app crashes on launch with error 134100 after I added an attribute."
- "How do I change an attribute's type from String to Date without losing data?"
- "Why does my migration work in the Simulator but crash on users' devices?"
- "How do I find Core Data objects that are used on the wrong thread?"
- "My list got slow after I added a relationship. How do I find N+1 queries?"
- "Should I use Core Data alongside SwiftData for features SwiftData lacks?"
- "My manager wants to delete the store to stop the crash. What should I do instead?"

## Diagnostic Workflow

Your assistant guides you through three steps.

### Step 1: Gather Evidence

Before changing code:
1. Record the exact crash message: `134100` means the store and the app's model don't match
2. Compare the store's model version identifiers with the app's current model
3. Check which thread and context touch each managed object, and launch with `-com.apple.CoreData.ConcurrencyDebug 1` to trap off-queue access
4. Launch with `-com.apple.CoreData.SQLDebug 1` and count the SQL queries each screen issues
5. Check whether SwiftData and Core Data both open the same store

### Step 2: Check the Most Common Cause First

The most common cause of an incompatible-store crash is editing the existing `.xcdatamodel` in place instead of adding a new model version. Your assistant checks for more than one model version in the `.xcdatamodeld` bundle, then confirms that automatic lightweight migration is turned on (`shouldMigrateStoreAutomatically` and `shouldInferMappingModelAutomatically`). It's off by default on a raw `NSPersistentStoreCoordinator`, and turning it on resolves most crashes from additive changes.

A Simulator that was reset starts from an empty store, so the migration never runs there. The skill has you test every migration on a device that holds real data.

### Step 3: Apply the Targeted Pattern

- **Lightweight migration** – adding optional attributes, required attributes with a default in the model, removals, and renames with a renaming identifier, all in a new model version
- **Custom migration** – `NSStagedMigrationManager` with an `NSCustomMigrationStage` (iOS 17+), and a rename, add, and backfill recipe for attribute type changes
- **Thread confinement** – private-queue contexts for background work, the async `perform` API, and passing IDs or values across threads instead of managed objects
- **N+1 queries** – `relationshipKeyPathsForPrefetching` for relationships and `fetchBatchSize` for large result sets
- **SwiftData and Core Data** – when to stay in SwiftData, when to drop to Core Data, and never touching the same entity from both
- **Migration testing** – a test that migrates a copy of real production data, and a checklist to finish before shipping

## Documentation Scope

This page documents the `core-data-diag` skill (in the `axiom-data` suite), which your assistant loads when Core Data crashes after a schema change, misbehaves across threads, or slows down. To scan your code and data models for these risks, run `/axiom:audit core-data`, which launches the core-data-auditor agent. The skill file also holds a quick-reference table, common mistakes, and advice for a production crash where someone proposes deleting the persistent store: show how many users would lose their data, offer a tested migration instead, and record the decision if deletion goes ahead.

## Related

- [core-data](/skills/persistence/core-data) – Core Data stack setup, concurrency patterns, and migration strategies
- [core-data-auditor](/agents/core-data-auditor) – Scans your code and models for migration risks, thread-confinement violations, and N+1 queries
- [audit-core-data](/commands/debugging/audit-core-data) – The command that runs the Core Data auditor
- [swiftdata](/skills/persistence/swiftdata) – SwiftData patterns, for deciding whether to stay in SwiftData
- [database-migration](/skills/persistence/database-migration) – Safe schema evolution for SQLite, GRDB, and SQLiteData stores
