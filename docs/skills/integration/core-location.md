---
name: core-location
description: Core Location implementation patterns - authorization strategy, monitoring approach, accuracy selection, background location
---

# Core Location

Implementation patterns for Core Location, covering authorization strategy, choosing a monitoring approach, accuracy optimization, and background location setup.

## When to Use

Use this skill when you're:
- Choosing between When In Use and Always authorization
- Deciding on a monitoring approach (continuous updates, significant-change, or `CLMonitor`)
- Implementing geofencing or region monitoring
- Setting up background location updates
- Debugging "location not working" issues
- Reviewing location code for anti-patterns

## Example Prompts

Questions you can ask your assistant that will draw from this skill:

- "Should I use When In Use or Always authorization?"
- "How should I implement geofencing in my app?"
- "What's the best way to track user location in the background?"
- "Why is my location code draining battery?"
- "How do I upgrade from When In Use to Always authorization?"
- "What accuracy level should I use for a store finder?"
- "How do I handle location authorization denial gracefully?"

## What This Skill Provides

### Anti-Patterns Prevented
- Premature Always authorization (a 30–60% denial rate)
- Continuous updates for geofencing (10× the battery drain of `CLMonitor`)
- Ignoring stationary detection (wasted battery)
- No graceful denial handling
- The wrong accuracy for the use case
- Not stopping updates when done
- Ignoring `CLServiceSession` (iOS 18+)
- Treating reduced accuracy as a toggle you control, when Approximate location silently breaks geofences

### Decision Trees
- Authorization strategy (When In Use vs. Always, and the upgrade flow)
- Monitoring strategy (continuous vs. significant-change vs. `CLMonitor`)
- Accuracy selection (navigation vs. fitness vs. store finder)

### Pressure Scenarios
- Pushing back on "just use Always authorization"
- Debugging "location isn't working in the background"
- Fixing "geofence events aren't firing" in production

### Checklists and Version Notes
- A pre-release location checklist (`Info.plist` keys, privacy manifest, authorization, updates, testing)
- A background location setup checklist
- Which APIs need iOS 17 (`CLLocationUpdate`, `CLMonitor`) or iOS 18 (`CLServiceSession`), and the `CLLocationManager` path for iOS 14–16

## Key Pattern

### Progressive Authorization (Recommended)

```swift
// Start minimal - When In Use
let baseSession = CLServiceSession(authorization: .whenInUse)

// Later, when user creates a location reminder:
let alwaysSession = CLServiceSession(authorization: .always)

// For features needing full accuracy:
let navSession = CLServiceSession(
    authorization: .whenInUse,
    fullAccuracyPurposeKey: "Navigation"
)
```

**Why**: Requesting Always authorization up front draws a 30–60% denial rate. Upgrading progressively, once the user understands the value, draws 5–10%.

## Documentation Scope

This page documents the `core-location` skill (in the `axiom-location` suite), the implementation patterns and decision frameworks your assistant uses when helping you design location features.

## Related

- [Core Location Reference](/reference/core-location-ref) – API details and code examples for modern Core Location
- [Core Location Diagnostics](/diagnostic/core-location-diag) – Symptom-based troubleshooting
- [Energy Optimization](/skills/debugging/energy) – Location as a battery subsystem

## Resources

**WWDC**: 2023-10180 (Discover streamlined location updates), 2023-10147 (Meet Core Location Monitor), 2024-10212 (What's new in location authorization)

**Docs**: /corelocation, /corelocation/clmonitor, /corelocation/cllocationupdate, /corelocation/clservicesession
