---
name: camera-capture-diag
description: Troubleshooting AVFoundation camera issues — black preview, frozen camera, wrong rotation, slow capture, session interruptions, permission problems, slow launch, dropped frames during recording
---

# Camera Capture Diagnostics

Systematic troubleshooting for AVFoundation camera problems: black or frozen previews, wrong rotation, slow capture, session interruptions, permission problems, slow launch, and dropped frames. The cause is usually threading, session lifecycle, rotation, permissions, or configuration, so the diagnostic checks those before you debug capture code.

## Symptoms This Diagnoses

Use when you're experiencing:
- "No camera device found" or a black preview while running in the Simulator
- Black or frozen camera preview
- Black preview with **no error at all** — no exception, no log, and setup appeared to succeed
- Camera worked, then went black mid-session and stayed black until relaunch
- UI freezes for 1–3 seconds when opening the camera
- Camera freezes during a phone call or in Split View
- Preview or captured photo rotated 90 degrees
- Front camera photo doesn't match the mirrored preview
- Photo capture takes 2 or more seconds
- Slow camera launch, with the preview taking a second or more to appear
- ProRes or high-bitrate recording drops frames
- "Camera in use by another app" errors
- Camera stops working after prolonged use (thermal pressure)
- Crash on older iOS versions that lack iOS 17 APIs
- Camera permission denied or never requested

## Example Prompts

- "Why does AVCaptureDevice.default return nil in the Simulator?"
- "My camera preview is just a black screen"
- "The preview is black but nothing errors — should I rewrite this with DiscoverySession?"
- "My camera dies partway through and only a relaunch fixes it — how do I even see the error?"
- "The UI freezes when I open the camera"
- "Camera freezes when I get a phone call"
- "Why is the captured photo rotated wrong?"
- "The front camera photo doesn't match the preview"
- "Photo capture is really slow, takes 2+ seconds"
- "My camera app launches slowly"
- "My ProRes recording drops frames"
- "Camera crashes on iOS 16 devices"
- "User says camera permission is denied but they never saw a prompt"

## Diagnostic Workflow

First, make sure you're on a real device: the Simulator has no camera hardware. Then:

```
1. Check Session State
   ├─ Verify session.isRunning = true
   ├─ Verify inputs.count >= 1
   ├─ Verify outputs.count >= 1
   └─ Check the preview layer connection

2. Check Threading
   ├─ Verify startRunning() runs on a background queue
   ├─ Verify all session work runs on sessionQueue
   └─ Verify UI updates run on the main thread

3. Check Permissions
   ├─ Print authorizationStatus
   ├─ Handle .notDetermined (request access)
   └─ Handle .denied (prompt to open Settings)

4. Check Interruptions
   ├─ Add an interruption observer
   ├─ Reproduce with a phone call
   └─ Verify the UI shows feedback

5. Turn On the Error Channel (do this first if the console is clean)
   ├─ Observe runtimeErrorNotification
   ├─ Observe didStopRunning, didStartRunning, and wasInterrupted
   └─ Recover from runtime errors: the session won't restart itself
```

A clean console doesn't mean capture is working. `AVCaptureSession` reports most runtime failures through notifications rather than thrown errors, so a session that fails while running stays black and silent unless you observe them.

## Diagnostic Patterns

The skill covers 18 diagnostic patterns. Common symptoms and their fixes:

| Symptom | Check First | Likely Fix |
|---------|-------------|------------|
| Black preview | Session state | Start the session, add an input, connect the preview layer |
| Black preview, no error at all | Add a `deinit` print to the camera controller | Keep the controller alive for the view's lifetime |
| UI freezes | Threading | Move `startRunning()` to a background queue |
| Freezes on call | Interruptions | Add an interruption observer with UI feedback |
| Wrong rotation | Rotation angle | Use `RotationCoordinator` (iOS 17 and later) |
| Slow capture | Quality setting | Set `photoQualityPrioritization` to `.speed` or `.balanced` |
| Slow launch | Launch-to-preview time | Adopt deferred start (iOS 26 and later) |
| Recording drops frames | `hardwareCost` and system pressure | Lower the format or frame rate; use Pro Video Storage for ProRes (iOS 27) |
| Denied access | Permissions | Show a prompt to open Settings |
| Crash on old iOS | `@available` check | Guard iOS 17 APIs |
| Random stops | Thermal state | Reduce quality and show a cooling message |
| iPad Split View | Multitasking | Show an "unavailable in Split View" message |
| Front camera "bug" | Mirroring | Expected: the preview mirrors and the photo doesn't (Apple's standard) |

## Documentation Scope

This page documents the `camera-capture-diag` diagnostic skill (in the `axiom-media` suite). It runs the checks above before your assistant debugs any code, and each of its 18 patterns includes specific symptoms, diagnostic steps, fixes, and an estimated time to fix.

## Related

- [camera-capture](/skills/integration/camera-capture) – Camera implementation patterns and session setup, including deferred start and Pro Video Storage
- [camera-capture-ref](/reference/camera-capture-ref) – Complete AVFoundation camera API reference
- [camera-auditor](/agents/camera-auditor) – Scans your code for capture problems, including a missing runtime-error observer
- [photo-library](/skills/integration/photo-library) – Photo picking and library access

## Resources

**WWDC**: 2021-10247, 2023-10105, 2026-303

**Docs**: /avfoundation/avcapturesession
