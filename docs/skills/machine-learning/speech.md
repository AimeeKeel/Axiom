---
name: speech
description: On-device speech-to-text with SpeechAnalyzer — file and live transcription, model assets, the limit on simultaneous analyses, the iOS 27 audio input providers, and when SFSpeechRecognizer still applies
---

# Speech-to-Text

How to add on-device speech-to-text with Apple's `SpeechAnalyzer` (iOS 26 and later), the framework behind transcription in Notes and Voice Memos, from choosing a module to showing live results and stopping cleanly.

## When to Use

Use this skill when you're:
- Transcribing an audio or video file
- Showing a live transcript from the microphone
- Choosing between `SpeechTranscriber`, `DictationTranscriber`, and the older `SFSpeechRecognizer`
- Downloading and managing the speech models your locales need
- Running more than one transcription at once, or seeing an `insufficientResources` error
- Feeding microphone or capture audio to the analyzer under Swift 6

## Example Prompts

Questions you can ask your assistant that will draw from this skill:

- "How do I add live transcription to my iOS app?"
- "Should I use SpeechTranscriber, DictationTranscriber, or SFSpeechRecognizer?"
- "Why does my transcript drop its last few words when I stop recording?"
- "Why am I getting `insufficientResources` from SpeechAnalyzer?"
- "My app crashes inside the audio tap closure since I moved to Swift 6. Why?"
- "How do I transcribe a video's audio track on iOS 27?"
- "How do I sync transcript text with audio playback?"

## What This Skill Provides

- **Choosing a module** – `SpeechTranscriber` for general use, `DictationTranscriber` for custom vocabulary and the same locales as on-device `SFSpeechRecognizer`, `SpeechDetector` to skip silence, and platform availability for each
- **File and live transcription** – Complete patterns for transcribing a file and for a live session that merges in-progress and final results by audio time
- **Feeding audio** – The iOS 27 capture, asset, and converter providers, the iOS 26 microphone path written so its audio callback is safe under Swift 6, and why the analyzer never converts audio formats
- **Stopping without losing words** – Ending a session so final results still arrive
- **Model assets** – Reserving and releasing locales with `AssetInventory`, and why the audio format isn't known until the model is installed
- **Limits and errors** – The cap of about two simultaneous analyses on iOS and visionOS, the error-matching syntax that compiles, and the iOS 27 option that stops the counting, though analyzers can still fail beyond the hardware's real capacity
- **Reference tables** – Every transcriber preset and option, with what each one turns on
- **SFSpeechRecognizer** – When the older API still applies: deployment targets before iOS 26, and locales that only server recognition supports

## Documentation Scope

This page documents the `speech` skill (in the `axiom-ai` suite), which your assistant loads when you add speech-to-text. Configuring your app's audio session for recording or playback alongside transcription is covered by the [AVFoundation reference](/reference/avfoundation-ref).

## Related

- [ios-ml](/skills/machine-learning/ios-ml) – The hub that routes on-device machine learning and speech work
- [foundation-models](/skills/integration/foundation-models) – Summarizing or titling a transcript with Apple's on-device language model

## Resources

**WWDC**: 2025-277

**Docs**: /speech, /speech/speechanalyzer, /speech/speechtranscriber, /speech/dictationtranscriber, /speech/assetinventory, /speech/captureinputsequenceprovider, /speech/sfspeechrecognizer
