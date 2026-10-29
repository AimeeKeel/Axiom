---
name: core-location-ref
description: CLLocationUpdate, CLMonitor, CLServiceSession, CLBackgroundActivitySession APIs for iOS 17+
---

# Core Location Reference

API reference for modern Core Location (iOS 17+): `CLLocationUpdate`, `CLMonitor`, `CLServiceSession`, `CLBackgroundActivitySession`, authorization patterns, and migration from the legacy APIs. Use it when you need exact signatures, limits, and patterns.

## When to Use This Reference

Use this reference when you need:
- `CLLocationUpdate` AsyncSequence patterns
- `CLMonitor` geofencing implementation
- `CLServiceSession` declarative authorization (iOS 18+)
- `CLBackgroundActivitySession` for background updates
- Authorization state handling
- Migration from legacy `CLLocationManager` patterns
- Geocoding, heading, and location simulation for testing

## Example Prompts

Questions you can ask your assistant that will draw from this reference:

- "How do I use CLLocationUpdate with async/await?"
- "What is CLMonitor and how do I set up geofencing?"
- "How do I implement CLServiceSession for authorization?"
- "What's the modern way to do background location updates?"
- "How do I handle the 20-geofence limit?"
- "What are the diagnostic properties on CLLocationUpdate?"
- "How do I migrate from CLLocationManager delegates?"
- "How do I migrate from `headingOrientation` to `headingBody`?"
- "Which LiveConfiguration should I use for on-water navigation?"

## What's Covered

### CLLocationUpdate (iOS 17+)
- `liveUpdates()` with AsyncSequence
- `LiveConfiguration` options: `.default`, `.automotiveNavigation`, `.otherNavigation`, `.fitness`, `.airborne`, and `.maritime` (27 releases)
- Key properties, including `isStationary` for automatic pause and resume

### CLMonitor (iOS 17+)
- Geofencing and beacons with `CircularGeographicCondition` and `BeaconIdentityCondition`
- The 20-condition limit, adding with an assumed state, records, event properties

### CLServiceSession (iOS 18+)
- Declarative authorization goals
- `fullAccuracyPurposeKey` for temporary precision
- Implicit sessions from `liveUpdates` iteration
- Diagnostic properties (`authorizationDenied`, `authorizationDeniedGlobally`, `insufficientlyInUse`, `alwaysAuthorizationDenied`, `authorizationRequestInProgress`)
- Session layering and lifecycle

### Authorization
- Authorization levels and state machine
- Accuracy authorization (full vs. reduced)
- Required Info.plist keys
- Legacy `requestWhenInUseAuthorization` patterns

### Background Location
- `CLBackgroundActivitySession` setup
- Background mode capability requirements and the background indicator
- App lifecycle through suspension and termination, and session recovery on relaunch

### Legacy APIs (iOS 12–16)
- `CLLocationManager` delegate pattern
- Accuracy constants
- Region monitoring (deprecated)
- Significant location changes
- Visit monitoring

### Geofencing Best Practices
- Region size, a strategy for the 20-region limit, entry and exit timing, persistence across launches

### Testing and Simulation
- Xcode location simulation, custom GPX routes, authorization states, Console filtering

### Swift Concurrency
- Task cancellation, `MainActor` considerations, error handling

### Geocoding
- `CLGeocoder` forward and reverse geocoding, `CLPlacemark` properties, rate limits

### Heading
- Compass heading updates (`CLHeading`)
- `headingBody`, which replaces the deprecated `headingOrientation` (iOS, macOS, and watchOS 27)
- `locationHeadingAnchor(manager:isEnabled:)`, the SwiftUI modifier that makes a view the heading body (iOS 27.2)

### Troubleshooting
- Quick checks for missing updates, background failures, geofences that don't fire, reduced accuracy, and a location icon that stays on

## Key Pattern

### iOS 17+ Location Updates

```swift
for try await update in CLLocationUpdate.liveUpdates() {
    if update.authorizationDenied {
        showLocationDeniedUI()
        break
    }
    if let location = update.location {
        processLocation(location)
    }
    if update.isStationary {
        // Updates pause automatically, resume when device moves
    }
}
```

### iOS 17+ Geofencing

```swift
let monitor = await CLMonitor("MyApp")
let condition = CLMonitor.CircularGeographicCondition(
    center: CLLocationCoordinate2D(latitude: 37.33, longitude: -122.01),
    radius: 100
)
await monitor.add(condition, identifier: "ApplePark")

for try await event in monitor.events {
    switch event.state {
    case .satisfied: handleEntry(event.identifier)
    case .unsatisfied: handleExit(event.identifier)
    case .unknown: break
    @unknown default: break
    }
}
```

## Documentation Scope

This page documents the `core-location-ref` skill (in the `axiom-location` suite), the API reference your assistant uses for Core Location APIs and implementation patterns.

## Related

- [core-location](/skills/integration/core-location) – Anti-patterns and decision trees for authorization and monitoring strategy
- [core-location-diag](/diagnostic/core-location-diag) – Symptom-based troubleshooting when location updates or geofences misbehave
- [energy-ref](/reference/energy-ref) – Location as a battery subsystem: trading accuracy against power

## Resources

**WWDC**: 2023-10180, 2023-10147, 2024-10212

**Docs**: /corelocation, /corelocation/clmonitor, /corelocation/cllocationupdate, /corelocation/clservicesession
