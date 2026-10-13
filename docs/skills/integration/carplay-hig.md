---
name: carplay-hig
description: CarPlay HIG and design discipline — app category selection, the 7 Universal Guidelines, per-category rules, entitlement review preparation, iOS 26 widgets and Live Activities, CarPlay Ultra
---

# CarPlay HIG and Design Discipline

CarPlay is not a second screen for your iPhone app: it is a regulated surface with hard design rules that Apple enforces during entitlement review, before your app reaches the App Store. This skill helps you pick the right app category, follow the 7 Universal Guidelines and per-category rules, and prepare a submission that passes review.

## When to Use

Use this skill when you're:

- Deciding whether your app belongs on CarPlay at all, and if so, in which of the 11 categories
- Requesting a CarPlay entitlement (Apple reviews design before granting the entitlement)
- Designing any CarPlay screen, flow, alert, or notification
- Adding widgets or Live Activities to CarPlay on iOS 26+
- Responding to Apple feedback on a CarPlay submission
- Reviewing an existing CarPlay implementation for HIG compliance
- Supporting CarPlay Ultra, which requires multitouch-aware layouts

## Example Prompts

Questions you can ask your assistant that will draw from this skill:

- "Which CarPlay category should my parking-finder app use?"
- "Apple rejected my CarPlay entitlement request — what's the most likely cause?"
- "Can I show message body text in a CarPlay notification?"
- "How do I add a widget to CarPlay without making it the primary CarPlay experience?"
- "What does CarPlay Ultra require that vanilla CarPlay doesn't?"
- "I want to add a one-time setup screen to my CarPlay app. Is that OK?"
- "How do I test my CarPlay app on Xcode 27 — do I still need the standalone CarPlay Simulator, and can I test without an iPhone?"

## What This Skill Provides

- **Category selection decision tree** – picks exactly one of the 11 CarPlay categories (Audio, Communication, Driving Task, EV Charging, Fueling, Navigation, Parking, Public Safety, Quick Food Ordering, Video, Voice-Based Conversational), or an allowed pair (EV charging with fueling, audio with video), with the minimum iOS version and entitlement string for each
- **The 7 Universal Guidelines** – quoted verbatim from the CarPlay Developer Guide: primary purpose, never direct to iPhone, all flows possible in CarPlay, relevant to driving, no gaming or social networking, no message content, and templates as intended
- **Per-category design rules** – for each of the 11 categories, including the no-lyrics rule for audio apps, the 9 navigation-specific rules, the refresh-rate caps for driving task apps, the simplified-ordering rule for quick-service restaurant (QSR) apps, the AirPlay requirement for video apps, and the voice-first rule for conversational apps
- **Red-flag table** – the ten most common "I'll just…" shortcuts that break CarPlay rules, each paired with the specific rule and its source
- **Entitlement request flow** – what Apple reviews, why category fit is the most common rejection reason, and how to frame your description so the right reviewer signs off
- **Layout, color, icon, and per-template asset sizes** – including the 120×120 and 180×180 icon sizes, the no-black-background rule, and the screen-resolution range (748×456 to 1920×720, plus portrait 900×1200)
- **Error handling for iPhone-locked state** – why CarPlay typically runs with iPhone locked, which storage and Keychain access becomes unavailable, and how to surface errors in CarPlay rather than on the iPhone
- **iOS 26 additions** – widgets in CarPlay (`.systemSmall` family, `.disfavoredLocations([.carPlay], for: [.systemSmall])` for unsuitable widgets), Live Activities (`.small` activity family), CarPlay Ultra, and multitouch
- **Notification rules** – which categories support notifications, the `.carPlay` authorization option, the `allowInCarPlay` category option, and the no-message-body rule for communication apps
- **Testing paths** – CarPlay Simulator, built into Xcode 27's Device Hub or as the standalone app (both need a physical iPhone), Xcode Simulator's CarPlay display on Xcode 26 and earlier, and what only a real vehicle can show
- **Expert review checklist and common mistakes** – category fit, universal guidelines, layout and assets, error and locked-state behavior, and the iOS 26 additions; run it before requesting the entitlement

## Key Pattern

### Templates are not custom views

CarPlay apps don't draw their own controls. They pick from a fixed set of templates (list, grid, alert, map, Now Playing, and so on) and supply data; iOS renders the UI onto the vehicle's display. The one exception is the navigation base view, which exists exclusively to draw a map — never overlays, alerts, or custom UI.

### Driver distraction is the framing principle

"CarPlay is designed for the driver, not for passengers." Every rule in the HIG exists to keep eyes on the road. When you find yourself wanting to add a feature "while we're here", ask whether it serves a driving task. If it doesn't, leave it on iPhone.

### iPhone-locked is the default test path

Most CarPlay use happens with iPhone locked in a pocket or center console. Your app cannot access files protected with `NSFileProtectionComplete`, the most restrictive Keychain items, or SQLite databases opened with `SQLITE_OPEN_FILEPROTECTION_COMPLETE`. Test this path early, because it surfaces issues that testing with the phone unlocked hides.

## Documentation Scope

This page documents the `carplay-hig` skill (in the `axiom-media` suite), the design rules your assistant applies before you build or submit a CarPlay app.

- For template mechanics and per-category template availability, see [CarPlay Templates Reference](/reference/carplay-templates-ref)

## Related

- [Now Playing Integration](/skills/integration/now-playing) – The core Now Playing patterns CarPlay audio apps build on
- [CarPlay Now Playing Reference](/reference/now-playing-carplay) – `CPNowPlayingTemplate` API mechanics, sports mode metadata, and the CarPlay-specific gotchas table for audio apps
- [CarPlay Navigation Reference](/reference/carplay-navigation-ref) – Navigation implementation (base view rules, route guidance lifecycle, instrument cluster, HUD metadata, multitouch on iOS 26+)
- [Push Notifications](/skills/integration/push-notifications) – Notification authorization, including the `.carPlay` option and `allowInCarPlay` category configuration
- [AVFoundation Audio Reference](/reference/avfoundation-ref) – `AVAudioSession` configuration for navigation voice prompts

## Resources

### Primary sources (Apple)

- [CarPlay HIG](https://developer.apple.com/design/human-interface-guidelines/carplay) – Apple's design guidance for CarPlay apps
- [CarPlay Developer Guide](https://developer.apple.com/download/files/CarPlay-Developer-Guide.pdf) (Jun 2026) – Entitlement request, template availability, per-category rules, asset sizes
- [CarPlay Audio App Programming Guide](https://developer.apple.com/carplay/documentation/CarPlay-Audio-App-Programming-Guide.pdf) (Mar 2017) – Legacy MediaPlayer path notes that still apply to iPhone-locked data access
- [CarPlay for developers](https://developer.apple.com/carplay/) – Where you request the entitlement

**WWDC**: 2017-719 (Enabling Your App for CarPlay), 2018-213 (CarPlay Audio and Navigation Apps), 2020-10635 (Accelerate your app with CarPlay), 2022-10016 (Get more mileage out of your app with CarPlay), 2025-216 (Turbocharge your app for CarPlay)
