---
name: localization-research-ref
description: Apple terminology matching, project termbase discipline, VoiceOver translator comments, pseudolocalization, and Translation Management System selection
skill_type: reference
version: 1.0.0
---

# Localization Research & Consistency Reference

Research and consistency discipline for localized apps that match platform conventions. It covers the work before and after translation that decides whether translations feel *native* or *machine-translated*.

## When to Use This Reference

Use this reference when:

- Matching app terminology to Apple's platform vocabulary (Music, Mail, Calendar, Photos, Settings)
- Building a project glossary before a translation pass
- Writing translator context for VoiceOver-only strings
- Stress-testing layout before real translations arrive
- Choosing a Translation Management System, or TMS (Crowdin, Lokalise, Phrase, SimpleLocalize)
- Preparing for Apple Design Award Inclusivity review
- Auditing existing translations for consistency or platform match

## Example Prompts

Questions you can ask your assistant that will draw from this reference:

- "How does Apple Music translate 'Up Next' in French?"
- "Where can I read Apple's own Siri phrase wording for a locale?"
- "How do I build a localization glossary for my app?"
- "Should I pseudolocalize before paying for translations?"
- "Which Translation Management System should I use for an `.xcstrings` project?"
- "How should I write translator comments for VoiceOver accessibility labels?"
- "What's the difference between Accented Pseudolanguage and Double-Length Pseudolanguage?"

## What's Covered

### Apple Terminology Matching
- Apple's shipped translations inside the simulator runtime (`Music.app/<lang>.lproj`, `AppShortcuts.strings`)
- Apple Support multi-locale pages (authoritative cross-check)
- applelocalization.com (community database, sanity-check only)
- 15 media-app terms worth looking up first, plus a generic-app list
- URL-swap workflow for locale comparison

### Project Termbase (Glossary)
- What belongs in a termbase (6 categories)
- Markdown table format with source attribution
- When to build it (before the first translation pass, before a new locale, before Apple Design Award or App Store review, and after a terminology complaint)
- Storage location options

### VoiceOver-Aware Comments
- Why spoken strings need different translation than visible labels
- `VoiceOver:` comment prefix convention
- Pairing with `.accessibilityLabel` and `.accessibilityHint`

### Pseudolocalization
- Four Xcode scheme modes (Accented, Right-to-Left, Double-Length, Bounded String) and the launch arguments behind them
- When to run each
- Workflow sequence to catch hardcoded strings, layout breaks, and right-to-left bugs

### Translation Management Systems
- When a TMS is warranted (several locales at once, or a review and approval workflow) and when it isn't
- Comparison of Crowdin, Lokalise, Phrase, SimpleLocalize
- Round-trip workflow with `.xcstrings`
- Termbase integration

### Pre-Submission Workflow
- 8-step sequence from pseudolocalization through device testing
- Ordered to minimize the cost of issues discovered late

## Key Pattern

### Apple Terminology Cross-Check

```
1. Find Apple Support article covering the term
   → support.apple.com/en-us/<article-id>
2. Swap locale segment to target language
   → support.apple.com/fr-fr/<article-id>
3. Extract Apple's canonical translation
4. Record in project glossary with source attribution
```

### VoiceOver Translator Comment Convention

```swift
String(
    localized: "Double tap to change artwork",
    comment: "VoiceOver: spoken hint for the artwork button. Not visible on screen."
)
```

The `VoiceOver:` prefix signals to translators (and TMS filters) that the string is spoken, not read, so they translate it as a full spoken instruction rather than a UI label.

## Documentation Scope

This page documents the `localization-research-ref` skill (in the `axiom-integration` suite). It covers the research and consistency discipline around the Xcode workflow. For the mechanics (String Catalog setup, SwiftUI and UIKit APIs, plurals, right-to-left layout, locale-aware formatters, and Xcode 26's AI-generated translator comments), see [Localization & Internationalization](/skills/integration/localization).

## Related

- [Accessibility Diagnostics](/diagnostic/accessibility-diag) – VoiceOver labels and hints (the strings this reference helps translate)
- [hig](/skills/ui-design/hig) – HIG terminology conventions

## Resources

**Apple**: /xcode/localizing-and-varying-text-with-a-string-catalog, /xcode/localization, /accessibility/voiceover

**WWDC**: 2025-225 (Xcode 26 localization), 2023-10155 (String Catalogs), 2021-10221 (Streamline your localized strings)

**Community**: applelocalization.com (sanity-check database, not authoritative)

**Support pages** (authoritative cross-check): support.apple.com/en-us → swap locale segment

**TMS**: Crowdin, Lokalise, Phrase, SimpleLocalize (all support `.xcstrings` natively)
