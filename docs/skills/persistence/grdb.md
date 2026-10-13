---
name: grdb
description: Raw GRDB for complex SQL queries, ValueObservation, and DatabaseMigrator patterns
version: 1.1.0
---

# GRDB

Direct SQLite access with [GRDB.swift](https://github.com/groue/GRDB.swift), a type-safe Swift toolkit that keeps the full power of raw SQL within reach.

## When to Use

Use this skill when you're:
- Writing complex SQL joins across many tables
- Using window functions such as `ROW_NUMBER`, `RANK`, or `LAG`/`LEAD`
- Observing queries reactively with `ValueObservation`
- Needing full control over SQL for performance
- Writing migrations that go beyond schema changes
- Dropping down from SQLiteData for an operation its query builder can't express

Use SQLiteData instead when `@Table` models are enough, you need CloudKit sync, or you prefer declarative queries; its query builder now handles `GROUP BY` and `HAVING` too. Use SwiftData for simple CRUD with native Apple integration when you don't need raw SQL control.

## Example Prompts

Questions you can ask your assistant that will draw from this skill:

- "I need to query messages with their authors and count of reactions in one query."
- "I want to observe a filtered list and update the UI whenever notes with a specific tag change."
- "I'm importing thousands of records and need custom migration logic."
- "My query is slow (10+ seconds). How do I profile and optimize it?"
- "I need tasks grouped by due date with completion counts, ordered by priority. Raw SQL seems easier than type-safe queries."
- "My sync overwrites rows the user just edited. How do I insert new rows without touching existing ones?"
- "Should I encrypt my SQLite database, or is iOS file protection enough?"
- "My upsert fails with `no such column: "rowid"`. What's going on?"

## What This Skill Provides

### Database Setup
- `DatabaseQueue` (one connection) versus `DatabasePool` (concurrent access), and when to choose each
- File-based and in-memory databases

### Record Types
- `Codable` structs that adopt `FetchableRecord` and `PersistableRecord` — `Codable` alone isn't a record
- Read-only `FetchableRecord` types built from joined rows
- Nested `Codable` properties, which GRDB stores as JSON

### Upsert
- `upsert` and `upsertAndFetch` for insert-or-update in one statement
- Scoping which columns a conflict updates (`UpsertUpdateStrategy`)
- Why `INSERT OR REPLACE` is not an upsert, and what it silently destroys
- `WITHOUT ROWID` upsert bugs — fixed generally in GRDB 7.11.0, still broken through 7.11.1 for `INTEGER` primary keys

### Querying
- Raw SQL with `fetchAll` and `fetchOne`
- Cursors for large result sets
- Type-safe filtering, sorting, and joins with the query interface
- Complex joins and aggregations (`COUNT`, `SUM`, `GROUP BY`)

### Observation
- `ValueObservation` with Combine publishers
- SwiftUI integration through GRDBQuery's `@Query`
- `DatabaseRegionObservation`, for when you need every transaction rather than fresh values
- Coalescing rapid updates with `removeDuplicates()` and `debounce`

### DatabaseMigrator
- Registering migrations in order
- Transforming data during a migration
- What the migrator guarantees: each migration runs exactly once, in order, so defensive `IF NOT EXISTS` SQL is unnecessary

### Performance
- Batching writes in a single transaction
- Prepared statements
- Index creation and `EXPLAIN QUERY PLAN`
- `db.trace` for profiling slow queries

### Encryption at Rest
- When SQLCipher is the answer and when file-level Data Protection already is
- What adopting SQLCipher costs (CocoaPods versus a forked SPM package)
- Why a SQLCipher build invalidates the system-SQLite version floors used elsewhere

### tvOS
- Why a local-only database is a cache on tvOS, and pairing GRDB with CloudKit sync

## Key Pattern

### Basic Query

```swift
import GRDB

let dbQueue = try DatabaseQueue(path: dbPath)

// Codable supplies the column mapping; the record protocols supply fetch and insert
struct Track: Codable, FetchableRecord, PersistableRecord {
    static let databaseTableName = "tracks"
    var id: String
    var title: String
    var artist: String
}

// Fetch
let tracks = try dbQueue.read { db in
    try Track.fetchAll(db, sql: "SELECT * FROM tracks WHERE artist = ?", arguments: ["Daft Punk"])
}

// Write
try dbQueue.write { db in
    try db.execute(sql: "INSERT INTO tracks (id, title, artist) VALUES (?, ?, ?)",
                   arguments: [UUID().uuidString, "Get Lucky", "Daft Punk"])
}
```

### ValueObservation (Reactive)

```swift
let observation = ValueObservation.tracking { db in
    try Track.filter(Column("artist") == "Daft Punk").fetchAll(db)
}

let cancellable = observation.start(in: dbQueue, onError: { error in
    print("Error: \(error)")
}, onChange: { tracks in
    // Called on every database change affecting this query
    self.tracks = tracks
})
```

### DatabaseMigrator

```swift
var migrator = DatabaseMigrator()

migrator.registerMigration("v1") { db in
    try db.create(table: "tracks") { t in
        t.column("id", .text).primaryKey()
        t.column("title", .text).notNull()
        t.column("artist", .text).notNull()
    }
}

migrator.registerMigration("v2") { db in
    try db.alter(table: "tracks") { t in
        t.add(column: "duration", .double)
    }
}

try migrator.migrate(dbQueue)
```

## Documentation Scope

This page documents the `grdb` skill (in the `axiom-data` suite) — the raw GRDB patterns your assistant uses when you need more SQL control than SQLiteData provides.

## Related

- [grdb-performance](/skills/persistence/grdb-performance) – query plans, index design, `PRAGMA optimize`, and observation cost
- [grdb-app-groups](/skills/persistence/grdb-app-groups) – sharing the database with a widget, extension, or Live Activity
- [sqlitedata](/skills/persistence/sqlitedata) – type-safe SQLiteData with `@Table` models, built on GRDB
- [database-migration](/skills/persistence/database-migration) – safe migration patterns
- [sqlite-fts-ref](/reference/sqlite-fts-ref) – full-text search with FTS5
- [swift-concurrency](/skills/concurrency/swift-concurrency) – async patterns for database actors

## Resources

**GitHub**: groue/GRDB.swift, groue/GRDBQuery

**Docs**: sqlite.org/docs.html, sqlite.org/lang_upsert.html, sqlcipher.net
