---
name: clinical-and-mobility
description: Use when reading clinical health records (FHIR resources, allergies, conditions, labs, medications, vitals, coverage) or passive mobility metrics (walking speed, Apple Walking Steadiness, six-minute walk) — includes the separate clinical authorization and recalibration patterns.
---

# Clinical Records and Mobility

Two specialized HealthKit domains: read-only FHIR clinical records from connected healthcare providers, and system-generated mobility metrics that measure gait and walking health.

## When to Use

Use this skill when you're:
- Accessing electronic health records (allergies, conditions, immunizations, labs, medications, procedures, vitals, coverage) via HealthKit
- Parsing `HKFHIRResource` JSON from provider data (DSTU2 or R4)
- Reading mobility metrics: walking speed, step length, asymmetry, Apple Walking Steadiness, the six-minute walk test
- Building a recovery or rehabilitation feature that tracks gait trends
- Passing App Store review for an app that reads health records

## Example Prompts

Questions you can ask your assistant that will draw from this skill:

- "How do I read the user's allergies and conditions from connected providers?"
- "Why is `HKClinicalRecord.startDate` showing today instead of the actual diagnosis date?"
- "What's the right way to display Apple Walking Steadiness to the user?"
- "After the user's knee surgery, how do I recalibrate their six-minute walk estimates?"
- "Why are my clinical-record queries returning empty even though the user has data?"

## What This Skill Provides

### Health Records (Clinical FHIR)
- The nine clinical type identifiers, including the singular `.vitalSignRecord` spelling
- The `HKClinicalRecord` shape: `clinicalType`, `displayName`, `fhirResource`
- `HKFHIRResource` properties, and defensive JSON parsing across DSTU2 and R4
- Why `HKClinicalRecord.startDate` is the download timestamp, not the clinical event date
- Read-only authorization through a separate permission sheet that lists the user's provider accounts
- Two-part setup: the Clinical Health Records checkbox in Xcode, plus `NSHealthClinicalHealthRecordsShareUsageDescription`
- The Privacy Policy URL required in App Store Connect
- Reading records with `HKSamplePredicate.clinicalRecord(type:predicate:)`

### Mobility Metrics
- Eight system-generated quantity types: walking speed, step length, double-support percentage, asymmetry, Apple Walking Steadiness, six-minute walk distance, and stair ascent and descent speed
- The unit gotcha: Apple Walking Steadiness uses `.percent()`, but its values run from 0.0 to 1.0
- Wheelchair mode suppresses walking metrics, so render honest empty states
- `HKAppleWalkingSteadinessClassification` (`.ok`, `.low`, `.veryLow`) and its band thresholds
- Pairing `appleWalkingSteadinessEvent` with `HKObserverQuery` for proactive gait alerts
- `recalibrateEstimates(sampleType:date:)` after surgery or injury, its separate entitlement, and the 14-day rebuild window
- Setup prerequisites: the user's height in the Health app, regular Apple Watch wear, and about two weeks of data before showing trends

### Core Motion vs. HealthKit Mobility
- A side-by-side comparison: latency, persistence, authorization, and use case
- Why hand-rolling gait analysis from `CMMotionManager` is a research project, not a feature
- Why Apple's validated thresholds (waist-carry detection, flat-ground gating) are hard to replicate

## Key Pattern

`HKClinicalRecord.startDate` is the date the record landed on the device, not the date the clinical event happened. Always pull the real date from the FHIR payload:

```swift
func parse(resource: HKFHIRResource) throws -> [String: Any]? {
    try JSONSerialization.jsonObject(with: resource.data, options: []) as? [String: Any]
}
```

Inspect `resource.fhirVersion` and branch, because DSTU2 and R4 have different shapes. Then pull `recordedDate`, `performedDateTime`, or `onsetDateTime`, depending on `resourceType`.

## Documentation Scope

This page documents the `clinical-and-mobility` skill (in the `axiom-health` suite). The skill also holds the clinical-type and mobility-type tables, the recalibration code, and a common-mistakes table.

## Related

- [Fundamentals](/skills/health/fundamentals) – HealthKit basics these domains build on
- [Authorization and Privacy](/skills/health/authorization-and-privacy) – Baseline HealthKit authorization, which clinical records extend with their own sheet and `Info.plist` key
- [Queries](/skills/health/queries) – The standard sample-query APIs, which also read clinical records once you cast to `HKClinicalRecord`
- [Sync and Background](/skills/health/sync-and-background) – The `HKObserverQuery` pattern behind proactive Apple Walking Steadiness alerts
- [Privacy UX](/skills/integration/privacy-ux) – Writing purpose strings and privacy disclosures for sensitive data
- [security-privacy-scanner](/agents/security-privacy-scanner) – Agent that audits usage descriptions and flags unused entitlements

## Resources

**WWDC**: 2018-229, 2021-10287 (Measure health with motion)

**Docs**: /healthkit/accessing-health-records, /healthkit/hkclinicaltype, /healthkit/hkclinicaltypeidentifier, /healthkit/hkclinicalrecord, /healthkit/hkfhirresource, /healthkit/hkfhirresourcetype, /healthkit/creating-a-mobility-health-app, /healthkit/hkquantitytypeidentifier/walkingspeed, /healthkit/hkquantitytypeidentifier/applewalkingsteadiness, /healthkit/hkquantitytypeidentifier/sixminutewalktestdistance, /healthkit/hkapplewalkingsteadinessclassification, /healthkit/hkhealthstore/recalibrateestimates(sampletype:date:completion:)
