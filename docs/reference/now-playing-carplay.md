---
name: now-playing-carplay
description: CarPlay Now Playing integration patterns, CPNowPlayingTemplate customization, entitlement setup, and CarPlay-specific debugging
---

# CarPlay Now Playing Reference

How an audio app's Now Playing integration reaches CarPlay: the metadata it reuses, `CPNowPlayingTemplate` custom buttons and sports mode, the CarPlay audio entitlement, and how to test it all.

## When to Use This Reference

Use this reference when:
- Adding CarPlay support to an audio app
- Now Playing metadata doesn't appear in CarPlay
- Custom buttons (shuffle, repeat, playback rate) aren't showing in CarPlay
- Your app doesn't appear in the CarPlay Audio section
- Showing live scores with the Now Playing template's sports mode
- Debugging differences between iPhone and CarPlay Simulator behavior

## Example Prompts

Questions you can ask your assistant that will draw from this reference:

- "Why doesn't my app show up in CarPlay at all?"
- "Now Playing works on the Lock Screen, so why is it blank in CarPlay?"
- "How do I add shuffle and repeat buttons to CarPlay?"
- "Why do my custom buttons work on device but not in CarPlay Simulator?"
- "What entitlements do I need for CarPlay audio?"
- "How do I show team scores and a game clock in CarPlay's Now Playing screen?"
- "How do I test my audio app in CarPlay on Xcode 27?"

## What's Covered

- CarPlay's relationship to `MPNowPlayingInfoCenter` and `MPRemoteCommandCenter` (no CarPlay-specific metadata for the basic case)
- On iOS 27, apps using the NowPlaying framework reach CarPlay through their `MediaSession`; never add `MPNowPlayingInfoCenter` or `MPRemoteCommandCenter` calls for CarPlay alongside it
- `CPNowPlayingTemplate` customization with custom buttons (iOS 14+), configured at connection time
- Sports mode (iOS 18.4+): the content schema, clock behavior, and when to use it
- The `audio` background mode and the `com.apple.developer.carplay-audio` entitlement, which you request from Apple; the deprecated `playable-content` entitlement
- CarPlay-specific gotchas table with time-to-fix estimates
- Testing in CarPlay Simulator (built into Xcode 27's Device Hub, or the standalone app; both need a physical iPhone), in Xcode Simulator's CarPlay display on Xcode 26 and earlier, and in real vehicles
- Verification checklist for CarPlay audio integration

## Key Insight

CarPlay reads from the same `MPNowPlayingInfoCenter` and `MPRemoteCommandCenter` as the Lock Screen and Control Center. If your Now Playing integration works on iOS, it renders in CarPlay with no additional code. The only CarPlay-specific work is the entitlement and optional `CPNowPlayingTemplate` customization.

## Documentation Scope

This page documents the `now-playing-carplay` skill (in the `axiom-media` suite), which covers the CarPlay-specific parts of Now Playing.

- For CarPlay design rules, the entitlement request flow, and the full testing guidance, see [CarPlay HIG](/skills/integration/carplay-hig)
- For template mechanics beyond Now Playing, see [carplay-templates-ref](/reference/carplay-templates-ref)

## Related

- [now-playing](/skills/integration/now-playing) – Core Now Playing patterns, the foundation CarPlay builds on
- [now-playing-musickit](/reference/now-playing-musickit) – Automatic Now Playing for Apple Music content played through MusicKit
- [avfoundation-ref](/reference/avfoundation-ref) – `AVAudioSession` configuration for background audio

## Resources

**WWDC**: 2018-213, 2020-10635

**Docs**: /carplay, /mediaplayer/mpnowplayinginfocenter
