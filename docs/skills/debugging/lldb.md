---
name: lldb
description: Use when ANY runtime debugging is needed — setting breakpoints, inspecting variables, evaluating expressions, analyzing threads, or reproducing crashes interactively with LLDB
---

# LLDB Debugging

Interactive debugging with LLDB. The debugger freezes time so you can question your running app: inspect variables, evaluate expressions, navigate threads, and find out exactly why something went wrong.

## When to Use

Use this skill when:
- A crash reproduces locally and you need to inspect state at the crash site
- Values are wrong at runtime even though the code looks correct
- You need to understand thread state during a hang or deadlock
- `po` prints garbage for a Swift type and you need an alternative
- You want to test a fix without rebuilding by evaluating expressions at a breakpoint
- You need to break on all exceptions, on a condition, or on a symbol
- You've analyzed a crash log and want breakpoints that reproduce the failure path

## Example Prompts

Questions you can ask your assistant that will draw from this skill:

- "My app crashes on this line but I can't tell why. How do I inspect the state?"
- "How do I set a conditional breakpoint that only fires for a specific user ID?"
- "`po` shows garbage for my Swift struct. What should I use instead?"
- "How do I evaluate an expression at a breakpoint without rebuilding?"
- "I need to break whenever any exception is thrown. How?"
- "How do I navigate threads and understand which one caused the crash?"
- "What's the difference between `v`, `p`, and `po` in LLDB?"
- "My app is frozen. How do I find the deadlock?"

## What This Skill Provides

### Five Playbooks

1. **Crash triage** – Read the stop reason, get the backtrace, navigate to your frame, inspect state, and set a conditional breakpoint to catch it earlier next time
2. **Hang and deadlock diagnosis** – Pause the app, read every thread's backtrace, classify thread states, and check for deadlocks
3. **Swift value inspection** – Choose between `v`, `p`, `po`, and `expr`; inspect optionals, collections, SwiftUI state, and actors; modify values at runtime; trigger background tasks
4. **Breakpoint strategies** – Conditional, logpoint, symbolic, exception, one-shot breakpoints, and watchpoints
5. **Async and concurrency debugging** – Identify async frames, and inspect task state, actor-isolated code, and task groups

### Decision Aids

- When to use LLDB instead of xcsym, Instruments, or memory and hang diagnostics (Instruments measures trends; LLDB inspects a moment)
- Which print command to use (`v` first, then `p`, `po`, or `expr`)
- An anti-pattern table and a checklist for before, during, and after a debug session

### Pressure Scenarios

- "It's a Release-only crash, so LLDB is useless"
- "Just add print statements"
- "`po` doesn't work, so LLDB is broken"

## Documentation Scope

This page documents the `lldb` skill in the `axiom-build` suite. It's the workflow and decision-making half of LLDB debugging; the command catalog lives in its own reference.

- For every command organized by task (variables, breakpoints, threads, expressions, memory), see [LLDB Command Reference](/reference/lldb-ref)

## Related

- [Crash Symbolication (xcsym)](/reference/xcsym-ref) – Symbolicate a `.ips`, MetricKit, or `.crash` file before you reach for the debugger
- [Hang Diagnostics](/skills/debugging/hang-diagnostics) – The diagnosis approach for a frozen app, which may then use LLDB for thread inspection
- [Memory Debugging](/skills/debugging/memory-debugging) – Instruments-based leak diagnosis, for memory that grows over time
- [Performance Profiling](/skills/debugging/performance-profiling) – Instruments workflows for measuring CPU, memory, and energy over time
- [Xcode Debugging](/skills/debugging/xcode-debugging) – Environment-first diagnostics for build failures and Xcode problems

## Resources

**WWDC**: 2019-429, 2018-412, 2022-110370

**Docs**: /xcode/stepping-through-code-and-inspecting-variables-to-isolate-bugs, /xcode/setting-breakpoints-to-pause-your-running-app, /xcode/diagnosing-memory-thread-and-crash-issues-early
