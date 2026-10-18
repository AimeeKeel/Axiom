---
name: siri-audio-diag
description: Siri says "I can't play that" or "hasn't added support for that with Siri", can't find items by name, or works only while the app is open
---

# Siri Audio Diagnostics

Troubleshooting for audio apps whose Siri support builds but doesn't play. Most failures have one of four causes: the request took a path you didn't build, Siri never matched the request to one of your items, a cold-start process ended early, or your search didn't survive Siri's phrasing.

## Symptoms This Diagnoses

Use when you're experiencing:
- Siri says "I can't play that" even though the build succeeds
- Siri says "MyApp hasn't added support for that with Siri"
- Siri finds your app but can't find an artist, album, or playlist by name
- Siri playback works only while the app is already open
- Duplicate results in Siri or Spotlight
- "Pause" and "next" work, but "play this album" doesn't
- An App Shortcut phrase goes to a web or Maps result, but tapping the shortcut works
- A schema build fails with no schema errors listed
- The build log shows `At least one halting error was produced during export`
- AppIntentsTesting reports `LNPerformQueryErrorDomain 10002`
- A schema intent's `perform()` crashes with large entities

## Example Prompts

Questions you can ask your assistant that will invoke this diagnostic:

- "Why does Siri say it can't play that when my app has the Audio schemas?"
- "Siri says my app hasn't added support for that. What's missing?"
- "Why can't Siri find artists in my app by name?"
- "Why does Siri playback only work when my app is open?"
- "Next track works with Siri but playing an album doesn't. Why?"
- "My App Shortcut works when I tap it but not when I say it"

## Diagnostic Workflow

The diagnostic first identifies which path the request took. "Pause" and "next" go through Now Playing commands; "play X" goes through the Audio schemas for Siri AI, or through SiriKit for classic Siri; and App Shortcut phrases go through your App Shortcuts, which have their own Siri opt-in. A fix for one path does nothing for another.

From there it works through each symptom:

- **Build problems** – Swift errors that hide schema errors, and the halting export error
- **SiriKit not wired** – Info.plist keys, the Siri entitlement, the multiple-scene requirement for in-app handlers, and authorization
- **Resolution failures** – A missing `AudioSearch` query, a query that returns nothing for Siri's phrasing, and a stale Spotlight index
- **Name search** – Entity queries that can't search by name
- **Cold start** – Background processes that end before resolving, and services that crash when no window exists yet
- **Other symptoms** – Duplicate results, Now Playing commands that don't respond, a declined App Shortcuts opt-in, and crashes from oversized entities

It ends with pitfalls in automated Siri testing, such as a UI-test call that can block for about 60 seconds while Siri still runs the request.

## Documentation Scope

This page documents the `siri-audio-diag` diagnostic skill (in the `axiom-integration` suite), the workflows your assistant uses when Siri support in an audio app builds but doesn't play. The skill file includes the exact log messages and build errors to look for.

- For exact schema shapes and error-to-fix mappings, see [siri-audio-ref](/reference/siri-audio-ref)

## Related

- [siri-audio](/skills/integration/siri-audio) – The build order and testing ladder that prevent most of these failures
- [app-shortcuts-ref](/reference/app-shortcuts-ref) – App Shortcut phrases and their separate Siri opt-in
- [now-playing](/skills/integration/now-playing) – Remote commands and Now Playing metadata for "pause", "next", and "what song is this?"
- [core-spotlight-ref](/reference/core-spotlight-ref) – Indexing and rebuilding the Spotlight entries Siri searches

## Resources

**WWDC**: 2026-343, 2026-240, 2020-10060

**Docs**: /mediaintents/responding-to-audio-search-and-playback-requests, /sirikit/requesting-authorization-to-use-siri, /sirikit/dispatching-intents-to-handlers, /appintentstesting
