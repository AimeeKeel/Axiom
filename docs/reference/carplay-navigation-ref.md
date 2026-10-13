---
name: carplay-navigation-ref
description: CarPlay turn-by-turn navigation reference — base view rules, route guidance lifecycle, map template, CarPlay Dashboard, instrument cluster, HUD metadata, voice prompts, multitouch (iOS 26+), map panels and EV charging (iOS 27), and testing
---

# CarPlay Navigation Reference

API and framework reference for CarPlay turn-by-turn navigation apps. It covers the base view contract, the route guidance lifecycle, instrument cluster and HUD metadata, voice prompts, multitouch input (iOS 26+), and the extra displays that only navigation apps can drive.

## When to Use This Reference

Use this reference when:

- Implementing the `templateApplicationScene(_:didConnect:to:)` lifecycle for a navigation app
- Drawing into the CarPlay base view and you need to know what is and isn't allowed
- Wiring `CPMapTemplate` route previews, route choice panels, and trip start
- Driving turn-by-turn updates through `CPNavigationSession` (maneuvers, estimates, alerts, end, pause, resume)
- Populating the CarPlay Dashboard map (iOS 13.4+), instrument cluster (iOS 15.4+), or HUD metadata (iOS 17.4+)
- Handling multitouch zoom, pitch, and rotate callbacks on `CPMapTemplate` (iOS 26+, including CarPlay Ultra vehicles)
- Playing voice prompts over the vehicle's audio without holding the audio session
- Testing across the full range of CarPlay screen sizes and cluster configurations

## Example Prompts

Questions you can ask your assistant that will draw from this reference:

- "What exactly can I draw in the CarPlay navigation base view?"
- "How do I configure the `UIApplicationSceneManifest` for a navigation app with Dashboard and instrument cluster?"
- "What's the route guidance lifecycle from destination selection through trip end?"
- "How do I provide lane guidance using the second maneuver?"
- "Which maneuver metadata appears in the instrument cluster vs. the HUD?"
- "How do I update trip estimates without spamming the system?"
- "What multitouch gestures does `CPMapTemplate` deliver on iOS 26+?"
- "How do I show a CarPlay map panel for route choices on iOS 27?"
- "How do I tell whether the vehicle is using my route (route sharing) on iOS 27?"
- "How do I surface an EV charging stop with `CPChargingStationConnection`?"
- "How do I handle `mapTemplateDidCancelNavigation` when the car's native nav takes over?"

## What's Covered

- **Supported displays matrix** – Center display (iOS 12), CarPlay Dashboard (iOS 13.4), instrument cluster (iOS 15.4), HUD metadata (iOS 17.4), and Apple's advice to support every capability
- **Base view contract** – A map only, with no alerts, overlays, or other UI; light and dark `contentStyle` signals; the safe area around buttons
- **Application scene manifest** – Declaring the main CarPlay, Dashboard, and instrument cluster scenes, and the matching `CPTemplateApplicationScene` delegate roles
- **Scene delegate lifecycle** – Receiving `CPInterfaceController` and `CPWindow`, retaining both for the session, setting the root map template, and the initial navigation bar, map, and pan buttons
- **Route guidance lifecycle** – Destination selection through list, grid, search, or voice-control templates (never more than five levels deep); the trip preview panel (up to 12 `CPTrip` objects); route choice descriptions, longest first; starting guidance, maneuver updates, and ending guidance
- **Re-routing** – `resumeTrip(updatedRouteSegments:currentSegment:rerouteReason:)` (iOS 26.4+), which deprecates the iOS 17.4 `resumeTrip(updatedRouteInformation:)`, and `resumeNavigation(updatedTrip:…)` for a replacement trip (iOS 27)
- **Map panels and EV charging (iOS 27)** – `CPMapPanel` overlays shown with `showPanel` or `pushPanel` over `CPMapTemplate`, built from trips, travel estimates, route choices, route details, charging connections, and waypoints; `CPChargingStationConnection` (connector, voltage, power) for EV charging stops
- **Multi-stop waypoints** – `CPNavigationWaypoint` (iOS 26.4) and its removal delegate callbacks, plus `nameVariants` and `addressVariants` (iOS 27)
- **Route sharing and the options panel (iOS 27)** – `isRouteSharingSupported`, `isRouteSharingEnabled`, `mapTemplate(_:didUpdateRouteSharingEnabled:)`, and `CPNavigationSession.optionsPanel`
- **`CPManeuver` content** – Light and dark symbol sets, instruction variants in descending length order, attributed instruction variants with embedded images, and maneuver metadata (`maneuverType`, `maneuverState`, `junctionType`, `trafficSide`, lane guidance)
- **Lane guidance through the second maneuver** – The 120 × 18 pt symbol-only convention and `CPManeuverDisplayStyleSymbolOnly` (`.symbolOnly` in Swift)
- **Estimate updates** – `CPNavigationSession.updateEstimates(_:for:)` per maneuver, `CPMapTemplate.updateEstimates(_:for:)` per trip, and updating only on significant changes
- **Navigation alerts** – `CPNavigationAlert` title and subtitle variants, actions, and auto-dismiss duration; the iOS 16 additions (longer subtitles, no-button alerts, custom button colors); and the iOS 27 avatar initializer with an `actions` array
- **Cancellation by the car's native navigation** – Handling `mapTemplateDidCancelNavigation`, as navigation rule #6 requires
- **Keyboard and list restrictions** – `CPSessionConfiguration` and `limitedUserInterfacesChanged`
- **Voice prompts and audio** – The `.playback` category, `.voicePrompt` mode, and `[.interruptSpokenAudioAndMixWithOthers, .duckOthers]` options; activating only while a prompt plays; checking `promptStyle`
- **Dashboard and instrument cluster maps** – The second map and its drawing guidelines
- **Instrument cluster and HUD metadata (iOS 17.4+)** – Declaring support, providing maneuvers, the maneuver state machine, required properties, lane guidance, and junction, traffic-side, and lane values
- **Maneuver symbol asset sizes** – Maximum sizes per element, and Dashboard-specific image variants
- **Multitouch (iOS 26+)** – Zoom (pinch, double tap, two-finger double tap), pitch (two-finger slide up or down), and rotate (two-finger clockwise or counterclockwise)
- **Testing matrix** – Screen sizes from 748 × 456 to 1920 × 720 plus portrait, instrument cluster configurations, metadata testing, and the gaps between CarPlay Simulator, Xcode's Simulator, and a real vehicle
- **Common mistakes** – Drawing UI in the base view, unordered instruction variants, `traitCollection` instead of `carTraitCollection`, holding the audio session, and missing scene manifest keys

## Documentation Scope

This page documents the `carplay-navigation-ref` skill (in the `axiom-media` suite), the framework-and-API half of CarPlay navigation.

- For **the 9 navigation-specific design rules** (base-view restriction, audio handling, native-nav cancellation), see [CarPlay HIG](/skills/integration/carplay-hig). Start there before any navigation implementation work.

## Related

- [CarPlay Templates Reference](/reference/carplay-templates-ref) – The template catalog and per-category availability across every CarPlay app type
- [Now Playing CarPlay Reference](/reference/now-playing-carplay) – Now Playing metadata and `CPNowPlayingTemplate` for CarPlay audio apps
- [AVFoundation Audio Reference](/reference/avfoundation-ref) – The `AVAudioSession` categories, modes, and options behind voice prompts

## Resources

**CarPlay Developer Guide** (June 2026): navigation rules p. 6, instrument cluster and HUD pp. 34 and 53–58, base view p. 35, route guidance lifecycle pp. 43–48, multitouch p. 49, scene manifest pp. 63–64

**WWDC**: 2026-212, 2025-216, 2022-10016, 2020-10635, 2018-213
