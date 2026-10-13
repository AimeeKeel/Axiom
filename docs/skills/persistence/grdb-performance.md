---
name: grdb-performance
description: Performant, idiomatic SQLite + GRDB for Swift — connection model, WAL economics, PRAGMA optimize, EXPLAIN QUERY PLAN workflow, index design, cursors, Swift 6 idioms
version: 1.0.0
---

# GRDB Performance

Performance and correctness discipline for GRDB on Apple platforms. Use SQLite deliberately, let GRDB handle the Swift integration, and validate with query plans and Instruments rather than PRAGMAs copied on faith.

## When to Use

Use this skill when you're:

- Diagnosing a slow GRDB query and want to know what to measure first
- Hitting an app hang that traces back to database access
- Watching memory grow while fetching large result sets
- Designing a new schema and want choices you won't regret
- Choosing between `DatabaseQueue` and `DatabasePool`
- Reviewing GRDB code that builds raw SQL with string interpolation
- Wondering why a `ValueObservation` stopped updating without raising an error
- Doing a pre-release sanity check on a GRDB-backed app

For full-text search, sharing a database with a widget, or migration safety, see the matching skills under Related below.

## Example Prompts

Questions you can ask your assistant that will draw from this skill:

- "Why is my GRDB query so slow?"
- "Should I use `DatabaseQueue` or `DatabasePool` for my app?"
- "What's `PRAGMA optimize`, and do I need it?"
- "My `fetchAll` is using too much memory. What's the fix?"
- "How do I know whether my queries actually use their indexes?"
- "Why does the planner say SCAN when I have an index?"
- "I have partial indexes, but they don't seem to fire. Why?"
- "When should I use `WITHOUT ROWID`?"
- "How do I migrate from `Record` subclasses to struct records?"
- "My Swift 6 build says `databaseSelection` is not concurrency-safe. How do I fix it?"

## What This Skill Provides

### Folklore Correction
- Why the N+1 query problem is a client/server concern that doesn't apply to SQLite
- Why 200+ statements per screen is normal when SQLite runs in-process

### Connection Model
- The `DatabaseQueue` versus `DatabasePool` decision rule
- Why connections stay open for the app's lifetime (WWDC 2019)

### WAL Economics and Backup Safety
- WAL journaling, which cut fsync calls from 16 to 1 in Apple's WWDC 2019 measurement
- Why the `.sqlite`, `-wal`, and `-shm` files travel together, and why copying the main file alone loses data
- `vacuum(into:)` for consistent snapshot backups
- Checkpoint behavior, autocheckpoint thresholds, and when to switch to `DELETE` journaling for a large bulk load

### Query Planner Workflow
- `PRAGMA optimize=0x10002` on connection open, plus periodic refreshes
- `EXPLAIN QUERY PLAN` as the verification tool
- What `SCAN`, `SEARCH`, and `USE TEMP B-TREE` mean, and what to do about each
- How much slower queries run when the planner has no statistics

### Index Design
- The compound-index rule: "left to right, no skipping, stops at the first range"
- Dropping prefix-redundant indexes
- Partial indexes: the planner does no algebra, so the query's `WHERE` must match the index's literally
- Expression indexes for `LOWER()` and JSON
- Indexing every foreign-key column (GRDB's `belongsTo` does it for you)

### Schema Choices That Affect Performance
- `WITHOUT ROWID` for small-row tables with non-integer primary keys
- Its two traps: such tables are never observed, and upsert is still partly broken — fixed generally in GRDB 7.11.0, still failing through 7.11.1 for `INTEGER` primary keys
- Generated columns (`VIRTUAL` by default, and indexable)
- `PRAGMA table_xinfo`, not `table_info`, to inspect generated columns

### Query Idioms
- Records as `Sendable` structs, not `Record` subclasses (GRDB 7+)
- `databaseSelection` as a computed `static var` under Swift 6
- SQL injection safety: only `?` and `:name` arguments or `execute(literal:)`

### Cursors for Large Streams
- `fetchCursor` consumption rules (the cursor must stay inside `read { ... }`)
- `Row` reuse, and `row.copy()` when you keep a snapshot
- When cursors beat `fetchAll`

### Observation Cost
- `ValueObservation`'s default scheduling (asynchronous, on the main actor)
- `.immediate` scheduling, for fast queries only
- `DatabaseRegionObservation`, for when transactions matter more than values
- The in-process blind spot: four categories of write that fire no notification at all
- Why `WITHOUT ROWID` tables are never observed, and why no GRDB setting fixes it
- `Database.notifyChanges(in:)` as the remedy when a writer must announce itself
- `DatabaseEventObservationStrategy` (GRDB 7.11+), and what turning it on costs

### SQLiteData Layer
- Which GRDB tuning carries over unchanged to SQLiteData
- SQLiteData's direct SQLite decoder versus `Codable` round-trips
- How `@FetchAll` mirrors `ValueObservation.shared(in:)` semantics

### Anti-Patterns Reference
- One table of anti-patterns, each with its symptom, its fix, and the section that explains it — from SQL string interpolation, missing foreign-key indexes, and unbounded `fetchAll` to `INSERT OR REPLACE` used as an upsert and the `WITHOUT ROWID` observation and upsert traps

### When to Profile vs. Read
- `EXPLAIN QUERY PLAN` first, since it's free
- The Instruments File Activity template for write amplification
- Instruments Points of Interest with `db.trace` for contention
- The read-first principle: most performance bugs are a missed cheap win, not a measurement problem
- Why toy data lies, and why measurements need realistic row counts

## Key Pattern

### PRAGMA optimize (biggest cheap win)

```swift
var config = Configuration()
config.prepareDatabase { db in
    // On connection open: include analysis of fresh connection (0x10000 bit)
    try db.execute(sql: "PRAGMA optimize=0x10002")
}
let dbQueue = try DatabaseQueue(path: dbPath, configuration: config)

// On app background or before close:
try dbQueue.write { db in
    try db.execute(sql: "PRAGMA optimize")
}
```

### EXPLAIN QUERY PLAN workflow

```swift
try dbQueue.read { db in
    let plan = try Row.fetchAll(
        db,
        sql: "EXPLAIN QUERY PLAN SELECT * FROM track WHERE artist_id = ?",
        arguments: [42]
    )
    for row in plan { print(row) }
}
```

Red flags: `SCAN <table>` on a large table, and any `USE TEMP B-TREE` for `ORDER BY`, `GROUP BY`, or `DISTINCT`.

### Cursors for memory-sensitive fetches

```swift
try dbQueue.read { db in
    let cursor = try Track.fetchCursor(db, sql: "SELECT * FROM track ORDER BY title")
    while let track = try cursor.next() {
        process(track)
    }
}
```

Consume a cursor inside the `read { ... }` closure. A cursor that escapes it still holds an open statement, which is undefined behavior.

## Documentation Scope

This page documents the `grdb-performance` skill (in the `axiom-data` suite): performance and correctness discipline for GRDB. To scan your code for the issues it teaches, use the [grdb-performance-auditor](/agents/grdb-performance-auditor) agent. For the GRDB primer (setup, record types, basic queries, `ValueObservation`), see [grdb](/skills/persistence/grdb).

## Related

- [sqlite-fts-ref](/reference/sqlite-fts-ref) – full-text search, shared by GRDB and SQLiteData
- [grdb-app-groups](/skills/persistence/grdb-app-groups) – sharing one database across processes, such as an app and its widget
- [database-migration](/skills/persistence/database-migration) – migration safety and `STRICT` tables
- [sqlitedata](/skills/persistence/sqlitedata) – when SQLiteData is a better fit than raw GRDB

## Resources

**WWDC**: 2019-419 (Optimizing Storage in Your App)

**SQLite docs**: sqlite.org/np1queryprob, sqlite.org/wal, sqlite.org/eqp, sqlite.org/queryplanner, sqlite.org/lang_analyze, sqlite.org/partialindex, sqlite.org/expridx, sqlite.org/withoutrowid, sqlite.org/gencol

**GRDB docs**: github.com/groue/GRDB.swift

**Third-party**: emschwartz.me/subtleties-of-sqlite-indexes (Schwartz compound-index rule), simonwillison.net/2024/May/8/modern-sqlite-generated-columns (Willison generated columns), phiresky.github.io/blog/2020/sqlite-performance-tuning (Phiresky PRAGMA tuning)
