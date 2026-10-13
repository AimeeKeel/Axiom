---
name: swiftdata-migration-diag
description: Systematic diagnostics for SwiftData migration crashes, data loss, and relationship errors
skill_type: diagnostic
version: 0.9
---

# SwiftData Migration Diagnostics

Systematic troubleshooting for SwiftData migration failures: schema version mismatches, relationship errors, data loss, and migrations that pass in the Simulator but crash on a device. Most of these come from a model missing from a `VersionedSchema`, a missing relationship inverse, or an untested upgrade path, not from SwiftData itself.

## Symptoms This Diagnoses

Use when you're experiencing:
- App crashes on launch after a schema change
- "Expected only Arrays for Relationships" error
- "The model used to open the store is incompatible"
- "Failed to fulfill faulting for [relationship]"
- Migration works in the Simulator but crashes on a device
- Data exists before migration and is gone after
- Relationships broken after migration (`nil` where they shouldn't be)

## Example Prompts

- "App crashes after I added a new property to my @Model"
- "'Expected only Arrays for Relationships' — what does this mean?"
- "Migration works in simulator but crashes on real device"
- "Data disappeared after migration"
- "How do I fix 'incompatible model' errors?"
- "Relationships are nil after running migration"

## Diagnostic Workflow

Your assistant guides you through three steps.

### Step 1: Identify Error Type

| Error Message | Root Cause |
|---------------|------------|
| "Expected only Arrays for Relationships" | Missing inverse on many-to-many |
| "incompatible model" | Schema version mismatch |
| "Failed to fulfill faulting" | Relationship not prefetched |
| Simulator works, device crashes | Untested migration path |
| Data gone after migration | Transformation in `didMigrate` instead of `willMigrate` |

### Step 2: Check Common Issues

Before changing code:
1. Verify that every model, even an unchanged one, is listed in `VersionedSchema.models`
2. Check that the migration plan lists every schema version in order, with a stage for each transition
3. Check that the container uses the latest schema and registers the migration plan
4. Verify relationship inverses on both sides
5. Enable SwiftData debug logging with the `-com.apple.coredata.swiftdata.debug 1` launch argument, and read the SQL in the console

### Step 3: Apply Targeted Fix

Your assistant applies the matching pattern:
- **Pattern 1** – Relationship inverse fixes, including the iOS 17.0 many-to-many workaround
- **Pattern 2** – Schema version mismatch
- **Pattern 3** – Data loss from `willMigrate` and `didMigrate` misuse
- **Pattern 4** – Real device testing of the upgrade path
- **Pattern 5** – Relationship prefetching

## Key Diagnostic Patterns

### Many-to-Many Relationships

```swift
// ❌ Missing inverse causes "Expected only Arrays"
var tags: [Tag] = []

// ✅ Explicit inverse, declared on both sides
// In Note:
@Relationship(deleteRule: .nullify, inverse: \Tag.notes)
var tags: [Tag] = []

// In Tag:
@Relationship(deleteRule: .nullify, inverse: \Note.tags)
var notes: [Note] = []
```

### Schema Version Checklist

```swift
enum MigrationPlan: SchemaMigrationPlan {
    static var schemas: [any VersionedSchema.Type] {
        [SchemaV1.self, SchemaV2.self, SchemaV3.self]  // All versions!
    }
}
```

### Simulator vs Device

The Simulator deletes the database on each rebuild, which hides schema mismatches. A real device keeps its database and crashes immediately on a mismatch, so **always test migrations on a real device with real data before shipping**: install the old version, create data, then install the new version over it.

## Quick Reference

| Error | Fix | Time |
|-------|-----|------|
| "Expected only Arrays" | Add `@Relationship(inverse:)` | 2 min |
| "incompatible model" | Add the missing version to `schemas` | 2 min |
| Crash after a schema change | Include every model in `models` | 2 min |
| "Failed to fulfill faulting" | Add `relationshipKeyPathsForPrefetching` | 3 min |
| Relationships `nil` after migration | Fix the `@Relationship(inverse:)` key path | 3 min |
| Data lost after migration | Move the logic from `didMigrate` to `willMigrate` | 5 min |
| Device crash only | Test on a real device | 15 min |

## Documentation Scope

This page documents the `swiftdata-migration-diag` diagnostic skill (in the `axiom-data` suite) — systematic troubleshooting your assistant uses when SwiftData migrations fail.

## Related

- [swiftdata-migration](/skills/persistence/swiftdata-migration) – Custom migration patterns, including two-stage migrations for complex type changes
- [swiftdata](/skills/persistence/swiftdata) – SwiftData fundamentals
- [database-migration](/skills/persistence/database-migration) – General migration safety
- [swiftdata-auditor](/agents/swiftdata-auditor) – Scans your models for migration risks before you ship

## Resources

**WWDC**: 2025-291 (SwiftData Migration), 2023-10195 (Schema modeling)

**Docs**: /swiftdata, /swiftdata/schemamigrationplan
