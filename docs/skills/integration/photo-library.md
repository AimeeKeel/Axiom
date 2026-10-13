---
name: photo-library
description: PhotosPicker, PHPickerViewController, photo selection, limited library access, save to camera roll, PHPhotoLibrary permissions, Transferable image loading, PHPhotoLibraryChangeObserver, Swift 6 strict concurrency isolation
---

# Photo Library

Privacy-forward patterns for picking photos and accessing the photo library. Covers `PhotosPicker` (SwiftUI), `PHPickerViewController` (UIKit), limited library access, saving to the camera roll, and observing library changes.

## When to Use

Use this skill when you're:
- Letting users select photos from their library
- Choosing between `PHPickerViewController` and `PhotosPicker`
- Handling limited photo library access (iOS 14+)
- Saving photos or videos to the camera roll
- Loading images from a `PhotosPickerItem` with `Transferable`
- Observing photo library changes for a gallery UI
- Requesting the right permission level
- Using PhotoKit from a `@MainActor` type under Swift 6 strict concurrency

**Note** For a custom camera UI, use [camera-capture](/skills/integration/camera-capture) instead. Photo pickers need no permission at all.

## Example Prompts

Questions you can ask your assistant that will draw from this skill:

- "How do I let users pick photos in SwiftUI?"
- "What's the difference between PHPicker and PhotosPicker?"
- "User says they can't see their photos"
- "How do I save a photo to the camera roll?"
- "How do I handle limited photo access?"
- "How do I load an image from PhotosPickerItem?"
- "User granted limited access but can't see photos"
- "Why does my `photoLibraryDidChange` need to be `nonisolated`?"
- "My photo gallery crashes with `_dispatch_assert_queue_fail` after the Swift 6 migration"
- "Do I still need to re-fetch PHAssets by localIdentifier inside a change block?"
- "How do I stop picked photos carrying GPS coordinates to my backend?" (iOS 27)
- "How do I let users create or post to a shared album from my app?" (iOS 27)
- "How do I restrict which image formats get decoded from untrusted data?" (iOS 27)
- "My app closes when a user opens a 48MP photo"

## What This Skill Provides

### Photo Picker Patterns
- SwiftUI `PhotosPicker` with single and multiple selection (iOS 16+)
- Embedded inline `PhotosPicker` with continuous selection (iOS 17+)
- UIKit `PHPickerViewController` with filters and a delegate
- Embedded UIKit picker with live updates (iOS 17+)
- Filter combinations (`.any`, `.all`, `.not`)
- Preserving HDR content with `preferredItemEncoding`
- Stripping location and captions with `metadataOptions`, and seeding the picker's search field (iOS 27)

### Permission Strategy
- `PHPickerViewController` and `PhotosPicker` need no permission; the system handles privacy
- `.addOnly` for saving photos without read access
- `.readWrite` only when building a gallery browser
- Handling `.limited` status with `presentLimitedLibraryPicker`
- The Info.plist usage descriptions each level needs

### Image Loading
- Custom `Transferable` types for HEIF/HEIC, which the default `Image` representation doesn't load
- Async loading with error handling
- Progress reporting for large files
- Downsampling with ImageIO, so a 48MP photo doesn't get your app terminated for memory
- Restricting which formats ImageIO decodes from untrusted data with `kCGImageSourceAllowableTypes` (iOS 27)

### Library Management
- Saving photos and videos with `PHAssetCreationRequest`
- Observing library changes with `PHPhotoLibraryChangeObserver`
- System sheets for creating, posting to, and customizing shared albums (iOS 27)

### Swift 6 Strict Concurrency
- `nonisolated` change observer with a `Task { @MainActor in }` hop, and why the compiler's `@preconcurrency` fix-it ships a crash
- `performChanges { @Sendable in }` when the call site is actor-isolated
- Which PhotoKit types are `Sendable`, and why re-fetching by `localIdentifier` is about staleness rather than isolation
- Ordering and fetch-result laziness caveats for gallery UIs

### Pressure Scenarios
- Over-requesting permissions when a picker suffices
- Users reporting "no photos available" with limited access
- Slow photo loading with large files

## Key Pattern

### SwiftUI PhotosPicker (No Permission Needed)

```swift
import SwiftUI
import PhotosUI

@State private var selectedItem: PhotosPickerItem?
@State private var selectedImage: Image?

PhotosPicker(
    selection: $selectedItem,
    matching: .images
) {
    Label("Select Photo", systemImage: "photo")
}
.onChange(of: selectedItem) { _, newItem in
    Task {
        if let data = try? await newItem?.loadTransferable(type: Data.self),
           let uiImage = UIImage(data: data) {
            selectedImage = Image(uiImage: uiImage)
        }
    }
}
```

## Documentation Scope

This page documents the `photo-library` skill (in the `axiom-media` suite), which your assistant uses when you implement photo selection and library features. Beyond the patterns above, the skill includes anti-patterns, a shipping checklist, and pressure scenarios.

## Related

- [photo-library-ref](/reference/photo-library-ref) – Complete PhotoKit and picker API reference
- [camera-capture](/skills/integration/camera-capture) – Custom camera UI with `AVCaptureSession`
- [camera-capture-diag](/diagnostic/camera-capture-diag) – Troubleshooting camera capture issues
- [isolation-inheritance-diag](/diagnostic/isolation-inheritance-diag) – Diagnosing the `_dispatch_assert_queue_fail` crashes PhotoKit callbacks cause under Swift 6

## Resources

**WWDC**: 2020-10652, 2020-10641, 2022-10023, 2023-10107

**Docs**: /photosui/phpickerviewcontroller, /photosui/photospicker, /photos/phphotolibrary
