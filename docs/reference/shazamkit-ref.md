---
name: shazamkit-ref
description: ShazamKit API reference — SHManagedSession (iOS 17+), SHSession, custom catalogs, signature generation, media items, library management, and the Shazam CLI
---

# ShazamKit Reference

An API reference for ShazamKit, which recognizes audio against Shazam's music catalog or against a custom catalog you build. It covers the iOS 17 `SHManagedSession`, which records for you, and the iOS 15 `SHSession` for buffer-level control, plus catalogs, signatures, the user's Shazam library, and the `shazam` command-line tool.

## When to Use This Reference

Use this reference when:
- Looking up `SHManagedSession` initializers, methods (`prepare()`, `result()`, `results`, `cancel()`), or state cases (`.idle`, `.prerecording`, `.matching`)
- Working with `SHSession` for buffer-level matching (iOS 15+, with your own `AVAudioEngine` capture) or `matchStreamingBuffer(_:at:)` for streaming audio
- Building a custom catalog (`SHCustomCatalog`) from `SHMediaItem` and `SHSignature` pairs, loading a `.shazamcatalog` file, or serializing a catalog with `dataRepresentation`
- Generating signatures with `SHSignatureGenerator`, from `AVAudioPCMBuffer` chunks finished with `signature()` or from a whole `AVAsset`
- Defining custom `SHMediaItemProperty` keys for app-specific metadata on matched items
- Reading match-specific properties (`matchOffset`, `predictedCurrentMatchOffset`, `frequencySkew`, `confidence`) from `SHMatchedMediaItem`
- Managing the user's Shazam library with `SHLibrary` (iOS 17+ — add, read, and delete) or the legacy write-only `SHMediaLibrary` (`add`)
- Looking up `SHError` codes and their meanings
- Using the `shazam` command-line tool to generate signatures and catalogs offline, at scale

## Example Prompts

Questions you can ask your assistant that will draw from this reference:

- "What's the API signature for `SHManagedSession.result()` and what does the return type look like?"
- "How do I use `SHSession.matchStreamingBuffer` and what's the `at:` parameter for?"
- "What properties does `SHMatchedMediaItem` add on top of `SHMediaItem`?"
- "How do I define a custom `SHMediaItemProperty` for my podcast episode number?"
- "What's the difference between `SHLibrary` and `SHMediaLibrary`?"
- "What does `SHError.Code.audioDiscontinuity` mean, and how do I avoid it?"
- "How do I generate signatures from audio files at scale with the CLI?"
- "Can I match against both the Shazam catalog and a custom catalog from one session?"

## What's Covered

- **`SHManagedSession` (iOS 17+)** – initializer overloads (Shazam catalog vs custom catalog), single-shot `result() async`, `results` `AsyncSequence` for continuous matching, `prepare() async` for pre-recording, `cancel()` to stop, `Observable` conformance and the `state` property with `.idle` / `.prerecording` / `.matching` cases, `Sendable` conformance
- **`SHSession` (iOS 15+)** – initializer overloads, `match(_:)` for complete signatures, `matchStreamingBuffer(_:at:)` for streaming audio (with the contiguous-audio validation), `delegate` for callback-based delivery, `results` `AsyncSequence` (iOS 16+), audio format support on iOS 15–16 (specific PCM formats) vs iOS 17+ (automatic conversion), multiple-match behavior on iOS 17+
- **`SHSession.Result` (iOS 16+)** – `.match(SHMatch)` / `.noMatch(SHSignature)` / `.error(any Error, SHSignature)`
- **`SHSessionDelegate`** – `session(_:didFind:)` and `session(_:didNotFindMatchFor:error:)` optional methods
- **`SHMatch`** – `mediaItems` array of `SHMatchedMediaItem` and `querySignature`
- **`SHMediaItem`** – properties dictionary keyed by `SHMediaItemProperty`, predefined keys (`.title`, `.subtitle`, `.artist`, `.artworkURL`, `.videoURL`, `.genres`, `.explicitContent`, `.ISRC`, `.appleMusicID`, `.appleMusicURL`, `.webURL`, `.shazamID`, `.creationDate`), iOS 16+ timed content properties (`.timeRanges`, `.frequencySkewRanges`), custom property extension pattern, `fetch(shazamID:)` class method, subscript access, `Identifiable` (iOS 17+) / `Sendable` conformances
- **`SHMatchedMediaItem`** – match-only additions: `.matchOffset`, `.predictedCurrentMatchOffset` (auto-updating during streaming), `.frequencySkew`, `.confidence` (0.0 to 1.0, iOS 18.4+)
- **`SHMediaItemProperty`** – `RawRepresentable` struct for predefined and custom property keys, complete list of predefined keys, custom extension pattern
- **`SHSignature`** – `duration`, `dataRepresentation` for storage/transmission, `init(dataRepresentation:)` throwing initializer, `slices(from:duration:stride:)` for segmenting (iOS 18+)
- **`SHSignatureGenerator`** – `append(_:at:)` for `AVAudioPCMBuffer` chunks, `signature()` to finalize, `signature(from:)` for an `AVAsset` (iOS 16+)
- **`SHCatalog` and `SHCustomCatalog`** – `minimumQuerySignatureDuration` / `maximumQuerySignatureDuration`, `addReferenceSignature(_:representing:)`, `dataRepresentation` and `init(dataRepresentation:)` (iOS 18+), `add(from:)` for `.shazamcatalog` files, `write(to:)` (deprecated in iOS 18)
- **`SHLibrary` (iOS 17+) and the legacy `SHMediaLibrary`** – `SHLibrary` adds, reads, and deletes the items your app added, syncing through iCloud; `SHMediaLibrary` is write-only and accepts only Shazam catalog items
- **`SHError` codes** – matching, catalog, signature, media library, and session errors
- **Audio format requirements** – what formats `SHSession` accepts on iOS 15–16 vs iOS 17+, format conversion responsibilities
- **`shazam` CLI (macOS 13+)** – `shazam signature` and the `shazam custom-catalog` subcommands (`create`, `update`, `display`, `remove`, `export`) for offline signature generation and catalog construction
- **Quick reference** – class hierarchy, common-task table, `.shazamsignature` and `.shazamcatalog` file extensions, and Apple's two sample projects

## Documentation Scope

This page documents the `shazamkit-ref` skill (in the `axiom-media` suite), the API lookup half of the ShazamKit pair. Choosing between the two session APIs, the setup checklist, the ShazamKit App Service that Shazam catalog matching needs, and common mistakes live in the `shazamkit` skill listed under Related.

## Related

- [ShazamKit](/skills/integration/shazamkit) – which session API to use, the setup checklist, and why Shazam catalog matching silently returns nothing without the ShazamKit App Service
- [Privacy UX](/skills/integration/privacy-ux) – asking for microphone access (`NSMicrophoneUsageDescription`) at the right moment
- [Now Playing](/skills/integration/now-playing) – Lock Screen metadata and MusicKit playback when your app plays a matched song
- [AVFoundation Reference](/reference/avfoundation-ref) – the `AVAudioEngine` capture that feeds `AVAudioPCMBuffer`s to `SHSession`

## Resources

**WWDC**: 2021-10044, 2021-10045, 2022-10028, 2023-10051

**Docs**: /shazamkit, /shazamkit/shmanagedsession, /shazamkit/shsession, /shazamkit/shcustomcatalog, /shazamkit/shmediaitem, /shazamkit/shlibrary
