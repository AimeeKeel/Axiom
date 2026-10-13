---
name: cloud-sync-diag
description: Systematic diagnostics for CloudKit errors, iCloud Drive sync failures, and quota issues
---

# Cloud Sync Diagnostics

Systematic troubleshooting for iCloud sync problems in both CloudKit and iCloud Drive. Most sync failures come from account or entitlement setup, connectivity, or sync-timing expectations, not from iCloud itself.

## Symptoms This Diagnoses

Use when you're experiencing:
- Nothing ever syncs, with no errors and a silent console
- Sync works in development but fails in TestFlight or the App Store
- Files or data not appearing on other devices
- "iCloud account not available" errors
- Persistent sync conflicts, or the same record duplicated across devices
- Records that silently go missing after a batch save
- CloudKit quota exceeded (`CKError.quotaExceeded`)
- Upload or download stuck at 0%
- Works in the Simulator but not on a device
- Works on Wi-Fi but not on cellular
- SwiftData not syncing to CloudKit

## Example Prompts

- "Data isn't syncing between my devices"
- "Getting 'iCloud account not available' error"
- "CloudKit quota exceeded — what do I tell users?"
- "How do I handle CKError.serverRecordChanged?"
- "Sync worked in TestFlight but fails in the App Store build"
- "SwiftData CloudKit sync stopped working"
- "iCloud Drive files won't upload"

## Diagnostic Workflow

Your assistant starts with the setup checks: for Core Data, whether any store description you built yourself carries `cloudKitContainerOptions` (without it, that store saves locally and syncs nothing, with no error); then iCloud account status, entitlements, network, and device storage. From there it follows the decision tree for your symptom.

### CloudKit Issues

```
Check account status first:
  await container.accountStatus()
  ├─ .noAccount → User not signed into iCloud
  ├─ .restricted → Parental controls or corporate restrictions
  └─ .temporarilyUnavailable → Network issue or iCloud outage

Worked in development, fails after release:
  └─ Production schema never deployed (not a quota problem)
     → CloudKit Console → Deploy Schema to Production

CKError handling:
  ├─ .quotaExceeded → Prompt the user to free or buy storage
  ├─ .networkUnavailable → Queue for retry
  └─ .serverRecordChanged → Fetch the latest record first; merge only true conflicts
```

### iCloud Drive Issues

```
File not syncing:
  ├─ Check upload error: ubiquitousItemUploadingErrorKey
  ├─ Check download error: ubiquitousItemDownloadingErrorKey
  └─ Check conflicts: ubiquitousItemHasUnresolvedConflictsKey

Files not appearing on another device:
  ├─ Same iCloud account on both devices?
  ├─ Entitlements match?
  ├─ iCloud Drive enabled for the app in Settings?
  └─ Wait: sync takes minutes, not seconds
```

### SwiftData CloudKit

```
SwiftData not syncing:
  ├─ ModelConfiguration has a CloudKit container?
  ├─ Using the private database only?
  └─ No @Attribute(.unique)? (not supported with CloudKit)
```

## Key Diagnostic Checks

```swift
// 1. Check iCloud availability
let token = FileManager.default.ubiquityIdentityToken
if token == nil {
    print("❌ Not signed into iCloud")
}

// 2. Check CloudKit account
let status = try await CKContainer.default().accountStatus()
// .available, .noAccount, .restricted

// 3. Check container access
if let url = FileManager.default.url(
    forUbiquityContainerIdentifier: nil
) {
    print("✅ Container: \(url)")
}
```

## Common CloudKit Errors

| Error | Cause | Fix |
|-------|-------|-----|
| `quotaExceeded` | The user's (private database) or your container's (public database) CloudKit storage is full | Prompt the user to free space |
| `serverRecordChanged` | Saving a stale record, or a true concurrent edit | Fetch, modify, then save; merge records only for real multi-device conflicts |
| `networkUnavailable` | No connection | Queue for retry |
| `accountTemporarilyUnavailable` | iCloud temporarily unavailable or the user signed out | Retry with backoff |
| `unknownItem` or `invalidArguments` after release | Production schema not deployed | Deploy the schema to Production in the CloudKit Console |
| `limitExceeded` from `CKSyncEngine` | A change batch exceeded the 250-record cap | Build batches with `CKSyncEngine.RecordZoneChangeBatch(pendingChanges:recordProvider:)` |

Batch saves can also lose records silently: check each record's result in `perRecordSaveBlock`, not just the operation's overall result.

## Documentation Scope

This page documents the `cloud-sync-diag` diagnostic skill (in the `axiom-data` suite) — systematic troubleshooting your assistant uses when you report iCloud sync problems. The skill also covers convergent deduplication of records duplicated across devices, file coordinator deadlocks, server-side asset import errors, a production crisis checklist for sync that breaks after an update, and CloudKit Console monitoring.

## Related

- [cloud-sync](/skills/persistence/cloud-sync) – Choosing and implementing a sync approach
- [cloudkit-ref](/reference/cloudkit-ref) – CloudKit and `CKSyncEngine` implementation details
- [icloud-drive-ref](/reference/icloud-drive-ref) – iCloud Drive implementation details
- [swiftdata](/skills/persistence/swiftdata) – SwiftData with CloudKit integration
- [icloud-auditor](/agents/icloud-auditor) – Scans your code for iCloud sync issues
- [networking](/skills/integration/networking) – Network connectivity patterns

## Resources

**Docs**: /cloudkit, /swiftdata

**Console**: [CloudKit Console](https://icloud.developer.apple.com/dashboard)
