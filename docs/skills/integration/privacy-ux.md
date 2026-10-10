---
name: privacy-ux
description: Discipline for privacy-first app design — privacy manifests, just-in-time permission requests, App Tracking Transparency, tracking domains, Required Reason APIs, and Privacy Nutrition Labels
---

# Privacy UX

Discipline-enforcing skill for shipping a privacy-first iOS app. It covers privacy manifests (`PrivacyInfo.xcprivacy`), clear permission requests, App Tracking Transparency, and the disclosures needed for App Review.

## When to Use

Use this skill when:
- Creating or auditing `PrivacyInfo.xcprivacy`
- Requesting system permissions (Camera, Photos, Microphone, Location, Bluetooth, etc.)
- Implementing App Tracking Transparency (ATT) and IDFA access
- Preparing or updating Privacy Nutrition Labels in App Store Connect
- Declaring tracking domains and avoiding accidental tracking
- Adding Required Reason API declarations (UserDefaults, file timestamps, system boot time, disk space)
- Designing transparent UX for permission and ATT prompts
- Debugging privacy-related App Store rejections

## Example Prompts

- "How do I structure my `PrivacyInfo.xcprivacy`?"
- "What's the right just-in-time pattern for requesting camera access?"
- "How do I explain ATT clearly while preserving the user's choice?"
- "Does my SDK's advertising measurement or fraud prevention require ATT permission?"
- "How do I handle the iOS 27.2 EU ATT prompt, Additional Information, and yearly re-prompting?"
- "Which of my APIs need a Required Reason declaration?"
- "How do I declare tracking domains in my privacy manifest?"
- "What data types go into Privacy Nutrition Labels and how do they map to manifest entries?"
- "I'm getting an ITMS-91056 rejection — what's missing?"

## What This Skill Provides

- **Privacy manifest discipline** – `PrivacyInfo.xcprivacy` structure, `NSPrivacyTracking` flag, `NSPrivacyTrackingDomains` array, `NSPrivacyCollectedDataTypes` declarations, `NSPrivacyAccessedAPITypes` with reason codes (e.g., `CA92.1` for UserDefaults)
- **Just-in-time permission pattern** – request access in the feature context, add an explanation screen only when needed with one action opening the system alert, and handle denial gracefully
- **App Tracking Transparency UX** – optional pre-alert explanations, qualified tracking exceptions, authorization-only IDFA access, iOS 27.2 expanded EU prompt and Markdown purpose string, Additional Information returning `.notDetermined`, yearly re-prompt eligibility, and older-OS/SDK fallbacks
- **Tracking domains** – cross-company advertising and advertising measurement, data-broker sharing, automatic blocking in iOS 17+, how to declare partner domains in the manifest
- **Required Reason APIs** – the four common categories (UserDefaults, file timestamps, system boot time, disk space) and the specific reason codes that satisfy App Review
- **Privacy Nutrition Labels** – data collection categories, data use purposes, linked vs. not-linked-to-identity, how to keep the manifest and Nutrition Labels in sync
- **Permission decision matrix** – which permissions need usage descriptions, which need entitlements, which are silently blocked without manifest declarations
- **Anti-patterns** – requesting at launch ("get all the popups out of the way"), missing Info.plist usage descriptions (crash on first access), no Required Reason declaration (App Store rejection), misleading pre-alerts, extra pre-alert actions that are not needed to obtain legal consent, tracking domains undeclared (silent blocking)
- **App Review rejection playbook** – common ITMS codes (ITMS-91056, ITMS-91065, ITMS-91062) and the manifest changes that resolve them

## Related

- [hig](/skills/ui-design/hig) – permission request UX patterns and onboarding flow
- [hig-ref](/reference/hig-ref) – complete HIG reference
- [eventkit-contacts](/skills/integration/eventkit-contacts) – EventKit and Contacts have their own permission models layered on top of these patterns
