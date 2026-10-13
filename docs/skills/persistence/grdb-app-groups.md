---
name: grdb-app-groups
description: Sharing a GRDB database across the main app and widgets, extensions, or Live Activities — persistent WAL, suspension defense, Data Protection on .db/-wal/-shm, cross-process change notification
version: 1.0.0
---

# GRDB Across App Groups

Discipline for sharing one SQLite database between your main app and its widgets, extensions, or Live Activities on iOS. GRDB's own documentation calls this "extremely difficult on iOS" and "almost impossible to test", so the skill turns it into an explicit checklist.

## When to Use

Use this skill when you're seeing any of these:

- "My widget shows stale data from the app's database"
- "My Live Activity can't open the database while the device is locked"
- "App keeps getting killed with `0xDEAD10CC` in crash logs"
- "App works in dev but crashes after TestFlight upload"
- "Two processes hit `SQLITE_BUSY` and never recover"
- "SQLite error 10 (`SQLITE_IOERR`) only on locked devices"
- "Why does my widget see different data than the app?"
- You're starting a new widget or extension that must read the app's GRDB database safely

This skill covers a different symptom class from [grdb-performance](/skills/persistence/grdb-performance), which fires on "query slow"; this one fires on "process boundary violated".

## Example Prompts

Questions you can ask your assistant that will draw from this skill:

- "My widget needs to read the same database as the app. How do I set it up safely?"
- "I shipped to TestFlight and now I'm getting `0xDEAD10CC` crashes. What's causing them?"
- "My Live Activity can't read the database after the device locks. Why?"
- "How do I notify my widget when the app writes to the database?"
- "Should I use `DatabaseQueue` or `DatabasePool` when my app and widget share a database?"
- "What Data Protection class should my shared SQLite file use?"

## What This Skill Provides

### Prefer Not to Share
- The snapshot-file pattern: the app writes a derived JSON or read-only SQLite file for the widget
- WidgetCenter timelines computed by the app, so the widget never opens the database
- Shared `UserDefaults` for small datasets
- Darwin notifications that ask the app to refresh instead of opening the database from the widget

### Mandatory Setup
- The App Groups entitlement on every target, all listing the same group identifier
- Resolving the container URL
- A dedicated subdirectory for the `.db`, `-wal`, and `-shm` files
- Running the same versioned migration in every process before it writes, so an FTS5 index can't drift

### Mandatory PRAGMAs and Configuration
- `DatabasePool`, which enables WAL automatically and allows concurrent reads
- Persistent WAL through the `SQLITE_FCNTL_PERSIST_WAL` file control
- `Configuration.busyMode = .timeout(5)`
- `locking_mode = NORMAL`, never `EXCLUSIVE`
- `PRAGMA optimize` in the writer process, since read-only widgets can't refresh the planner's statistics

### Data Protection
- Why an explicit `.complete` breaks widgets after auto-lock
- `.completeUntilFirstUserAuthentication` for shared databases
- Applying one class to all three files (`.db`, `-wal`, `-shm`), and again after any migration that recreates them
- Why iOS 17's `.completeWhenUserInactive` blocks widget reads during idle periods

### Suspension Defense (`0xDEAD10CC`)
- How the iOS suspension watchdog terminates an app that still holds SQLite locks
- `Configuration.observesSuspensionNotifications = true`
- Posting `Database.suspendNotification` and `resumeNotification` from the app lifecycle
- **Suspend on entering the background, not on resigning active** – `.inactive` is transient
- SwiftUI `scenePhase` wiring, with `.inactive` as a no-op
- Catching `SQLITE_ABORT` (4) and `SQLITE_INTERRUPT` (9) on the write path

### File Coordination on Open
- `NSFileCoordinator` to stop writer and reader races at open time
- Read-only opens with `readingItemAt:` and `.withoutChanges`
- Preventing migration races on the first multi-process launch

### Cross-Process Change Notification
- `DatabaseRegionObservation` to detect every commit
- Darwin notifications through `CFNotificationCenterGetDarwinNotifyCenter`
- Why `deliverImmediately` is ignored on the Darwin center

### `SQLITE_BUSY` Retry
- Why `SQLITE_BUSY` is expected, not fatal, when several processes share a database
- Exponential backoff (50 ms, 200 ms, 500 ms) wrapped around the whole `write` call
- When to show the user a "sync busy" state

## Key Pattern

### Persistent WAL setup

```swift
import GRDB
import SQLite3

var config = Configuration()
config.busyMode = .timeout(5)
config.observesSuspensionNotifications = true

config.prepareDatabase { db in
    // Keep -wal and -shm files on disk so read-only processes can attach
    var flag: CInt = 1
    let code = withUnsafeMutablePointer(to: &flag) { ptr -> CInt in
        sqlite3_file_control(db.sqliteConnection, nil, SQLITE_FCNTL_PERSIST_WAL, ptr)
    }
    guard code == SQLITE_OK else {
        throw DatabaseError(resultCode: ResultCode(rawValue: code))
    }
    try db.execute(sql: "PRAGMA locking_mode = NORMAL")
}
```

### Suspension defense wiring (SwiftUI)

```swift
@Environment(\.scenePhase) private var scenePhase

var body: some Scene {
    WindowGroup { ContentView() }
        .onChange(of: scenePhase) { _, newPhase in
            switch newPhase {
            case .active:
                NotificationCenter.default.post(
                    name: Database.resumeNotification, object: nil)
            case .background:
                NotificationCenter.default.post(
                    name: Database.suspendNotification, object: nil)
            case .inactive:
                break   // Transient — do NOT suspend here
            @unknown default:
                break
            }
        }
}
```

### Cross-process change broadcast

```swift
let regionObservation = DatabaseRegionObservation(tracking: .fullDatabase)

let cancellable = regionObservation.start(in: dbPool) { error in
    // log
} onChange: { db in
    CFNotificationCenterPostNotification(
        CFNotificationCenterGetDarwinNotifyCenter(),
        CFNotificationName("com.example.app.db.changed" as CFString),
        nil, nil, false   // deliverImmediately is ignored on Darwin center
    )
}
```

## Documentation Scope

This page documents the `grdb-app-groups` skill (in the `axiom-data` suite). For an automated scan, use the [grdb-performance-auditor](/agents/grdb-performance-auditor) agent, which flags journal-mode mismatches and missing suspension defense in app-group databases.

## Related

- [grdb](/skills/persistence/grdb) – GRDB primer for setup and queries
- [grdb-performance](/skills/persistence/grdb-performance) – performance discipline, including the `PRAGMA optimize` setup the writer process runs for shared databases
- [database-migration](/skills/persistence/database-migration) – the versioned migrations every process runs before it writes
- [sqlite-fts-ref](/reference/sqlite-fts-ref) – FTS5 sync triggers, and why a process that writes before the migration leaves the index stale
- [icloud-drive-ref](/reference/icloud-drive-ref) – iCloud Drive file sharing, a different model from a shared database
- [storage](/skills/persistence/storage) – deciding where data lives before you decide to share it

## Resources

**GRDB docs**: github.com/groue/GRDB.swift, Documentation/DatabaseSharing.md

**Docs**: /xcode/configuring-app-groups, /foundation/fileprotectiontype, /foundation/nsfilecoordinator
