---
name: app-review-guidelines
description: Index of Apple's App Review Guidelines organized by section, with zero-tolerance flags, top rejection causes, and sensitive-app requirements
---

# App Review Guidelines

A structured index of Apple's App Review Guidelines, verified against the February 6, 2026 revision. Use it to find the guideline behind a rejection, catch zero-tolerance violations before you submit, and learn which app types need extra documentation.

## When to Use

Use this skill when:
- You received a rejection that cites a guideline number and need context
- You want to check your app against the sections most often cited in rejections
- You're building a sensitive-category app (Kids, medical, crypto, gambling, VPN) and need its extra documentation requirements
- You need to know which violations carry immediate-removal risk
- You're checking a feature against the Safety, Performance, Business, Design, or Legal sections before you build it

## Example Prompts

Questions you can ask your assistant that will draw from this skill:

- "What does Guideline 2.1 actually require?"
- "Which App Review Guidelines have zero-tolerance enforcement?"
- "We're submitting a Kids category app. What do 1.3 and 5.1.4 require?"
- "What are the top 10 rejection causes?"
- "Is my VPN app subject to special review requirements?"
- "Our app sells loot boxes. Which guideline covers odds disclosure?"
- "What's the difference between 4.2 (minimum functionality) and 4.3 (spam)?"

## What This Skill Provides

- **Section-by-section index** – Safety (1.x), Performance (2.x), Business (3.x), Design (4.x), and Legal (5.x), summarizing the guidelines most often cited
- **Zero-tolerance flags** – the four guidelines (1.1.4, 2.5.3, 4.1(b), 5.1.1(vi)) whose violation means immediate removal of the app or removal from the Apple Developer Program, called out separately so they don't get lost in the long list
- **Top 10 rejection causes** – ranked, with Apple's published share where one exists (about 40% for 2.1, App Completeness); the canonical "if you only check ten things, check these"
- **Sensitive app types** – Kids apps with third-party ads, medical hardware, third-party content and trademarks, gambling, VPN, and real-money gaming, and regulated industries (banking, crypto, healthcare, air travel), with the documentation or legal-entity enrollment each requires
- **Payments cross-reference** – Apple Pay, Wallet, and Tap to Pay questions under Section 3 go to the `axiom-payments` suite

## Documentation Scope

This page documents the `app-review-guidelines` skill (in the `axiom-shipping` suite).

## Related

- [App Store Submission](/skills/shipping/app-store-submission) – the pre-flight checklist that catches 90% of rejection causes before you submit
- [App Store Diagnostics](/diagnostic/app-store-diag) – for when a rejection has arrived; maps guideline numbers to root causes and fixes
- [Expert Review Checklist](/skills/shipping/expert-review-checklist) – a nine-section verification list covering build, privacy, metadata, monetization, and EU compliance
- [App Store Reference](/reference/app-store-ref) – field-level metadata specs, privacy manifest schema, and age rating tiers
