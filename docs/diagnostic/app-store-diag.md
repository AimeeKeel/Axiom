---
name: app-store-diag
description: Use when app is rejected by App Review, submission blocked, or appeal needed - systematic diagnosis from rejection message to fix with guideline-specific remediation patterns and appeal writing
---

# App Store Rejection Diagnostics

Maps an App Store rejection message to one of nine diagnostic patterns, so you fix what App Review actually cited. Most developers lose 1–2 weeks to rejection cycles because they skim the message, guess the cause, and fix something that wasn't the problem.

## Symptoms This Diagnoses

Use when you're experiencing:
- App rejected by App Review with a specific guideline number
- App crashed during review
- "Binary Rejected" with no clear guideline cited
- "Metadata Rejected" status in App Store Connect
- Same app rejected multiple times for different reasons
- Rejection that mentions "privacy", "data collection", "login", or "authentication"
- Rejection for thin functionality, a web wrapper, or a duplicate app (Guideline 4.2 or 4.3)
- Rejection for objectionable content, unmoderated user-generated content, or Kids category rules (Guideline 1.x)
- Apple Pay, Wallet, or Tap to Pay rejection
- Reviewer asking for a demo account or more information
- Unsure whether to fix and resubmit or appeal

## Example Prompts

Questions you can ask your assistant that will draw from this diagnostic:

- "My app was rejected for Guideline 2.1, what do I do?"
- "I got 'Metadata Rejected' — do I need a new build?"
- "App rejected for missing privacy policy, how do I fix this?"
- "On iOS 27.2, my tracking prompt returns no decision after the user taps Additional Information. Is my ATT flow wrong?"
- "Should I appeal this App Store rejection?"
- "My app was rejected 3 times for different reasons each time"
- "Binary Rejected but no guideline number — what happened?"
- "How do I write an App Review appeal?"
- "How do I respond to a Guideline 4.2 or 4.3 rejection?"
- "What does a Guideline 1.x rejection mean for user-generated content or a Kids category app?"

## Diagnostic Workflow

```
1. Read the FULL rejection message
   |- Copy the exact text and every guideline number
   |- Identify the rejection type (App / Metadata / Binary)
   |- Check whether the reviewer is asking for information rather than rejecting
   +- Screenshot it for your team

2. Map it to a diagnostic pattern
   |- Guideline 2.1     -> Pattern 1 (App Completeness)
   |- Guideline 2.3     -> Pattern 2 (Metadata)
   |- Guideline 5.1     -> Pattern 3 (Privacy)
   |- Guideline 4.8     -> Pattern 4 (Sign in with Apple)
   |- Guideline 3.x     -> Pattern 5 (Business/Monetization)
   |- No guideline      -> Pattern 6 (Binary/Technical)
   |- Guideline 4.2/4.3 -> Pattern 8 (Minimum Functionality/Spam)
   |- Guideline 1.x     -> Pattern 9 (Safety/Content/UGC/Kids)
   +- Reviewer is wrong -> Pattern 7 (Appeal)

3. Apply the pattern's fix
   |- Follow the diagnosis steps for that pattern
   |- Fix ALL cited guidelines, not just the first
   +- Run the pre-submission checklist before resubmitting

4. Verify and resubmit
   |- Test the fix on a physical device
   |- Run the complete pre-flight checklist
   +- Explain your fixes in the resubmission notes
```

Payment rejections (Apple Pay, Wallet, Tap to Pay) start in the `axiom-payments` suite to find the root cause, then return here for the appeal workflow.

## Diagnostic Patterns

App Store Connect is abbreviated ASC below.

| Pattern | Symptom | Diagnosis | Fix |
|---------|---------|-----------|-----|
| 1: Guideline 2.1, App Completeness | Crashes, placeholder content, broken links, missing demo credentials | Pull the reviewer's crash log from the rejection message or Xcode Organizer and symbolicate it with `xcsym` before guessing; search for placeholders; verify every URL | Replace test content, provide demo credentials that won't expire, and test on the reviewer's OS version |
| 2: Guideline 2.3, Metadata | "Metadata Rejected": screenshots don't match the app, the description promises missing features, or keywords use trademarks | Compare every screenshot to the submitted build and check each claim in the description | Update the metadata in ASC; metadata-only rejections need no new build |
| 3: Guideline 5.1, Privacy | Missing or inaccessible privacy policy, missing purpose strings, undeclared data collection, tracking without App Tracking Transparency (ATT) consent | Check the policy is reachable from ASC and inside the app, generate Xcode's Privacy Report, and audit third-party SDKs | Update the privacy manifest, add specific purpose strings, and make the policy match what the app actually collects |
| 4: Guideline 4.8, Sign in with Apple | Third-party or social login without Sign in with Apple | Check for any third-party login, and whether an exception applies | Add Sign in with Apple at equal prominence, and handle credential revocation |
| 5: Guideline 3.x, Business | Digital content unlocked without in-app purchase, unclear subscription terms, undisclosed loot box odds | Check whether any digital good or feature bypasses Apple's in-app purchase | Use StoreKit 2 for all digital goods, disclose loot box odds, and clarify subscription terms |
| 6: Binary Rejected, Technical gates | Automated rejection, no guideline number, build stuck in processing | Check the Xcode and SDK version, privacy manifest, encryption declaration, and signing | Update Xcode, add `PrivacyInfo.xcprivacy`, set `ITSAppUsesNonExemptEncryption`, regenerate provisioning, and validate the archive before submitting |
| 7: Appeal | You believe the reviewer misunderstood the app or applied the wrong guideline | Confirm you comply with the cited guideline and gather evidence | Reply in ASC with specific evidence first; file a formal appeal if that doesn't resolve it |
| 8: Guideline 4.2/4.3, Minimum Functionality or Spam | App seen as too thin, a web wrapper, a duplicate, or template-generated | Check whether a web view is the primary UI and native features are absent, then decide honestly whether the rejection is valid | Add meaningful native features, show reviewers the path to the app's value, or appeal with a full walkthrough |
| 9: Guideline 1.x, Safety | Objectionable content (1.1), user-generated content without moderation (1.2), Kids category gaps (1.3) | Identify the sub-guideline from what the app displays and which category it's in | Build reporting, blocking, and moderation for user content; meet Kids category rules for SDKs, external links, and purchases |

For the iOS 27.2 EU tracking prompt, Pattern 3 hands off to the privacy-ux skill, which covers setting up the expanded prompt, treating a missing decision after Additional Information as no consent, and when eligible EU users can be prompted again a year later.

Missing a deadline isn't grounds for an appeal. Fix the cited issues, then request expedited review.

## Quick Reference

| Rejection Type | Likely Cause | First Check | Pattern | Typical Fix Time |
|---|---|---|---|---|
| Guideline 2.1 | Crashes or placeholders | Reviewer's crash log; search for placeholders | 1 | 1–3 days |
| Guideline 2.3 | Metadata mismatch | Compare screenshots to the app | 2 | 1 day (no build) |
| Guideline 5.1 | Privacy gaps | Policy, privacy manifest, purpose strings | 3 | 2–5 days |
| Guideline 4.8 | Missing Sign in with Apple | Look for third-party login | 4 | 3–5 days |
| Guideline 3.x | Payment method | Review in-app purchase flows | 5 | 3–14 days |
| Binary Rejected | Technical gate | SDK, privacy manifest, encryption | 6 | 1–2 days |
| Guideline 1.x | Safety, content, or user-generated content | Moderation and Kids category compliance | 9 | 1–3 weeks |
| Guideline 4.2/4.3 | Thin app or spam | Native features and uniqueness | 8 | 1–4 weeks |

## Production Crisis Defense

#### Scenario

Your app has been rejected for the third time, with a different reason each time, and launch is tomorrow.

#### Why This Happens

Each review pass goes deeper: the first catches crashes, the second checks metadata, and the third audits privacy compliance. That's normal, not a reviewer picking on you.

#### Protocol

1. Don't panic, and don't resubmit without a thorough fix.
2. Run the complete pre-flight checklist, not just the cited issue.
3. Audit the whole cited area; for a privacy rejection, that means every SDK, analytics call, and API request that sends user data.
4. Verify that every earlier rejection issue is still fixed.
5. Request expedited review if the release is genuinely time-critical.

#### Time Comparison

| Approach | Time to Approval |
|---|---|
| Quick fix and resubmit | 7–14 more days (likely rejected again) |
| Full audit and thorough fix | 3–5 days (high confidence) |
| Full audit and expedited review | 1–3 days (if granted) |

## Documentation Scope

This page documents the `app-store-diag` diagnostic skill (in the `axiom-shipping` suite). Your assistant loads it when you describe a rejection, and it holds what this page summarizes:

- The nine diagnostic patterns, each with symptoms, common causes, diagnosis steps, fixes, and verification
- A decision tree from rejection message to pattern
- The multi-rejection crisis scenario and a stakeholder communication template
- Appeal-writing guidance with good and bad examples
- A pre-submission checklist to prevent future rejections
- Common mistakes, such as skimming the rejection, fixing only the cited issue, and arguing emotionally

Unlike a reference skill, which supplies information, a diagnostic skill walks your assistant through required steps and holds up under deadline pressure. For Apple Pay, Wallet, and Tap to Pay rejections, see [payments-diag](/diagnostic/payments-diag).

## Related

- [App Store Submission](/skills/shipping/app-store-submission) – The pre-flight checklist that prevents these rejections
- [App Store Reference](/reference/app-store-ref) – Metadata specs, the guideline index, and the privacy manifest schema
- [App Store Connect Reference](/reference/app-store-connect-ref) – Crash analysis and TestFlight feedback in App Store Connect
- [xcsym Reference](/reference/xcsym-ref) – Symbolicates the reviewer's crash log for Pattern 1
- [StoreKit 2 Reference](/reference/storekit-ref) – In-app purchase implementation for Guideline 3.x fixes
- [Privacy UX Patterns](/skills/integration/privacy-ux) – Privacy manifests and ATT, including the iOS 27.2 EU prompt, for Guideline 5.1 fixes
- [Accessibility Diagnostics](/diagnostic/accessibility-diag) – Accessibility compliance issues that surface in review

## Resources

**WWDC**: 2025-328

**Docs**: /app-store/review/guidelines, /distribute/app-review, /support/offering-account-deletion-in-your-app, /contact/app-store/?topic=appeal
