---
name: energy-ref
description: Complete energy optimization API reference with Power Profiler, timers, network, and location
version: 1.0.0
---

# Energy Optimization Reference

API reference for making iOS apps use less battery, with code examples from WWDC sessions. It covers the Power Profiler, timers, networking, location, background execution, display and GPU work, disk I/O, Low Power Mode, MetricKit, and push notifications.

## When to Use This Reference

Use this reference when you need:
- The Power Profiler workflow and how to read its results
- Timer API patterns for energy efficiency
- Discretionary and background networking APIs
- Location accuracy and monitoring options
- Background execution best practices
- Display and GPU energy optimization
- Low Power Mode and thermal state responses

## Example Prompts

Questions you can ask your assistant that will draw from this reference:

- "How do I configure DispatchSource timers with proper leeway?"
- "What's the discretionary flag for URLSession and when should I use it?"
- "How do I set up significant-change location monitoring?"
- "What are the background task duration limits?"
- "How do I use MetricKit to monitor energy in production?"
- "What's the difference between continuous and significant-change location?"
- "How should my app respond to Low Power Mode or a hot device?"

## What's Covered

### Power Profiler Workflow
- Recording traces with Instruments, tethered to a Mac
- On-device recording without a Mac (iOS 26+)
- Interpreting the 5 power impact lanes
- Comparing before and after traces

### Timer Efficiency
- `Timer` with tolerance, the Combine timer publisher, and `DispatchSource` timers with leeway
- Invalidating timers when done
- Event-driven alternatives to polling

### Network Efficiency
- `URLSession` configuration
- Discretionary background downloads
- Background session delegates

### Location Efficiency
- `CLLocationManager` accuracy, distance filter, and automatic pausing
- Significant-change monitoring
- `CLLocationUpdate` and `CLMonitor`
- Accuracy levels and their energy cost

### Background Execution
- `beginBackgroundTask`, `BGAppRefreshTask`, `BGProcessingTask`, `BGContinuedProcessingTask` (iOS 26+)
- The EMRCA principles: efficient, minimal, resilient, courteous, adaptive

### Display and GPU
- Dark Mode and true black on OLED displays
- Frame rate control with `CADisplayLink`
- Stopping animations that aren't visible

### Disk I/O
- Batching writes, SQLite WAL mode, `XCTStorageMetric` in tests

### Low Power Mode and Thermal State
- Detecting Low Power Mode and responding to thermal state changes

### MetricKit
- `MXMetricManagerSubscriber` setup, energy metrics, and `MXDiagnosticPayload` (iOS 13–26)
- Battery usage in the Xcode Organizer
- MetricKit 27: `MetricManager` AsyncSequence streams replace `MXMetricManagerSubscriber` — see [metrickit-ref](/reference/metrickit-ref)

### Push Notifications
- Alert and background push setup, server payloads, and priority headers

### Checklists
- Troubleshooting: an app at the top of Battery settings, a hot device, background drain, high cellular use
- Expert review checklists for timers, network, location, background execution, and display

## Key Pattern

### Timer with Proper Leeway

```swift
// ✅ GOOD — Leeway allows system to coalesce
let source = DispatchSource.makeTimerSource(queue: .main)
source.schedule(
    deadline: .now(),
    repeating: .seconds(30),
    leeway: .seconds(5)  // 5 seconds flexibility
)
source.setEventHandler { [weak self] in
    self?.update()
}
source.resume()

// ❌ BAD — Zero leeway prevents coalescing
source.schedule(deadline: .now(), repeating: .seconds(30), leeway: .never)
```

### Significant-Change Location

```swift
// ✅ GOOD — Low power, event-driven
locationManager.startMonitoringSignificantLocationChanges()
// Updates only on significant movement (500m+ or cell tower change)

// ❌ BAD — Continuous GPS drain
locationManager.desiredAccuracy = kCLLocationAccuracyBest
locationManager.startUpdatingLocation()
```

### Discretionary Network Transfer

```swift
// ✅ GOOD — System schedules for optimal energy
let config = URLSessionConfiguration.background(withIdentifier: "sync")
config.isDiscretionary = true  // Defer until optimal conditions
config.allowsCellularAccess = false
```

## Documentation Scope

This page documents the `energy-ref` skill (in the `axiom-performance` suite), the API reference your assistant uses for energy optimization APIs and patterns.

## Related

- [energy](/skills/debugging/energy) – Decision trees and Power Profiler workflows for finding what drains the battery
- [energy-diag](/diagnostic/energy-diag) – Symptom-based troubleshooting, starting from what the user notices
- [energy-auditor](/agents/energy-auditor) – Agent that scans your code for timer abuse, polling, continuous location, and background mode misuse
- [timer-patterns](/skills/debugging/timer-patterns) – `DispatchSourceTimer` lifecycle safety and crash prevention for the timers tuned here

## Resources

**WWDC**: 2025-226, 2025-227, 2022-10083, 2020-10095, 2019-707, 2019-417

**Docs**: /xcode/improving-your-app-s-performance, /backgroundtasks
