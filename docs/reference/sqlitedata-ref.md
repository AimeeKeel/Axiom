---
name: sqlitedata-ref
description: SQLiteData advanced patterns, @Selection column groups, single-table inheritance, recursive CTEs, database views, custom aggregates, TableAlias self-joins, JSON/string aggregation
skill_type: reference
version: 1.0.0
---

# SQLiteData Advanced Reference

Advanced query patterns and schema composition for SQLiteData 1.12+, Point-Free's persistence library built on GRDB and StructuredQueries.

## When to Use This Reference

Use this reference when you're:
- Composing reusable column groups with `@Selection`
- Implementing single-table inheritance patterns
- Writing recursive CTEs for hierarchical data
- Creating database views for complex queries
- Building custom aggregate functions
- Using `TableAlias` for self-joins
- Aggregating data as JSON or concatenated strings
- Filtering by dates, sorting with a Unicode-aware collation, or writing triggers that coexist with CloudKit sync

## Example Prompts

Questions you can ask your assistant that will draw from this reference:

- "How do I share timestamp columns across multiple SQLiteData tables?"
- "I need to query a tree structure in SQLiteData. How do I write a recursive CTE?"
- "How do I implement single-table inheritance with `@Selection`?"
- "I want to create a database view for a complex join. How?"
- "How do I aggregate child records as JSON in a single query?"
- "I need a self-join for comparing records in the same table."
- "How do I write a custom aggregate function in SQLiteData?"
- "How do I filter by 'the last 7 days' without computing the date in Swift?"
- "How do I sort text the way Swift does, so 'café' and 'cafe\u{0301}' compare equal?"
- "My trigger fires on every CloudKit sync. How do I make it skip synced writes?"

## What's Covered

### Schema Composition
- `@Selection` for reusable column groups
- Embedding column groups in `@Table` types
- Single-table inheritance with `@Selection` enums and the `CasePaths` package trait
- Flattening groups in CREATE TABLE
- Passing whole rows to `@DatabaseFunction`
- Column groups vs SwiftData class inheritance

### Query Composition
- Reusable scopes as static properties and `Where<T>` extensions
- `@Fetch` with `FetchKeyRequest` for multi-query reads; `.load()` for dynamic requests
- String functions, `like` patterns, `collate(.nocase)`
- `nullif` alongside coalesce for null handling
- `in`, `between`, pagination (offset and cursor), `distinct()`
- `RETURNING` on insert, update and delete
- `Case` expressions
- Compound selects: `union`, `intersect`, `except`

### Joins and CTEs
- `join`, `leftJoin`, `rightJoin`, `fullJoin`
- `TableAlias` for self-joins; `select.as(_:)` to alias an already-built statement
- `Values` – literal multi-row `VALUES` sets, joinable and usable as a CTE seed
- Non-recursive CTEs with `With { } query: { }`
- Recursive CTEs for hierarchical data (trees, graphs)

### Dates and Times
- Date columns called as functions: `$0.dueDate(.startOfMonth)`
- `DateTimeModifier` – `years`/`months`/`days`/`hours`/`minutes`/`seconds`/`milliseconds`/`weekday`, `startOfDay`/`startOfMonth`/`startOfYear`
- `.now` as a separate expression that takes the same modifiers
- Component accessors: `year`, `month`, `day`, `hour`, `minute`, `second`, `weekday`, `dayOfYear`, `fractionalSecond`, `strftime(_:)`
- Storage-aware output (`unixepoch` vs `datetime`)

### Full-Text Search (Query Builder)
- `FTS5` tables, `match`, `highlight`, `snippet`, `bm25` ordering

### Aggregation
- JSON aggregation (`jsonGroupArray`, `jsonObject()`)
- String concatenation (`groupConcat`)
- Conditional aggregates with `filter:`, and `having()`
- Custom aggregate functions with `@DatabaseFunction`

### Schema Creation
- `#sql` for CREATE TABLE, indexes, triggers and ALTER TABLE
- `\(bind:)` vs `\(raw:)` interpolation
- Foreign keys (on by default under GRDB)

### Views, Collations and Triggers
- `@Selection` result types and `createTemporaryView`
- `.canonical` – Unicode canonical-equivalence ordering, auto-installed by `defaultDatabase(path:configuration:)`
- `@DatabaseCollation` for Swift-defined collating sequences; `Database.add(collation:)` / `remove(collation:)`
- Collation-aware indexes — an index under one collation cannot serve a query using another
- `createTemporaryTrigger` and guarding it with `SyncEngine.$isSynchronizing` under CloudKit sync
- `Updates<T>` extensions and `QueryBindable` enums

### Performance Patterns
- Batch upserts with cached statements and multi-row `VALUES`
- Explicit transactions for batch writes

## Key Pattern

### Column Groups with `@Selection`

```swift
// Define reusable column group
@Selection
struct Timestamps {
    let createdAt: Date
    let updatedAt: Date?
}

// Embed in multiple tables
@Table
nonisolated struct Reminder: Identifiable {
    let id: UUID
    var title = ""
    let timestamps: Timestamps  // Reused column group
}
```

**Note** Flatten every group in your CREATE TABLE, because SQLite has no concept of grouped columns.

### Recursive CTE for Trees

```swift
@Selection
struct CategoryTree {
    let id: Category.ID
    let name: String
    let parentID: Category.ID?
}

// All descendants of a root category
let descendants = try With {
    Category.where { $0.id.eq(#bind(rootCategoryId)) }     // Base case
        .select { CategoryTree.Columns(id: $0.id, name: $0.name, parentID: $0.parentID) }
        .union(
            all: true,
            Category.all                                     // Recursive case
                .join(CategoryTree.all) { $0.parentID.eq($1.id) }
                .select { category, _ in
                    CategoryTree.Columns(id: category.id, name: category.name, parentID: category.parentID)
                }
        )
} query: {
    CategoryTree.order(by: \.name)
}.fetchAll(db)
```

## Documentation Scope

This page documents the `sqlitedata-ref` skill (in the `axiom-data` suite): advanced SQLiteData patterns for experienced developers.

- For basic CRUD, CloudKit sync setup and `@Table` fundamentals, see [sqlitedata](/skills/persistence/sqlitedata)
- For storing, extracting and indexing JSON columns, see [sql-json-ref](/reference/sql-json-ref)
- For FTS5 tokenizers, Unicode normalization and ranking, see [sqlite-fts-ref](/reference/sqlite-fts-ref)

## Related

- [grdb](/skills/persistence/grdb) – raw GRDB when you need maximum SQL control
- [grdb-performance](/skills/persistence/grdb-performance) – `EXPLAIN QUERY PLAN` and index tuning beneath SQLiteData queries
- [database-migration](/skills/persistence/database-migration) – safe schema evolution for the `#sql` migrations above
- [sqlitedata-migration](/skills/persistence/sqlitedata-migration) – moving an app from SwiftData to SQLiteData
- [swift-sharing](/skills/persistence/swift-sharing) – the `SharedReader` layer beneath `@FetchAll` and `@FetchOne`
- [swift-concurrency](/skills/concurrency/swift-concurrency) – Swift 6 isolation rules behind the `nonisolated` table types

## Resources

**Docs**: github.com/pointfreeco/sqlite-data, github.com/pointfreeco/swift-structured-queries, github.com/groue/GRDB.swift
