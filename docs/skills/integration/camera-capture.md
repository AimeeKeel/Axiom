---
name: camera-capture
description: AVCaptureSession camera preview, photo capture, video recording, RotationCoordinator, responsive capture pipeline, session interruptions, deferred processing, deferred start, Pro Video Storage
---

# Camera Capture

AVFoundation camera patterns for custom camera UIs, covering session setup, photo capture, video recording, rotation handling, a responsive capture pipeline, and session lifecycle management.

## When to Use

Use this skill when you're:
- Building a custom camera UI (not the system picker)
- Capturing photos with quality and speed trade-offs
- Recording video with audio
- Handling device rotation correctly with `RotationCoordinator` (iOS 17+)
- Making capture feel instant (zero shutter lag, deferred processing)
- Making the camera launch fast with deferred start (iOS 26 and later)
- Recording high-data-rate video (ProRes) with Pro Video Storage (iOS 27)
- Handling session interruptions (phone calls, multitasking, thermal pressure)
- Switching between front and back cameras
- Choosing among iPhone Duo's front cameras by the direction they face, not their position

**Note:** If you just need users to pick existing photos, use [Photo Library](/skills/integration/photo-library) instead. This skill is for building custom camera experiences with `AVCaptureSession`.

## Example Prompts

Questions you can ask your assistant that will draw from this skill:

- "How do I set up a camera preview in SwiftUI?"
- "My camera freezes when I get a phone call"
- "The photo preview is rotated wrong on the front camera"
- "How do I make photo capture feel instant?"
- "Should I use deferred processing?"
- "How do I switch between front and back cameras?"
- "How do I record video with audio?"
- "My camera takes too long to capture"
- "My camera app launches slowly — the preview takes forever to appear"
- "My ProRes recording drops frames"
- "How do I support the two front cameras on iPhone Duo?"

## What This Skill Provides

### Session Architecture
- Choosing a capture mode and requesting camera permission before setup
- `AVCaptureSession` setup on a dedicated serial queue
- Input and output configuration inside an atomic `beginConfiguration()`/`commitConfiguration()` block
- Session presets for photo vs. video use cases

### Capture Patterns
- Basic photo capture with `AVCapturePhotoOutput`
- Video recording with `AVCaptureMovieFileOutput` and audio
- Switching between front and back cameras, with fallback handling
- iPhone Duo's front cameras: the virtual front camera, the camera-direction API (iOS 27.1), and when to override preview mirroring

### Responsive Capture Pipeline (iOS 17+)
- Zero shutter lag with a ring buffer for instant capture
- Responsive capture for overlapping photo captures
- Fast capture prioritization for burst-like shooting
- A readiness coordinator for shutter button state
- Deferred processing with proxy images and background processing

### Launch Performance and Pro Recording
- Deferred start for fast launch, with the preview up in roughly half the time (iOS 26 and later)
- Automatic vs. manual deferred start, including previews rendered through a video data output
- Pro Video Storage for deterministic ProRes file writes (iOS 27)

### Rotation and Orientation
- `RotationCoordinator` for automatic rotation tracking (replaces the deprecated `videoOrientation`)
- Key-value observation (KVO) of preview angle updates
- Applying the capture angle so photos come out correctly oriented

### Session Lifecycle
- Interruption handling (phone calls, Split View, thermal pressure)
- Starting and stopping the session on a background queue
- UI feedback patterns for interrupted states

### Anti-Patterns, Pressure Scenarios, and Checklist
- Common mistakes, such as session work on the main thread, and setting a capture value while its `automatically…` flag is still on (iOS 27), which raises an exception
- Shipping camera features under deadline pressure, answering "the camera is too slow", and explaining front camera mirroring to designers
- A pre-ship checklist covering setup, permissions, rotation, launch, interruptions, and iPhone Duo

## Key Pattern

### SwiftUI Camera Preview

```swift
struct CameraPreview: UIViewRepresentable {
    let session: AVCaptureSession

    func makeUIView(context: Context) -> PreviewView {
        let view = PreviewView()
        view.previewLayer.session = session
        view.previewLayer.videoGravity = .resizeAspectFill
        return view
    }

    func updateUIView(_ uiView: PreviewView, context: Context) {}

    class PreviewView: UIView {
        override class var layerClass: AnyClass { AVCaptureVideoPreviewLayer.self }
        var previewLayer: AVCaptureVideoPreviewLayer { layer as! AVCaptureVideoPreviewLayer }
    }
}
```

## Documentation Scope

This page documents the `camera-capture` skill (in the `axiom-media` suite), the AVFoundation camera patterns your assistant uses when helping you build custom camera features. The skill contains nine core patterns with code examples, anti-patterns, a shipping checklist, and pressure scenarios.

## Related

- [Camera Capture Diagnostics](/diagnostic/camera-capture-diag) – Troubleshooting camera issues (black preview, rotation, slow capture)
- [Camera Capture API Reference](/reference/camera-capture-ref) – Complete AVFoundation camera API reference, including high-resolution capture and the Center Stage front camera
- [Photo Library](/skills/integration/photo-library) – Photo picking and library access
- [iPhone Duo](/skills/ui-design/iphone-duo) – Showing camera UI on both displays, alongside the front-camera switching covered here

## Resources

**WWDC**: 2021-10247 (Capture high-quality photos using video formats), 2023-10105 (Create a more responsive camera experience), 2026-303 (Build a responsive camera app that launches quickly), 2026-304 (Implement high resolution photo capture), 2026-341 (Support the Center Stage front camera in your iOS app)

**Tech Talks**: 111465 (Build a great camera experience for iPhone Duo)

**Docs**: /avfoundation/avcapturesession, /avfoundation/avcapturedevice/rotationcoordinator, /avfoundation/avcapturephotosettings, /avfoundation/avcapturephotooutputreadinesscoordinator, /avfoundation/avprovideostorage
