---
name: lldb-ref
description: Complete LLDB command reference — variable inspection, breakpoints, threads, expression evaluation, process control, memory commands, and .lldbinit customization
---

# LLDB Command Reference

Command reference for LLDB, the debugger in Xcode. It is organized by task, so you can find the exact command for variable inspection, breakpoints, threads, expression evaluation, and more.

## When to Use This Reference

Use this reference when:
- Looking up the exact LLDB command syntax for a specific task
- Choosing between `v`, `p`, and `po` for variable inspection
- Setting up breakpoints (conditional, symbolic, exception, regex)
- Navigating threads and reading backtraces
- Evaluating or modifying state at a breakpoint
- Customizing LLDB with `.lldbinit` aliases and scripts
- Inspecting raw memory, pointer values, or loaded images
- Fixing LLDB itself when an expression fails to parse or a breakpoint is never hit

## Example Prompts

Questions you can ask your assistant that will draw from this reference:

- "What's the syntax for a conditional breakpoint in LLDB?"
- "How do I inspect a Swift optional in LLDB without force-unwrapping?"
- "What flags does `frame variable` support?"
- "How do I set a symbolic breakpoint on a specific method?"
- "How do I read a thread backtrace and navigate frames?"
- "What's the difference between `thread step-over` and `thread step-in`?"
- "How do I dump raw memory at an address in LLDB?"
- "How do I create custom LLDB aliases in `.lldbinit`?"
- "Why does LLDB say a variable is not available?"

## What's Covered

- **Variable inspection** – `v` / `frame variable`, `p` / `expression`, `po`, format specifiers, flags (`-d run`, `-T`, `-R`, `-D N`), `register read`
- **Breakpoints** – `breakpoint set` by file/line, name, selector, regex, address; conditional (`-c`), ignore count (`-i`), one-shot (`-o`), breakpoint commands (logpoints), exception, symbolic; managing breakpoints; watchpoints
- **Threads and backtraces** – `bt`, `thread list`, `thread info`, `thread select`, `frame select`, `up` / `down`, `thread return`
- **Expression evaluation** – Swift and Objective-C expressions, result variables (`$R0`, `$R1`), modifying state, UI and SwiftUI debugging expressions, runtime type information
- **Process control** – `continue`, `thread step-over` / `step-in` / `step-out`, `process interrupt`, `process attach` / `detach`
- **Memory and images** – `memory read`, `memory find`, `image lookup`, `image list`
- **`.lldbinit` customization** – Command aliases, type summaries, settings, per-project init files
- **Troubleshooting LLDB itself** – "expression failed to parse", "variable not available", wrong language mode, crashing expressions, slow LLDB, breakpoints not hit

## Key Pattern

### Variable Inspection Decision

```
v (frame variable)  → Reads memory directly. No compilation. Most reliable for Swift values.
p (expression)      → Compiles and executes. Use for computed properties and function calls.
po (print object)   → Calls debugDescription. Use for NSObject subclasses, NSError, collections.
```

```
(lldb) v self.myProperty           # Fast, reliable for stored properties
(lldb) p items.count               # Needed for computed values
(lldb) po error                    # Best for NSError, NSNotification
```

### Conditional Breakpoint

```
(lldb) breakpoint set -f MyFile.swift -l 42 -c 'userId == "abc123"'
```

## Documentation Scope

This page documents the `lldb-ref` skill (in the `axiom-build` suite), the LLDB command guide your assistant uses when you need specific command syntax or flags.

## Related

- [LLDB Debugging](/skills/debugging/lldb) – Debugging workflows, playbooks, and decision trees for when to use which LLDB commands
- [Xcode Debugging](/skills/debugging/xcode-debugging) – Environment-first diagnostics for Xcode build and runtime issues
- [Memory Debugging](/skills/debugging/memory-debugging) – Instruments-based leak diagnosis (complements LLDB for memory issues)
- [Performance Profiling](/skills/debugging/performance-profiling) – Instruments workflows (LLDB inspects; Instruments measures)
- [xcsym](/reference/xcsym-ref) – Symbolicating crash reports when you can't reproduce the crash under the debugger

## Resources

**WWDC**: 2019-429, 2018-412, 2022-110370, 2015-402

**Docs**: /xcode/stepping-through-code-and-inspecting-variables-to-isolate-bugs, /xcode/setting-breakpoints-to-pause-your-running-app
