---
name: storage
description: Navigation hub for ALL storage decisions — choosing between SwiftData, Core Data, SQLite, and files; picking the right directory (Documents vs Application Support vs Caches vs tmp); deciding between CloudKit and iCloud Drive
---

# iOS Storage Decisions

Navigation hub for storage decisions on Apple platforms, covering both dimensions of every choice: **format** (structured records or files) and **location** (local or cloud, and which directory). The wrong format forces workarounds; the wrong location causes data loss, backup bloat, or App Store rejections.

## When to Use

Use this skill when you're:
- Starting a project and choosing a storage approach
- Asking "where should I store this data?"
- Deciding between SwiftData, Core Data, SQLiteData, GRDB, or plain files
- Choosing between CloudKit and iCloud Drive for sync
- Deciding between Documents, Application Support, Caches, and tmp
- Planning data architecture for offline-first or sync-heavy apps
- Migrating from one storage solution to another
- Debugging "files disappeared", "backup is huge", or "data not syncing"

For implementation details, use the more specific skills listed under Related below.

## Example Prompts

Questions you can ask your assistant that will draw from this skill:

- "Where should I store user-edited photos versus downloaded thumbnails?"
- "Should I use SwiftData or SQLiteData for a notes app?"
- "My app's iCloud backup is 2 GB. What am I doing wrong?"
- "Should I sync this user data with CloudKit or iCloud Drive?"
- "We're moving from JSON files to SwiftData. How do we plan the migration?"
- "Why are the files I saved in `tmp/` gone after a relaunch?"
- "What happens to local files on tvOS between launches?"

## What This Skill Provides

### Format decisions

- Structured data versus files — the question to ask before picking an API
- SwiftData, Core Data, SQLiteData, and GRDB — when each is the right tool
- When plain `FileManager` beats any database

### Location decisions

- **Documents** – user-created content; backed up, and visible in the Files app only when `UIFileSharingEnabled` is set
- **Application Support** – app-generated data that must persist; backed up and hidden from the user
- **Caches** – re-downloadable content; excluded from backup, and purged by the system under storage pressure
- **tmp** – scratch space the system purges while your app isn't running
- **`isExcludedFromBackup`** – explicit backup control for large files

### Cloud sync decisions

- CloudKit versus iCloud Drive versus `NSUbiquitousKeyValueStore`
- SwiftData with CloudKit (iOS 17+) versus CKSyncEngine versus the raw CloudKit APIs
- The 1 MB total and 1,024-key limits on `NSUbiquitousKeyValueStore`

### Platform gotchas

- tvOS guarantees almost no persistent local storage: beyond a small `UserDefaults` allowance, any local file can be gone at the next launch
- The system purges Caches under storage pressure and tmp between launches, so everything in either needs a way to be recreated
- Everything in Documents goes into the iCloud backup; large re-downloadable files there bloat backups and risk rejection

### Migration checklists

- Database to database (Core Data to SwiftData)
- Files to database (JSON to SwiftData)
- Local to cloud (CloudKit and iCloud entitlements, conflict handling, opt-in UX)

## Key Pattern

### Choose location by lifecycle, not by convenience

```swift
// User-created → Documents (backed up)
try data.write(
    to: FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
        .appendingPathComponent("MyDocument.pdf"),
    options: .completeFileProtection
)

// Re-downloadable → Caches (system can purge, excluded from backup)
let cacheURL = FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask)[0]
    .appendingPathComponent("thumbnail.jpg")
try imageData.write(to: cacheURL)

var resourceValues = URLResourceValues()
resourceValues.isExcludedFromBackup = true
try cacheURL.setResourceValues(resourceValues)
```

Both writes use the same `FileManager` API. The lifecycle — "the user made this" versus "I can download this again" — decides the directory.

## Documentation Scope

This page documents the `storage` skill (in the `axiom-data` suite). To scan an existing project for misplaced files, missing backup exclusions, and other storage mistakes, use the [storage-auditor](/agents/storage-auditor) agent.

## Related

- [swiftdata](/skills/persistence/swiftdata) – implementation details for `@Model`, `@Query`, and Swift 6 concurrency
- [sqlitedata](/skills/persistence/sqlitedata) – value-type persistence with CloudKit record sharing
- [grdb](/skills/persistence/grdb) – raw SQL, reactive queries, and complex database operations
- [core-data](/skills/persistence/core-data) – when you're maintaining an existing Core Data app
- [cloud-sync](/skills/persistence/cloud-sync) – CloudKit sync implementation with CKSyncEngine
- [database-migration](/skills/persistence/database-migration) – safe schema evolution patterns
- [codable](/skills/persistence/codable) – JSON and plist encoding for small structured data
- [storage-diag](/diagnostic/storage-diag) – troubleshooting missing files, backup bloat, and protection-level failures
- [storage-management-ref](/reference/storage-management-ref) – purge policies, disk space APIs, and quota management
- [file-protection-ref](/reference/file-protection-ref) – `.completeFileProtection` and related encryption options
- [icloud-drive-ref](/reference/icloud-drive-ref) – ubiquitous container patterns for file-based sync
- [cloudkit-ref](/reference/cloudkit-ref) – CKSyncEngine and raw CloudKit API reference

## Resources

**WWDC**: 2023-10187, 2023-10188, 2024-10137

**Docs**: /foundation/filemanager, /swiftdata, /cloudkit/cksyncengine, /foundation/nsubiquitouskeyvaluestore
