---
name: database-migration
description: Use when adding/modifying database columns, encountering "FOREIGN KEY constraint failed", "no such column", "cannot add NOT NULL column" errors, or creating schema migrations for SQLite/GRDB/SQLiteData — prevents data loss with safe migration patterns and testing workflows for iOS/macOS apps
---

# Database Migration

Safe schema evolution for production apps that hold user data. Additive, idempotent migration patterns keep upgrades from losing data.

## When to Use

Use this skill when you're:
- Adding new columns to existing tables
- Modifying column types or constraints
- Getting "FOREIGN KEY constraint failed" errors
- Getting "no such column" errors
- Getting "cannot add NOT NULL column" errors
- Adding relationships between tables
- Planning schema migrations before release

**Core principle** Migrations are immutable once shipped. Make them additive and idempotent.

## Example Prompts

Questions you can ask your assistant that will draw from this skill:

- "I need to add a new column but the app is live with user data. How do I do this safely?"
- "I'm getting 'cannot add NOT NULL column' errors. What's wrong?"
- "I need to change a column from text to integer. Can I just ALTER the column type?"
- "How do I add a foreign key without breaking existing data?"
- "Users are crashing after update. I changed a migration but it's already in production."
- "How do I test migrations before shipping?"
- "What's the safe pattern for renaming a column?"

## What This Skill Provides

### Critical Rules (Data Loss Prevention)

Never do these with user data:
- ❌ `DROP TABLE` on a table that holds user data
- ❌ Modify a shipped migration (create a new one instead)
- ❌ Drop a table before copying its rows (a rebuild goes create new → copy → drop old → rename)
- ❌ Add a `NOT NULL` column without a `DEFAULT`
- ❌ Delete columns before retiring them in code

### Safe Patterns
- Adding nullable columns, with an existence check so the migration can run twice
- Adding columns with defaults
- Changing a column's type (new column → migrate data → deprecate the old one)
- Renaming a column the same way
- Foreign keys: a new column with `ADD COLUMN … REFERENCES`, or a copy-first table rebuild
- Splitting a complex refactor across several migrations, including index creation
- `STRICT` tables for new tables where type integrity matters

### Testing Workflows
- Three tests against the migrator you ship: the upgrade path (data preservation), a fresh install, and running the migrations twice
- Manual testing before TestFlight
- Why tvOS migrations must also work against a fresh database

### Framework-Specific
- GRDB `DatabaseMigrator` setup and checking which migrations have run
- SwiftData `VersionedSchema` and `SchemaMigrationPlan`

## Key Pattern

### Adding a Column Safely

```swift
// ✅ SAFE: Add nullable column (works with existing rows)
migrator.registerMigration("v2_add_preferences") { db in
    try db.execute(sql: """
        ALTER TABLE users ADD COLUMN preferences TEXT
    """)
}

// ✅ SAFE: Add column with default (works with existing rows)
migrator.registerMigration("v3_add_created_at") { db in
    try db.execute(sql: """
        ALTER TABLE users ADD COLUMN created_at TEXT DEFAULT ''
    """)
}

// ❌ UNSAFE: NOT NULL without default (fails on existing rows)
try db.execute(sql: """
    ALTER TABLE users ADD COLUMN required_field TEXT NOT NULL
    -- Error: Cannot add a NOT NULL column with default value NULL
""")
```

### Changing Column Type Safely

```swift
// ✅ SAFE: Add new → migrate → keep old (never delete)
migrator.registerMigration("v4_migrate_age_to_int") { db in
    // 1. Add new column
    try db.execute(sql: "ALTER TABLE users ADD COLUMN age_int INTEGER")

    // 2. Migrate data
    try db.execute(sql: "UPDATE users SET age_int = CAST(age AS INTEGER)")

    // 3. Keep old column (for backwards compatibility)
    // NEVER: DROP COLUMN age
}
```

## Documentation Scope

This page documents the `database-migration` skill (in the `axiom-data` suite), which your assistant uses when you plan and run schema migrations. The skill covers SQLite, GRDB, and SwiftData.

## Related

- [swiftdata-migration](/skills/persistence/swiftdata-migration) – Custom SwiftData schema migrations with `VersionedSchema` and `SchemaMigrationPlan`
- [grdb](/skills/persistence/grdb) – GRDB queries, `ValueObservation`, and `DatabaseMigrator` patterns
- [sqlitedata](/skills/persistence/sqlitedata) – SQLiteData `@Table` models and registering their schema migrations
- [xcode-debugging](/skills/debugging/xcode-debugging) – Environment diagnostics when migrations fail

## Resources

**WWDC**: 2023-10195

**Docs**: /swiftdata/versionedschema, /swiftdata/schemamigrationplan
