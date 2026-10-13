---
name: avfoundation-video-ref
description: AVFoundation video & media-engine APIs — AVAssetWriter/AVAssetExportSession, the concurrency-native sample-buffer Receiver pipeline, iOS 27 resumable export, segment-based writing, Apple Log 2, and the Swift-only deprecations
---

# AVFoundation Video & Media-Engine Reference

API reference for AVFoundation's video write, export, and render engine, the companion to the audio-focused AVFoundation reference. It covers the async writing and export APIs, the new iOS 27 capabilities, and the Swift-only deprecations that retire the old callback and KVO surface.

## When to Use This Reference

Use this reference when:
- Writing or exporting video with `AVAssetWriter` or `AVAssetExportSession`
- Migrating off the Swift-deprecated export and write calls (`exportAsynchronously`, `startWriting`, `progress`, `cancelExport`)
- Adopting the concurrency-native sample-buffer `Receiver` pipeline
- Adding iOS 27 resumable export or segment-based writing
- Capturing in Apple Log or Apple Log 2, or detaching playback from system audio
- Propagating color tagging and other attachments between pixel buffers

## Example Prompts

Questions you can ask your assistant that will draw from this reference:

- "How do I migrate off `exportAsynchronously` in Swift 6?"
- "What replaces `AVAssetWriter.startWriting()` in iOS 27?"
- "How does resumable export work with `configureForResumableExport`?"
- "Show me the segment-based writing flow with `AVAssetWritingPlanner`."
- "How do I enqueue sample buffers with backpressure on the new `Receiver`?"
- "How do I record in Apple Log 2?"
- "Why did my processed frame lose its color tagging?"
- "How do I copy attachments from a source pixel buffer to a destination?"

## What's Covered

### Writing and export engine (before iOS 27)

These APIs predate iOS 27. They replace the calls iOS 27 deprecates in Swift, and they work on an iOS 26 or older deployment target, so migrating to them needs no availability check.

- `AVAssetWriter.start()`, `inputReceiver(for:)`, `AVAssetWriterInput.SampleBufferReceiver`, `appendImmediately(_:)`, `inputReceiverRequestingMultiPass(for:)` (iOS 26)
- `AVAssetExportSession.export(to:as:)` (iOS 13), `states(updateInterval:)` (iOS 18)

### Swift-only deprecations

Deprecated in Swift only; Objective-C callers are unaffected. Each has an async replacement.

- `exportAsynchronously(completionHandler:)` (iOS 18)
- `progress`, `cancelExport()`, `startWriting()`, per-input `append(_:)` and the pixel-buffer adaptor path (iOS 27)

### iOS 27 additions

- **Resumable export** – `AVAssetExportSession.configureForResumableExport()`, `AVAssetExportSession.ResumptionState`
- **Segment-based writing** – `AVAssetWritingPlanner` (`init(directoryForTemporaryFiles:)`, `plan(_:segmentHandler:)`, `executePlan()`, `segmentBoundaryGuidelinesForVideo(codecType:encoderSpecification:)`), `AVAssetVideoTrackPlan`
- **Concurrency-native rendering** – `AVSampleBufferVideoRenderer.Receiver` and its audio counterpart: `sampleBufferReceiver(adding:)` and `removeReceiver(_:at:)` on `AVSampleBufferRenderSynchronizer`, `enqueue(_:)` → `EnqueueResult`, `enqueueImmediately(_:)`, `renderingEventsAfterFinishedEnqueuing`
- **Apple Log 2** – `AVVideoLogTransferFunctionKey`, `AVVideoLogTransferFunction_AppleLog`, `AVVideoLogTransferFunction_AppleLog2`
- **Typed buffer attachments** – `CVAttachmentAccess`, `CVAttachmentContainer`, `propagate(from:)`, `copy()`, `attachedMode(of:)`, custom keys through the `*AttachmentKeyDefinitions` enums; they replace untyped `CMSetAttachment` and `kCVImageBuffer*` keys, on Swift-native buffer types only
- **Detach playback from system audio** – `AVPlayer.setDisconnectedFromSystemAudio(_:)` (iOS, tvOS, watchOS, and visionOS 27; not macOS)

### Concurrency posture

The media engine is `async`- and `Sendable`-first without broad `@MainActor` isolation, and its async append and enqueue entry points are `nonisolated(nonsending)`.

## Documentation Scope

This page documents the `avfoundation-video-ref` skill (in the `axiom-media` suite), an API reference with no mandatory workflow. The skill holds the signatures, code examples, and availability traps your assistant uses when answering.

- For the Swift 6 `async` and `Sendable` patterns these APIs rely on, see [Swift Concurrency](/skills/concurrency/swift-concurrency)

## Related

- [AVFoundation (audio)](/reference/avfoundation-ref) – The audio half of AVFoundation: audio session, engine, and spatial audio
- [Camera Capture](/reference/camera-capture-ref) – `AVCaptureSession` setup and recording, which feeds the writer and export APIs here

## Resources

**WWDC**: 2026-256

**Docs**: /avfoundation/avassetexportsession, /avfoundation/avassetwriter, /avfoundation/avassetwritingplanner, /avfoundation/avsamplebuffervideorenderer
