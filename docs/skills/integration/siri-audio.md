---
name: siri-audio
description: Make "play X in MyApp" work with Siri in a music, podcast, audiobook, or radio app, for both Siri AI and classic Siri
skill_type: skill
version: 1.0
apple_platforms: iOS 27+ (Audio schema domain, not watchOS or tvOS), iOS 14+ (in-app SiriKit media, not macOS)
---

# Siri for Audio Apps

This skill helps your assistant make "play X in MyApp" work with Siri in a music, podcast, audiobook, radio, ambient-sound, or news-brief app, for both kinds of Siri: Siri AI, the new Siri in iOS 27 built on Apple Intelligence, and classic Siri, which every other user still has (iOS 26, devices without Apple Intelligence, Apple Intelligence turned off, Apple Watch, and Apple TV). It covers which of Siri's three paths into your app to build, in what order, and how to keep a successful build from shipping a feature that never plays anything.

Part of the **axiom-integration** suite (`skills/siri-audio.md`).

## When to Use

Use this skill when you're:
- Adding Siri playback ("play my running playlist in MyApp") to an audio app
- Adopting `@AppEntity(schema: .audio.song)` or another `.audio.*` schema
- Supporting voice requests to like a song, add it to a playlist, play it next, or identify it
- Deciding whether SiriKit media intents are still needed in iOS 27 (they are, for every classic Siri user)

## Example Prompts

- "How do I make Siri play songs from my music app?"
- "Which Audio schemas do I need for a podcast app?"
- "Do I still need `INPlayMediaIntent` if I adopt the Audio schema domain?"
- "Why does Siri find my app but then say it can't play that?"
- "How should my app handle 'play something in MyApp'?"
- "Do I need to ask for Siri permission?"

## What This Skill Provides

- **Three paths** – The Audio schema domain (iOS 27) for Siri AI, SiriKit's `INPlayMediaIntent` for classic Siri, and Now Playing commands for "pause" and "next" while your app is the current player, plus which users take each path
- **Build order** – Now Playing commands, schema entities with searchable queries, a query that resolves Siri's `AudioSearch` requests, the `playAudio` intent, the other audio intents, indexing and context, then SiriKit, each testable before you start the next
- **Search that survives Siri's phrasing** – Search the spoken query as given, strip Siri's own words only when that finds nothing, and answer "play something" with favorites, recents, or the current queue
- **SiriKit setup** – The in-app handler and its multiple-scene requirement, the Info.plist keys, the Siri entitlement, and when to request Siri authorization
- **Cold-start safety** – How to keep queries and intents working when Siri runs them before your app has a window
- **Testing ladder** – Build, AppIntentsTesting, direct query tests, Shortcuts, Spotlight, then both kinds of Siri, with the app running and killed

## Related

- [siri-audio-ref](/reference/siri-audio-ref) – The exact required members, parameters, enum cases, and build errors for each Audio schema this skill tells you to adopt, plus the SiriKit media API
- [siri-audio-diag](/diagnostic/siri-audio-diag) – Fixes for "I can't play that", "hasn't added support for that with Siri", and cold-start failures
- [app-intents-ref](/reference/app-intents-ref) – The App Intents framework the Audio schemas build on
- [now-playing](/skills/integration/now-playing) – The player, Now Playing metadata, and the remote commands Siri uses for "pause" and "next"
- [core-spotlight-ref](/reference/core-spotlight-ref) – Indexing the entities Siri searches
- [app-shortcuts-ref](/reference/app-shortcuts-ref) – App Shortcut phrases, which need their own Siri opt-in

## Resources

**WWDC**: 2026-343, 2026-240, 2026-345, 2020-10060

**Docs**: /appintents/app-schema-domain-audio, /appintents/integrating-your-music-app-with-apple-intelligence, /mediaintents/responding-to-audio-search-and-playback-requests, /sirikit/improving-siri-media-interactions-and-app-selection, /sirikit/requesting-authorization-to-use-siri
