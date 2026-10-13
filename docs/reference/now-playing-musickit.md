---
name: now-playing-musickit
description: MusicKit Now Playing integration patterns, ApplicationMusicPlayer automatic metadata publishing, and hybrid app strategies
---

# MusicKit Now Playing Reference

How Now Playing works when you play Apple Music content with MusicKit's `ApplicationMusicPlayer`, plus the authorization, subscription, playback, and queue APIs around it and the handoff rules for apps that also play their own audio.

## When to Use This Reference

Use this reference when:
- Playing Apple Music content with MusicKit's `ApplicationMusicPlayer`
- Checking Music authorization or an Apple Music subscription, or offering one
- Managing the playback queue
- Building a hybrid app that plays both Apple Music and your own content
- Now Playing info is wrong or missing when playing Apple Music tracks
- Manually setting `nowPlayingInfo` and fighting MusicKit's automatic data

## Example Prompts

Questions you can ask your assistant that will draw from this reference:

- "Do I need to set Now Playing info when using MusicKit?"
- "Why does Now Playing show the wrong metadata for Apple Music tracks?"
- "My app plays both Apple Music and local files. How do I handle Now Playing?"
- "Why does the Lock Screen still show the Apple Music track after I switch to my own file?"
- "How do I check whether the user has an Apple Music subscription?"
- "How does `ApplicationMusicPlayer` handle Now Playing automatically?"

## What's Covered

- What `ApplicationMusicPlayer` publishes automatically (title, artist, album, artwork, duration, elapsed time, rate), and why it doesn't use your app's `MPNowPlayingInfoCenter` dictionary
- What is not automatic (custom metadata, remote command customization, mixed content)
- Music authorization, Apple Music subscription checks, the subscription offer sheet, and graceful fallback without a subscription
- Playback, playback state observation, and queue management
- Hybrid app handoff between MusicKit and `AVPlayer`: `stop()` rather than `pause()`, clearing your dictionary on every switch, never read-modify-write
- The common mistake of writing `nowPlayingInfo` during MusicKit playback, and why it blanks the artwork
- When manual `MPNowPlayingInfoCenter` updates are appropriate with MusicKit

## Key Insight

MusicKit's `ApplicationMusicPlayer` publishes Now Playing on its own, but not through your app's `MPNowPlayingInfoCenter` dictionary. The Music playback service renders the audio out of process and publishes from there, so the service and your dictionary are two separate publishers of one Lock Screen slot, and whichever wrote last wins. You don't need to set Now Playing info for Apple Music content. Writing `nowPlayingInfo` anyway is the most common mistake: it replaces the service's metadata with a snapshot that lacks artwork and goes stale at the next track change.

## Documentation Scope

This page documents the `now-playing-musickit` skill (in the `axiom-media` suite): MusicKit playback, authorization, subscription, and Now Playing publishing. Reading the user's library is a separate skill, covered on the [music-library](/skills/integration/music-library) page.

## Related

- [now-playing](/skills/integration/now-playing) – Core Now Playing patterns, including manual `MPNowPlayingInfoCenter` setup
- [now-playing-carplay](/reference/now-playing-carplay) – CarPlay Now Playing with `CPNowPlayingTemplate` customization
- [avfoundation-ref](/reference/avfoundation-ref) – `AVAudioSession` and `AVPlayer` for audio that doesn't come from MusicKit

## Resources

**Docs**: /musickit, /musickit/applicationmusicplayer, /musickit/musicsubscription
