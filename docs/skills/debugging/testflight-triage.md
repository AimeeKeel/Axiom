---
name: testflight-triage
description: Systematic workflow for investigating TestFlight crashes and reviewing beta feedback using Xcode Organizer
---

# TestFlight Crash and Feedback Triage

A systematic workflow for investigating TestFlight crashes and reviewing beta feedback in Xcode Organizer. Understand a crash before writing a fix: 15 minutes of triage saves hours of debugging.

## When to Use

Use this skill when:
- A beta tester reports that your app crashed
- App Store Connect shows crash counts and you don't know how to investigate them
- Crash logs in Organizer aren't symbolicated (they show hex addresses)
- A user says the app "just closed" but you can't find a crash report
- You need to review TestFlight feedback screenshots and comments
- The crash rate spiked after a new TestFlight build

**Core principle** Understand the crash before writing any fix. Rushed guesses often miss the real problem or introduce new bugs.

## Example Prompts

Questions you can ask your assistant that will draw from this skill:

- "A beta tester said my app crashed. How do I find and understand the crash?"
- "I see crashes in App Store Connect but don't know how to investigate them."
- "My crash logs aren't symbolicated. How do I fix that?"
- "The app was killed but there's no crash report. What happened?"
- "How do I review TestFlight feedback in Xcode?"
- "What does EXC_BAD_ACCESS mean and how do I fix it?"
- "Our crash rate spiked after the latest build. How do I triage this?"
- "Triage all the crash logs Xcode has collected on my Mac, across every version."
- "Organizer shows a dozen different crash signatures. Are they really different bugs?"

## What This Skill Provides

### First Step: xcsym
- Running `xcsym crash` on a downloaded crash, which finds dSYMs in Archives, DerivedData, and `~/Downloads` on its own
- Using `xcsym verify` to find which images are missing dSYMs when symbolication is incomplete

### Xcode Organizer Walkthrough
- Opening Organizer (Window → Organizer)
- The layout: sidebar, crashes list, log view, and inspector
- Filters for time period, version, product, and release type
- Crash entry badges (App Clip, Watch, Extension)
- The Feedback Inspector for tester comments
- Opening a crash in your project and sharing it

### The Triage Questions
Before diving into code, ask:
1. How long has this been a problem? (check the inspector graph)
2. Does it affect production, or only TestFlight? (use the Release filter)
3. What was the user doing? (check the Feedback Inspector)

### Symbolication
- Why crashes aren't symbolicated (usually a missing dSYM)
- A quick check for symbolicated, unsymbolicated, and partly symbolicated logs
- Manual symbolication: finding the dSYM with `mdfind`, resolving addresses with `atos`, and whole logs with `crashlog`
- Common failures and fixes, and checking dSYM UUIDs with `dwarfdump --uuid`

### Reading Crash Reports
- The fields that matter: exception type and codes, termination reason, crashed thread, application-specific information, and binary images
- Reading the stack trace, including statically linked Swift packages that only show up under your app's binary (search for the package's source filenames, not its name)

### Common Crash Patterns
- **EXC_BAD_ACCESS** – A nil pointer or a deallocated object
- **EXC_CRASH (SIGABRT)** – Assertions and uncaught exceptions
- **Watchdog (0x8badf00d)** – The main thread was blocked too long
- **Jetsam** – A memory-pressure kill, which leaves no crash report

### Terminations Without Crash Reports
- The Terminations Organizer for kills that aren't crashes
- Launch timeout, memory limit, background CPU limit, and background task timeout
- Questions to ask the user, and MetricKit for better diagnostics

### The On-Disk Organizer Corpus (.xccrashpoint)
- Where Xcode keeps every collected crash log on disk, and how to list the full corpus, including the version-pinned filter directories a narrow search misses
- Why Organizer signature names mislead: they come from an arbitrary non-crashing thread, so one bug fans out into many signatures
- Why per-version device counts hide cross-version history, and why summed device counts overstate reach

### Feedback Triage
- Where to find feedback in Organizer and App Store Connect, and what each entry contains
- Sorting feedback into bugs, feature requests, unclear reports, and working-as-intended
- What the asc-mcp tools can fetch for you: builds, testers, TestFlight crash reports and logs, and tester comments and screenshots

### Working with Your Assistant
- Running the crash-analyzer agent, or `/axiom:analyze-crash`, on a crash log
- Effective prompts, and what to include: the full report, user context, and the relevant code
- What your assistant can help with, and what needs your judgment

### Pressure Scenarios
- An important user reports constant crashes, but you can't find any reports
- The crash rate spiked after the latest TestFlight build and needs a fix now
- The crash is symbolicated, but you still don't understand it

## Key Pattern

### The Triage Questions

When a crash is reported, answer these questions before touching code:

| Question | Where to Look | Why It Matters |
|----------|---------------|----------------|
| How long has this been a problem? | Inspector graph area | Shows when the crash was introduced |
| Is it TestFlight only, or production too? | Release filter | Determines urgency and scope |
| What was the user doing? | Feedback Inspector | Gives you reproduction context |

### Reading a Crash Report

```
Exception Type:  EXC_BAD_ACCESS (SIGSEGV)
Exception Codes: KERN_INVALID_ADDRESS at 0x0000000000000010

Thread 0 Crashed:
0   MyApp    UserManager.currentUser.getter + 45
1   MyApp    ProfileViewController.viewDidLoad() + 123
```

**Translation**
- `EXC_BAD_ACCESS` at a very low address (`0x10`) almost always means a nil dereference
- It crashed reading the `currentUser` property
- It was called during view setup
- **Likely cause**: Force-unwrapping an optional that was nil, or accessing a deallocated object

## Documentation Scope

This page documents the `testflight-triage` skill in the `axiom-shipping` suite. Your assistant uses its Organizer walkthroughs, symbolication commands, crash pattern guides, and pressure scenarios when you report TestFlight problems. The `axiom-build` and `axiom-shipping` routers both send TestFlight crash questions to it.

## Related

- [Crash Symbolication (xcsym)](/reference/xcsym-ref) – The tool this workflow runs first to symbolicate and classify a crash
- [crash-analyzer](/agents/crash-analyzer) – The agent that parses a crash log and suggests next steps; run it with [`/axiom:analyze-crash`](/commands/debugging/analyze-crash)
- [production-triage](/skills/debugging/production-triage) – For dozens of grouped crashes from Sentry or App Store Connect, rather than a single crash
- [lldb](/skills/debugging/lldb) – Reproducing and inspecting a crash interactively in the debugger
- [memory-debugging](/skills/debugging/memory-debugging) – When the crash pattern points to a memory problem (jetsam, steady growth)
- [performance-profiling](/skills/debugging/performance-profiling) – When the crash is performance-related (watchdog timeout, high CPU)
- [xcode-debugging](/skills/debugging/xcode-debugging) – When the problem is the build or environment, not a runtime crash
- [asc-mcp](/skills/shipping/asc-mcp) – Setting up programmatic access to App Store Connect builds, testers, and crash logs

## Resources

**WWDC**: 2018-414, 2020-10076, 2020-10078, 2020-10081, 2021-10203, 2021-10258

**Docs**: /xcode/diagnosing-issues-using-crash-reports-and-device-logs, /xcode/examining-the-fields-in-a-crash-report, /xcode/adding-identifiable-symbol-names-to-a-crash-report, /xcode/identifying-the-cause-of-common-crashes, /xcode/identifying-high-memory-use-with-jetsam-event-reports
