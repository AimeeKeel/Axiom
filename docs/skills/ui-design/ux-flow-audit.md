---
name: ux-flow-audit
description: Discipline for auditing real user-experience flow defects — dead ends, dismiss traps, buried CTAs, missing empty/loading/error states, deep-link breakage, accessibility dead ends
---

# UX Flow Audit

Audits what users actually experience: can they complete the task, can they get back, and do they know what's happening? Axiom's code-level auditors check patterns; this skill checks UX outcomes, and treats flow problems as defects, not polish.

## When to Use

Use this skill when:
- You're reviewing a flow before TestFlight or App Store submission
- A user (or your own QA) reports being "stuck" on a screen
- You're auditing a SwiftUI or UIKit app for missing empty, loading, or error states
- You're checking that every modal (`.sheet`, `.fullScreenCover`, alert) has a way out
- You're verifying that gesture-only actions have accessibility equivalents
- An `.onOpenURL` handler exists and you want to confirm it doesn't land users on a broken screen
- You want UX findings cross-checked against findings from `swiftui-nav-auditor`, `accessibility-auditor`, or `concurrency-auditor`

## Example Prompts

Questions you can ask your assistant that will draw from this skill:

- "Audit my onboarding flow for dead ends and dismiss traps."
- "Does this sheet have a way out for VoiceOver users?"
- "Find missing empty states across the codebase."
- "My fullScreenCover has no close button. Is that a UX defect?"
- "Walk every entry point and confirm users can complete the primary task."
- "What's the typical fix time for a buried CTA?"

## What This Skill Provides

- **Six iOS UX principles** – Honor the Promise, Escape Hatch, Primary Action Visibility, Dead End Prevention, Progressive Disclosure, and Feedback Loop, each anchoring a detection category
- **Eight core defects (always checked)** – dead-end views, dismiss traps, buried calls to action, promise-scope mismatch, deep link dead ends, missing empty states, missing loading and error states, and accessibility dead ends; these are UX bugs, not opinions
- **Three contextual checks** – onboarding gaps, broken data paths, and platform parity gaps, flagged when they look wrong but acknowledged as possible product decisions
- **Audit process** – six steps: map entry points, map navigation containers, trace flows, check data wiring, check platform adaptivity, and check accessibility flows
- **Cross-auditor correlation** – when a UX finding overlaps a finding from another Axiom auditor (navigation, accessibility, concurrency, or SwiftData), its severity rises to HIGH or CRITICAL
- **Output format** – a rating table (urgency, blast radius, fix effort, return on investment) and a Navigation Reachability Score showing what percentage of screens deep links, widgets, and notifications can reach
- **Fix effort reality check** – typical fix times (10–30 minutes for most defects), for pushing back on "that's a big change"
- **Anti-rationalization table** – answers to seven common excuses for shipping UX defects, including "users will figure it out" and "the dismiss gesture handles it" (`fullScreenCover` has no dismiss gesture)

## Documentation Scope

This page documents the `ux-flow-audit` skill (in the `axiom-accessibility` suite), which your assistant draws on when you review user flows for dead ends, traps, and missing states.

- For automated scanning, use [ux-flow-auditor](/agents/ux-flow-auditor), which checks the same eleven categories across your codebase, or run [/axiom:audit-ux-flow](/commands/ui-design/audit-ux-flow)

## Related

- [swiftui-nav](/skills/ui-design/swiftui-nav) – Navigation architecture for `NavigationStack`, `NavigationSplitView`, and deep-link routing
- [swiftui-debugging](/skills/ui-design/swiftui-debugging) – State, binding, and view-update bugs that often surface as UX problems
- [hig](/skills/ui-design/hig) – The Human Interface Guidelines behind "Honor the Promise" and primary action visibility
- [accessibility-diag](/diagnostic/accessibility-diag) – Full WCAG and VoiceOver coverage beyond the accessibility dead-end category
