---
name: shareplay-ref
description: GroupActivities API reference — session, messenger, journal, activation, metadata, and the deprecation table
skill_type: reference
version: 1.0
apple_platforms: iOS 15+, macOS 12+, tvOS 15+, visionOS 1+ (not watchOS)
---

# GroupActivities Reference

Signatures, availability, and deprecations for GroupActivities, the framework behind SharePlay. Every signature is checked against the iOS 27 SDK interface rather than Apple's web documentation, which truncates several of these pages.

## When to Use This Reference

Use this reference when:
- You need an exact signature, and the rendered Apple page shows only a member list
- You're checking whether a symbol exists on a given platform or OS version
- You've inherited SharePlay code and need to know which APIs are deprecated
- You're auditing a `switch` over `ActivityType` or `GroupSession.State`
- You need to know which import an overlay symbol requires

## Example Prompts

Questions you can ask your assistant that will draw from this reference:

- "What's the full list of `GroupActivityMetadata.ActivityType` values?"
- "Is `GroupActivityTransferRepresentation` available on tvOS?"
- "What replaced `metadata.localizedTitle`?"
- "What are the cases of `GroupActivityActivationResult` and what should each one do?"
- "Which import do I need for `GroupActivitySharingController`?"

## What's Covered

### Setup
Entitlement, Info.plist keys (none needed), allowed target types, platform support

### Activity definition
`GroupActivity`, `GroupActivityMetadata`, `ActivityType` (all ten values), `LifetimePolicy`, `SceneAssociationBehavior`, `BroadcastOptions`, `supportsContinuationOnTV`

### Activation and discovery
`GroupStateObserver`, `GroupActivityActivationResult`, `prepareForActivation()`, `activate()`, `GroupActivitySharingController`, `GroupActivityTransferRepresentation`

### Session
`GroupSession`, `GroupSession.State`, `GroupSession.Sessions`, `Participant`, `Participants`

### Distributed state
`GroupSessionMessenger`, `DeliveryMode`, `Messages`, `MessageContext`, `GroupSessionJournal`, `Attachment`, `Attachments`

### Notices
`GroupSessionEvent`, `Action`, `QueueChange`

### Migration
Full deprecation table, cross-import overlay requirements, visionOS additions (`systemCoordinator`, `SpatialTemplatePreference`, `GroupActivityAssociationKind`)

## Documentation Scope

This page documents the `shareplay-ref` skill (in the `axiom-integration` suite), the API lookup half of Axiom's SharePlay coverage. Patterns, decisions, and the reasoning behind them live in the `shareplay` and `shareplay-playback` skills listed under Related.

## Notes That Change How You Write the Code

A few facts in this reference deserve a callout, because the obvious reading of Apple's documentation produces code that looks right and is wrong.

**`ActivityType` is a struct of static lets, not an enum.** A `switch` over it needs `default:`. There are ten values; the deprecated `Experience` enum exposes only two of them.

**`GroupSession.State` and `GroupActivityActivationResult` are non-frozen.** In Swift 6 language mode, a `switch` without `@unknown default` is a compile error rather than a warning.

**The journal has no pre-download validation hook.** Attachments cap at 100 MB, and there is no point at which you can gate, moderate, or check entitlements before a participant downloads. Apple directs protected content to your own server.

**`activate()` returns `Bool`, and `false` is not a failure** — it means no session will be delivered to your app, so stop waiting rather than retrying or calling `end()`. An Apple TV handoff is one example, not the only one. Real failures throw.

**`GroupActivityTransferRepresentation` is unavailable on tvOS**, even though GroupActivities itself runs there, so the share sheet, `ShareLink`, and AirDrop can't start a session on that platform. `GroupActivitySharingController` is unavailable on tvOS too, which leaves no in-app way to start SharePlay there: sessions must begin on another device.

**`GroupSession` is not `Sendable`**, while `GroupSessionMessenger` and `GroupSessionJournal` are `@unchecked Sendable`. Observation is Combine-only — there is no `AsyncSequence` for `state`, `activity`, or `activeParticipants`.

**`GroupSessionJournal.Attachments.Element` is an array**, not a single attachment. Each iteration delivers the entire current set to everyone, including whoever uploaded it.

**Nothing was added to GroupActivities in the 27 SDK line** — the iOS and visionOS interfaces are identical between the 27.0 and 27.2 SDKs apart from their header lines. Guidance here is written against the 27.2 interface.

## Related

- [SharePlay overview](/SharePlay) – where to start with Axiom's SharePlay coverage, and which skill answers which question
- [shareplay](/skills/integration/shareplay) – session lifecycle, activation, distributed state, and the patterns these APIs require
- [shareplay-playback](/skills/integration/shareplay-playback) – synchronized media playback, which AVFoundation coordinates rather than your messenger (in the `axiom-media` suite)
- [swift-concurrency](/skills/concurrency/swift-concurrency) – isolating a `GroupSession`, which is not `Sendable`

## Resources

**WWDC**: 2021-10183, 2021-10187, 2022-10140, 2023-10239, 2023-10241

**Docs**: /groupactivities, /groupactivities/groupsession, /groupactivities/groupsessionmessenger, /groupactivities/groupsessionjournal, /groupactivities/groupactivitymetadata, /xcode/configuring-group-activities
