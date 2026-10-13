---
name: production-triage
description: Systematic workflow for triaging production crash groups from Sentry and App Store Connect — fetch, classify, cluster, filter suspension noise, and rank by user impact
---

# Production Crash and Hang Triage

A systematic workflow for triaging grouped production crashes and hangs from Sentry and App Store Connect. Get the whole picture before you dive into any single crash, so you don't fix the wrong thing while your top crash keeps climbing.

## When to Use

Use this skill when:
- A Sentry or App Store Connect dashboard shows many crash groups and you're not sure where to start
- You're preparing a triage report before a sprint or incident review
- You wonder whether a spike in crashes is real or driven by suspension and idle-runloop noise
- You want to know which crash families regressed in the latest build
- Several Sentry fingerprints look different but might share a root cause

**Core principle** Understand the crash landscape before touching code, and rank by affected users, not by how alarming a crash looks.

## Example Prompts

Questions you can ask your assistant that will draw from this skill:

- "Triage my Sentry crashes and tell me what to fix first."
- "What are my top crash families in App Store Connect?"
- "Is my crash rate inflated by suspension or idle-runloop noise?"
- "Which crashes appeared after my last release?"
- "Cluster these Sentry groups and tell me which ones are the same bug."
- "Show me a ranked report of production crashes by affected users."

## What This Skill Provides

### The Pipeline
- Your assistant fetches and normalizes the issues, `xcsym triage` classifies and clusters them without network access or dSYMs, and the triage-analyzer agent merges clusters into families and ranks them
- The NormalizedReport format that `xcsym triage` reads, one issue per line

### Fetching from Sentry
- Finding an auth token without ever asking you to paste it, and checking its scope before the full fetch
- Listing unresolved issues with mandatory cursor pagination
- Ranking from the list payload and fetching individual events only where needed

### Fetching from App Store Connect
- Pulling crash signatures and logs with the asc-mcp tools
- Building a minimal report from exception codes alone when ASC has no frame data, with reduced confidence noted in the report

### Noise Classification
- Recognizing idle-runloop hangs (`anr_idle_runloop`), whose shape is *consistent with* background suspension. The `noise.anr_suspension.v1` rule flags them as likely noise for review, never as a verdict: real watchdog-terminated hangs inside system callouts share the same shape, and MetricKit (hang diagnostics and watchdog-exit counts) tells them apart
- Separating those from real main-thread blocks (`anr_main_thread_block`), which are genuine responsiveness failures and never flagged as noise
- Five noise classes, each with a `deprioritize_safety` rating that says how safe it is to act on the flag: likely suspension, possibly fixed in a newer build, third-party or system frames only, OS versions below your floor, and low user impact

### Clustering and Ranking
- Reading the mechanical clusters `xcsym triage` produces, and splitting low-confidence clusters that lump unrelated issues under one system frame
- Merging clusters that share a root cause into families
- Ranking families by affected users

### Reporting and Follow-Up
- The flag-never-hide rule: every noise-flagged issue appears in the report, so you decide what to dismiss
- Resolving a Sentry issue in a specific release, or archiving it when a fix isn't verified, and why closing issues doesn't change the crash-free rate

## Key Pattern

### The Triage Report Structure

A triage report has three sections, and every issue appears in one of them:

| Section | What it contains |
|---------|------------------|
| Top real-bug families | Clusters with no noise flags, ranked by affected users, each with its pattern, a root-cause hypothesis, and a next step |
| Deprioritized as likely noise | Every noise-flagged issue with its noise class, safety rating, reason, and impact, sorted least-safe first, to review before closing |
| Skipped | Reports that were malformed or couldn't be classified |

### Suspension Noise: The Common False Positive

Sentry and App Store Connect both report idle-runloop hangs alongside real crashes. The shape is consistent with the system suspending an idle, backgrounded app rather than a code bug, but review it rather than dismissing it on shape alone: real watchdog-terminated hangs inside system callouts look identical, and MetricKit's hang diagnostics and watchdog-exit counts are what tell them apart. In one real triage run, the top issue by user count was exactly this kind of likely false positive, which is why the report never hides it.

## Documentation Scope

This page documents the `production-triage` skill in the `axiom-shipping` suite. Your assistant uses its fetch patterns, report format, noise classification rules, clustering approach, and ranked-report format when you ask about Sentry or App Store Connect crash groups. The `axiom-shipping` and `axiom-performance` routers both send corpus triage questions to it.

## Related

- [triage-analyzer](/agents/triage-analyzer) – The agent that runs this pipeline end to end and writes the ranked report
- [/axiom:triage](/commands/debugging/triage) – The command that starts a corpus triage
- [testflight-triage](/skills/debugging/testflight-triage) – For a single crash or TestFlight feedback in Xcode Organizer, rather than a corpus of grouped issues
- [Hang Diagnostics](/skills/debugging/hang-diagnostics) – Investigating a single hang once triage points you at one
- [grdb](/skills/persistence/grdb) – The fix for the `0xdead10cc` (file lock) crash that triage often traces to GRDB or SQLite
- [xcsym Reference](/reference/xcsym-ref) – The `triage` subcommand and the `pattern_tag` values this skill classifies with

## Resources

**Docs**: /xcode/diagnosing-issues-using-crash-reports-and-device-logs, /xcode/understanding-the-exception-types-in-a-crash-report
