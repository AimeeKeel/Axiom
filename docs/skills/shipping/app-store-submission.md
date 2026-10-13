---
name: app-store-submission
description: Use when preparing ANY app for App Store submission, responding to App Review rejections, or running a pre-submission audit
---

# App Store Submission

A systematic pre-flight checklist that catches 90% of App Store rejection causes before you submit. Thirty minutes of pre-flight saves 3–7 days of rejection-fix-resubmit cycles.

## When to Use

Use this skill when you're:
- Preparing to submit an app or update to the App Store
- Submitting your first app as a new developer
- Responding to an App Review rejection
- Running a pre-submission audit before TestFlight or production
- Updating an existing app after a long gap, when new requirements may apply
- Wondering "is my app ready to submit?"

**Core principle** Ship once, ship right. Over 40% of rejections cite Guideline 2.1 (App Completeness), and another 30% are metadata and privacy issues. Both are preventable.

## Example Prompts

Questions you can ask your assistant that will draw from this skill:

- "Is my app ready to submit to the App Store?"
- "What do I need before submitting my first iOS app?"
- "I keep getting rejected. What am I missing?"
- "What's the pre-submission checklist for the App Store?"
- "Do I need a privacy manifest?"
- "I built with the iOS 27 SDK, and my upload was rejected for a missing launch screen. Why?"
- "My app update was rejected for metadata issues."

## What This Skill Provides

### Pre-Flight Checklist (9 Categories)
A mandatory checklist covering build configuration, privacy, metadata, account and authentication, App Review information, content completeness, regional compliance, the 2025–2026 requirements, and the 27-release requirements (launch screen, scene lifecycle, Mac availability).

### Anti-Patterns with Time Costs
Eight common submission mistakes — no device testing, a missing privacy policy, placeholder content, an ignored privacy manifest, missing Sign in with Apple, no account deletion, the wrong age rating, and missing demo credentials — each with the days it costs and how to prevent it.

### IAP Submission Checklist
- A review screenshot for each in-app purchase product
- In-app purchase products attached to the version (a checkbox in App Store Connect, needed on the first submission only)
- Terms of Use and Privacy Policy links on the paywall (`SubscriptionStoreView` adds them automatically; a custom paywall must add them by hand)
- Subscription terms visible before purchase (price, period, auto-renewal)

### Decision Tree
A step-by-step "is my app ready?" walkthrough covering crashes, privacy manifest, privacy policy, screenshots, account deletion, Sign in with Apple, in-app purchases, encryption, EU compliance, demo credentials, age rating, and placeholder content.

### Pressure Scenarios
Three scenarios that keep the checklist in place under deadline pressure, after repeated rejections, and when an update is "just a bug fix".

### Handling Rejections
Reading rejection messages, choosing a response, deciding when to appeal, expedited review eligibility (critical bug fixes and event-related apps), "Meet with App Review" sessions, bug-fix leniency, and the difference between metadata and binary rejections.

## Key Pattern

### The 30-Minute Pre-Flight

```
Before EVERY submission, run the complete checklist:

1. Build Configuration  — Physical device, latest SDK, launch screen, IPv6, release config
2. Privacy              — Manifest, policy (ASC + in-app), purpose strings, ATT
3. Metadata             — Name, screenshots, keywords, "What's New"
4. Account              — Deletion flow, Sign in with Apple, Restore Purchases
5. App Review Info      — Contact info, demo credentials, notes
6. Content              — No placeholders, all links work, production assets
7. Regional             — EU DSA trader status, age rating, export compliance
8. 2025–2026            — Updated age rating, accessibility labels, AI consent, SDK minimum
9. 27 Releases          — Launch screen key, scene lifecycle, Mac availability
```

**Before**: 11 days lost to three preventable rejections.
**After**: a 30-minute pre-flight catches all three issues, and the app is approved on its first submission.

## Documentation Scope

This page documents the `app-store-submission` skill (in the `axiom-shipping` suite). The skill also covers screenshot requirements, encryption export compliance, and a first-time developer checklist.

## Related

- [App Review Guidelines](/skills/shipping/app-review-guidelines) – the guideline numbers behind each rejection category
- [Expert Review Checklist](/skills/shipping/expert-review-checklist) – a flat nine-section list to run as the final pass
- [App Store Reference](/reference/app-store-ref) – metadata field specs and the privacy manifest schema
- [App Store Diagnostics](/diagnostic/app-store-diag) – rejection diagnosis and remediation patterns
- [StoreKit 2 Reference](/reference/storekit-ref) – in-app purchase and subscription implementation
- [Privacy UX Patterns](/skills/integration/privacy-ux) – privacy manifest, App Tracking Transparency, and permission request patterns
- [App Store Connect](/reference/app-store-connect-ref) – App Store Connect navigation, crash data, and analytics

## Resources

**WWDC**: 2022-10166, 2025-328, 2025-224, 2025-241

**Docs**: /app-store/review/guidelines, /app-store/submitting, /app-store/app-privacy-details
