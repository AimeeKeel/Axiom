---
name: swiftdata-migration
description: SwiftData custom schema migrations with VersionedSchema and SchemaMigrationPlan
skill_type: discipline
version: 0.9
---

# SwiftData Custom Schema Migrations

Custom schema migrations for SwiftData when lightweight migration isn't enough. Covers `VersionedSchema`, `SchemaMigrationPlan`, the `willMigrate`/`didMigrate` limitation, and the two-stage pattern for type changes.

## When to Use

Use this skill when you're:
- Changing a property's type (`String` → `AttributedString`, `Int` → `String`)
- Making an optional property required, which means filling in existing nil values first
- Restructuring relationships
- Splitting or merging fields
- Adding a unique constraint that requires deduplicating existing rows
- Getting "The model used to open the store is incompatible" errors
- Seeing a migration that works in the Simulator crash on a device

SwiftData migrates automatically for lightweight changes: adding optional properties, adding properties with defaults, removing properties, renaming with `@Attribute(originalName:)`, changing delete rules, and adding new models. Everything else needs a custom migration, which is what this skill covers.

## Example Prompts

Questions you can ask your assistant that will draw from this skill:

- "I need to change a property from String to AttributedString. How do I migrate existing data?"
- "My model has a one-to-many relationship with cascade delete. How do I preserve it during migration?"
- "I have a many-to-many relationship, and migration fails with 'Expected only Arrays for Relationships'."
- "Why do I have to copy ALL my models into each VersionedSchema?"
- "My migration works in the Simulator but crashes on a real device."
- "I'm getting 'The model used to open the store is incompatible with the one used to create the store'."
- "How do I test my SwiftData migration before releasing it?"

## What This Skill Provides

### The willMigrate/didMigrate Limitation
- `willMigrate` sees only the old models
- `didMigrate` sees only the new models
- You can never access both at once, and that shapes every migration strategy

### VersionedSchema Pattern
- Each schema is a complete snapshot, not a diff, so every model is copied into each version
- `@Attribute(originalName:)` for lightweight renames

### Two-Stage Migration for Type Changes
- An intermediate schema (V1.1) that holds both the old and the new property
- Stage 1: a lightweight migration from V1 to V1.1 adds the new property
- Stage 2: a custom migration from V1.1 to V2 converts the data in `willMigrate`, while both properties still exist
- Why storing `AttributedString` directly needs a format-stability plan

### Relationships
- Preserving one-to-many relationships with cascade delete
- Many-to-many relationships with explicit inverses and arrays on both sides
- The iOS 17.0 alphabetical-naming bug (fixed in iOS 17.1)
- Prefetching relationships during migration to avoid N+1 queries

### Large Stores and Unique Constraints
- Paging through a large store in batches inside `willMigrate`, so a migration can't run out of memory partway through
- Deduplicating rows before adding a unique constraint

### Testing Migrations
- A mandatory checklist: fresh install, upgrade from each previous version, a real device, relationship integrity, and record counts before and after
- Why Simulator testing is insufficient: a rebuild starts from a fresh database, so the migration code never runs
- A Swift Testing pattern for migration tests
- The SwiftData SQL debug launch argument and the common error messages

## Key Pattern

### The Core Limitation

```swift
static let migrateV1toV2 = MigrationStage.custom(
    fromVersion: SchemaV1.self,
    toVersion: SchemaV2.self,
    willMigrate: { context in
        // ✅ CAN access: SchemaV1 models (old)
        let v1Notes = try context.fetch(FetchDescriptor<SchemaV1.Note>())
        // ❌ CANNOT access: SchemaV2 models (don't exist yet)
    },
    didMigrate: { context in
        // ✅ CAN access: SchemaV2 models (new)
        let v2Notes = try context.fetch(FetchDescriptor<SchemaV2.Note>())
        // ❌ CANNOT access: SchemaV1 models (gone)
    }
)
```

### Two-Stage Migration for Type Changes

```swift
enum NotesMigrationPlan: SchemaMigrationPlan {
    static var schemas: [any VersionedSchema.Type] {
        [NotesSchemaV1.self, NotesSchemaV1_1.self, NotesSchemaV2.self]
    }

    static var stages: [MigrationStage] {
        [migrateV1toV1_1, migrateV1_1toV2]
    }

    // Stage 1: lightweight — V1.1 adds contentNew alongside contentOld
    static let migrateV1toV1_1 = MigrationStage.lightweight(
        fromVersion: NotesSchemaV1.self,
        toVersion: NotesSchemaV1_1.self
    )

    // Stage 2: custom — convert while V1.1 still has both properties
    static let migrateV1_1toV2 = MigrationStage.custom(
        fromVersion: NotesSchemaV1_1.self,
        toVersion: NotesSchemaV2.self,
        willMigrate: { context in
            var descriptor = FetchDescriptor<NotesSchemaV1_1.Note>()
            descriptor.relationshipKeyPathsForPrefetching = [\.folder, \.tags]
            for note in try context.fetch(descriptor) {
                note.contentNew = AttributedString(note.contentOld)
            }
            try context.save()
        },
        didMigrate: nil
    )
}
```

V2 then renames `contentNew` to `content` with `@Attribute(originalName: "contentNew")` and drops `contentOld`. On a large store, page through the notes in batches instead of fetching them all at once.

## Documentation Scope

This page documents the `swiftdata-migration` skill (in the `axiom-data` suite) — the custom migration patterns your assistant uses when lightweight migration isn't enough.

## Related

- [swiftdata](/skills/persistence/swiftdata) – core SwiftData patterns
- [swiftdata-migration-diag](/diagnostic/swiftdata-migration-diag) – diagnosing a migration that has already failed
- [database-migration](/skills/persistence/database-migration) – safe additive migration patterns for any persistence framework

## Resources

**WWDC**: 2023-10195 (Model your schema with SwiftData), 2025-291 (SwiftData: Dive into inheritance and schema migration)

**Docs**: /swiftdata/versionedschema, /swiftdata/schemamigrationplan
