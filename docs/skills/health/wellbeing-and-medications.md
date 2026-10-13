---
name: wellbeing-and-medications
description: Use when integrating State of Mind mood logging (iOS 18+) or the Medications API (iOS 26+) — valence aggregation, symptom logging, per-object authorization, privacy-sensitive UI patterns, or menopausal-state category (iOS 27).
---

# Wellbeing and Medications

Sensitive HealthKit categories: `HKStateOfMind` mood samples, the Medications API (iOS 26+), and menopausal state (OS 27). All three demand extra care in authorization, aggregation, and UI.

## When to Use

Use this skill when you're:
- Reading or writing State of Mind samples (mood, emotion, valence, labels, associations)
- Integrating the Medications API: tracked medications, dose events, and concepts
- Logging symptoms and associating them with medications in your own code
- Working with the per-object authorization model unique to medications
- Aggregating valence correctly across a mix of unpleasant and pleasant days
- Logging or querying menopausal state (OS 27)

## Example Prompts

Questions you can ask your assistant that will draw from this skill:

- "Why does my mood average look flat when the user had very good and very bad days?"
- "How do I ask for permission to read the user's medications?"
- "How do I log that a headache symptom might be linked to a specific medication?"
- "What's the difference between `HKMedicationConcept` and `HKUserAnnotatedMedication`?"
- "How do I build a daily mood logger that respects user privacy?"
- "How do I record perimenopause in my cycle-tracking app?" (OS 27)

## What This Skill Provides

### State of Mind (iOS 18+)
- The `HKStateOfMind` model: `kind`, `valence`, `labels`, `associations`, and the derived `valenceClassification`
- Writing samples with the right `kind` for the time horizon (momentary vs. daily)
- Reading with `HKSamplePredicate.stateOfMind(_:)` and association and label predicates
- Correct valence aggregation: shift to `[0, 2]` before averaging to avoid misleading "flat" means
- Declarative SwiftUI authorization with HealthKitUI's `.healthDataAccessRequest(...)`

### Medications API (iOS 26+)
- The three-type model: `HKMedicationConcept`, `HKUserAnnotatedMedication`, `HKMedicationDoseEvent`
- Querying tracked medications with `HKUserAnnotatedMedicationQueryDescriptor`
- Reading dose events (taken, skipped, snoozed) with the `HKQuery.predicateForMedicationDoseEvent` filters
- FHIR-style clinical codings (RxNorm) on concepts for interoperability

### Per-Object Authorization (Medications Only)
- Why medications skip the normal `requestAuthorization` sheet entirely
- How the Health app shows a per-app toggle inline when the user adds a new medication
- Why denied medications are invisible to your app, so empty queries must read as "no data"
- `HKObjectType.userAnnotatedMedicationType().requiresPerObjectAuthorization()` for branching

### Symptoms and Privacy
- No built-in API links symptoms to medications; maintain your own RxNorm-to-symptom dictionary
- Symptoms are ordinary `HKCategorySample` values with an intensity scale
- Purpose strings matter most here, because mental-health and medication data draw the most user denials and App Review scrutiny
- Display valence as language or emoji, not raw `-1.0` to `1.0` numbers

### Menopausal State (OS 27)
- The `menopausalState` category type and its three values: `.menopause`, `.perimenopause`, and `.none`
- Filtering category queries by value, since `HKCategoryValueMenopausalState` conforms to `HKCategoryValuePredicateProviding`
- The same sensitive-data care as State of Mind and Medications

## Key Pattern

Averaging raw valence values misleads users because positive and negative days cancel out. Shift to a positive range first:

```swift
let adjusted = results.map { $0.valence + 1.0 }              // [0, 2]
let averageAdjusted = adjusted.reduce(0.0, +) / Double(adjusted.count)
let percent = Int(100.0 * averageAdjusted / 2.0)             // 0..100
```

Without the shift, one +0.8 day and one –0.8 day average to 0, reporting "neutral" for a week that was emotionally intense.

## Documentation Scope

This page documents the `wellbeing-and-medications` skill (in the `axiom-health` suite). The skill also holds the full `HKStateOfMind` field table, the dose-event properties, and a common-mistakes table.

## Related

- [Fundamentals](/skills/health/fundamentals) – The HealthKit data model these categories build on
- [Authorization and Privacy](/skills/health/authorization-and-privacy) – Baseline authorization rules; medications depart from them, as this skill explains
- [Queries](/skills/health/queries) – One-shot reads for State of Mind and dose-event samples
- [Sync and Background](/skills/health/sync-and-background) – Anchored queries, the recommended way to keep mood and dose data in sync
- [Privacy UX](/skills/integration/privacy-ux) – Writing purpose strings and privacy disclosures for sensitive health data
- [security-privacy-scanner](/agents/security-privacy-scanner) – Agent that audits usage descriptions and privacy-sensitive data flows

## Resources

**WWDC**: 2024-10109 (Explore wellbeing APIs in HealthKit), 2025-321 (Meet the HealthKit Medications API)

**Docs**: /healthkit/hkstateofmind, /healthkit/hkmedicationconcept, /healthkit/hkuserannotatedmedication, /healthkit/hkmedicationdoseevent, /healthkit/hkclinicalcoding, /healthkit/hkuserannotatedmedicationquerydescriptor, /healthkit/logging-symptoms-associated-with-a-medication, /healthkit/visualizing-healthkit-state-of-mind-in-visionos, /healthkit/recording-and-querying-menopausal-state
