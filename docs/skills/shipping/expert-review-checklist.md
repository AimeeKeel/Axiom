---
name: expert-review-checklist
description: Comprehensive 9-section App Store submission checklist covering build, privacy, metadata, account, content, age rating, monetization, EU compliance, and App Review info
---

# Expert Review Checklist

A nine-section verification checklist for App Store submissions. Where [App Store Submission](/skills/shipping/app-store-submission) is the pre-flight workflow with anti-patterns and pressure scenarios, this skill is the flat checklist: every box to tick before you tap Submit for Review.

## When to Use

Use this skill when:
- You want a single flat list to walk through before submission, not a workflow
- You're doing a final pass after the App Store Submission pre-flight and want to confirm nothing was missed
- You're distributing in the EU and need the DSA trader status verification steps
- You're shipping in-app purchases and want monetization checks (status, screenshots, restore, grace period)
- You're a team lead reviewing a submission someone else prepared
- You need a printable or exportable list to share with someone outside engineering (product, legal, design)

## Example Prompts

Questions you can ask your assistant that will draw from this skill:

- "Run me through the full pre-submission checklist."
- "What goes in the EU compliance section before I submit?"
- "What does the build section of pre-submission verification cover?"
- "Walk me through the privacy checklist line by line."
- "What demo credentials does App Review need from us?"
- "Have we covered everything for monetization before submitting?"

## What This Skill Provides

- **Build verification** – SDK version, export compliance flag, encryption documentation, IPv6 compatibility, signing, bundle ID, a unique build string, the 200 MB cellular download limit, architectures, and no private APIs
- **Privacy verification** – `PrivacyInfo.xcprivacy`, the policy URL in App Store Connect, in-app access to the policy, purpose strings, App Tracking Transparency, Required Reason APIs, Privacy Nutrition Labels, third-party SDK manifests, and a generated privacy report
- **Metadata verification** – app name length, description, keywords, screenshots, "What's New" text, copyright, support URL, promotional text, category, and localization
- **Account verification** – account deletion, Sign in with Apple (offered whenever third-party login exists, with equal prominence and token revocation on deletion), and demo credentials that won't expire mid-review
- **Content verification** – no placeholders, broken links, staging URLs, or test data in screenshots, and no references to other mobile platforms in metadata
- **Age rating verification** – questionnaire completion, the new capability declarations, user-generated content moderation, web content filtering, and loot box odds disclosure
- **Monetization verification** – in-app purchase status and screenshots, subscription terms, loot box odds, Restore Purchases, no removing paid features to force a new purchase, grace period, and offer codes
- **EU compliance verification** – DSA trader status, trader email and phone verified through two-factor authentication, accurate contact information, and product labels where they apply
- **App Review info verification** – contact name, email, and phone, demo credentials, notes explaining non-obvious features, attachments for special hardware, and a monitored review contact email

## Documentation Scope

This page documents the `expert-review-checklist` skill (in the `axiom-shipping` suite).

## Related

- [App Store Submission](/skills/shipping/app-store-submission) – the workflow-driven pre-flight skill; start there, then run this checklist as the final pass
- [App Review Guidelines](/skills/shipping/app-review-guidelines) – an index of the guideline numbers behind each rejection category
- [App Store Diagnostics](/diagnostic/app-store-diag) – for when something on this checklist is wrong and you need a diagnosis-to-fix mapping
- [App Store Reference](/reference/app-store-ref) – field-level specs (character limits, screenshot dimensions, privacy manifest schema)
