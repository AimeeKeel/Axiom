---
name: authorization-and-privacy
description: Use when requesting HealthKit permissions, writing purpose strings, handling the read-access asymmetry, investigating empty Health tabs, or preparing HealthKit features for App Store review.
---

# HealthKit Authorization and Privacy

HealthKit's authorization model is asymmetric by design: the API reports write status but deliberately hides read status. Most "my Health tab is empty" bugs come from misunderstanding this one rule.

## When to Use

Use this skill when you're:
- Implementing the first authorization request for any HealthKit feature
- Investigating "my Health tab is empty for some users" (usually the read asymmetry, not a bug)
- Deciding between `requestAuthorization` and `getRequestStatusForAuthorization`
- Handling `HKAuthorizationStatus.notDetermined` vs. `.sharingDenied` vs. `.sharingAuthorized`
- Writing purpose strings for `NSHealthShareUsageDescription` and `NSHealthUpdateUsageDescription`
- Adding clinical records, vision prescriptions, or other per-object authorization types
- Preparing for App Store submission with Health data

## Example Prompts

Questions you can ask your assistant that will draw from this skill:

- "How do I tell whether the user granted read access to step count?"
- "Why does `authorizationStatus(for:)` return `.sharingAuthorized` even though my queries return no data?"
- "What purpose string should I use for reading workouts?"
- "I call `requestAuthorization` again, but the sheet never reappears. What's happening?"
- "Should I enable the Clinical Health Records capability in case I need it later?"
- "How do I find the earliest date I'm authorized to read a HealthKit sample type?" (OS 27)

## What This Skill Provides

### The One Rule You Must Internalize
- Why HealthKit deliberately hides whether reads were denied (to prevent privacy leaks)
- Why every denied read returns an empty result, indistinguishable from "no data exists"
- What this means for UI design: empty is a valid state, not an error

### Authorization API Reference
- `HKAuthorizationStatus` is write-only: all three cases describe share (write) state
- `getRequestStatusForAuthorization` tells you whether the sheet would appear, not whether access was granted
- `requestAuthorization` throws only on system errors, never on user denial
- Per-object authorization for vision prescriptions (iOS 16+)
- `earliestAuthorizedSampleDate(for:)` (OS 27) returns a **sparse** dictionary: a type appears only under limited access with a specific date, so a missing key means "unknown", not "unrestricted"

### Info.plist and Entitlement Setup
- Which usage-description keys are required, and which operations crash without them
- The HealthKit capability in Xcode, plus its Clinical Health Records and Background Delivery options
- Why enabling Clinical Health Records "just in case" gets an app rejected

### Privacy Discipline
- The four WWDC rules for when to request: in context, every time you intend to use the data, only what the feature needs, and never treating success as granted
- The Guest User session trap on iPad
- Background-read limitations, and what the Privacy Manifest and App Store Connect's data questionnaire expect
- The App Store rules against using HealthKit data for advertising or selling it, and the required privacy policy

## Key Pattern

**Success is not consent.** A `requestAuthorization` call that returns without throwing means *the request was delivered*, not that the user approved anything. To know whether you can actually read data, run the query and accept that empty results are a valid state, never an error.

```swift
// Correct — attempt the work, handle what comes back
try await store.requestAuthorization(toShare: toWrite, read: toRead)
let samples = try await descriptor.result(for: store)
// samples may be empty because user denied OR because no data exists.
// You cannot tell which. Show an empty-state UI, not an error.
```

## Documentation Scope

This page documents the `authorization-and-privacy` skill (in the `axiom-health` suite). The skill also holds a decision tree, the "empty Health tab" pressure scenario, and a full common-mistakes table.

## Related

- [Fundamentals](/skills/health/fundamentals) – Read first; covers the data types you're requesting permission for
- [Queries](/skills/health/queries) – How queries behave after authorization, including why empty results are valid
- [Sync and Background](/skills/health/sync-and-background) – Observer queries and background delivery, designed around background reads that may fail
- [Privacy UX](/skills/integration/privacy-ux) – Purpose strings and privacy UX across Apple frameworks, which apply to HealthKit too
- [App Store Submission](/skills/shipping/app-store-submission) – The broader submission checklist beyond the HealthKit rules here
- [security-privacy-scanner](/agents/security-privacy-scanner) – Agent that scans for missing usage descriptions and unused entitlements, including HealthKit's

## Resources

**WWDC**: 2020-10664 (Getting started with HealthKit), 2022-10005 (What's new in HealthKit)

**Docs**: /healthkit/authorizing-access-to-health-data, /healthkit/protecting-user-privacy, /healthkit/setting-up-healthkit, /healthkit/hkauthorizationstatus, /healthkit/hkauthorizationrequeststatus, /healthkit/hkhealthstore/requestauthorization(toshare:read:), /healthkit/hkhealthstore/authorizationstatus(for:)
