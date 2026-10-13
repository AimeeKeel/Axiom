---
name: sql-json-ref
description: SQLite JSON reference shared by GRDB and SQLiteData — JSON1 functions, the -> / ->> operators, JSONB, generated-column indexing, and the storage decision
skill_type: reference
version: 1.0.0
---

# SQLite JSON Reference

A reference for storing JSON inside a SQLite column and querying it, whether you use GRDB or SQLiteData. It covers JSON as a column value, not the wire-format Codable you send over the network or write to a file.

## When to Use This Reference

Use this reference when you're:
- Storing a Codable struct, array, or dictionary in a single SQLite column
- Extracting or filtering on a field inside a JSON column (`json_extract`, `->>`)
- Deciding between a TEXT JSON column, a JSONB BLOB, a real column, or a child table
- Making a JSON field fast to query (generated column + index)
- Reshaping JSON in a migration (rename a key, extract a field to its own column)
- Choosing JSONB and needing to know which iOS version it requires

## Example Prompts

Questions you can ask your assistant that will draw from this reference:

- "How do I store a Codable array in a SQLite column with GRDB or SQLiteData?"
- "Why is my `WHERE json_extract(data, '$.status') = 'active'` so slow?"
- "How do I index a field inside a JSON column?"
- "Should I use TEXT JSON or JSONB? What iOS version do I need for JSONB?"
- "Why won't my `jsonb_extract` call compile through SQLiteData?"
- "How do I rename a key inside a JSON column across every row?"
- "What's the difference between `->` and `->>` in SQLite?"
- "When should I use a JSON column versus a child table?"

## What's Covered

### Version Floor
- JSON1 functions → SQLite 3.9 (iOS 10.2 or earlier)
- `->`/`->>` operators → SQLite 3.38 (iOS 16 / macOS 13)
- JSONB → SQLite 3.45, which first shipped in the **26 cycle** (iOS 26 / macOS 26), not iOS 18
- Bundled SQLite by OS: iOS 17.2–18.x ship 3.43.2; iOS 26 ships 3.51.0; iOS 27 ships 3.54.0
- JSON1 works on every OS Axiom's guidance targets (iOS 18 and later); **JSONB does not**, so gate it or require iOS 26
- How each layer enforces the gate: StructuredQueries `@available` (no compile below 26), GRDB `Database.jsonb*` (compiled only against a vendored SQLite), raw SQL (compiles, then fails at runtime)
- The system-vs-vendored SQLite caveat (SQLCipher, custom builds, and the `SuppressPlatformSQLiteAvailability` trait)

### JSON1 Functions and Operators
- Extract: `json_extract`, `->` (JSON), `->>` (SQL scalar)
- Inspect: `json_type`, `json_array_length`, `json_valid`
- Iterate: `json_each` (one level), `json_tree` (recursive)
- Modify: `json_set`, `json_insert`, `json_replace`, `json_remove`, `json_patch`
- Build: `json_object`, `json_array`, `json_group_array`, `json_group_object`

### JSONB (Binary Format)
- `jsonb()` / `jsonb_extract()` family; round-trip via `json()` for display
- TEXT vs JSONB decision — default to TEXT; switch only when profiling shows parse cost **and** you can require or gate iOS 26
- SQLiteData's `JSONBRepresentation` via `@Column(as:)` for storing a Codable value as a BLOB
- SQLiteData per-API availability: ungated, iOS 26, and iOS 27 tiers

### Indexing JSON Fields
- A JSON extract in `WHERE` is a full scan — a generated column plus an index is the fix
- STORED vs VIRTUAL (`ALTER TABLE ADD COLUMN` accepts only VIRTUAL); the expression-index alternative

### Storage Decision
- Real column vs TEXT JSON vs JSONB vs child table
- When JSON is the wrong answer (filtering, one-to-many, FK integrity, concurrent partial updates)

### Layer-Specific APIs
- SQLiteData: `@Column(as: [T].JSONRepresentation.self)`, `jsonGroupArray`/`jsonObject`, typed key-path `jsonExtract(\.links[0].homepage)` instead of a `'$.path'` string, `jsonEach()` as a joinable select, and `jsonSet` / `jsonInsert` / `jsonReplace` / `jsonAppend` / `jsonRemove` / `jsonArrayInsert` (consecutive calls fuse into one SQL call)
- GRDB: nested Codable → JSON text automatically, `databaseJSONEncoder/Decoder` (the defaults already sort keys), `JSONColumn`, the `Database.json*` functions, `Database.jsonb*` (GRDB 7, vendored SQLite only)

### Migration Patterns
- Rename a key, merge defaults (`json_patch`), promote a hot JSON field to a real indexed column, batch large backfills

## Key Patterns

### Make a hot JSON field indexable

```sql
-- WHERE data ->> '$.status' = ? scans every row. Surface the field, then index it:
ALTER TABLE event ADD COLUMN status TEXT
    AS (data ->> '$.status') VIRTUAL;   -- ADD COLUMN takes VIRTUAL only
CREATE INDEX event_status ON event(status);
SELECT * FROM event WHERE status = 'active';   -- now uses the index
```

### SQLiteData — store a Codable value as JSON

```swift
@Table struct Player {
    let id: UUID
    @Column(as: [String].JSONRepresentation.self)
    var achievements: [String]            // stored as JSON text
}
```

### GRDB — query a JSON column

```swift
let address = JSONColumn("address")
let players = try Player.filter(address["country"] == "FR").fetchAll(db)  // address ->> 'country' = 'FR'
```

## Documentation Scope

This page documents the `sql-json-ref` skill (in the `axiom-data` suite), a reference shared by GRDB and SQLiteData. JSON1 and JSONB are SQLite engine features, so function names, path syntax, the storage decision, and generated-column indexing are the same in both layers; only the Swift API differs.

## Related

- [grdb](/skills/persistence/grdb) – GRDB record types; nested Codable is stored as JSON automatically
- [grdb-performance](/skills/persistence/grdb-performance) – EXPLAIN QUERY PLAN confirms whether a JSON query hits an index
- [sqlitedata](/skills/persistence/sqlitedata) – SQLiteData `@Table` and `@Column(as:)` patterns
- [sqlitedata-ref](/reference/sqlitedata-ref) – SQLiteData advanced queries (JSON aggregation section)
- [sqlite-fts-ref](/reference/sqlite-fts-ref) – when a searched JSON array should be FTS5 or a child table instead
- [database-migration](/skills/persistence/database-migration) – safety rules for the reshape and backfill migrations listed under Migration Patterns
- [codable](/skills/persistence/codable) – wire-format Codable (encoding for the network or a file), a different problem from column storage
- [grdb-performance-auditor](/agents/grdb-performance-auditor) – automated scan that flags unindexed query patterns

## Resources

**SQLite docs**: [sqlite.org/json1.html](https://sqlite.org/json1.html)

**GRDB docs**: [GRDB.swift JSON guide](https://github.com/groue/GRDB.swift/blob/master/GRDB/Documentation.docc/JSON.md)

**SQLiteData docs**: [swift-structured-queries](https://swiftpackageindex.com/pointfreeco/swift-structured-queries)
