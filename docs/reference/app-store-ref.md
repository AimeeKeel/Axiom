---
name: app-store-ref
description: Use when looking up ANY App Store metadata field, privacy manifest schema, age rating tier, export compliance decision, or WWDC25/WWDC26 submission change
skill_type: reference
version: 1.0.0
apple_platforms: iOS, iPadOS, tvOS, watchOS, visionOS
---

# App Store Submission Reference

A lookup reference for App Store submission requirements: metadata fields, privacy manifests, age ratings, export compliance, account rules, monetization, EU compliance, build upload, and the WWDC25 and WWDC26 changes. Use it when you need an exact field limit, reason code, or rule rather than a workflow.

## When to Use This Reference

Use this reference when you need:
- Specific metadata field requirements or character limits
- Privacy manifest schema fields or Required Reason API categories
- Age rating tiers and capability declarations
- Export compliance decisions and Info.plist keys
- EU DSA trader status requirements
- The IAP submission pipeline and review flow
- Build upload SDK requirements and processing details
- WWDC25 and WWDC26 submission changes (draft submissions, Asset Library, Retention Messaging, group subscriptions)

## Example Prompts

Questions you can ask your assistant that will draw from this reference:

- "What are the character limits for App Store metadata fields?"
- "What screenshot sizes do I need for iPhone and iPad?"
- "What are the Required Reason API categories for privacy manifests?"
- "What changes for ATT purpose strings and consent handling with the iOS 27.2 EU prompt?"
- "What are the App Store's age rating tiers?"
- "Do I need to set `ITSAppUsesNonExemptEncryption`?"
- "What's required for EU DSA trader status?"
- "How does the IAP review pipeline work?"
- "What changed for App Store submissions in WWDC25?"
- "How do I set up Retention Messaging or a Product Page Header?"
- "How do I onboard my app to Xcode Cloud and set up TestFlight distribution?"

## What's Covered

### Part 1: Metadata Fields
- Immutable fields: Bundle ID, SKU, IAP Product ID, Subscription Duration
- Required fields and character limits
- Screenshot pixel dimensions for every device size, with fallbacks
- App Preview specs (H.264 or ProRes 422 HQ, 15–30 seconds, 500 MB)
- App icon, App Review information, metadata rules (Guideline 2.3), localization, categories

### Part 2: Privacy Requirements
- Privacy policy (Guideline 5.1.1(i))
- `PrivacyInfo.xcprivacy` schema, API category identifiers, the aggregate privacy report
- Required Reason API categories and reason codes
- Privacy Nutrition Labels; "collected" and "tracking" definitions
- ATT: the iOS 27.2 expanded EU prompt, `.notDetermined`, yearly re-prompting, `NSUserTrackingMarkdownUsageDescription`
- Purpose strings (`NS*UsageDescription`) and third-party SDK manifests
- Gotchas: custom values Xcode silently rejects, IP address declaration, iOS 17 tracking-domain blocking, web view collection

### Part 3: App Review
- App Review timeline

### Part 4: Age Ratings
- Five tiers: 4+, 9+, 13+, 16+, 18+
- Capability declarations, regional mapping, best practices, questionnaire topics

### Part 5: Export Compliance
- Exempt, industry-standard, and proprietary encryption
- Decision tree, `ITSAppUsesNonExemptEncryption`, `ITSEncryptionExportComplianceCode`, France (ANSSI)

### Part 6: Accounts and Authentication
- Account deletion requirements and checklist
- Sign in with Apple (Guideline 4.8), its exceptions, and token revocation

### Part 7: Monetization and IAP
- IAP submission pipeline, metadata, and status flow
- Subscription rules, loot boxes, external payment eligibility
- Subscription groups, pricing, restore purchases, free trials

### Part 8: EU Compliance
- DSA trader status and requirements
- EU alternative distribution

### Part 9: Build Upload and Processing
- Upload methods, build identifiers, build selection, SDK requirements, processing stages
- IPv6, app thinning, entitlements
- TestFlight: 90-day expiry, 10,000 external testers, 6 builds per 24 hours, full review for the first external build, readiness checklist
- Xcode Cloud: onboarding, ephemeral-VM source handling, distribution setup, webhooks, additional repositories

### Part 10: WWDC25 Changes
- Draft submissions, reusable build numbers, builds retained after rejection
- Accessibility Nutrition Labels, AI-generated tags and review summaries
- Custom product page keywords, expanded offer codes, analytics, pricing

### Part 11: WWDC26 Changes
- Product Page Header and search-results visuals through the Asset Library (standalone review, real-time swaps)
- Retention Messaging in the subscription cancellation flow, including the real-time server API
- Group and volume subscription purchasing (Apple Business Manager and Apple School Manager, volume pricing bands)
- Enhanced IAP review submissions (grouped review items, the expanded `reviewSubmissions` API)

### Troubleshooting
- Ten common submission issues
- App Store Connect API endpoints for submissions

## Key Pattern

### Top Rejection Causes

| Rank | Guideline | Issue |
|------|-----------|-------|
| 1 | 2.1 | App completeness: crashes, placeholders, broken flows (~40% of rejections) |
| 2 | 5.1.1(i) | Privacy policy missing or inadequate |
| 3 | 2.1 | Incomplete review information, such as a missing demo account |
| 4 | 2.3.3 | Screenshots don't match the app |
| 5 | 4.0 | Substandard UI or HIG violations |

### Privacy Manifest Required Reason APIs

| Category | APIs | Reason codes |
|----------|------|--------------|
| File timestamp | `NSFileCreationDate`, `NSFileModificationDate`, `NSURLContentModificationDateKey` | DDA9.1, C617.1, 3B52.1, 0A2A.1 |
| System boot time | `systemUptime`, `mach_absolute_time` | 35F9.1, 8FFB.1, 3D61.1 |
| Disk space | `NSFileSystemFreeSize`, `NSFileSystemSize`, `volumeAvailableCapacityKey` | E174.1, 85F4.1, 7D9E.1, B728.1 |
| Active keyboard | `activeInputModes` | 54BD.1, 3EC4.1 |
| User defaults | `UserDefaults` | CA92.1, 1C8F.1, C56D.1, AC6B.1 |

Declare the code that matches your actual use. The skill explains what each code means.

## Documentation Scope

This page documents the `app-store-ref` skill (in the `axiom-shipping` suite), the reference your assistant uses for exact App Store submission details, field specs, and rules. The full App Review Guidelines index, top-ten rejection table, and zero-tolerance guidelines live in [app-review-guidelines](/skills/shipping/app-review-guidelines), and the nine-section submission checklist lives in [expert-review-checklist](/skills/shipping/expert-review-checklist).

## Related

- [App Store Submission](/skills/shipping/app-store-submission) – Pre-flight checklist and submission workflow, for deciding whether your app is ready
- [App Store Diagnostics](/diagnostic/app-store-diag) – Diagnosing a rejection and planning the fix or appeal
- [StoreKit 2 Reference](/reference/storekit-ref) – IAP and subscription APIs, for implementing what Part 7 describes
- [Privacy UX Patterns](/skills/integration/privacy-ux) – Writing the privacy manifest and building the ATT flow
- [Accessibility Diagnostics](/diagnostic/accessibility-diag) – Auditing the accessibility features you declare in Accessibility Nutrition Labels
- [App Store Connect Reference](/reference/app-store-connect-ref) – Finding crash data, TestFlight feedback, and metrics in App Store Connect

## Resources

**WWDC**: 2022-10166, 2025-224, 2025-241, 2025-252, 2025-328, 2026-205, 2026-210, 2026-261, 2026-309, 2026-391

**Docs**: /app-store/review/guidelines, /app-store/submitting, /app-store/app-privacy-details, /help/app-store-connect

**Skills**: axiom-integration, axiom-shipping
