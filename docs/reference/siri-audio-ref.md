---
name: siri-audio-ref
description: Audio schema domain, AudioSearch, and SiriKit media API reference for audio apps that work with Siri
---

# Siri for Audio Apps Reference

API reference for the App Intents Audio schema domain (iOS 27), the MediaIntents `AudioSearch` type, SiriKit media intents, and the Now Playing commands Siri uses, for developers adding Siri playback to a music, podcast, audiobook, or radio app. Apple's API names the schemas but not their required members, so this reference records the exact shapes the build enforces, measured against the iOS 27.1 SDK.

## When to Use This Reference

Use this reference when:
- You need the exact required properties, parameters, or enum cases for an `.audio.*` schema
- A build fails in the App Intents metadata phase (`ExtractAppIntentsMetadata`) with a schema error
- You're writing the `IntentValueQuery` that resolves Siri's `AudioSearch`
- You're setting up `INPlayMediaIntent` for classic Siri (users without Siri AI)
- You need to know which SiriKit authorization rules apply, and which don't

## Example Prompts

Questions you can ask your assistant that will draw from this reference:

- "What properties does `.audio.song` require?"
- "What parameters does the `playAudio` schema need?"
- "Why does my build say `Missing required parameter 'queueLocation'`?"
- "How do I declare the `AudioItem` union?"
- "Which `AudioSearch` criteria do I need to handle?"
- "What Info.plist keys does `INPlayMediaIntent` need?"
- "Does `siriAuthorizationStatus()` tell me whether App Shortcuts work with Siri?"

## What's Covered

### Enforcement
- The metadata build phase, and why Swift errors hide every schema error
- Exact optionality rules, allowed extra members, and the documented `playAudio` warning that Xcode doesn't emit
- Resolvability: which entities need `IndexedEntity`, `EntityStringQuery`, or `TransientAppEntity`
- Initializer ordering and memberwise initializers for schema entities
- Platform availability: Audio schemas skip watchOS and tvOS; `INPlayMediaIntent` skips macOS

### Entities
- `song`, `album`, `artist`, `playlist`, `songCollection`, `classicalMusicRecording`
- `liveRadioStation`, `algorithmicRadioStation`, `radioShow`, `radioShowEpisode`
- `podcastShow`, `podcastEpisode`, `podcastCollection`, `audiobook`
- `ambientSound`, `newsProvider`, `newsBrief`, `warmupAudioQueueResult`

### Intents
- `playAudio`, `warmupAudioQueue`, `updateAudioAffinity`
- `addToLibrary`, `addToPlaylist`, `createStation`, `recognizeAudio`

### Enums and Unions
- `playbackAttributes`, `queueInsertionLocation`, `affinityState`
- `invocationSource`, `appViewIdentifier`, `activity`
- The `AudioItem` union and the playlist `owner` union

### Resolution and Context
- `AudioSearch` and `AudioSearch.Criteria` (`searchQuery`, `unspecified`, `url`)
- `IndexedEntity`, `IndexedEntityQuery`, and the 10 MB entity limit
- Now Playing `appEntityIdentifiers`, on-screen annotations, `RelevantEntities`, `.system.searchInApp`, donations
- Gating App Shortcuts for a deployment target below iOS 27

### SiriKit Media
- `INPlayMediaIntent` and `INPlayMediaIntentHandling` in the app
- `INIntentsSupported`, `INSupportedMediaCategories`, the Siri entitlement, and `NSSiriUsageDescription`
- `INPreferences` authorization, and what `siriAuthorizationStatus()` does not report
- `INMediaSearch` fields and Apple's measured mix of request shapes
- App Selection (Siri choosing your app when the user doesn't name it): donations, `INMediaUserContext`, Spotlight, and vocabulary

### Now Playing Commands
- How Siri's "pause", "next", and "what song is this?" reach `MPRemoteCommandCenter` or the NowPlaying framework's `MediaCommand` closures (one or the other, never both), and Now Playing metadata

### Build Error Reference
- Each metadata-phase and Swift error message, and its fix

## Documentation Scope

This page documents the `siri-audio-ref` skill (in the `axiom-integration` suite), the reference your assistant uses for exact Audio schema shapes, `AudioSearch`, and SiriKit media setup. The skill holds a complete code sample, compiled against the iOS 27.1 SDK, for a music app's entities, unions, enums, intents, and queries, plus a SiriKit handler.

- For the approach and build order, see [siri-audio](/skills/integration/siri-audio)
- For playback that builds but doesn't work, see [siri-audio-diag](/diagnostic/siri-audio-diag)

## Related

- [app-intents-ref](/reference/app-intents-ref) – The App Intents framework, other schema domains, and AppIntentsTesting
- [app-shortcuts-ref](/reference/app-shortcuts-ref) – App Shortcuts and their separate Siri opt-in
- [core-spotlight-ref](/reference/core-spotlight-ref) – Spotlight indexing for `IndexedEntity`
- [now-playing](/skills/integration/now-playing) – Remote commands, Now Playing metadata, and entity annotations for the content that's playing

## Resources

**WWDC**: 2026-343, 2026-240, 2026-345, 2026-312, 2020-10060

**Docs**: /appintents/app-schema-domain-audio, /mediaintents/audiosearch, /appintents/intentvaluequery, /intents/inplaymediaintent, /sirikit/requesting-authorization-to-use-siri
