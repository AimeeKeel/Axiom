---
name: sqlite-fts-ref
description: SQLite FTS5 reference shared by GRDB and SQLiteData — tokenizers, Unicode normalization, external-content sync, ranking, prefix indexes, the MATCH operator
skill_type: reference
version: 1.0.0
---

# SQLite FTS5 Reference

A reference for adding full-text search with SQLite's FTS5 engine, whether you use GRDB or SQLiteData. It covers table design, tokenizers, Unicode normalization, ranking, prefix search, and index maintenance.

## When to Use This Reference

Use this reference when you're:
- Adding search to a GRDB- or SQLiteData-backed app
- Choosing a tokenizer (`unicode61`, `porter`, `trigram`, or `ascii`)
- Diagnosing Unicode search misses ("café matches but Müller doesn't")
- Setting up an external-content FTS5 table to avoid duplicating storage
- Tuning `bm25` column weights so title matches outrank body matches
- Adding fast prefix or autocomplete search
- Wiring up `highlight()` and `snippet()` for result UI

## Example Prompts

Questions you can ask your assistant that will draw from this reference:

- "Add full-text search to my GRDB app"
- "Why doesn't `Müller` match `Mueller` in my FTS5 search?"
- "How do I keep an external-content FTS5 index in sync with my source table?"
- "What's the difference between the `unicode61`, `porter`, and `trigram` tokenizers?"
- "How do I rank search results so title matches outrank body matches?"
- "Why are my prefix searches slow? Should I add `prefix='2 3'`?"
- "How do I escape user input safely for an FTS5 `MATCH` query?"
- "Should I use contentful, external-content, or contentless FTS5?"

## What's Covered

### Schema Patterns
- FTS5 over FTS3/FTS4 for all new code
- Contentful (default), external-content, contentless
- When to pick each shape
- No types or constraints in FTS5 column definitions
- `t.synchronize(withTable:)` – the idiomatic GRDB API

### Tokenizers
- `unicode61` (default, multilingual, strips diacritics)
- `porter` (English stemming only)
- `trigram` (substring/LIKE-style matching)
- `ascii` (ASCII-only)
- Tokenizer options (`remove_diacritics`, `separators`, `tokenchars`, trigram `case_sensitive`)
- GRDB has no `.trigram` factory; use `FTS5TokenizerDescriptor(components:)`

### Unicode Normalization
- NFC vs NFD — silent match misses on equivalent visible strings
- Ligature equivalence ("ﬁ" U+FB01 ↔ "fi") via NFKC
- Language-specific transliteration ("Müller" ↔ "Mueller")
- The rule: apply the same normalization when indexing AND when querying
- Why switching tokenizers never fixes a Unicode match miss

### External-Content Sync
- Triggers (AFTER INSERT/UPDATE/DELETE) and the `delete` command
- `rebuild` command after batch operations
- Migration ordering when several processes share an app-group database

### Ranking and Relevance
- `ORDER BY rank` (cheap, default)
- `bm25(table, w1, w2, ...)` column weights
- Lower `bm25` = better match (never sort descending)

### Prefix Search
- `prefix='2 3'` table option pre-indexes prefixes
- Storage cost tradeoffs
- Matching prefix lengths to your autocomplete UX

### Highlight and Snippet
- `highlight(t, col, '<b>', '</b>')`
- `snippet(t, col, '<b>', '</b>', '...', 32)` (`max_tokens` 1–64; larger values clamp to 64)
- Neither works on a contentless table

### Maintenance Commands
- `optimize`, `rebuild`, `merge`, `integrity-check`, `delete`

### Layer-Specific APIs
- GRDB: `db.create(virtualTable:using:)` with `FTS5()`, `t.content`/`t.contentRowID`, failable `FTS5Pattern` initializers, `ValueObservation` over a search join
- SQLiteData: `@Table` with FTS5 modifiers, `.match(_:)` (value binding does not escape FTS5 operators), CloudKit sync replicates the source table but not the index

### Worked Example and Anti-Patterns
- Multilingual book search with normalized shadow columns
- Anti-pattern table: mismatched normalization, `porter` on non-English text, unescaped `MATCH` input, missing triggers, `bm25` sorted descending

## Key Patterns

### GRDB external-content FTS5 with prefix indexes

```swift
try db.create(virtualTable: "book_ft", using: FTS5()) { t in
    t.tokenizer = .unicode61()
    t.synchronize(withTable: "book")   // auto-creates triggers + initial rebuild
    t.prefixes = [2, 3]
    t.column("title")
    t.column("body")
}
```

### Unicode normalization helper

```swift
extension String {
    var fts5Normalized: String {
        precomposedStringWithCompatibilityMapping              // NFKC (ligatures)
            .applyingTransform(.stripDiacritics, reverse: false) ?? self
        // For language-specific transliteration (e.g., ü→ue, ß→ss for German),
        // maintain your own replacement table and apply it here.
    }
}

// Apply on indexing AND querying — identical pipeline
let normalized = userInput.fts5Normalized
guard let pattern = FTS5Pattern(matchingAllPrefixesIn: normalized) else { return [] }
```

`synchronize(withTable:)` indexes the source columns exactly as stored, so to index normalized text, point the FTS table at normalized shadow columns, as the skill's worked example does.

### Ranking with column weights

```swift
let results = try Book.fetchAll(db, sql: """
    SELECT book.* FROM book
    JOIN book_ft ON book_ft.rowid = book.id
    WHERE book_ft MATCH ?
    ORDER BY bm25(book_ft, 10.0, 1.0)
    LIMIT 50
    """, arguments: [pattern])
// Weights follow column order: title weighted 10×, body 1×
// Lower bm25 = better, so default ascending order is correct
```

## Documentation Scope

This page documents the `sqlite-fts-ref` skill (in the `axiom-data` suite), a reference shared by GRDB and SQLiteData. FTS5 is a SQLite engine feature, so tokenizer choice, Unicode normalization, ranking, and prefix indexes are the same in both layers; only the Swift API differs.

## Related

- [grdb](/skills/persistence/grdb) – GRDB record types and queries
- [grdb-performance](/skills/persistence/grdb-performance) – EXPLAIN QUERY PLAN works on FTS5 MATCH queries
- [sqlitedata](/skills/persistence/sqlitedata) – SQLiteData `@Table` patterns
- [sqlitedata-ref](/reference/sqlitedata-ref) – SQLiteData advanced query patterns (FTS5 section)
- [grdb-app-groups](/skills/persistence/grdb-app-groups) – running the FTS5 migration in every process before it writes
- [sql-json-ref](/reference/sql-json-ref) – when a searched JSON array should become a child table or an FTS5 index
- [grdb-performance-auditor](/agents/grdb-performance-auditor) – automated scan that includes FTS5 anti-patterns

## Resources

**SQLite docs**: [sqlite.org/fts5.html](https://sqlite.org/fts5.html)

**GRDB docs**: [GRDB.swift full-text search guide](https://github.com/groue/GRDB.swift/blob/master/Documentation/FullTextSearch.md)
