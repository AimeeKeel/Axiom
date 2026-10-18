# Skills

Skills are the Apple-platform guidance Axiom gives your assistant, which loads the right skill automatically when your question matches its topic, so you never need to name one. Browse an area below for its full list, or scan the tables for a selection by category.

## Browse by Area

- **[UI & Design](/skills/ui-design/)** – SwiftUI views, navigation, layout, Liquid Glass, and the Human Interface Guidelines
- **[Computer Vision](/skills/computer-vision/)** – The Vision framework and on-device media analysis
- **[Machine Learning](/skills/machine-learning/)** – Core ML models and speech-to-text
- **[Debugging & Troubleshooting](/skills/debugging/)** – Build failures, crashes, hangs, memory, and performance profiling
- **[Concurrency & Async](/skills/concurrency/)** – Swift 6 concurrency, actors, `Sendable`, and Swift performance
- **[Persistence](/skills/persistence/)** – SwiftData, Core Data, GRDB, CloudKit, and safe migrations
- **[Apple Intelligence & Integration](/skills/integration/)** – Siri, App Intents, widgets, StoreKit, networking, and system services
- **[Testing](/skills/testing/)** – Swift Testing, XCTest, and UI automation
- **[Games](/skills/games/)** – SpriteKit, SceneKit, and RealityKit
- **[HealthKit and WorkoutKit](/skills/health/)** – Health data, workouts, and wellbeing APIs
- **[macOS](/skills/macos/)** – Windows, menus, sandboxing, AppKit, and distribution
- **[Security](/skills/security/)** – Keychain, CryptoKit, passkeys, App Attest, and securing agentic features
- **[Shipping & App Store](/skills/shipping/)** – Submission, rejections, and App Store Connect
- **[watchOS](/skills/watchos/)** – Apple Watch app structure, complications, and background tasks
- **[Xcode MCP Integration](/skills/xcode-mcp/)** – Connecting your assistant to Xcode's MCP tools

## Selected Skills by Category

### UI & Design

| Skill | When to Use |
|-------|-------------|
| [**app-composition**](/skills/ui-design/app-composition) | Structuring app entry points, `@main`, App/Scene/View lifecycle |
| [**hig**](/skills/ui-design/hig) | Quick design decisions, HIG compliance checklists, defending design choices |
| [**hig-ref**](/reference/hig-ref) | Comprehensive HIG reference with code examples and best practices |
| [**liquid-glass**](/skills/ui-design/liquid-glass) | Implementing Liquid Glass effects, debugging visual artifacts, design review pressure |
| [**liquid-glass-ref**](/reference/liquid-glass-ref) | Complete Liquid Glass adoption guide (icons, controls, navigation, windows) |
| [**sf-symbols**](/skills/ui-design/sf-symbols) | SF Symbols rendering, variable values, symbol effects, color modes |
| [**swiftui-architecture**](/skills/ui-design/swiftui-architecture) | Choosing a SwiftUI architecture — Apple's `@Observable` patterns first, and when MVVM, TCA, or Coordinator earn their layer |
| [**swiftui-performance**](/skills/ui-design/swiftui-performance) | App feels sluggish, animations stutter, SwiftUI Instrument profiling |
| [**swiftui-debugging**](/skills/ui-design/swiftui-debugging) | View doesn't update, preview crashes, layout issues |
| [**swiftui-debugging-diag**](/diagnostic/swiftui-debugging-diag) | Systematic SwiftUI debugging, intermittent issues, complex state dependencies |
| [**swiftui-gestures**](/skills/ui-design/swiftui-gestures) | Implementing tap, drag, long press, magnification, rotation gestures |
| [**swiftui-layout**](/skills/ui-design/swiftui-layout) | Adaptive layouts, iPad multitasking, iOS 26 free-form windows |
| [**swiftui-layout-ref**](/reference/swiftui-layout-ref) | `ViewThatFits`, `AnyLayout`, the `Layout` protocol, iOS 26 window APIs |
| [**swiftui-nav**](/skills/ui-design/swiftui-nav) | `NavigationStack` vs. `NavigationSplitView`, deep links, coordinator patterns |
| [**swiftui-nav-diag**](/diagnostic/swiftui-nav-diag) | Navigation not responding, unexpected pops, deep link failures |
| [**swiftui-nav-ref**](/reference/swiftui-nav-ref) | Comprehensive SwiftUI navigation API reference: `NavigationStack`, `NavigationSplitView`, `NavigationPath` |
| [**swiftui-26-ref**](/reference/swiftui-26-ref) | iOS 26 and iOS 27 SwiftUI: Liquid Glass, `@Animatable`, `WebView`, rich text, 3D charts |
| [**textkit-ref**](/reference/textkit-ref) | TextKit 2 architecture, migration, Writing Tools support |
| [**typography-ref**](/reference/typography-ref) | San Francisco fonts, text styles, Dynamic Type, tracking, leading |
| [**uikit-bridging**](/skills/ui-design/uikit-bridging) | Wrapping UIKit views and controllers in SwiftUI with `UIViewRepresentable` |
| [**uikit-animation-debugging**](/skills/ui-design/uikit-animation-debugging) | `CAAnimation` issues, completion handlers, spring physics |
| [**ux-flow-audit**](/skills/ui-design/ux-flow-audit) | Dead ends, dismiss traps, buried calls to action, missing empty, loading, and error states |

### Computer Vision

| Skill | When to Use |
|-------|-------------|
| [**vision**](/skills/computer-vision/vision) | Subject segmentation, hand and body pose, text recognition (OCR), barcode and QR scanning, document scanning |
| [**vision-ref**](/reference/vision-ref) | Complete Vision framework API reference with code examples |
| [**vision-diag**](/diagnostic/vision-diag) | Subject not detected, text not recognized, barcode issues, performance problems |

### Machine Learning

| Skill | When to Use |
|-------|-------------|
| [**ios-ml**](/skills/machine-learning/ios-ml) | Hub for on-device ML and speech-to-text; routes to each Core ML stage |
| [**coreml-conversion**](/skills/machine-learning/coreml-conversion) | Convert a trained PyTorch, TensorFlow, or Keras model with `coremltools` |
| [**coreml-compression**](/skills/machine-learning/coreml-compression) | Quantization, palettization, and pruning; post-training vs. training-time |
| [**coreml-training**](/skills/machine-learning/coreml-training) | Create ML training and on-device personalization with `MLUpdateTask` |
| [**coreml-deployment**](/skills/machine-learning/coreml) | Run a model in your app: pre-warming, Swift 6-safe prediction, KV-cache, multifunction, `MLTensor` |
| [**coreml-ref**](/reference/coreml-ref) | Core ML API reference, `MLTensor`, `MLComputePlan`, `coremltools` index |
| [**coreml-diag**](/diagnostic/coreml-diag) | Load errors, slowness, memory growth, accuracy loss after compression |
| [**speech**](/skills/machine-learning/speech) | Speech-to-text with `SpeechAnalyzer` (iOS 26+), live and file transcription |

### Debugging

| Skill | When to Use |
|-------|-------------|
| [**accessibility-diag**](/diagnostic/accessibility-diag) | VoiceOver issues, Dynamic Type violations, WCAG compliance, App Store Review prep |
| [**auto-layout-debugging**](/skills/debugging/auto-layout-debugging) | Constraint conflicts, ambiguous layout warnings, Auto Layout errors |
| [**build-performance**](/skills/debugging/build-performance) | Slow builds, type checking bottlenecks, analyzing Build Timeline |
| [**build-debugging**](/skills/debugging/build-debugging) | Dependency conflicts, CocoaPods and SPM failures |
| [**core-data-diag**](/diagnostic/core-data-diag) | Schema migration crashes, thread-confinement errors, N+1 query performance |
| [**deep-link-debugging**](/skills/debugging/deep-link-debugging) | Debug-only deep links for testing, simulator navigation, automated testing |
| [**display-performance**](/skills/debugging/display-performance) | Variable refresh rate, ProMotion, `MTKView`, `CADisplayLink` |
| [**energy**](/skills/debugging/energy) | Battery drain, device hot, Power Profiler workflows, energy anti-patterns |
| [**hang-diagnostics**](/skills/debugging/hang-diagnostics) | App hangs, UI freezes, main thread blocking |
| [**lldb**](/skills/debugging/lldb) | LLDB playbooks for crash triage, state inspection, breakpoint strategy |
| [**memory-debugging**](/skills/debugging/memory-debugging) | Memory leaks, retain cycles, progressive memory growth |
| [**objc-block-retain-cycles**](/skills/debugging/objc-block-retain-cycles) | Block memory leaks, weak-strong patterns |
| [**performance-profiling**](/skills/debugging/performance-profiling) | App feels slow, profiling with Instruments |
| [**testflight-triage**](/skills/debugging/testflight-triage) | Crash investigation, beta feedback, Xcode Organizer |
| [**timer-patterns**](/skills/debugging/timer-patterns) | Timer safety, invalidation patterns, memory-safe timer usage |
| [**xcode-debugging**](/skills/debugging/xcode-debugging) | BUILD FAILED, simulator hangs, zombie processes |

### Concurrency

| Skill | When to Use |
|-------|-------------|
| [**assume-isolated**](/skills/concurrency/assume-isolated) | Synchronous actor access for tests, legacy callbacks, performance-critical code |
| [**concurrency-profiling**](/skills/concurrency/concurrency-profiling) | Profiling async/await performance, actor contention diagnosis |
| [**ownership-conventions**](/skills/concurrency/ownership-conventions) | `borrowing` and `consuming` modifiers, noncopyable types |
| [**swift-concurrency**](/skills/concurrency/swift-concurrency) | Swift 6 actor isolation, `Sendable` errors, data races |
| [**swift-concurrency-ref**](/reference/swift-concurrency-ref) | Actor, `Sendable`, `Task`, `TaskGroup`, and `AsyncStream` API reference |
| [**swift-performance**](/skills/concurrency/swift-performance) | ARC overhead, unspecialized generics, allocation optimization |
| [**synchronization**](/skills/concurrency/synchronization) | Thread-safe primitives: `Mutex` (iOS 18+), `OSAllocatedUnfairLock`, `Atomic` |

### Persistence & Storage

| Skill | When to Use |
|-------|-------------|
| [**cloud-sync**](/skills/persistence/cloud-sync) | CloudKit vs. iCloud Drive, offline-first sync, conflict resolution |
| [**cloudkit-ref**](/reference/cloudkit-ref) | CloudKit sync, `CKSyncEngine`, `CKRecord`, shared database, conflict resolution |
| [**cloud-sync-diag**](/diagnostic/cloud-sync-diag) | File not syncing, CloudKit errors, sync conflicts, iCloud upload failures |
| [**codable**](/skills/persistence/codable) | JSON encoding/decoding, Codable conformance, handling decode errors, date strategies |
| [**core-data**](/skills/persistence/core-data) | Core Data stack, concurrency patterns, relationship modeling, apps that support iOS 16 and earlier |
| [**database-migration**](/skills/persistence/database-migration) | Adding database columns, schema changes, migration errors |
| [**file-protection-ref**](/reference/file-protection-ref) | `FileProtectionType`, file encryption, data protection, secure storage |
| [**grdb**](/skills/persistence/grdb) | Raw SQL queries, complex joins, `ValueObservation` |
| [**icloud-drive-ref**](/reference/icloud-drive-ref) | iCloud Drive, ubiquitous containers, `NSFileCoordinator`, file sync |
| [**realm-migration-ref**](/reference/realm-migration-ref) | Migrating from Realm to SwiftData (Realm Device Sync shut down in September 2025) |
| [**sqlitedata**](/skills/persistence/sqlitedata) | SQLiteData patterns, batch imports, CloudKit sync |
| [**storage-diag**](/diagnostic/storage-diag) | Files disappeared, data missing, backup too large, file not found |
| [**storage-management-ref**](/reference/storage-management-ref) | Purge files, storage pressure, `isExcludedFromBackup`, cache management |
| [**storage**](/skills/persistence/storage) | Where to store data, SwiftData vs. files, CloudKit vs. iCloud Drive |
| [**swiftdata**](/skills/persistence/swiftdata) | `@Model`, `@Query`, CloudKit integration |
| [**swiftdata-migration**](/skills/persistence/swiftdata-migration) | SwiftData custom schema migrations, relationship preservation |
| [**swiftdata-migration-diag**](/diagnostic/swiftdata-migration-diag) | Migration crashes, relationship errors, device vs. simulator failures |
| [**sqlitedata-migration**](/skills/persistence/sqlitedata-migration) | Migrating from SwiftData to SQLiteData |

### Integration

| Skill | When to Use |
|-------|-------------|
| [**apple-docs**](/skills/integration/apple-docs) | Apple's official for-LLM guides and Swift compiler diagnostics from Xcode |
| [**apple-docs-research**](/skills/integration/apple-docs-research) | Researching Apple frameworks, getting WWDC transcripts, using sosumi.ai |
| [**app-discoverability**](/skills/integration/app-discoverability) | App Intents, App Shortcuts, Core Spotlight, and `NSUserActivity` for Spotlight and Siri suggestions |
| [**app-intents-ref**](/reference/app-intents-ref) | Siri, Apple Intelligence, Shortcuts, Spotlight integration (iOS 16+) |
| [**app-schemas-ref**](/reference/app-schemas-ref) | The required parameters, properties, enum cases, and return types of every App Intents schema, generated from the iOS 27 SDK |
| [**app-shortcuts-ref**](/reference/app-shortcuts-ref) | App Shortcuts, instant Siri availability, suggested phrases |
| [**avfoundation-ref**](/reference/avfoundation-ref) | `AVAudioSession`, `AVAudioEngine`, bit-perfect DAC output, iOS 26+ spatial audio capture |
| [**background-processing**](/skills/integration/background-processing) | `BGTaskScheduler`, background `URLSession`, `BGContinuedProcessingTask` (iOS 26+) |
| [**camera-capture**](/skills/integration/camera-capture) | `AVCaptureSession`, camera preview, photo and video recording |
| [**core-location**](/skills/integration/core-location) | `CLLocationUpdate`, `CLMonitor`, geofencing, background location |
| [**core-spotlight-ref**](/reference/core-spotlight-ref) | Core Spotlight search, `NSUserActivity`, `CSSearchableItem`, `IndexedEntity` |
| [**eventkit + contacts**](/skills/integration/eventkit-contacts) | Calendar events, reminders, and contact access: four skills covering EventKit and EventKitUI, Contacts and ContactsUI, and ContactProvider |
| [**extensions-widgets**](/skills/integration/extensions-widgets) | Implementing widgets and Control Center controls |
| [**extensions-widgets-ref**](/reference/extensions-widgets-ref) | WidgetKit, Control Center controls, and App Groups data sharing API reference |
| [**foundation-models**](/skills/integration/foundation-models) | On-device AI with Apple's Foundation Models framework (iOS 26+) |
| [**foundation-models-guardrails**](/skills/integration/foundation-models-guardrails) | When to relax guardrails for content transformations, and proving it's safe |
| [**foundation-models-diag**](/diagnostic/foundation-models-diag) | Foundation Models troubleshooting (context exceeded, guardrails, slow generation) |
| [**foundation-models-ref**](/reference/foundation-models-ref) | Complete Foundation Models API reference with WWDC examples |
| [**live-activities**](/skills/integration/live-activities) | Live Activities and the Dynamic Island: ActivityKit lifecycle, push and broadcast updates |
| [**in-app-purchases**](/skills/integration/in-app-purchases) | StoreKit 2 implementation, subscriptions, transaction handling |
| [**mapkit**](/skills/integration/mapkit) | SwiftUI `Map`, `MKMapView`, annotations, search, directions |
| [**network-framework-ref**](/reference/network-framework-ref) | Network.framework API reference: `NWConnection` (iOS 12+), `NetworkConnection` (iOS 26+), TLV framing, Wi-Fi Aware |
| [**networking**](/skills/integration/networking) | Implementing UDP/TCP connections, migrating from sockets, debugging connection failures |
| [**networking-diag**](/diagnostic/networking-diag) | Connection timeouts, TLS failures, data not arriving, performance issues |
| [**now-playing**](/skills/integration/now-playing) | Now Playing metadata, Lock Screen and Control Center integration, remote commands |
| [**photo-library**](/skills/integration/photo-library) | `PHPickerViewController`, `PhotosPicker`, photo selection and access |
| [**siri-audio**](/skills/integration/siri-audio) | Siri playback in audio apps — the Audio schema domain (iOS 27), SiriKit media for classic Siri, and Now Playing commands |
| [**siri-notes-reminders**](/skills/integration/siri-notes-reminders) | Siri in notes, list, and to-do apps — moving from the deprecated SiriKit Lists and Notes intents to the Notes and Reminders schemas (iOS 27) |
| [**storekit-ref**](/reference/storekit-ref) | Complete StoreKit 2 API reference, including the iOS 18.4, iOS 26.4, and OS 27 additions |
| [**tvos**](/skills/integration/tvos) | tvOS development — focus engine, top shelf, platform differences |

### Testing

| Skill | When to Use |
|-------|-------------|
| [**swift-testing**](/skills/testing/swift-testing) | Modern Swift Testing framework, `@Test`, `#expect`, parameterized tests |
| [**testing-async**](/skills/testing/testing-async) | Testing async/await with Swift Testing, confirmation patterns |
| [**ui-testing**](/skills/ui-design/ui-testing) | Recording UI tests, flaky tests, race conditions |
| [**ui-recording**](/skills/testing/ui-recording) | Recording UI Automation (Xcode 26), replay across configurations |
| [**xctest-automation**](/skills/testing/xctest-automation) | XCUITest automation, condition-based waiting patterns |

## Skill Development Methodology

### TDD-Tested Skills

Discipline skills are tested with the ["red/green/refactor" methodology](https://en.wikipedia.org/wiki/Test-driven_development) against developer pressure scenarios such as deadline pressure, authority pressure, and sunk cost. The [Quality](/start/quality) page lists every validated skill, with its grade and the number of scenarios it passed.

### Reference Skills

All reference skills are reviewed against four quality criteria:

1. **Accuracy** – Every claim cited to official sources, code tested
2. **Completeness** – 80%+ coverage, edge cases documented, troubleshooting sections
3. **Clarity** – Examples first, scannable structure, jargon defined
4. **Practical Value** – Copy-paste ready, expert checklists, real-world impact

Browse every reference skill in the [Reference](/reference/) section.

## Related Resources

- [WWDC 2026 Sessions](https://developer.apple.com/videos/wwdc2026) – Apple's session videos for the OS 27 cycle
- [Claude Code Documentation](https://code.claude.com/docs) – How skills, agents, and plugins work in Claude Code
- [Superpowers](https://github.com/obra/superpowers) – The skills library whose test-driven approach to writing skills Axiom follows

## Contributing

Feedback is welcome.

- **Issues**: [Report bugs or request features](https://github.com/CharlesWiltgen/Axiom/issues)
- **Discussions**: [Share usage patterns and ask questions](https://github.com/CharlesWiltgen/Axiom/discussions)
