# MapKit Reference

API reference for MapKit: the SwiftUI `Map` (iOS 17+) and UIKit's `MKMapView`, annotations, overlays, search, directions, Look Around, snapshots, and geocoding.

## When to Use This Reference

Use this reference when:
- Looking up the SwiftUI `Map` content builder API
- Configuring `MapCameraPosition` for programmatic camera control
- Implementing `MKLocalSearch` or `MKLocalSearchCompleter`
- Setting up `MKDirections` for routing
- Working with Look Around scenes
- Converting between addresses and coordinates with the iOS 26 geocoding APIs
- Checking iOS version requirements for MapKit features

## Example Prompts

Questions you can ask your assistant that will draw from this reference:

- "What's the SwiftUI `Map` API for annotations?"
- "How do I use `MapCameraPosition`?"
- "What's the `MKLocalSearchCompleter` API for autocomplete?"
- "How do I calculate directions between two points?"
- "What iOS version added the SwiftUI `Map` content builder?"
- "How do I create a map snapshot image?"
- "How do I turn an address into coordinates with `MKGeocodingRequest`?"

## What's Covered

- SwiftUI vs. `MKMapView` feature comparison
- SwiftUI `Map` API: content builder, `MapCameraPosition`, selection, camera change callbacks, styles, interaction modes
- Map content: `Marker`, `Annotation`, `UserAnnotation`, shape overlays, clustering
- `MKMapView` in SwiftUI and key `MKMapViewDelegate` methods
- Annotation views: `MKMarkerAnnotationView`, `MKAnnotationView`, custom callouts, reuse
- `MKLocalSearch` and `MKLocalSearchCompleter`, result types, rate limiting, and the 11 point-of-interest categories new in the 27 releases
- `MKDirections` and `MKRoute`: transport types, ETA-only requests, turn-by-turn steps
- Look Around: `MKLookAroundScene`, `LookAroundPreview`, static snapshots
- Overlays and renderers, overlay levels, gradient polylines
- Map snapshots with `MKMapSnapshotter`
- iOS version feature matrix
- GeoToolbox and `PlaceDescriptor` (iOS 26+)
- `MKGeocodingRequest`, `MKReverseGeocodingRequest`, and `MKAddress` (iOS 26+)
- Choosing between geocoding and `MKLocalSearch`

## Documentation Scope

This page documents the `mapkit-ref` skill (in the `axiom-location` suite), the API reference your assistant uses for MapKit syntax and configuration.

## Related

- [MapKit](/skills/integration/mapkit) – Decision trees and anti-patterns for building map features
- [MapKit Diagnostics](/diagnostic/mapkit-diag) – Troubleshooting annotations, region jumping, and search failures
- [Core Location Reference](/reference/core-location-ref) – The location APIs that feed a map

## Resources

**WWDC**: 2023-10043, 2024-10094

**Docs**: /mapkit, /mapkit/map, /mapkit/mklocalsearch, /mapkit/mkdirections, /geotoolbox, /geotoolbox/placedescriptor, /mapkit/mkgeocodingrequest, /mapkit/mkreversegeocodingrequest, /mapkit/mkaddress
