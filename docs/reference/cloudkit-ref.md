---
name: cloudkit-ref
description: Modern CloudKit sync and sharing — SwiftData integration, CKSyncEngine, database APIs, root-record + zone-wide CKShare, conflict resolution
skill_type: reference
---

# CloudKit Reference

CloudKit reference for syncing and sharing structured records through iCloud. It covers the three modern sync approaches (SwiftData + CloudKit, CKSyncEngine, raw CloudKit), the two record-sharing models, and conflict resolution.

## When to Use This Reference

Use this reference when you're:

- Choosing between SwiftData + CloudKit, CKSyncEngine, and raw CloudKit APIs
- Syncing structured records (with relationships) across a user's devices
- Sharing records or an entire zone with other iCloud users (collaboration)
- Deciding between root-record and zone-wide sharing
- Resolving save conflicts (`CKError.serverRecordChanged`, save policies)
- Setting up custom zones, subscriptions, and change tracking
- Storing files as `CKAsset`s, including copying a Photos asset server-side (iOS 27)
- Monitoring CloudKit error rates and quota in the CloudKit Console

## Example Prompts

Questions you can ask your assistant that will draw from this reference:

- "Should I use SwiftData + CloudKit or CKSyncEngine for my app?"
- "How do I share a record with another iCloud user?"
- "Should I use root-record (`CKShare(rootRecord:)`) or zone-wide (`CKShare(recordZoneID:)`) sharing?"
- "I shared my data but the person I invited sees a blank list. Why?"
- "How do I share an entire CloudKit zone?"
- "How do I handle `CKError.serverRecordChanged` conflicts?"
- "How do I fetch only the changes since my last sync?"

## What's Covered

### Sync Approaches
- SwiftData + CloudKit: `ModelConfiguration(cloudKitDatabase:)`; private database only, no `@Attribute(.unique)`
- CKSyncEngine: events, pending-change batches (250 records per batch), state serialization, account changes, for custom persistence such as SQLite, GRDB, or JSON
- Raw CloudKit: `CKContainer`, `CKDatabase`, `CKRecord`, `CKRecordZone`, `CKAsset`, `CKModifyRecordsOperation`

### Databases and Scopes
- Private, public, and shared scopes: access, SwiftData support, use cases
- `privateCloudDatabase`, `publicCloudDatabase`, `sharedCloudDatabase`
- Entitlements and Xcode capability setup

### Zones and Change Tracking
- Custom zones and `CKRecordZone`
- Initial and incremental sync with `CKFetchDatabaseChangesOperation`, `CKFetchRecordZoneChangesOperation`, and server change tokens

### Subscriptions
- `CKDatabaseSubscription`, `CKQuerySubscription`, `CKRecordZoneSubscription`
- Silent push with `shouldSendContentAvailable`, and handling the notification

### Assets
- `CKAsset` from a file URL
- Server-side copy from Photos with `CKAsset(importing:)` and `CKAsset.ExportedAssetID` (iOS 27), and its data-safety edges

### Sharing
- **Root-record (hierarchical)** – `CKShare(rootRecord:)`; shares a record plus its `parent`-linked descendants
- **Zone-wide** – `CKShare(recordZoneID:)`; shares *every* record in the zone, for apps that read by enumerating the whole zone
- The decision: an app that enumerates the zone needs zone-wide sharing, or the invitee sees an empty data set
- `UICloudSharingController`, participant permissions, `CKAcceptSharesOperation`, the `CKRecordNameZoneWideShare` constant
- Participant equality compares identity, not permissions

### Conflict Resolution
- Save policies (`.ifServerRecordUnchanged`), `CKError.serverRecordChanged`, merging the server and client records

### Monitoring
- CloudKit Console: developer notifications, telemetry (error rate, latency percentiles, bandwidth), logs

## Key Patterns

### SwiftData + CloudKit (the easy path)

```swift
let container = try ModelContainer(
    for: Task.self,
    configurations: ModelConfiguration(
        cloudKitDatabase: .private("iCloud.com.example.app")
    )
)
```

### Choosing a sharing model

```swift
// Hierarchical: share one record and its parent-linked children.
let share = CKShare(rootRecord: rootRecord)

// Zone-wide: share the whole zone. Use this when the app reads by
// enumerating the zone rather than walking a root hierarchy — with
// root-record sharing, such an app exposes a blank data set to the invitee.
let zoneShare = CKShare(recordZoneID: customZone.zoneID)
```

## Documentation Scope

This page documents the `cloudkit-ref` skill (in the `axiom-data` suite), the reference your assistant uses for database-backed CloudKit: records, sync, and sharing. The skill holds the full patterns and code.

## Related

- [swiftdata](/skills/persistence/swiftdata) – SwiftData models that sync through `ModelConfiguration(cloudKitDatabase:)`
- [cloud-sync-diag](/diagnostic/cloud-sync-diag) – Diagnosing sync failures and conflict errors when CloudKit misbehaves
- [icloud-drive-ref](/reference/icloud-drive-ref) – File and document iCloud sync, a different problem from record sync
- [storage](/skills/persistence/storage) – Choosing between CloudKit, iCloud Drive, and local storage
- [photo-library-ref](/reference/photo-library-ref) – The Photos side of the server-side asset copy
- [icloud-auditor](/agents/icloud-auditor) – Automated scan for entitlement, `CKError`-coverage, and account-change gaps

## Resources

**WWDC**: 2023-10188, 2024-10122

**Docs**: /cloudkit, /cloudkit/ckshare, /cloudkit/cksyncengine, /cloudkit/ckrecordzone
