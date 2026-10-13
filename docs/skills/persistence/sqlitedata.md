---
name: sqlitedata
description: SQLiteData (Point-Free) patterns with @Table models, CloudKit sync, and StructuredQueries
skill_type: discipline
version: 3.0.0
---

# SQLiteData

Type-safe SQLite persistence using [SQLiteData](https://github.com/pointfreeco/sqlite-data) by Point-Free. A fast, lightweight replacement for SwiftData with CloudKit synchronization, built on GRDB and StructuredQueries.

## When to Use

Use this skill when you're:
- Defining `@Table` models
- Writing queries with `@FetchAll` and `@FetchOne`
- Inserting, updating, upserting, or deleting records
- Batch importing data
- Setting up CloudKit sync or record sharing with SQLiteData
- Fixing StructuredQueries compiler errors, such as `==` in a predicate or a missing `#bind`
- Testing sync or previewing sharing UI

**Core principle** Value types (`struct`), the `@Table` macro, and `database.write { }` blocks for every mutation.

Choose SQLiteData for type-safe SQLite, CloudKit sync with record sharing, large datasets (50,000+ records), and Swift 6 strict concurrency. Use SwiftData instead for simple CRUD with `@Model` classes when you don't need CloudKit record sharing, and raw GRDB for joins across four or more tables, window functions, or hand-written SQL on a profiled hot path.

## Example Prompts

Questions you can ask your assistant that will draw from this skill:

- "How do I set up a `@Table` model with custom column types?"
- "Why does `.where { $0.status == .done }` no longer compile?"
- "Why can't I `await` inside a `database.write` block?"
- "How do I do a bulk insert efficiently?"
- "How do I set up CloudKit sync with SQLiteData?"
- "What's the difference between `@FetchAll` and `@FetchOne`?"
- "How do I group my list into sections the way SwiftData does, but in SQL?"
- "My `@FetchOne` shows the wrong row — I passed the record, but it loads a different one."
- "Which SQLiteData package traits should I turn on?"
- "My tests pass, but sync is never exercised. What am I missing?"

## What This Skill Provides

### Table Models
- The property named `id` becomes the primary key; a key on any other column needs `@Column(primaryKey: true)`
- Properties with defaults map to non-nullable columns, and optionals to nullable ones
- `@Column(as:)` for custom representations
- `@Ephemeral` for properties that aren't persisted

### Queries
- `@FetchAll` for arrays, and `@FetchOne` for single values and aggregates
- Why single-record observation must be seeded with a statement (`Item.find(id)`), not a record
- `where` with key paths and closures, `order(by:)`, `limit`, and `offset`
- Static helpers `fetchAll` and `find` (v1.4.0+)
- Lifecycle-aware fetching that cancels with the view's `.task` (v1.4.0+)
- Sectioned results with `sectionBy:` (v1.8.0+), through `ResultsSectionCollection` and `ResultsSection`
- Loading and error state (`isLoading`, `loadError`) inherited from swift-sharing

### Mutations
- Inserts with the `Draft` pattern, including lazily initialized columns
- `RETURNING` to get generated values back
- Single and bulk updates and deletes
- Upserts, with merge strategies and partial unique indexes
- Batch inserts and transaction safety

### CloudKit Sync
- `SyncEngine` setup through `prepareDependencies`
- Manual sync control (v1.3.0+) and sync-state observation (v1.2.0+)
- Querying sync metadata (v1.3.0+)
- Record sharing, with per-record database resolution (v1.11.1+)
- Previewable sharing UI: `CloudSharingView` shows a mock in previews and tests (v1.5.0+)
- `SyncEngine.migratePrimaryKeys` for switching sync strategies

### Package Traits
- Six traits — CasePaths, Tagged, ColumnCoding, LazyInitializableByDefault, StrictDecoding, SuppressPlatformSQLiteAvailability — plus `SQLiteDataTagged`, a deprecated alias for `Tagged`
- The three that upstream documents as becoming default behavior in the next major release

### Testing and Previews
- `defaultDatabase()`, which provisions a temporary on-disk pool for both previews and tests
- The sync engine no longer auto-starts under test (v1.5.1+), so a test that exercises sync must call `syncEngine.start()`

### Raw SQL
- The `#sql` macro for raw queries and custom expressions

## Key Pattern

### Basic CRUD

```swift
// MODEL
@Table nonisolated struct Item: Identifiable {
    let id: UUID                    // Property named `id` = auto primary key
    var title = ""                  // Default = non-nullable
    var isActive = true
    var notes: String?              // Optional = nullable
    @Ephemeral var isSelected = false  // Not persisted
}

// SETUP
prepareDependencies { $0.defaultDatabase = try! appDatabase() }
@Dependency(\.defaultDatabase) var database

// FETCH
@FetchAll var items: [Item]
@FetchAll(Item.order(by: \.title).where(\.isActive)) var activeItems

// INSERT
try database.write { db in
    try Item.insert { Item.Draft(title: "New") }.execute(db)
}

// UPDATE
try database.write { db in
    try Item.find(id).update { $0.title = #bind("Updated") }.execute(db)
}

// DELETE
try database.write { db in
    try Item.find(id).delete().execute(db)
}
```

### Common Queries

```swift
// Filter
Item.where(\.isActive)                     // Keypath (simple)
Item.where { $0.title.like("%phone%") }    // Closure (complex)
Item.where { $0.status.eq(#bind(.done)) }  // Enum comparison

// Sort and paginate
Item.order(by: \.title)                    // Ascending
Item.order { $0.createdAt.desc() }         // Descending
Item.limit(10).offset(20)                  // Pagination
```

## Documentation Scope

This page documents the `sqlitedata` skill (in the `axiom-data` suite) — the SQLiteData patterns your assistant uses when you work with Point-Free's SQLite library.

## Related

- [sqlitedata-ref](/reference/sqlitedata-ref) – advanced patterns: CTEs, views, custom aggregates, `@Selection`, FTS5, and `@DatabaseFunction`
- [sqlitedata-migration](/skills/persistence/sqlitedata-migration) – moving an app from SwiftData to SQLiteData
- [grdb](/skills/persistence/grdb) – raw GRDB for queries the query builder can't express
- [database-migration](/skills/persistence/database-migration) – safe schema evolution patterns
- [swift-sharing](/skills/persistence/swift-sharing) – the layer `@FetchAll` and `@FetchOne` are built on; `isLoading`, `loadError`, and custom persistence strategies live there

## Resources

**GitHub**: pointfreeco/sqlite-data, pointfreeco/swift-structured-queries, groue/GRDB.swift
