---
name: core-location-diag
description: Location updates not arriving, background location broken, authorization denied, geofence not triggering
---

# Core Location Diagnostics

Symptom-based troubleshooting for Core Location: updates that never arrive, background location that stops, authorization denials, poor accuracy, and geofences that never fire. It covers the modern APIs, `CLLocationUpdate` and `CLMonitor` (iOS 17 and later).

## Symptoms This Diagnoses

Use when you're experiencing:

### Location Update Issues
- Updates never arrive (authorization, Info.plist keys, or a loop that isn't awaiting updates)
- Delegate callbacks never fire (the `CLLocationManager` is held in a local variable)
- Location unavailable (indoors, airplane mode, no GPS fix)
- Accuracy unexpectedly poor (reduced accuracy, or a Wi-Fi or cell-only fix)
- Updates stop randomly (the task was cancelled, or the device is stationary)

### Background Location Issues
- Updates stop when the app is backgrounded (missing capability, session, or authorization)
- Significant-change or region events don't wake the app (relaunch handling)
- Blue location indicator missing (session not held, or set up wrong)

### Authorization Problems
- Always denied on a fresh install (missing or empty Info.plist strings)
- Many users deny the prompt (requesting Always on first launch)
- `insufficientlyInUse` (requesting while the app isn't in use)
- Reduced accuracy forced (the user chose approximate location)

### Geofencing Issues
- Events never trigger (the 20-condition limit, or a radius under 100 m)
- Stale `lastEvent` (nothing is awaiting `monitor.events`)
- Monitor conditions lost after termination (not recreated on launch)

### Location Icon
- The location arrow won't go away

## Example Prompts

Questions you can ask your assistant that will invoke this diagnostic:

- "Why aren't my location updates arriving?"
- "Location stops working when my app goes to background"
- "Users are always denying location permission"
- "My geofence events never fire"
- "The location arrow icon won't go away"
- "How do I debug CLMonitor not triggering?"

## Diagnostic Workflow

```
1. Check Authorization
   ├─ authorizationStatus value
   ├─ locationServicesEnabled()
   ├─ accuracyAuthorization
   └─ Info.plist keys present

2. Verify Iteration
   ├─ Task actually running
   ├─ Not cancelled prematurely
   ├─ Stored in a property (not a local)
   └─ Awaiting updates

3. Check Background Setup
   ├─ Background mode capability
   ├─ CLBackgroundActivitySession held
   ├─ Session started from the foreground
   └─ Recovery on relaunch

4. Inspect Diagnostic Properties
   ├─ update.authorizationDenied
   ├─ update.locationUnavailable
   ├─ update.accuracyLimited
   └─ update.isStationary
```

## Diagnostic Patterns

| Symptom | Check First | Common Fix |
|---------|-------------|------------|
| No updates | `authorizationStatus`, Info.plist keys, and whether a task awaits `liveUpdates()` | Add `NSLocationWhenInUseUsageDescription`, request authorization, and keep the task in a property |
| Background stops | Background Modes capability and `CLBackgroundActivitySession` | Add the capability, create the session in the foreground, and hold it in a property |
| App not woken by events | Handling of `launchOptions[.location]` | Recreate the manager and restart services in `didFinishLaunching` |
| Always denied | Info.plist strings and request timing | Write a specific usage string; request When In Use first, then escalate to Always when a feature needs it |
| Poor accuracy | `accuracyAuthorization` and `horizontalAccuracy` | Request temporary full accuracy; discard fixes with a negative `horizontalAccuracy` |
| Geofence silent | Condition count, radius, and whether a task awaits `monitor.events` | Stay under 20 conditions, use a radius of at least 100 m, and recreate the monitor on launch |
| Icon persists | Task, session, and `CLMonitor` state | Cancel the task, invalidate the session, and remove conditions |

## Documentation Scope

This page documents the `core-location-diag` diagnostic skill (in the `axiom-location` suite). It holds a decision tree for each of the six symptom groups, common mistakes with fixes, Info.plist string guidance, and console commands for reading location logs. Unlike a reference skill, which covers the whole API, a diagnostic skill starts from the symptom.

## Related

- [core-location](/skills/integration/core-location) – Implementation patterns and decision trees
- [core-location-ref](/reference/core-location-ref) – Complete API reference
- [mapkit-diag](/diagnostic/mapkit-diag) – Map-specific location display issues
- [energy-diag](/diagnostic/energy-diag) – Location as a source of battery drain

## Resources

**WWDC**: 2023-10180, 2023-10147, 2024-10212

**Docs**: /corelocation, /corelocation/clmonitor, /corelocation/cllocationupdate
